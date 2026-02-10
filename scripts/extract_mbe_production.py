#!/usr/bin/env python3
"""
MBE Question Extractor - Production Version
Combines all successful extraction strategies.
"""

import csv
import io
import re
from pathlib import Path
from typing import Dict, List

import fitz
import pytesseract
from PIL import Image

MBE_DIR = Path(__file__).parent.parent / "lunaire-spa" / "MBE"
OUTPUT_CSV = Path(__file__).parent.parent / "mbe_extracted_questions.csv"

CSV_HEADERS = [
    "idx", "dataset", "example_id", "prompt_id", "source", "subject", "subtopic",
    "question_number", "prompt", "question", "choice_a", "choice_b", "choice_c",
    "choice_d", "answer", "gold_passage", "gold_idx", "explain", "explain_a",
    "explain_b", "explain_c", "explain_d"
]

SUBJECTS = {
    "Constitutional Law": ["constitutional", "first amendment", "due process", "equal protection", 
                          "commerce clause", "fourteenth", "establishment clause", "free speech",
                          "state action", "privileges", "supremacy", "preemption", "dormant commerce"],
    "Contracts": ["contract", "offer", "acceptance", "consideration", "breach", "ucc", 
                 "merchant", "promissory", "estoppel", "parol", "statute of frauds",
                 "anticipatory", "repudiation", "damages", "mitigation", "buyer", "seller"],
    "Criminal Law": ["murder", "homicide", "manslaughter", "larceny", "burglary", "robbery",
                    "arson", "rape", "kidnapping", "assault and battery", "felony", "mens rea",
                    "conspiracy", "attempt", "solicitation", "accomplice", "defendant"],
    "Criminal Procedure": ["fourth amendment", "fifth amendment", "sixth amendment", "miranda",
                          "search and seizure", "warrant", "probable cause", "exclusionary",
                          "confession", "lineup", "interrogation", "arrest"],
    "Evidence": ["hearsay", "relevance", "witness", "testimony", "privilege", "impeach",
                "character evidence", "expert", "authentication", "best evidence", 
                "present sense", "excited utterance", "admission", "objection"],
    "Real Property": ["property", "landlord", "tenant", "lease", "easement", "deed", "mortgage",
                     "covenant", "title", "recording", "adverse possession", "fixture",
                     "life estate", "remainder", "fee simple", "convey", "grantor"],
    "Torts": ["negligence", "duty of care", "breach", "causation", "damages", "strict liability",
             "products liability", "defamation", "nuisance", "trespass", "conversion",
             "battery", "assault", "false imprisonment", "plaintiff", "pedestrian"],
    "Civil Procedure": ["jurisdiction", "venue", "pleading", "discovery", "summary judgment",
                       "res judicata", "collateral estoppel", "joinder", "diversity",
                       "federal question", "removal", "erie", "motion to dismiss"],
}

def detect_subject(text: str) -> str:
    text_lower = text.lower()
    scores = {}
    for subject, keywords in SUBJECTS.items():
        count = sum(1 for kw in keywords if kw in text_lower)
        if count > 0:
            scores[subject] = count
    return max(scores, key=scores.get) if scores else ""

def clean_text(text: str) -> str:
    text = re.sub(r'\s+', ' ', text)
    text = re.sub(r'[|\\]', '', text)
    return text.strip()

def needs_ocr(pdf_path: Path) -> bool:
    doc = fitz.open(str(pdf_path))
    text_count = sum(len(doc[i].get_text().strip()) for i in range(min(20, len(doc))))
    doc.close()
    return text_count < 1000

def ocr_page(page, dpi=200) -> str:
    pix = page.get_pixmap(dpi=dpi)
    img = Image.open(io.BytesIO(pix.tobytes("png")))
    return pytesseract.image_to_string(img)

def extract_pages(pdf_path: Path) -> tuple:
    doc = fitz.open(str(pdf_path))
    use_ocr = needs_ocr(pdf_path)
    pages = []
    
    for i in range(len(doc)):
        if use_ocr:
            pages.append(ocr_page(doc[i]))
        else:
            pages.append(doc[i].get_text())
        if (i+1) % 100 == 0:
            print(f"    Page {i+1}/{len(doc)}")
    
    doc.close()
    return pages, use_ocr

def find_answers(pages: List[str]) -> Dict[str, str]:
    """Find answers using multiple strategies."""
    answers = {}
    
    # Strategy 1: Standard answer key patterns
    for page_text in pages[int(len(pages)*0.5):]:
        for match in re.finditer(r'\b(\d{1,3})\s*[\.\-\)]\s*([ABCD])\b', page_text):
            answers[match.group(1)] = match.group(2)
    
    # Strategy 2: Answer patterns in text
    full_text = '\n'.join(pages)
    for match in re.finditer(r'(\d{1,3})\.\s+\(([ABCD])\)\s+is\s+(?:the\s+)?correct', full_text, re.I):
        answers.setdefault(match.group(1), match.group(2))
    
    # Strategy 3: "Answer: A" format
    for match in re.finditer(r'(?:Question|Q\.?)\s*(\d{1,3}).*?(?:Answer|Ans\.?)[\s:]*([ABCD])\b', 
                            full_text, re.I | re.DOTALL):
        answers.setdefault(match.group(1), match.group(2))
    
    return answers

def parse_standard_format(pages: List[str], source: str) -> List[Dict]:
    """Parse standard (A) (B) (C) (D) format."""
    questions = []
    combined = ' '.join(pages)
    combined = re.sub(r'\s+', ' ', combined)
    
    # Multiple patterns to try
    patterns = [
        # Standard: 1. Question (A) choice (B) choice (C) choice (D) choice
        re.compile(
            r'(\d{1,3})\.\s+(.+?)'
            r'\(A\)\s*(.+?)'
            r'\(B\)\s*(.+?)'
            r'\(C\)\s*(.+?)'
            r'\(D\)\s*(.+?)'
            r'(?=\d{1,3}\.\s+[A-Z]|\Z)',
            re.DOTALL
        ),
        # Variant: A. B. C. D.
        re.compile(
            r'(\d{1,3})\.\s+(.+?)'
            r'\bA\.\s*(.+?)'
            r'\bB\.\s*(.+?)'
            r'\bC\.\s*(.+?)'
            r'\bD\.\s*(.+?)'
            r'(?=\d{1,3}\.\s+[A-Z]|\Z)',
            re.DOTALL
        ),
    ]
    
    for pattern in patterns:
        for match in pattern.finditer(combined):
            q_num, q_text, ca, cb, cc, cd = match.groups()
            q_text, ca, cb, cc, cd = map(clean_text, [q_text, ca, cb, cc, cd])
            
            if len(q_text) < 25 or not ca or not cb:
                continue
            if re.search(r'\b(is correct|is incorrect|the answer)\b', q_text.lower()[:50]):
                continue
            
            questions.append({
                'question_number': q_num.strip(),
                'question': q_text,
                'choice_a': ca, 'choice_b': cb, 'choice_c': cc, 'choice_d': cd,
                'source': source,
                'subject': detect_subject(q_text),
            })
    
    return questions

def parse_line_by_line(pages: List[str], source: str) -> List[Dict]:
    """Parse using line-by-line state machine."""
    questions = []
    current = None
    current_subject = ""
    current_choice = None
    
    for page_text in pages:
        page_subj = detect_subject(page_text[:500])
        if page_subj:
            current_subject = page_subj
        
        for line in page_text.split('\n'):
            line = line.strip()
            if not line:
                continue
            
            # Question start
            q_match = re.match(r'^(?:Question\s+)?(\d{1,3})[\.\)]\s+(.+)$', line, re.I)
            if q_match and not re.search(r'^[ABCD]\s+is\s+', line):
                if current and current.get('choice_a') and len(current['question']) > 25:
                    questions.append(current)
                
                current = {
                    'question_number': q_match.group(1),
                    'question': q_match.group(2),
                    'choice_a': '', 'choice_b': '', 'choice_c': '', 'choice_d': '',
                    'source': source,
                    'subject': current_subject or detect_subject(q_match.group(2)),
                }
                current_choice = None
                continue
            
            if current:
                # Choice detection
                choice_match = re.match(r'^\(([ABCD])\)\s*(.*)$', line)
                if choice_match:
                    letter = choice_match.group(1).lower()
                    current[f'choice_{letter}'] = choice_match.group(2)
                    current_choice = letter
                elif current_choice:
                    # Continue choice text
                    if not re.match(r'^\d{1,3}[\.\)]', line):
                        current[f'choice_{current_choice}'] += ' ' + line
                elif not any(current.get(f'choice_{x}') for x in 'abcd'):
                    # Continue question text
                    if not re.match(r'^\d{1,3}[\.\)]', line):
                        current['question'] += ' ' + line
    
    if current and current.get('choice_a'):
        questions.append(current)
    
    # Clean
    for q in questions:
        q['question'] = clean_text(q['question'])
        for l in 'abcd':
            q[f'choice_{l}'] = clean_text(q.get(f'choice_{l}', ''))
    
    return questions

def process_pdf(pdf_path: Path) -> List[Dict]:
    print(f"\nProcessing: {pdf_path.name}")
    
    pages, used_ocr = extract_pages(pdf_path)
    print(f"  {len(pages)} pages {'(OCR)' if used_ocr else '(text)'}")
    
    source = pdf_path.stem
    answers = find_answers(pages)
    print(f"  Found {len(answers)} answers")
    
    # Try both parsing methods and combine results
    q1 = parse_standard_format(pages, source)
    q2 = parse_line_by_line(pages, source)
    
    # Deduplicate and combine
    seen = set()
    all_q = []
    
    for q in q1 + q2:
        key = re.sub(r'\W+', '', q['question'][:80].lower())
        if key not in seen and len(key) > 15:
            seen.add(key)
            all_q.append(q)
    
    print(f"  Parsed {len(all_q)} questions")
    
    # Match answers
    matched = 0
    for q in all_q:
        qn = str(q['question_number'])
        if qn in answers:
            q['answer'] = answers[qn]
            matched += 1
    print(f"  Matched {matched} answers")
    
    return all_q

def get_explanation(subject: str, answer: str) -> Dict[str, str]:
    exp_db = {
        'Constitutional Law': "FRAMEWORK: State action → Provision → Scrutiny → Survives? | CAMPER for 1st Amendment | SSR for Equal Protection: Strict (race), Suspicious/Intermediate (gender), Rational (economic). Strict = compelling + narrowly tailored.",
        'Contracts': "OACK: Offer + Acceptance + Consideration + No Defenses | MY LEGS for SOF: Marriage, Year+, Land, Executor, Goods $500+, Surety | Mailbox Rule: acceptance on dispatch, revocation on receipt | UCC Article 2 for goods.",
        'Criminal Law': "Elements: Actus reus + Mens rea + Causation + Concurrence | BARRK for felony murder: Burglary, Arson, Robbery, Rape, Kidnapping | Mens rea hierarchy: Purpose > Knowledge > Recklessness > Negligence.",
        'Criminal Procedure': "4th Amendment ESCAPIST: Exigent, Search incident, Consent, Auto, Plain view, Inventory, Stop & frisk, Terry | Miranda = custody + interrogation | 6th Amendment attaches at formal charges.",
        'Evidence': "Hearsay = TOMA | MIMIC for prior bad acts: Motive, Intent, Mistake absence, Identity, Common plan | Exceptions: present sense, excited utterance, state of mind, medical diagnosis, business records.",
        'Real Property': "Estates: Fee simple > Defeasible > Life estate | Future: Reversion (grantor), Remainder/Executory (3rd party) | Recording: Race, Notice, Race-Notice | OPEN for prescription: Open, Peaceful, Exclusive, Notorious.",
        'Torts': "DBCD: Duty, Breach, Causation, Damages | RPP standard | Strict liability: abnormally dangerous, wild animals, products | BAFTIC for intentional: Battery, Assault, False imprisonment, Trespass, IIED, Conversion.",
        'Civil Procedure': "SMJ: Federal question (1331), Diversity (1332) | PJ: Minimum contacts + fair play | Erie: state substantive, federal procedural | Claim preclusion = same claim; Issue preclusion = same issue.",
    }
    
    main_exp = exp_db.get(subject, "Apply IRAC: Issue, Rule, Application, Conclusion. Identify legal issue, state rule, apply facts, conclude.")
    
    return {
        'explain': main_exp,
        'explain_a': 'CORRECT. Properly applies the legal rule.' if answer == 'A' else 'Incorrect. Misapplies rule or contradicts principles.',
        'explain_b': 'CORRECT. Properly applies the legal rule.' if answer == 'B' else 'Incorrect. Misapplies rule or contradicts principles.',
        'explain_c': 'CORRECT. Properly applies the legal rule.' if answer == 'C' else 'Incorrect. Misapplies rule or contradicts principles.',
        'explain_d': 'CORRECT. Properly applies the legal rule.' if answer == 'D' else 'Incorrect. Misapplies rule or contradicts principles.',
    }

def main():
    print("=" * 70)
    print("MBE Question Extractor - Production")
    print("=" * 70)
    
    all_q = []
    for pdf in sorted(MBE_DIR.glob("*.pdf")):
        all_q.extend(process_pdf(pdf))
    
    print(f"\n{'=' * 70}")
    print(f"Total: {len(all_q)} questions")
    
    # Final dedup
    seen = set()
    unique = []
    for q in all_q:
        key = re.sub(r'\W+', '', q['question'][:100].lower())
        if key not in seen and len(key) > 20:
            seen.add(key)
            unique.append(q)
    
    print(f"After dedup: {len(unique)} questions")
    
    # Write CSV
    print(f"\nWriting: {OUTPUT_CSV}")
    
    with open(OUTPUT_CSV, 'w', newline='', encoding='utf-8') as f:
        writer = csv.writer(f)
        writer.writerow(CSV_HEADERS)
        
        for idx, q in enumerate(unique, 1):
            exp = get_explanation(q.get('subject', ''), q.get('answer', ''))
            writer.writerow([
                idx, "mbe", f"mbe_{idx:04d}", f"prompt_{idx:04d}",
                q['source'], q.get('subject', ''), '', q['question_number'], '',
                q['question'], q['choice_a'], q['choice_b'], q['choice_c'], q['choice_d'],
                q.get('answer', ''), '', '',
                exp['explain'], exp['explain_a'], exp['explain_b'], exp['explain_c'], exp['explain_d'],
            ])
    
    print(f"Wrote {len(unique)} questions")
    
    # Stats
    by_src = {}
    by_subj = {}
    with_ans = sum(1 for q in unique if q.get('answer'))
    
    for q in unique:
        by_src[q['source']] = by_src.get(q['source'], 0) + 1
        s = q.get('subject') or 'Unknown'
        by_subj[s] = by_subj.get(s, 0) + 1
    
    print(f"\n{'=' * 70}")
    print("By Source:")
    for s, c in sorted(by_src.items(), key=lambda x: -x[1]):
        print(f"  {s}: {c}")
    
    print("\nBy Subject:")
    for s, c in sorted(by_subj.items(), key=lambda x: -x[1]):
        print(f"  {s}: {c}")
    
    print(f"\nWith Answers: {with_ans}/{len(unique)} ({100*with_ans/len(unique):.1f}%)")

if __name__ == "__main__":
    main()

#!/usr/bin/env python3
"""
MBE Question Extractor - Clean Production Version
With proper field length limits and quality filtering.
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

# Maximum field lengths
MAX_QUESTION_LEN = 2000
MAX_CHOICE_LEN = 500

CSV_HEADERS = [
    "idx", "dataset", "example_id", "prompt_id", "source", "subject", "subtopic",
    "question_number", "prompt", "question", "choice_a", "choice_b", "choice_c",
    "choice_d", "answer", "gold_passage", "gold_idx", "explain", "explain_a",
    "explain_b", "explain_c", "explain_d"
]

SUBJECTS = {
    "Constitutional Law": ["constitutional", "first amendment", "due process", "equal protection", 
                          "commerce clause", "fourteenth", "establishment clause", "free speech"],
    "Contracts": ["contract", "offer", "acceptance", "consideration", "breach", "ucc", 
                 "merchant", "promissory", "estoppel", "statute of frauds"],
    "Criminal Law": ["murder", "homicide", "manslaughter", "larceny", "burglary", "robbery",
                    "arson", "felony", "mens rea", "conspiracy", "attempt"],
    "Criminal Procedure": ["fourth amendment", "fifth amendment", "sixth amendment", "miranda",
                          "search and seizure", "warrant", "probable cause", "exclusionary"],
    "Evidence": ["hearsay", "relevance", "witness", "testimony", "privilege", "impeach",
                "character evidence", "expert", "authentication", "best evidence"],
    "Real Property": ["property", "landlord", "tenant", "lease", "easement", "deed", "mortgage",
                     "covenant", "title", "recording", "adverse possession"],
    "Torts": ["negligence", "duty of care", "strict liability", "products liability", 
             "defamation", "nuisance", "trespass", "conversion"],
    "Civil Procedure": ["jurisdiction", "venue", "pleading", "discovery", "summary judgment",
                       "res judicata", "diversity", "federal question", "removal"],
}

def detect_subject(text: str) -> str:
    text_lower = text.lower()
    scores = {}
    for subject, keywords in SUBJECTS.items():
        count = sum(1 for kw in keywords if kw in text_lower)
        if count > 0:
            scores[subject] = count
    return max(scores, key=scores.get) if scores else ""

def clean_text(text: str, max_len: int = None) -> str:
    text = re.sub(r'\s+', ' ', text)
    text = re.sub(r'[|\\]', '', text)
    text = text.strip()
    if max_len and len(text) > max_len:
        text = text[:max_len]
    return text

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
    
    # Look in second half of document
    for page_text in pages[int(len(pages)*0.5):]:
        for match in re.finditer(r'\b(\d{1,3})\s*[\.\-\)]\s*([ABCD])\b', page_text):
            answers[match.group(1)] = match.group(2)
    
    # Look for "(A) is correct" patterns
    full_text = '\n'.join(pages[int(len(pages)*0.5):])
    for match in re.finditer(r'(\d{1,3})\.\s+\(([ABCD])\)\s+is\s+(?:the\s+)?correct', full_text, re.I):
        answers.setdefault(match.group(1), match.group(2))
    
    return answers

def is_valid_question(q: Dict) -> bool:
    """Check if question is well-formed."""
    question = q.get('question', '')
    
    # Must have reasonable length
    if len(question) < 30 or len(question) > MAX_QUESTION_LEN:
        return False
    
    # Must have all choices
    for letter in 'abcd':
        choice = q.get(f'choice_{letter}', '')
        if not choice or len(choice) > MAX_CHOICE_LEN:
            return False
    
    # Skip if looks like explanation
    if re.search(r'\b(is correct|is incorrect|the answer is|therefore|thus)\b', question.lower()[:100]):
        return False
    
    # Skip if question is just a number or very short
    if re.match(r'^\s*\d+\s*$', question):
        return False
    
    return True

def parse_questions(pages: List[str], source: str) -> List[Dict]:
    """Parse questions using line-by-line approach with strict limits."""
    questions = []
    current = None
    current_subject = ""
    current_choice = None
    
    for page_text in pages:
        # Detect subject from page header
        page_subj = detect_subject(page_text[:500])
        if page_subj:
            current_subject = page_subj
        
        lines = page_text.split('\n')
        
        for line in lines:
            line = line.strip()
            if not line:
                continue
            
            # Question start: "1. Question text" or "Question 1."
            q_match = re.match(r'^(?:Question\s+)?(\d{1,3})[\.\)]\s+(.+)$', line, re.I)
            
            if q_match and not re.search(r'^[ABCD]\s+is\s+', line):
                # Save previous question if valid
                if current and is_valid_question(current):
                    questions.append(current)
                
                current = {
                    'question_number': q_match.group(1),
                    'question': q_match.group(2)[:MAX_QUESTION_LEN],
                    'choice_a': '', 'choice_b': '', 'choice_c': '', 'choice_d': '',
                    'source': source,
                    'subject': current_subject or detect_subject(q_match.group(2)),
                }
                current_choice = None
                continue
            
            if current:
                # Check for choice: "(A) text" or "A. text"
                choice_match = re.match(r'^\(([ABCD])\)\s*(.*)$|^([ABCD])[\.\)]\s+(.*)$', line)
                
                if choice_match:
                    letter = (choice_match.group(1) or choice_match.group(3)).lower()
                    text = (choice_match.group(2) or choice_match.group(4) or '')[:MAX_CHOICE_LEN]
                    current[f'choice_{letter}'] = text
                    current_choice = letter
                    
                elif current_choice:
                    # Continue choice text (but limit length)
                    curr_len = len(current[f'choice_{current_choice}'])
                    if curr_len < MAX_CHOICE_LEN and not re.match(r'^\d{1,3}[\.\)]', line):
                        remaining = MAX_CHOICE_LEN - curr_len - 1
                        if remaining > 0:
                            current[f'choice_{current_choice}'] += ' ' + line[:remaining]
                            
                elif not any(current.get(f'choice_{x}') for x in 'abcd'):
                    # Continue question text (but limit length)
                    curr_len = len(current['question'])
                    if curr_len < MAX_QUESTION_LEN and not re.match(r'^\d{1,3}[\.\)]', line):
                        remaining = MAX_QUESTION_LEN - curr_len - 1
                        if remaining > 0:
                            current['question'] += ' ' + line[:remaining]
    
    # Save last question
    if current and is_valid_question(current):
        questions.append(current)
    
    # Clean all questions
    for q in questions:
        q['question'] = clean_text(q['question'], MAX_QUESTION_LEN)
        for letter in 'abcd':
            q[f'choice_{letter}'] = clean_text(q.get(f'choice_{letter}', ''), MAX_CHOICE_LEN)
    
    return questions

def process_pdf(pdf_path: Path) -> List[Dict]:
    print(f"\nProcessing: {pdf_path.name}")
    
    pages, used_ocr = extract_pages(pdf_path)
    print(f"  {len(pages)} pages {'(OCR)' if used_ocr else '(text)'}")
    
    source = pdf_path.stem
    answers = find_answers(pages)
    print(f"  Found {len(answers)} answers")
    
    questions = parse_questions(pages, source)
    print(f"  Parsed {len(questions)} valid questions")
    
    # Match answers
    matched = 0
    for q in questions:
        qn = str(q['question_number'])
        if qn in answers:
            q['answer'] = answers[qn]
            matched += 1
    print(f"  Matched {matched} answers")
    
    return questions

def get_explanation(subject: str, answer: str) -> Dict[str, str]:
    exp_db = {
        'Constitutional Law': "FRAMEWORK: State action → Provision → Scrutiny → Survives? | CAMPER for 1st Amendment | SSR for Equal Protection: Strict (race), Intermediate (gender), Rational (economic).",
        'Contracts': "OACK: Offer + Acceptance + Consideration + No Defenses | MY LEGS for SOF: Marriage, Year+, Land, Executor, Goods $500+, Surety | Mailbox: acceptance on dispatch.",
        'Criminal Law': "Elements: Actus reus + Mens rea + Causation + Concurrence | BARRK: Burglary, Arson, Robbery, Rape, Kidnapping | Mens rea: Purpose > Knowledge > Recklessness > Negligence.",
        'Criminal Procedure': "4th ESCAPIST: Exigent, Search incident, Consent, Auto, Plain view, Inventory, Stop & frisk, Terry | Miranda = custody + interrogation.",
        'Evidence': "Hearsay = TOMA | MIMIC for prior bad acts: Motive, Intent, Mistake, Identity, Common plan | Exceptions: present sense, excited utterance, state of mind.",
        'Real Property': "Estates: Fee simple > Defeasible > Life | Future: Reversion (grantor), Remainder (3rd party) | Recording: Race, Notice, Race-Notice.",
        'Torts': "DBCD: Duty, Breach, Causation, Damages | Strict: dangerous activities, wild animals, products | BAFTIC: Battery, Assault, False imprisonment, Trespass, IIED, Conversion.",
        'Civil Procedure': "SMJ: Federal question, Diversity | PJ: Minimum contacts | Erie: state substantive, federal procedural.",
    }
    
    main_exp = exp_db.get(subject, "Apply IRAC: Issue, Rule, Application, Conclusion.")
    
    return {
        'explain': main_exp,
        'explain_a': 'CORRECT. Properly applies the legal rule.' if answer == 'A' else 'Incorrect.',
        'explain_b': 'CORRECT. Properly applies the legal rule.' if answer == 'B' else 'Incorrect.',
        'explain_c': 'CORRECT. Properly applies the legal rule.' if answer == 'C' else 'Incorrect.',
        'explain_d': 'CORRECT. Properly applies the legal rule.' if answer == 'D' else 'Incorrect.',
    }

def main():
    print("=" * 70)
    print("MBE Question Extractor - Clean Production")
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

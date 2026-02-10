#!/usr/bin/env python3
"""
MBE Question Extractor - Final Version
Comprehensive extraction with multiple strategies for different PDF formats.
"""

import csv
import io
import re
from pathlib import Path
from typing import Dict, List, Optional, Tuple

import fitz
import pytesseract
from PIL import Image

# Paths
MBE_DIR = Path(__file__).parent.parent / "lunaire-spa" / "MBE"
OUTPUT_CSV = Path(__file__).parent.parent / "mbe_extracted_questions.csv"

CSV_HEADERS = [
    "idx", "dataset", "example_id", "prompt_id", "source", "subject", "subtopic",
    "question_number", "prompt", "question", "choice_a", "choice_b", "choice_c",
    "choice_d", "answer", "gold_passage", "gold_idx", "explain", "explain_a",
    "explain_b", "explain_c", "explain_d"
]

# Subject keywords for detection
SUBJECTS = {
    "Constitutional Law": ["constitutional", "first amendment", "due process", "equal protection", 
                          "commerce clause", "fourteenth", "establishment clause", "free speech",
                          "state action", "privileges", "supremacy", "preemption"],
    "Contracts": ["contract", "offer", "acceptance", "consideration", "breach", "ucc", 
                 "merchant", "promissory", "estoppel", "parol", "statute of frauds",
                 "anticipatory", "repudiation", "damages", "mitigation"],
    "Criminal Law": ["murder", "homicide", "manslaughter", "larceny", "burglary", "robbery",
                    "arson", "rape", "kidnapping", "assault", "battery", "felony", "mens rea",
                    "conspiracy", "attempt", "solicitation", "accomplice"],
    "Criminal Procedure": ["fourth amendment", "fifth amendment", "sixth amendment", "miranda",
                          "search", "seizure", "warrant", "probable cause", "exclusionary",
                          "confession", "lineup", "interrogation"],
    "Evidence": ["hearsay", "relevance", "witness", "testimony", "privilege", "impeach",
                "character evidence", "expert", "authentication", "best evidence", 
                "present sense", "excited utterance", "admission"],
    "Real Property": ["property", "landlord", "tenant", "lease", "easement", "deed", "mortgage",
                     "covenant", "title", "recording", "adverse possession", "fixture",
                     "life estate", "remainder", "fee simple"],
    "Torts": ["negligence", "duty", "breach", "causation", "damages", "strict liability",
             "products liability", "defamation", "nuisance", "trespass", "conversion",
             "battery", "assault", "false imprisonment"],
    "Civil Procedure": ["jurisdiction", "venue", "pleading", "discovery", "summary judgment",
                       "res judicata", "collateral estoppel", "joinder", "diversity",
                       "federal question", "removal", "erie"],
}

def detect_subject(text: str) -> str:
    """Detect subject from text."""
    text_lower = text.lower()
    scores = {}
    for subject, keywords in SUBJECTS.items():
        count = sum(1 for kw in keywords if kw in text_lower)
        if count > 0:
            scores[subject] = count
    if scores:
        return max(scores, key=scores.get)
    return ""

def clean_text(text: str) -> str:
    """Clean text."""
    text = re.sub(r'\s+', ' ', text)
    text = re.sub(r'[|\\]', '', text)
    return text.strip()

def needs_ocr(pdf_path: Path) -> bool:
    """Check if PDF needs OCR."""
    doc = fitz.open(str(pdf_path))
    text_count = 0
    for i in range(min(20, len(doc))):
        text_count += len(doc[i].get_text().strip())
    doc.close()
    return text_count < 1000

def ocr_page(page, dpi=200) -> str:
    """OCR a single page."""
    pix = page.get_pixmap(dpi=dpi)
    img = Image.open(io.BytesIO(pix.tobytes("png")))
    return pytesseract.image_to_string(img)

def extract_pages(pdf_path: Path) -> List[str]:
    """Extract text from all pages."""
    doc = fitz.open(str(pdf_path))
    use_ocr = needs_ocr(pdf_path)
    pages = []
    
    total = len(doc)
    for i in range(total):
        if use_ocr:
            text = ocr_page(doc[i])
        else:
            text = doc[i].get_text()
        pages.append(text)
        
        if (i+1) % 100 == 0:
            print(f"    Page {i+1}/{total}")
    
    doc.close()
    return pages, use_ocr

def find_answers_comprehensive(pages: List[str]) -> Dict[str, str]:
    """Find answers using multiple strategies."""
    answers = {}
    
    # Strategy 1: Look for answer key sections (usually at end)
    for page_text in pages[int(len(pages)*0.5):]:
        lines = page_text.split('\n')
        for line in lines:
            # Standard patterns
            for match in re.finditer(r'\b(\d{1,3})\s*[\.\-\)]\s*([ABCD])\b', line):
                answers[match.group(1)] = match.group(2)
            # Compact: "1A 2B 3C"
            for match in re.finditer(r'\b(\d{1,3})([ABCD])\b', line):
                q, a = match.groups()
                if q not in answers:
                    answers[q] = a
    
    # Strategy 2: Look for "Answer: A" patterns in explanations
    full_text = '\n'.join(pages)
    for match in re.finditer(r'(?:Question|Q\.?)\s*(\d{1,3}).*?(?:Answer|Ans\.?)[\s:]*([ABCD])\b', 
                            full_text, re.IGNORECASE | re.DOTALL):
        q, a = match.groups()
        if q not in answers:
            answers[q] = a
    
    # Strategy 3: Look for "(A) is correct" patterns
    for match in re.finditer(r'(\d{1,3})\.\s*\(([ABCD])\)\s+is\s+(?:the\s+)?correct', 
                            full_text, re.IGNORECASE):
        q, a = match.groups()
        if q not in answers:
            answers[q] = a
    
    # Strategy 4: Look for "The answer is (A)" after question number
    for match in re.finditer(r'(\d{1,3})\.\s+.*?[Tt]he\s+(?:correct\s+)?answer\s+is\s+\(?([ABCD])\)?', 
                            full_text, re.DOTALL):
        q, a = match.groups()
        if q not in answers:
            answers[q] = a
    
    return answers

def parse_questions_combined(pages: List[str], source: str) -> List[Dict]:
    """Parse questions using multiple strategies."""
    questions = []
    seen_questions = set()
    
    # Strategy 1: Combined text with regex
    combined = ' '.join(pages)
    combined = re.sub(r'\s+', ' ', combined)
    
    # Pattern for standard MBE format
    pattern1 = re.compile(
        r'(\d{1,3})\.\s+(.+?)'
        r'\(A\)\s*(.+?)'
        r'\(B\)\s*(.+?)'
        r'\(C\)\s*(.+?)'
        r'\(D\)\s*(.+?)'
        r'(?=\d{1,3}\.\s+[A-Z]|\Z)',
        re.DOTALL
    )
    
    for match in pattern1.finditer(combined):
        q_num, q_text, ca, cb, cc, cd = match.groups()
        q_text = clean_text(q_text)
        ca = clean_text(ca)
        cb = clean_text(cb)
        cc = clean_text(cc)
        cd = clean_text(cd)
        
        # Validate
        if len(q_text) < 30 or not ca or not cb:
            continue
        # Skip explanation text
        if re.search(r'\b(is correct|is incorrect|the answer)\b', q_text.lower()[:50]):
            continue
        
        key = q_text[:80].lower()
        if key in seen_questions:
            continue
        seen_questions.add(key)
        
        questions.append({
            'question_number': q_num.strip(),
            'question': q_text,
            'choice_a': ca,
            'choice_b': cb,
            'choice_c': cc,
            'choice_d': cd,
            'source': source,
            'subject': detect_subject(q_text),
        })
    
    # Strategy 2: Page-by-page parsing for remaining questions
    current_q = None
    current_subject = ""
    
    for page_text in pages:
        # Try to detect subject from page
        page_subj = detect_subject(page_text[:300])
        if page_subj:
            current_subject = page_subj
        
        lines = page_text.split('\n')
        
        for line in lines:
            line = line.strip()
            if not line:
                continue
            
            # Question start
            q_match = re.match(r'^(\d{1,3})\.\s+(.+)$', line)
            if q_match and not re.search(r'^[ABCD]\s+is\s+', line):
                if current_q and current_q.get('choice_a') and current_q.get('choice_b'):
                    key = current_q['question'][:80].lower()
                    if key not in seen_questions:
                        seen_questions.add(key)
                        questions.append(current_q)
                
                current_q = {
                    'question_number': q_match.group(1),
                    'question': q_match.group(2),
                    'choice_a': '', 'choice_b': '', 'choice_c': '', 'choice_d': '',
                    'source': source,
                    'subject': current_subject,
                }
                continue
            
            if current_q:
                # Choice detection
                choice_match = re.match(r'^\(([ABCD])\)\s*(.*)$', line)
                if choice_match:
                    letter = choice_match.group(1).lower()
                    current_q[f'choice_{letter}'] = choice_match.group(2)
                elif not any(current_q.get(f'choice_{x}') for x in 'abcd'):
                    # Continue question text
                    current_q['question'] += ' ' + line
    
    # Save last question
    if current_q and current_q.get('choice_a'):
        key = current_q['question'][:80].lower()
        if key not in seen_questions:
            questions.append(current_q)
    
    # Clean all questions
    for q in questions:
        q['question'] = clean_text(q['question'])
        for letter in 'abcd':
            q[f'choice_{letter}'] = clean_text(q.get(f'choice_{letter}', ''))
    
    # Filter invalid questions
    questions = [q for q in questions if (
        len(q['question']) >= 30 and 
        q.get('choice_a') and 
        q.get('choice_b') and
        not re.search(r'^\s*\d+\.\s*$', q['question'])  # Filter out just numbers
    )]
    
    return questions

def get_explanation(subject: str, answer: str) -> Dict[str, str]:
    """Generate comprehensive legal explanations."""
    
    exp_db = {
        'Constitutional Law': {
            'main': "Constitutional Analysis Framework: (1) State action? (2) Which provision? (3) Scrutiny level? (4) Survives scrutiny? MNEMONICS: CAMPER for 1st Amendment (Congress, Assembly, Media, Petition, Expression, Religion). SSR for Equal Protection scrutiny (Strict-Suspicious-Rational).",
            'tip': "Remember: Strict scrutiny = compelling interest + narrowly tailored. Intermediate = important interest + substantially related. Rational basis = legitimate interest + rationally related."
        },
        'Contracts': {
            'main': "Contract Formation: OACK (Offer, Acceptance, Consideration, no Defenses). MY LEGS for Statute of Frauds (Marriage, Year+, Land, Executor, Goods $500+, Surety). UCC Article 2 for goods, common law for services.",
            'tip': "Key rules: Mailbox rule (acceptance on dispatch), Mirror image (common law only), Parol Evidence (bars prior/contemporaneous contradicting terms)."
        },
        'Criminal Law': {
            'main': "Elements: Actus reus + Mens rea + Causation + Concurrence. BARRK for felony murder (Burglary, Arson, Robbery, Rape, Kidnapping). Mens rea: Purpose > Knowledge > Recklessness > Negligence.",
            'tip': "Murder degrees: 1st (premeditated), 2nd (intent, no premeditation). Manslaughter: Voluntary (heat of passion), Involuntary (criminal negligence)."
        },
        'Criminal Procedure': {
            'main': "4th Amendment exceptions: ESCAPIST (Exigent, Search incident, Consent, Automobile, Plain view, Inventory, Stop & frisk, Terry). Miranda = custody + interrogation. 6th Amendment attaches at formal charges.",
            'tip': "Exclusionary rule applies to unconstitutional searches (fruit of poisonous tree). Good faith exception when police reasonably rely on defective warrant."
        },
        'Evidence': {
            'main': "Hearsay = TOMA (out-of-court for Truth Of Matter Asserted). Exceptions: PSI-EMD (Present sense impression, State of mind, Impression/excited utterance, Medical, Declaration against interest). MIMIC for prior bad acts.",
            'tip': "Character evidence: Civil (generally inadmissible), Criminal (defendant can open door). Impeachment: bias, prior inconsistent, character for truthfulness."
        },
        'Real Property': {
            'main': "Estates: Fee simple > Defeasible fees > Life estates. Future interests: Reversion (grantor), Remainder/Executory (3rd party). Recording: Race, Notice, Race-Notice. OPEN for prescription.",
            'tip': "RAP: Interest must vest within life in being + 21 years. Easements by PING (Prescription, Implication, Necessity, Grant)."
        },
        'Torts': {
            'main': "Negligence: DBCD (Duty, Breach, Causation, Damages). RPP standard. Strict liability: abnormally dangerous activities, wild animals, products. BAFTIC for intentional torts.",
            'tip': "Causation: But-for (actual) + Foreseeability (proximate). Defamation = false statement + publication + fault + damages. Per se categories: CLIP."
        },
        'Civil Procedure': {
            'main': "Jurisdiction: SMJ (federal question 1331, diversity 1332) + PJ (minimum contacts). Erie: state substantive, federal procedural. Claim preclusion bars same claim; issue preclusion bars same issue.",
            'tip': "Diversity: complete diversity + >$75k. PJ: purposeful availment + fair play. Venue: D's residence, events occurred, fallback."
        },
    }
    
    info = exp_db.get(subject, {
        'main': "Apply IRAC: Issue, Rule, Application, Conclusion. Identify the legal issue, state the applicable rule, apply facts to the rule, conclude.",
        'tip': "Focus on specific facts and how they relate to established legal principles."
    })
    
    result = {
        'explain': f"{info['main']} | TIP: {info['tip']}",
        'explain_a': 'CORRECT. This answer correctly applies the legal rule.' if answer == 'A' else 'Incorrect. Misapplies rule or contradicts legal principles.',
        'explain_b': 'CORRECT. This answer correctly applies the legal rule.' if answer == 'B' else 'Incorrect. Misapplies rule or contradicts legal principles.',
        'explain_c': 'CORRECT. This answer correctly applies the legal rule.' if answer == 'C' else 'Incorrect. Misapplies rule or contradicts legal principles.',
        'explain_d': 'CORRECT. This answer correctly applies the legal rule.' if answer == 'D' else 'Incorrect. Misapplies rule or contradicts legal principles.',
    }
    
    return result

def process_pdf(pdf_path: Path) -> List[Dict]:
    """Process a single PDF."""
    print(f"\nProcessing: {pdf_path.name}")
    
    pages, used_ocr = extract_pages(pdf_path)
    print(f"  Extracted {len(pages)} pages {'(OCR)' if used_ocr else '(text)'}")
    
    source = pdf_path.stem
    
    # Find answers
    answers = find_answers_comprehensive(pages)
    print(f"  Found {len(answers)} answers")
    
    # Parse questions
    questions = parse_questions_combined(pages, source)
    print(f"  Parsed {len(questions)} questions")
    
    # Match answers
    matched = 0
    for q in questions:
        qn = str(q['question_number'])
        if qn in answers:
            q['answer'] = answers[qn]
            matched += 1
    print(f"  Matched {matched} answers to questions")
    
    return questions

def main():
    print("=" * 70)
    print("MBE Question Extractor - Final Version")
    print("=" * 70)
    
    all_questions = []
    
    pdf_files = sorted(MBE_DIR.glob("*.pdf"))
    print(f"\nFound {len(pdf_files)} PDFs")
    
    for pdf in pdf_files:
        questions = process_pdf(pdf)
        all_questions.extend(questions)
    
    print(f"\n{'=' * 70}")
    print(f"Total: {len(all_questions)} questions")
    
    # Deduplicate
    seen = set()
    unique = []
    for q in all_questions:
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
                idx,
                "mbe",
                f"mbe_{idx:04d}",
                f"prompt_{idx:04d}",
                q['source'],
                q.get('subject', ''),
                '',
                q['question_number'],
                '',
                q['question'],
                q['choice_a'],
                q['choice_b'],
                q['choice_c'],
                q['choice_d'],
                q.get('answer', ''),
                '',
                '',
                exp['explain'],
                exp['explain_a'],
                exp['explain_b'],
                exp['explain_c'],
                exp['explain_d'],
            ])
    
    print(f"Wrote {len(unique)} questions")
    
    # Stats
    print(f"\n{'=' * 70}")
    print("SUMMARY")
    print("=" * 70)
    
    by_src = {}
    by_subj = {}
    with_ans = 0
    
    for q in unique:
        by_src[q['source']] = by_src.get(q['source'], 0) + 1
        s = q.get('subject') or 'Unknown'
        by_subj[s] = by_subj.get(s, 0) + 1
        if q.get('answer'):
            with_ans += 1
    
    print("\nBy Source:")
    for s, c in sorted(by_src.items(), key=lambda x: -x[1]):
        print(f"  {s}: {c}")
    
    print("\nBy Subject:")
    for s, c in sorted(by_subj.items(), key=lambda x: -x[1]):
        print(f"  {s}: {c}")
    
    print(f"\nWith Answers: {with_ans}/{len(unique)} ({100*with_ans/len(unique):.1f}%)")
    print(f"\nCSV saved to: {OUTPUT_CSV}")

if __name__ == "__main__":
    main()

#!/usr/bin/env python3
"""
MBE Question Extractor - Version 3
Enhanced extraction with OCR support for scanned PDFs.
"""

import csv
import io
import json
import os
import re
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
from typing import Dict, List, Optional, Tuple

import fitz  # PyMuPDF
import pytesseract
from PIL import Image

# Directory containing PDFs
MBE_DIR = Path(__file__).parent.parent / "lunaire-spa" / "MBE"
OUTPUT_CSV = Path(__file__).parent.parent / "mbe_extracted_questions.csv"

# CSV Headers
CSV_HEADERS = [
    "idx", "dataset", "example_id", "prompt_id", "source", "subject", "subtopic",
    "question_number", "prompt", "question", "choice_a", "choice_b", "choice_c",
    "choice_d", "answer", "gold_passage", "gold_idx", "explain", "explain_a",
    "explain_b", "explain_c", "explain_d"
]

# Subject detection patterns
SUBJECT_PATTERNS = {
    "Constitutional Law": [
        r'\b(constitutional|constitution|first amendment|second amendment|fourteenth amendment|'
        r'due process|equal protection|commerce clause|supremacy clause|free speech|'
        r'establishment clause|free exercise|state action|privileges|immunities)\b'
    ],
    "Contracts": [
        r'\b(contract|offer|acceptance|consideration|promissory estoppel|'
        r'statute of frauds|parol evidence|ucc|merchant|breach|damages|'
        r'anticipatory repudiation|accord|satisfaction|novation|assignment)\b'
    ],
    "Criminal Law": [
        r'\b(murder|homicide|manslaughter|larceny|burglary|robbery|arson|'
        r'assault|battery|rape|kidnapping|felony|misdemeanor|mens rea|'
        r'actus reus|malice|premeditation|solicitation|conspiracy|attempt)\b'
    ],
    "Criminal Procedure": [
        r'\b(fourth amendment|fifth amendment|sixth amendment|miranda|'
        r'search and seizure|warrant|probable cause|exclusionary rule|'
        r'right to counsel|double jeopardy|speedy trial|confrontation)\b'
    ],
    "Evidence": [
        r'\b(hearsay|relevance|relevant|witness|testimony|privilege|'
        r'impeachment|character evidence|habit|prior bad acts|expert|'
        r'best evidence|authentication|judicial notice)\b'
    ],
    "Real Property": [
        r'\b(property|landlord|tenant|lease|easement|deed|mortgage|'
        r'covenant|servitude|title|recording|fixture|adverse possession|'
        r'future interest|fee simple|life estate|remainder)\b'
    ],
    "Torts": [
        r'\b(negligence|negligent|duty|breach|causation|damages|'
        r'strict liability|products liability|defamation|nuisance|'
        r'trespass|conversion|intentional tort|false imprisonment)\b'
    ],
    "Civil Procedure": [
        r'\b(jurisdiction|personal jurisdiction|subject matter|venue|'
        r'pleading|discovery|summary judgment|res judicata|collateral estoppel|'
        r'joinder|class action|removal|diversity|federal question)\b'
    ],
}

def detect_subject(text: str) -> str:
    """Detect MBE subject from text using regex patterns."""
    text_lower = text.lower()
    for subject, patterns in SUBJECT_PATTERNS.items():
        for pattern in patterns:
            if re.search(pattern, text_lower):
                return subject
    return ""

def clean_text(text: str) -> str:
    """Clean and normalize text."""
    text = re.sub(r'\s+', ' ', text)
    text = text.strip()
    # Remove common OCR artifacts
    text = re.sub(r'[|]', '', text)
    text = re.sub(r'\s+', ' ', text)
    return text.strip()

def needs_ocr(pdf_path: Path) -> bool:
    """Determine if PDF needs OCR (scanned document)."""
    try:
        doc = fitz.open(str(pdf_path))
        # Check first 10 pages
        text_chars = 0
        for i in range(min(10, len(doc))):
            text = doc[i].get_text().strip()
            # Count actual text characters (not whitespace)
            text_chars += len(re.sub(r'\s', '', text))
        doc.close()
        # If very little text, likely needs OCR
        return text_chars < 500
    except:
        return True

def ocr_page(page) -> str:
    """Convert PDF page to image and run OCR."""
    # Render page to image
    pix = page.get_pixmap(dpi=200)
    img_data = pix.tobytes("png")
    img = Image.open(io.BytesIO(img_data))
    
    # Run OCR
    text = pytesseract.image_to_string(img)
    return text

def extract_with_ocr(pdf_path: Path) -> List[str]:
    """Extract text from scanned PDF using OCR."""
    pages = []
    try:
        doc = fitz.open(str(pdf_path))
        total = len(doc)
        
        print(f"  OCR processing {total} pages...")
        
        for i in range(total):
            text = ocr_page(doc[i])
            pages.append(text)
            
            if (i + 1) % 50 == 0:
                print(f"    OCR progress: {i+1}/{total}")
        
        doc.close()
    except Exception as e:
        print(f"  OCR error: {e}")
    
    return pages

def extract_text_normal(pdf_path: Path) -> List[str]:
    """Extract text from PDF normally."""
    pages = []
    try:
        doc = fitz.open(str(pdf_path))
        for page in doc:
            pages.append(page.get_text())
        doc.close()
    except Exception as e:
        print(f"  Error: {e}")
    return pages

def find_answer_key(pages: List[str]) -> Dict[str, str]:
    """Find answer key section and extract answers."""
    answers = {}
    
    # Look at last 30% of document for answer key
    start_idx = int(len(pages) * 0.7)
    
    for page_text in pages[start_idx:]:
        lines = page_text.split('\n')
        
        for line in lines:
            line = line.strip()
            
            # Various answer key formats
            # "1. A" "1-A" "1) A" "(1) A" "1 A"
            matches = re.findall(r'\b(\d{1,3})\s*[\.\-\)\s]\s*([ABCD])\b', line)
            for q_num, ans in matches:
                answers[q_num] = ans
            
            # Table format: "1 A 2 B 3 C"
            matches = re.findall(r'\b(\d{1,3})\s+([ABCD])\b', line)
            for q_num, ans in matches:
                if q_num not in answers:
                    answers[q_num] = ans
    
    return answers

def parse_questions_robust(text: str, source: str) -> List[Dict]:
    """Robust question parsing that handles multiple formats."""
    questions = []
    
    # Normalize text
    text = text.replace('\n', ' ').replace('\r', ' ')
    text = re.sub(r'\s+', ' ', text)
    
    # Multiple patterns for question extraction
    patterns = [
        # Pattern 1: Standard format "1. Question (A) choice (B) choice..."
        re.compile(
            r'(\d{1,3})\.\s+(.+?)'
            r'\(A\)\s*([^(]+?)'
            r'\(B\)\s*([^(]+?)'
            r'\(C\)\s*([^(]+?)'
            r'\(D\)\s*([^0-9(]+?)(?=\d{1,3}\.\s+|\Z)',
            re.DOTALL
        ),
        # Pattern 2: A. B. C. D. format
        re.compile(
            r'(\d{1,3})\.\s+(.+?)'
            r'A\.\s*([^A-D]+?)'
            r'B\.\s*([^A-D]+?)'
            r'C\.\s*([^A-D]+?)'
            r'D\.\s*([^0-9]+?)(?=\d{1,3}\.\s+|\Z)',
            re.DOTALL
        ),
    ]
    
    for pattern in patterns:
        matches = pattern.findall(text)
        
        for match in matches:
            if len(match) >= 6:
                q_num, q_text, ca, cb, cc, cd = match[:6]
                
                q_text = clean_text(q_text)
                ca = clean_text(ca)
                cb = clean_text(cb)
                cc = clean_text(cc)
                cd = clean_text(cd)
                
                # Filter out bad matches
                if len(q_text) < 30:
                    continue
                if not ca or not cb or not cc or not cd:
                    continue
                # Skip if it looks like an explanation (common pattern)
                if re.search(r'\bis\s+(correct|incorrect|the\s+answer)\b', q_text.lower()):
                    continue
                if re.search(r'^[A-D]\s+is\s+(correct|the)', q_text):
                    continue
                
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
        
        if questions:
            break  # Use first successful pattern
    
    return questions

def parse_questions_line_by_line(pages: List[str], source: str) -> List[Dict]:
    """Parse questions using line-by-line state machine approach."""
    questions = []
    current = None
    current_subject = ""
    
    for page_text in pages:
        lines = page_text.split('\n')
        
        # Try to detect subject from page header
        page_subject = detect_subject(page_text[:500])
        if page_subject:
            current_subject = page_subject
        
        i = 0
        while i < len(lines):
            line = lines[i].strip()
            
            # Check for question start
            q_match = re.match(r'^(?:Question\s+)?(\d{1,3})[\.\)]\s*(.+)$', line, re.IGNORECASE)
            
            if q_match and not re.match(r'^[ABCD]\s+is\s+', line):
                # Save previous question
                if current and current.get('choice_a'):
                    questions.append(current)
                
                q_num = q_match.group(1)
                q_text = q_match.group(2)
                
                current = {
                    'question_number': q_num,
                    'question': q_text,
                    'choice_a': '',
                    'choice_b': '',
                    'choice_c': '',
                    'choice_d': '',
                    'source': source,
                    'subject': current_subject or detect_subject(q_text),
                }
                
            elif current:
                # Check for choices
                choice_match = re.match(r'^\(([ABCD])\)\s*(.*)$|^([ABCD])[\.\)]\s*(.*)$', line)
                
                if choice_match:
                    letter = (choice_match.group(1) or choice_match.group(3)).lower()
                    text = choice_match.group(2) or choice_match.group(4) or ''
                    current[f'choice_{letter}'] = text
                
                elif not re.match(r'^\d{1,3}[\.\)]', line):
                    # Might be continuation of question or choice
                    if line and len(line) > 2:
                        # Add to question if no choices yet
                        if not current.get('choice_a'):
                            current['question'] += ' ' + line
            
            i += 1
        
        # Save last question on page
        if current and current.get('choice_a') and current.get('choice_d'):
            questions.append(current)
            current = None
    
    # Final save
    if current and current.get('choice_a'):
        questions.append(current)
    
    # Clean up
    for q in questions:
        q['question'] = clean_text(q['question'])
        for letter in ['a', 'b', 'c', 'd']:
            q[f'choice_{letter}'] = clean_text(q.get(f'choice_{letter}', ''))
    
    return questions

def process_pdf(pdf_path: Path) -> List[Dict]:
    """Process a single PDF."""
    print(f"\nProcessing: {pdf_path.name}")
    
    # Check if OCR needed
    use_ocr = needs_ocr(pdf_path)
    
    if use_ocr:
        print("  PDF appears to be scanned - using OCR")
        pages = extract_with_ocr(pdf_path)
    else:
        pages = extract_text_normal(pdf_path)
    
    print(f"  Extracted {len(pages)} pages")
    
    source = pdf_path.stem
    
    # Find answers
    answers = find_answer_key(pages)
    print(f"  Found {len(answers)} answers in key")
    
    # Try robust parsing on combined text
    combined_text = ' '.join(pages)
    questions = parse_questions_robust(combined_text, source)
    
    # If that didn't work well, try line-by-line
    if len(questions) < 20:
        questions = parse_questions_line_by_line(pages, source)
    
    print(f"  Parsed {len(questions)} questions")
    
    # Match answers
    matched = 0
    for q in questions:
        q_num = str(q['question_number'])
        if q_num in answers:
            q['answer'] = answers[q_num]
            matched += 1
    
    print(f"  Matched {matched} answers")
    
    return questions

def get_legal_explanation(subject: str, answer: str, question: str) -> Dict[str, str]:
    """Generate comprehensive legal explanations."""
    
    explanations_db = {
        'Constitutional Law': {
            'main': "IRAC Analysis: Identify constitutional provision → Determine scrutiny level → Apply facts → Conclude. KEY MNEMONICS: 'CAMPER' for 1st Amendment (Congress, Assembly, Media, Petition, Expression, Religion). Equal Protection uses SSR framework: Strict (race), Suspicious (gender), Rational (economic).",
            'rules': "Strict scrutiny requires compelling interest + narrowly tailored. Intermediate scrutiny requires important interest + substantially related. Rational basis requires legitimate interest + rationally related.",
        },
        'Contracts': {
            'main': "Contract formation: OACK (Offer + Acceptance + Consideration + No Defenses). Remember MY LEGS for Statute of Frauds: Marriage, Year+, Land, Executor, Goods $500+, Surety. UCC gap fillers apply to goods; common law requires more certainty.",
            'rules': "Mailbox rule: acceptance effective on dispatch; revocation effective on receipt. Mirror image rule (common law) vs battle of forms (UCC 2-207). Parol evidence bars prior/contemporaneous oral agreements contradicting final written contract.",
        },
        'Criminal Law': {
            'main': "Elements: Actus reus + Mens rea + Causation + Concurrence. BARRK for felony murder: Burglary, Arson, Robbery, Rape, Kidnapping. Mens rea hierarchy: Purpose > Knowledge > Recklessness > Negligence (MPC).",
            'rules': "Murder degrees: 1st (premeditated), 2nd (intent without premeditation). Voluntary manslaughter requires heat of passion with adequate provocation. Self-defense requires reasonable belief of imminent harm and proportional response.",
        },
        'Criminal Procedure': {
            'main': "4th Amendment: ESCAPIST exceptions (Exigent, Search incident to arrest, Consent, Automobile, Plain view, Inventory, Stop & frisk, Terry). Miranda requires custody + interrogation. 6th Amendment right to counsel attaches at adversarial proceedings.",
            'rules': "Exclusionary rule: evidence from unconstitutional search/seizure inadmissible (good faith exception applies). Terry stop requires reasonable suspicion; arrest requires probable cause. Miranda warnings required before custodial interrogation.",
        },
        'Evidence': {
            'main': "Hearsay = TOMA (out-of-court statement for Truth Of Matter Asserted). MIMIC for prior bad acts: Motive, Intent, Mistake absence, Identity, Common plan. Character evidence generally inadmissible in civil cases.",
            'rules': "Hearsay exceptions (availability immaterial): present sense impression, excited utterance, state of mind, medical diagnosis, business/public records. Impeachment: bias, prior inconsistent statement, character for truthfulness, contradiction.",
        },
        'Real Property': {
            'main': "Estates: Fee simple > Life estate > Defeasible fees. Future interests: Reversion (grantor), Remainder/Executory interest (third party). OPEN for prescriptive easement: Open, Peaceful, Exclusive, Notorious + statutory period.",
            'rules': "Recording statutes: Race (first to record), Notice (BFP without notice), Race-Notice (first BFP to record). Marketable title free from encumbrances. RAP: interest must vest within life in being + 21 years.",
        },
        'Torts': {
            'main': "Negligence: DBCD (Duty, Breach, Causation, Damages). RPP standard for ordinary care. BAFTIC for intentional torts: Battery, Assault, False imprisonment, Trespass, IIED, Conversion.",
            'rules': "Causation: 'but for' (actual) + proximate (foreseeability). Strict liability for: abnormally dangerous activities, wild animals, products (manufacturing/design/warning defects). Comparative fault reduces recovery (pure vs modified).",
        },
        'Civil Procedure': {
            'main': "Jurisdiction: SMJ (federal question/diversity) + PJ (minimum contacts). Erie doctrine: state substantive law, federal procedural law in diversity. Claim preclusion bars same claim; issue preclusion bars same issue.",
            'rules': "Diversity requires complete diversity + >$75k. Personal jurisdiction: traditional bases (presence, domicile, consent) or long-arm (purposeful availment + fair play). Venue: defendant's residence, where events occurred, or fallback.",
        },
    }
    
    info = explanations_db.get(subject, {
        'main': "Apply IRAC method: Issue, Rule, Application, Conclusion. Identify the area of law, state the applicable rule, apply facts to the rule, and reach a conclusion.",
        'rules': "Focus on the specific facts given and how they relate to established legal principles."
    })
    
    explanations = {
        'explain': f"{info['main']} | RULE: {info['rules']}",
        'explain_a': '',
        'explain_b': '',
        'explain_c': '',
        'explain_d': '',
    }
    
    for letter in ['A', 'B', 'C', 'D']:
        key = f'explain_{letter.lower()}'
        if letter == answer:
            explanations[key] = "CORRECT. This answer correctly applies the legal rule to the given facts and reaches the proper legal conclusion."
        else:
            explanations[key] = "Incorrect. This answer misapplies the rule, ignores key facts, or contradicts established legal principles."
    
    return explanations

def main():
    """Main function."""
    print("=" * 70)
    print("MBE Question Extractor v3 (with OCR support)")
    print("=" * 70)
    
    all_questions = []
    
    pdf_files = list(MBE_DIR.glob("*.pdf"))
    print(f"\nFound {len(pdf_files)} PDF files")
    
    for pdf_file in pdf_files:
        questions = process_pdf(pdf_file)
        all_questions.extend(questions)
    
    print(f"\n{'=' * 70}")
    print(f"Total extracted: {len(all_questions)} questions")
    
    # De-duplicate
    seen = set()
    unique = []
    for q in all_questions:
        # Use question text for dedup
        key = re.sub(r'\s+', '', q['question'][:100].lower())
        if key not in seen and len(q['question']) > 30:
            seen.add(key)
            unique.append(q)
    
    print(f"After dedup: {len(unique)} unique questions")
    
    if not unique:
        print("No questions extracted!")
        return
    
    # Write CSV
    print(f"\nWriting to: {OUTPUT_CSV}")
    
    with open(OUTPUT_CSV, 'w', newline='', encoding='utf-8') as f:
        writer = csv.writer(f)
        writer.writerow(CSV_HEADERS)
        
        for idx, q in enumerate(unique, 1):
            expl = get_legal_explanation(
                q.get('subject', ''),
                q.get('answer', ''),
                q.get('question', '')
            )
            
            row = [
                idx,                          # idx
                "mbe",                         # dataset
                f"mbe_{idx:04d}",              # example_id
                f"prompt_{idx:04d}",           # prompt_id
                q['source'],                   # source
                q.get('subject', ''),          # subject
                '',                            # subtopic
                q['question_number'],          # question_number
                '',                            # prompt
                q['question'],                 # question
                q['choice_a'],                 # choice_a
                q['choice_b'],                 # choice_b
                q['choice_c'],                 # choice_c
                q['choice_d'],                 # choice_d
                q.get('answer', ''),           # answer
                '',                            # gold_passage
                '',                            # gold_idx
                expl['explain'],               # explain
                expl['explain_a'],             # explain_a
                expl['explain_b'],             # explain_b
                expl['explain_c'],             # explain_c
                expl['explain_d'],             # explain_d
            ]
            writer.writerow(row)
    
    print(f"Wrote {len(unique)} questions to CSV")
    
    # Statistics
    print(f"\n{'=' * 70}")
    print("STATISTICS")
    print("=" * 70)
    
    by_source = {}
    by_subject = {}
    with_answer = 0
    
    for q in unique:
        src = q['source']
        by_source[src] = by_source.get(src, 0) + 1
        
        subj = q.get('subject') or 'Unknown'
        by_subject[subj] = by_subject.get(subj, 0) + 1
        
        if q.get('answer'):
            with_answer += 1
    
    print("\nBy Source:")
    for s, c in sorted(by_source.items(), key=lambda x: -x[1]):
        print(f"  {s}: {c}")
    
    print("\nBy Subject:")
    for s, c in sorted(by_subject.items(), key=lambda x: -x[1]):
        print(f"  {s}: {c}")
    
    print(f"\nWith Answers: {with_answer}/{len(unique)} ({100*with_answer/len(unique):.1f}%)")

if __name__ == "__main__":
    main()

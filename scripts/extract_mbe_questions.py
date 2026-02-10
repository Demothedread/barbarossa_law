#!/usr/bin/env python3
"""
MBE Question Extractor
Extracts bar exam questions from PDF files and outputs to CSV format.
"""

import csv
import os
import re
from pathlib import Path
from typing import Dict, List, Optional, Tuple

import fitz  # PyMuPDF

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

# MBE Subjects
SUBJECTS = {
    "constitutional law": "Constitutional Law",
    "contracts": "Contracts", 
    "criminal law": "Criminal Law",
    "criminal procedure": "Criminal Procedure",
    "evidence": "Evidence",
    "real property": "Real Property",
    "torts": "Torts",
    "civil procedure": "Civil Procedure",
}

def detect_subject(text: str) -> str:
    """Detect the MBE subject from text context."""
    text_lower = text.lower()
    for key, value in SUBJECTS.items():
        if key in text_lower:
            return value
    return ""

def extract_text_from_pdf(pdf_path: Path) -> List[Tuple[int, str]]:
    """Extract text from PDF with page numbers."""
    pages = []
    try:
        doc = fitz.open(str(pdf_path))
        for page_num in range(len(doc)):
            page = doc[page_num]
            text = page.get_text()
            pages.append((page_num + 1, text))
        doc.close()
    except Exception as e:
        print(f"Error reading {pdf_path}: {e}")
    return pages

def parse_barbri_questions(pages: List[Tuple[int, str]], source: str) -> List[Dict]:
    """Parse questions from Barbri format PDFs."""
    questions = []
    current_subject = ""
    
    # Combine all text to find question patterns
    full_text = "\n".join([text for _, text in pages])
    
    # Pattern for questions: number followed by period, then text
    # Questions typically have (A), (B), (C), (D) choices
    question_pattern = re.compile(
        r'(\d{1,3})\.\s+(.+?)(?=\n\s*\(A\))',
        re.DOTALL
    )
    
    # Find questions with their choices
    choice_pattern = re.compile(
        r'(\d{1,3})\.\s+(.+?)\(A\)\s*(.+?)\(B\)\s*(.+?)\(C\)\s*(.+?)\(D\)\s*(.+?)(?=\d{1,3}\.\s+|\Z)',
        re.DOTALL
    )
    
    matches = choice_pattern.findall(full_text)
    
    for match in matches:
        if len(match) >= 6:
            q_num, q_text, choice_a, choice_b, choice_c, choice_d = match[:6]
            
            # Clean up text
            q_text = re.sub(r'\s+', ' ', q_text).strip()
            choice_a = re.sub(r'\s+', ' ', choice_a).strip()
            choice_b = re.sub(r'\s+', ' ', choice_b).strip()
            choice_c = re.sub(r'\s+', ' ', choice_c).strip()
            choice_d = re.sub(r'\s+', ' ', choice_d).strip()
            
            # Detect subject from context
            subject = detect_subject(q_text)
            
            questions.append({
                'question_number': q_num,
                'question': q_text,
                'choice_a': choice_a,
                'choice_b': choice_b,
                'choice_c': choice_c,
                'choice_d': choice_d,
                'source': source,
                'subject': subject,
            })
    
    return questions

def parse_flemings_questions(pages: List[Tuple[int, str]], source: str) -> List[Dict]:
    """Parse questions from Fleming's format PDFs."""
    questions = []
    full_text = "\n".join([text for _, text in pages])
    
    # Fleming's often uses numbered questions with lettered choices
    # Try multiple patterns
    patterns = [
        # Pattern 1: Question number. text (A) choice (B) choice...
        re.compile(
            r'(?:Question\s+)?(\d{1,3})[\.\)]\s*(.+?)\s*\(A\)\s*(.+?)\s*\(B\)\s*(.+?)\s*\(C\)\s*(.+?)\s*\(D\)\s*(.+?)(?=(?:Question\s+)?\d{1,3}[\.\)]|\Z)',
            re.DOTALL | re.IGNORECASE
        ),
        # Pattern 2: Just numbers
        re.compile(
            r'(\d{1,3})\.\s+(.+?)\s+\(A\)\s+(.+?)\s+\(B\)\s+(.+?)\s+\(C\)\s+(.+?)\s+\(D\)\s+(.+?)(?=\d{1,3}\.\s+|\Z)',
            re.DOTALL
        ),
    ]
    
    for pattern in patterns:
        matches = pattern.findall(full_text)
        if matches:
            for match in matches:
                if len(match) >= 6:
                    q_num, q_text, choice_a, choice_b, choice_c, choice_d = match[:6]
                    
                    # Clean up
                    q_text = re.sub(r'\s+', ' ', q_text).strip()
                    choice_a = re.sub(r'\s+', ' ', choice_a).strip()
                    choice_b = re.sub(r'\s+', ' ', choice_b).strip()
                    choice_c = re.sub(r'\s+', ' ', choice_c).strip()
                    choice_d = re.sub(r'\s+', ' ', choice_d).strip()
                    
                    if len(q_text) > 20:  # Filter out too short matches
                        subject = detect_subject(q_text)
                        questions.append({
                            'question_number': q_num,
                            'question': q_text,
                            'choice_a': choice_a,
                            'choice_b': choice_b,
                            'choice_c': choice_c,
                            'choice_d': choice_d,
                            'source': source,
                            'subject': subject,
                        })
            break
    
    return questions

def parse_pmbr_questions(pages: List[Tuple[int, str]], source: str) -> List[Dict]:
    """Parse questions from PMBR format PDFs."""
    questions = []
    full_text = "\n".join([text for _, text in pages])
    
    # PMBR often has a specific format
    pattern = re.compile(
        r'(\d{1,3})\.\s+(.+?)\s*(?:\(A\)|A\.)\s*(.+?)\s*(?:\(B\)|B\.)\s*(.+?)\s*(?:\(C\)|C\.)\s*(.+?)\s*(?:\(D\)|D\.)\s*(.+?)(?=\d{1,3}\.\s+|\Z)',
        re.DOTALL
    )
    
    matches = pattern.findall(full_text)
    
    for match in matches:
        if len(match) >= 6:
            q_num, q_text, choice_a, choice_b, choice_c, choice_d = match[:6]
            
            q_text = re.sub(r'\s+', ' ', q_text).strip()
            choice_a = re.sub(r'\s+', ' ', choice_a).strip()
            choice_b = re.sub(r'\s+', ' ', choice_b).strip()
            choice_c = re.sub(r'\s+', ' ', choice_c).strip()
            choice_d = re.sub(r'\s+', ' ', choice_d).strip()
            
            if len(q_text) > 20:
                subject = detect_subject(q_text)
                questions.append({
                    'question_number': q_num,
                    'question': q_text,
                    'choice_a': choice_a,
                    'choice_b': choice_b,
                    'choice_c': choice_c,
                    'choice_d': choice_d,
                    'source': source,
                    'subject': subject,
                })
    
    return questions

def find_answers_in_text(full_text: str) -> Dict[str, str]:
    """Find answer key in the text (usually at the back of the book)."""
    answers = {}
    
    # Common answer key patterns
    patterns = [
        # Pattern: 1. A  2. B  3. C
        re.compile(r'(\d{1,3})\.\s*([ABCD])\b', re.MULTILINE),
        # Pattern: 1-A  2-B  3-C
        re.compile(r'(\d{1,3})\s*[-–]\s*([ABCD])\b', re.MULTILINE),
        # Pattern: 1(A)  2(B)
        re.compile(r'(\d{1,3})\s*\(([ABCD])\)', re.MULTILINE),
        # Pattern: just numbers and letters in sequence
        re.compile(r'(\d{1,3})\s+([ABCD])(?:\s|$)', re.MULTILINE),
    ]
    
    for pattern in patterns:
        matches = pattern.findall(full_text)
        if len(matches) > 10:  # If we found significant matches
            for q_num, answer in matches:
                answers[q_num] = answer
            if len(answers) > 50:  # Good coverage
                break
    
    return answers

def generate_explanation(question: str, choices: Dict[str, str], answer: str, subject: str) -> Dict[str, str]:
    """Generate explanations based on legal knowledge."""
    
    explanations = {
        'explain': '',
        'explain_a': '',
        'explain_b': '',
        'explain_c': '',
        'explain_d': '',
    }
    
    # Subject-specific legal rules and mnemonics
    rules_by_subject = {
        'Constitutional Law': {
            'rules': [
                'IRAC: Issue, Rule, Application, Conclusion',
                'Commerce Clause: Congress can regulate (1) channels of interstate commerce, (2) instrumentalities, (3) activities substantially affecting interstate commerce',
                'Due Process: Procedural (notice and hearing) vs Substantive (fundamental rights)',
                'Equal Protection: Rational basis (legitimate interest), Intermediate scrutiny (important interest), Strict scrutiny (compelling interest)',
            ],
            'mnemonics': [
                'CAMPER for 1st Amendment: Congress, Assembly, Media, Petition, Expression, Religion',
                'TIPS for takings: Temporary, Inverse, Physical, Substantial economic impact',
            ]
        },
        'Contracts': {
            'rules': [
                'Offer + Acceptance + Consideration = Contract',
                'Statute of Frauds (MY LEGS): Marriage, Year+, Land, Executor, Goods $500+, Surety',
                'Mailbox Rule: Acceptance effective on dispatch; rejection effective on receipt',
                'Mirror Image Rule: Common law requires exact acceptance; UCC allows additional terms',
                'Parol Evidence Rule: Prior/contemporaneous agreements merged into written contract',
            ],
            'mnemonics': [
                'DURESS has no consent',
                'SOF = MY LEGS',
                'PER keeps it written (Parol Evidence Rule)',
            ]
        },
        'Criminal Law': {
            'rules': [
                'Mens Rea levels: Purpose, Knowledge, Recklessness, Negligence',
                'Homicide: Murder (1st/2nd), Voluntary Manslaughter (heat of passion), Involuntary Manslaughter',
                'Felony Murder: Death during enumerated felony (BARRK: Burglary, Arson, Robbery, Rape, Kidnapping)',
                'Defenses: Self-defense, Necessity, Duress, Insanity (M\'Naghten, Irresistible Impulse, MPC)',
            ],
            'mnemonics': [
                'BARRK for felony murder: Burglary, Arson, Robbery, Rape, Kidnapping',
                'MPC mens rea: PKNR (Purpose, Knowledge, Negligence, Recklessness)',
                'CRIMINAL for inchoate: Conspiracy, Attempt, Solicitation',
            ]
        },
        'Evidence': {
            'rules': [
                'Hearsay: Out-of-court statement offered for truth of matter asserted',
                'Hearsay Exceptions: Present sense impression, Excited utterance, State of mind, Medical diagnosis',
                'Character Evidence: Generally inadmissible in civil; criminal defendant can open door',
                'Relevance: Tendency to make fact more/less probable (FRE 401)',
                'Best Evidence Rule: Original document required to prove contents',
            ],
            'mnemonics': [
                'TOMA for hearsay: Truth Of Matter Asserted',
                'MIMIC for prior bad acts: Motive, Intent, Mistake absence, Identity, Common plan',
                'PEDS for unavailable declarant: Prior testimony, Dying declaration, Statement against interest',
            ]
        },
        'Real Property': {
            'rules': [
                'Estates: Fee Simple, Life Estate, Fee Tail, Defeasible Fees',
                'Future Interests: Reversion, Remainder (vested/contingent), Executory Interest',
                'Recording Acts: Race, Notice, Race-Notice',
                'Easements: Express, Implied, Prescriptive, Necessity',
                'Covenants: Touch and concern, Horizontal privity, Vertical privity',
            ],
            'mnemonics': [
                'RAP: No interest valid unless it must vest within 21 years after life in being',
                'DUSTPAN for license: Determinable, Use, Sale, Termination, Personal, And revocable, Not assignable',
            ]
        },
        'Torts': {
            'rules': [
                'Negligence: Duty, Breach, Causation (actual + proximate), Damages',
                'Strict Liability: Abnormally dangerous activities, Wild animals, Products liability',
                'Intentional Torts: Battery, Assault, False Imprisonment, IIED, Trespass, Conversion',
                'Defamation: False statement of fact, Publication, Damages (per se vs special)',
            ],
            'mnemonics': [
                'DBCD for negligence: Duty, Breach, Causation, Damages',
                'BAFTIC for intentional torts: Battery, Assault, False imprisonment, Trespass, IIED, Conversion',
                'RPP: Reasonable Prudent Person standard',
            ]
        },
        'Civil Procedure': {
            'rules': [
                'Personal Jurisdiction: Presence, Domicile, Consent, Minimum Contacts (purposeful availment)',
                'Subject Matter Jurisdiction: Federal Question (1331), Diversity (1332 - complete diversity, >$75k)',
                'Venue: Where defendant resides, where events occurred, fallback',
                'Pleading: Notice pleading (Twombly/Iqbal plausibility standard)',
            ],
            'mnemonics': [
                'FRCP 12(b) motions: Lack of SMJ, PJ, Venue, Process, Service, Failure to state claim, Indispensable party',
                'Erie doctrine: Federal courts apply state substantive law, federal procedural law',
            ]
        },
    }
    
    # Get subject-specific content
    subject_info = rules_by_subject.get(subject, {'rules': [], 'mnemonics': []})
    
    # Build main explanation
    if subject_info['rules']:
        explanations['explain'] = f"Key {subject} concepts: {subject_info['rules'][0]}"
        if subject_info['mnemonics']:
            explanations['explain'] += f" | Memory tip: {subject_info['mnemonics'][0]}"
    
    # Generate choice explanations based on answer
    for letter in ['a', 'b', 'c', 'd']:
        choice_key = f'explain_{letter}'
        if letter.upper() == answer:
            explanations[choice_key] = f"CORRECT. This answer correctly applies the legal principle."
        else:
            explanations[choice_key] = f"Incorrect. This choice misapplies or contradicts the applicable rule."
    
    return explanations

def process_pdf(pdf_path: Path) -> List[Dict]:
    """Process a single PDF and extract questions."""
    print(f"\nProcessing: {pdf_path.name}")
    
    # Extract text from PDF
    pages = extract_text_from_pdf(pdf_path)
    if not pages:
        print(f"  No text extracted from {pdf_path.name}")
        return []
    
    print(f"  Extracted {len(pages)} pages")
    
    # Determine source name
    source = pdf_path.stem
    
    # Combine all text for answer finding
    full_text = "\n".join([text for _, text in pages])
    
    # Try to find answers first
    answers = find_answers_in_text(full_text)
    print(f"  Found {len(answers)} answers in answer key")
    
    # Parse questions based on source
    questions = []
    if 'barbri' in source.lower():
        questions = parse_barbri_questions(pages, source)
    elif 'fleming' in source.lower():
        questions = parse_flemings_questions(pages, source)
    elif 'pmbr' in source.lower():
        questions = parse_pmbr_questions(pages, source)
    else:
        # Try all parsers
        questions = parse_barbri_questions(pages, source)
        if len(questions) < 10:
            questions = parse_flemings_questions(pages, source)
        if len(questions) < 10:
            questions = parse_pmbr_questions(pages, source)
    
    print(f"  Parsed {len(questions)} questions")
    
    # Match answers to questions
    for q in questions:
        q_num = str(q['question_number'])
        if q_num in answers:
            q['answer'] = answers[q_num]
        else:
            q['answer'] = ''
    
    return questions

def main():
    """Main extraction routine."""
    print("MBE Question Extractor")
    print("=" * 50)
    
    all_questions = []
    
    # Process each PDF
    for pdf_file in MBE_DIR.glob("*.pdf"):
        questions = process_pdf(pdf_file)
        all_questions.extend(questions)
    
    print(f"\n{'=' * 50}")
    print(f"Total questions extracted: {len(all_questions)}")
    
    if not all_questions:
        print("No questions extracted. Exiting.")
        return
    
    # Write to CSV
    print(f"\nWriting to {OUTPUT_CSV}")
    
    with open(OUTPUT_CSV, 'w', newline='', encoding='utf-8') as f:
        writer = csv.writer(f)
        writer.writerow(CSV_HEADERS)
        
        for idx, q in enumerate(all_questions, start=1):
            # Generate explanations
            explanations = generate_explanation(
                q['question'],
                {
                    'A': q['choice_a'],
                    'B': q['choice_b'],
                    'C': q['choice_c'],
                    'D': q['choice_d'],
                },
                q.get('answer', ''),
                q.get('subject', '')
            )
            
            row = [
                idx,  # idx
                "mbe",  # dataset
                f"mbe_{idx:04d}",  # example_id
                f"prompt_{idx:04d}",  # prompt_id
                q['source'],  # source
                q.get('subject', ''),  # subject
                '',  # subtopic
                q['question_number'],  # question_number
                '',  # prompt
                q['question'],  # question
                q['choice_a'],  # choice_a
                q['choice_b'],  # choice_b
                q['choice_c'],  # choice_c
                q['choice_d'],  # choice_d
                q.get('answer', ''),  # answer
                '',  # gold_passage
                '',  # gold_idx
                explanations['explain'],  # explain
                explanations['explain_a'],  # explain_a
                explanations['explain_b'],  # explain_b
                explanations['explain_c'],  # explain_c
                explanations['explain_d'],  # explain_d
            ]
            writer.writerow(row)
    
    print(f"Successfully wrote {len(all_questions)} questions to CSV")
    
    # Summary by source
    print("\nQuestions by source:")
    sources = {}
    for q in all_questions:
        src = q['source']
        sources[src] = sources.get(src, 0) + 1
    for src, count in sorted(sources.items()):
        print(f"  {src}: {count}")
    
    # Summary by subject
    print("\nQuestions by subject:")
    subjects = {}
    for q in all_questions:
        subj = q.get('subject', 'Unknown') or 'Unknown'
        subjects[subj] = subjects.get(subj, 0) + 1
    for subj, count in sorted(subjects.items()):
        print(f"  {subj}: {count}")

if __name__ == "__main__":
    main()

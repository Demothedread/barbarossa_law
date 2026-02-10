#!/usr/bin/env python3
"""
MBE Question Extractor - Version 2
Extracts bar exam questions from PDF files and outputs to CSV format.
Uses page-by-page processing for efficiency.
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
    "constitutional": "Constitutional Law",
    "constitution": "Constitutional Law",
    "first amendment": "Constitutional Law",
    "due process": "Constitutional Law",
    "equal protection": "Constitutional Law",
    "commerce clause": "Constitutional Law",
    "contracts": "Contracts",
    "contract": "Contracts", 
    "offer": "Contracts",
    "acceptance": "Contracts",
    "consideration": "Contracts",
    "ucc": "Contracts",
    "breach": "Contracts",
    "criminal law": "Criminal Law",
    "murder": "Criminal Law",
    "homicide": "Criminal Law",
    "larceny": "Criminal Law",
    "burglary": "Criminal Law",
    "robbery": "Criminal Law",
    "felony": "Criminal Law",
    "criminal procedure": "Criminal Procedure",
    "fourth amendment": "Criminal Procedure",
    "miranda": "Criminal Procedure",
    "search": "Criminal Procedure",
    "seizure": "Criminal Procedure",
    "evidence": "Evidence",
    "hearsay": "Evidence",
    "witness": "Evidence",
    "testimony": "Evidence",
    "privilege": "Evidence",
    "real property": "Real Property",
    "property": "Real Property",
    "landlord": "Real Property",
    "tenant": "Real Property",
    "easement": "Real Property",
    "deed": "Real Property",
    "mortgage": "Real Property",
    "covenant": "Real Property",
    "torts": "Torts",
    "tort": "Torts",
    "negligence": "Torts",
    "negligent": "Torts",
    "battery": "Torts",
    "assault": "Torts",
    "defamation": "Torts",
    "strict liability": "Torts",
    "civil procedure": "Civil Procedure",
    "jurisdiction": "Civil Procedure",
    "venue": "Civil Procedure",
    "discovery": "Civil Procedure",
    "pleading": "Civil Procedure",
}

def detect_subject(text: str) -> str:
    """Detect the MBE subject from text context."""
    text_lower = text.lower()
    for key, value in SUBJECTS.items():
        if key in text_lower:
            return value
    return ""

def clean_text(text: str) -> str:
    """Clean and normalize text."""
    # Replace multiple whitespace with single space
    text = re.sub(r'\s+', ' ', text)
    # Remove leading/trailing whitespace
    text = text.strip()
    return text

def extract_text_from_pdf(pdf_path: Path) -> Tuple[List[str], int]:
    """Extract text from PDF, returning list of page texts and total pages."""
    pages = []
    try:
        doc = fitz.open(str(pdf_path))
        for page_num in range(len(doc)):
            page = doc[page_num]
            text = page.get_text()
            pages.append(text)
        doc.close()
    except Exception as e:
        print(f"Error reading {pdf_path}: {e}")
    return pages, len(pages)

def find_answer_key_section(pages: List[str]) -> Dict[str, str]:
    """Find and parse answer key, usually in the back of the book."""
    answers = {}
    
    # Look at the last 30% of pages for answer keys
    start_idx = int(len(pages) * 0.7)
    answer_section = "\n".join(pages[start_idx:])
    
    # Patterns for answer keys - simpler patterns to avoid regex catastrophe
    # Look for lines with answer patterns
    lines = answer_section.split('\n')
    
    for line in lines:
        line = line.strip()
        
        # Pattern: "1. A" or "1 A" or "1-A" or "1.A"
        matches = re.findall(r'\b(\d{1,3})\s*[\.\-\s]\s*([ABCD])\b', line)
        for q_num, answer in matches:
            answers[q_num] = answer
        
        # Pattern: "(1) A" or "1) A"
        matches = re.findall(r'\(?\s*(\d{1,3})\s*\)\s*([ABCD])\b', line)
        for q_num, answer in matches:
            answers[q_num] = answer
    
    return answers

def parse_page_for_questions(page_text: str, source: str, current_subject: str = "") -> Tuple[List[Dict], str]:
    """Parse a single page for questions. Returns questions and detected subject."""
    questions = []
    
    # Try to detect subject from page headers or content
    detected_subject = detect_subject(page_text) or current_subject
    
    # Split into lines for line-by-line processing
    lines = page_text.split('\n')
    
    # State machine for parsing
    current_question = None
    collecting_choices = False
    current_choice = None
    choice_text = ""
    
    i = 0
    while i < len(lines):
        line = lines[i].strip()
        
        # Check for question number start (e.g., "1.", "12.", "Question 1")
        q_match = re.match(r'^(?:Question\s+)?(\d{1,3})[\.\)]\s*(.*)$', line, re.IGNORECASE)
        
        if q_match:
            # Save previous question if exists
            if current_question and current_question.get('choice_d'):
                questions.append(current_question)
            
            q_num = q_match.group(1)
            q_text = q_match.group(2)
            
            current_question = {
                'question_number': q_num,
                'question': q_text,
                'choice_a': '',
                'choice_b': '',
                'choice_c': '',
                'choice_d': '',
                'source': source,
                'subject': detected_subject,
            }
            collecting_choices = False
            current_choice = None
        
        elif current_question:
            # Check for choice markers
            choice_match = re.match(r'^\(([ABCD])\)\s*(.*)$|^([ABCD])[\.\)]\s*(.*)$', line)
            
            if choice_match:
                letter = (choice_match.group(1) or choice_match.group(3)).upper()
                text = choice_match.group(2) or choice_match.group(4) or ''
                
                if current_choice:
                    # Save previous choice
                    current_question[f'choice_{current_choice.lower()}'] = clean_text(choice_text)
                
                current_choice = letter
                choice_text = text
                collecting_choices = True
            
            elif collecting_choices and current_choice:
                # Continue collecting choice text
                if line and not re.match(r'^\d{1,3}[\.\)]', line):
                    choice_text += ' ' + line
            
            elif not collecting_choices:
                # Continue collecting question text
                if line and not re.match(r'^(?:Question\s+)?\d{1,3}[\.\)]', line):
                    current_question['question'] += ' ' + line
        
        i += 1
    
    # Save last choice and question
    if current_question:
        if current_choice:
            current_question[f'choice_{current_choice.lower()}'] = clean_text(choice_text)
        if current_question.get('choice_a') or current_question.get('choice_b'):
            questions.append(current_question)
    
    # Clean up questions
    for q in questions:
        q['question'] = clean_text(q['question'])
        for letter in ['a', 'b', 'c', 'd']:
            q[f'choice_{letter}'] = clean_text(q.get(f'choice_{letter}', ''))
    
    return questions, detected_subject

def parse_multi_column_page(page_text: str, source: str) -> List[Dict]:
    """Parse pages that might have multi-column layout."""
    questions = []
    
    # Alternative approach: find all question patterns in the text
    text = page_text.replace('\n', ' ')
    
    # Pattern to match question number followed by text and choices
    # More lenient pattern
    pattern = r'(\d{1,3})\.\s+([^(]+?)\s*\(A\)\s*([^(]+?)\s*\(B\)\s*([^(]+?)\s*\(C\)\s*([^(]+?)\s*\(D\)\s*([^0-9]+?)(?=\d{1,3}\.\s+|\Z)'
    
    matches = re.findall(pattern, text, re.DOTALL)
    
    for match in matches:
        if len(match) >= 6:
            q_num, q_text, choice_a, choice_b, choice_c, choice_d = match[:6]
            
            questions.append({
                'question_number': q_num.strip(),
                'question': clean_text(q_text),
                'choice_a': clean_text(choice_a),
                'choice_b': clean_text(choice_b),
                'choice_c': clean_text(choice_c),
                'choice_d': clean_text(choice_d),
                'source': source,
                'subject': detect_subject(q_text),
            })
    
    return questions

def process_pdf(pdf_path: Path) -> List[Dict]:
    """Process a single PDF and extract questions."""
    print(f"\nProcessing: {pdf_path.name}")
    
    pages, num_pages = extract_text_from_pdf(pdf_path)
    if not pages:
        print(f"  No text extracted from {pdf_path.name}")
        return []
    
    print(f"  Extracted {num_pages} pages")
    
    source = pdf_path.stem
    
    # Find answers first
    answers = find_answer_key_section(pages)
    print(f"  Found {len(answers)} answers in answer key")
    
    # Process each page
    all_questions = []
    current_subject = ""
    
    for page_num, page_text in enumerate(pages):
        # Try line-by-line parsing first
        questions, current_subject = parse_page_for_questions(page_text, source, current_subject)
        
        # If that didn't work well, try multi-column parsing
        if not questions:
            questions = parse_multi_column_page(page_text, source)
        
        # Filter out incomplete questions
        questions = [q for q in questions if q.get('question') and len(q.get('question', '')) > 20]
        
        all_questions.extend(questions)
        
        # Progress indicator every 50 pages
        if (page_num + 1) % 50 == 0:
            print(f"    Processed {page_num + 1}/{num_pages} pages, {len(all_questions)} questions so far")
    
    print(f"  Total parsed: {len(all_questions)} questions")
    
    # Match answers to questions
    matched = 0
    for q in all_questions:
        q_num = str(q['question_number'])
        if q_num in answers:
            q['answer'] = answers[q_num]
            matched += 1
    
    print(f"  Matched {matched} answers")
    
    return all_questions

def get_legal_explanation(subject: str, answer: str) -> Dict[str, str]:
    """Generate legal explanations based on subject matter."""
    
    explanations_db = {
        'Constitutional Law': {
            'main': "Apply constitutional analysis: (1) Is there state action? (2) Which constitutional provision applies? (3) What level of scrutiny? (4) Does the action survive scrutiny? MNEMONIC: STATE-PROVISION-SCRUTINY-SURVIVE",
            'rules': [
                "Equal Protection: Use STRICT scrutiny for race/national origin, INTERMEDIATE for gender, RATIONAL BASIS for economic regulation",
                "Due Process: Procedural (Matthews balancing: private interest, risk of error, government interest) vs Substantive (fundamental rights get strict scrutiny)",
                "Commerce Clause: Congress can regulate (1) channels, (2) instrumentalities, (3) activities substantially affecting interstate commerce",
                "1st Amendment: Content-based restrictions get strict scrutiny; content-neutral get intermediate",
            ]
        },
        'Contracts': {
            'main': "Apply contract formation analysis: (1) Valid offer? (2) Valid acceptance? (3) Consideration? (4) Any defenses? MNEMONIC: OACK - Offer, Acceptance, Consideration, Kdefenses",
            'rules': [
                "Statute of Frauds (MY LEGS): Marriage, Year+, Land, Executor, Goods $500+, Surety",
                "Parol Evidence Rule: Prior/contemporaneous agreements merged into final written contract",
                "Mailbox Rule: Acceptance effective on dispatch; rejection/revocation on receipt",
                "UCC Article 2: Applies to sale of goods; more flexible than common law",
            ]
        },
        'Criminal Law': {
            'main': "Apply criminal analysis: (1) What crime charged? (2) What are the elements? (3) Are all elements satisfied? (4) Any defenses? MNEMONIC: CREAM - Crime, Requirements, Elements met?, Actus reus/Mens rea, defenses",
            'rules': [
                "Murder: (1) First degree - premeditated; (2) Second degree - intent without premeditation",
                "Felony Murder Rule: Death during BARRK felony (Burglary, Arson, Robbery, Rape, Kidnapping)",
                "Mens Rea levels: Purpose > Knowledge > Recklessness > Negligence",
                "Defenses: Self-defense (reasonable belief of imminent harm), Necessity, Duress, Insanity",
            ]
        },
        'Criminal Procedure': {
            'main': "Apply 4th/5th/6th Amendment analysis: (1) Was there government action? (2) Was there a search/seizure/interrogation? (3) Were rights violated? (4) What remedy? MNEMONIC: GASR - Government Action, Search/Seizure, Rights, Remedy",
            'rules': [
                "4th Amendment: Reasonable expectation of privacy test (Katz); Warrant requirement with exceptions",
                "Search exceptions: ESCAPIST - Exigent circumstances, Search incident to arrest, Consent, Automobile, Plain view, Inventory, Stop and frisk, Terry stop",
                "Miranda: Custody + Interrogation = Miranda warnings required before statements admissible",
                "6th Amendment: Right to counsel attaches at initiation of adversarial proceedings",
            ]
        },
        'Evidence': {
            'main': "Apply evidence analysis: (1) Is it relevant? (2) Is it hearsay? (3) Any exceptions? (4) Any other exclusions? MNEMONIC: RHEA - Relevant, Hearsay, Exceptions, Admissible",
            'rules': [
                "Hearsay: Out-of-court statement offered for TOMA (Truth Of Matter Asserted)",
                "Hearsay exceptions (availability immaterial): Present sense impression, Excited utterance, State of mind, Medical diagnosis, Business records, Public records",
                "Character evidence: Generally inadmissible in civil; defendant can open door in criminal",
                "Prior bad acts (MIMIC): Motive, Intent, Mistake absence, Identity, Common plan/scheme",
            ]
        },
        'Real Property': {
            'main': "Apply property analysis: (1) What type of interest? (2) How was it created? (3) What are its characteristics? (4) How can it be terminated? MNEMONIC: ICCT - Interest, Creation, Characteristics, Termination",
            'rules': [
                "Estates: Fee simple absolute, Defeasible fees (determinable, subject to condition subsequent, subject to executory interest), Life estate",
                "Future interests: Reversion, Remainder (vested/contingent), Executory interest (shifting/springing)",
                "Recording acts: Race (first to record), Notice (subsequent BFP without notice), Race-Notice (first BFP to record without notice)",
                "Easements: Created by Express grant, Implication, Necessity, Prescription (OPEN: Open, Peaceful, Exclusive, Notorious + statutory period)",
            ]
        },
        'Torts': {
            'main': "Apply tort analysis: (1) What tort claimed? (2) What are the elements? (3) Are all elements met? (4) Any defenses? MNEMONIC: TEAD - Tort type, Elements, All met?, Defenses",
            'rules': [
                "Negligence elements (DBCD): Duty, Breach, Causation (actual + proximate), Damages",
                "Strict liability: Abnormally dangerous activities, Wild animals, Products liability (manufacturing defect, design defect, warning defect)",
                "Intentional torts: Battery (harmful/offensive contact), Assault (apprehension of imminent contact), False imprisonment, IIED",
                "Defamation: False statement of fact + Publication + Fault + Damages (per se: CLIP - Crime, Loathsome disease, Improper business conduct, Sexual misconduct)",
            ]
        },
        'Civil Procedure': {
            'main': "Apply procedural analysis: (1) Does court have jurisdiction? (2) Is venue proper? (3) Are pleadings sufficient? (4) Are discovery/trial rules followed? MNEMONIC: JVPT - Jurisdiction, Venue, Pleadings, Trial",
            'rules': [
                "Subject matter jurisdiction: Federal question (1331) or Diversity (1332) - complete diversity + >$75k",
                "Personal jurisdiction: Traditional bases (presence, domicile, consent) or Long-arm (minimum contacts + fair play)",
                "Venue: Where defendant resides, where events occurred, or fallback (where any defendant can be found if no other venue works)",
                "Erie doctrine: Federal courts sitting in diversity apply state substantive law, federal procedural law",
            ]
        },
    }
    
    subject_info = explanations_db.get(subject, {
        'main': "Apply systematic legal analysis: identify the issue, state the rule, apply facts to law, reach conclusion (IRAC method).",
        'rules': ["Always identify the area of law and applicable rules before analyzing."]
    })
    
    explanations = {
        'explain': subject_info['main'] + " Key rules: " + subject_info['rules'][0] if subject_info['rules'] else subject_info['main'],
        'explain_a': '',
        'explain_b': '',
        'explain_c': '',
        'explain_d': '',
    }
    
    # Set correct/incorrect explanations
    for letter in ['A', 'B', 'C', 'D']:
        key = f'explain_{letter.lower()}'
        if letter == answer:
            explanations[key] = "CORRECT. This answer properly applies the relevant legal rule to the facts."
        else:
            explanations[key] = "Incorrect. This answer either misapplies the rule or contradicts established legal principles."
    
    return explanations

def main():
    """Main extraction routine."""
    print("=" * 60)
    print("MBE Question Extractor v2")
    print("=" * 60)
    
    all_questions = []
    
    # Process each PDF
    pdf_files = list(MBE_DIR.glob("*.pdf"))
    print(f"\nFound {len(pdf_files)} PDF files to process")
    
    for pdf_file in pdf_files:
        questions = process_pdf(pdf_file)
        all_questions.extend(questions)
    
    print(f"\n{'=' * 60}")
    print(f"Total questions extracted: {len(all_questions)}")
    
    # De-duplicate based on question text
    seen = set()
    unique_questions = []
    for q in all_questions:
        q_hash = q['question'][:100]  # Use first 100 chars as hash
        if q_hash not in seen:
            seen.add(q_hash)
            unique_questions.append(q)
    
    print(f"After de-duplication: {len(unique_questions)} unique questions")
    
    if not unique_questions:
        print("No questions extracted. Exiting.")
        return
    
    # Write to CSV
    print(f"\nWriting to {OUTPUT_CSV}")
    
    with open(OUTPUT_CSV, 'w', newline='', encoding='utf-8') as f:
        writer = csv.writer(f)
        writer.writerow(CSV_HEADERS)
        
        for idx, q in enumerate(unique_questions, start=1):
            # Generate explanations
            explanations = get_legal_explanation(
                q.get('subject', ''),
                q.get('answer', '')
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
    
    print(f"Successfully wrote {len(unique_questions)} questions to CSV")
    
    # Summary statistics
    print("\n" + "=" * 60)
    print("SUMMARY STATISTICS")
    print("=" * 60)
    
    print("\nQuestions by source:")
    sources = {}
    for q in unique_questions:
        src = q['source']
        sources[src] = sources.get(src, 0) + 1
    for src, count in sorted(sources.items(), key=lambda x: -x[1]):
        print(f"  {src}: {count}")
    
    print("\nQuestions by subject:")
    subjects = {}
    for q in unique_questions:
        subj = q.get('subject', 'Unknown') or 'Unknown'
        subjects[subj] = subjects.get(subj, 0) + 1
    for subj, count in sorted(subjects.items(), key=lambda x: -x[1]):
        print(f"  {subj}: {count}")
    
    print("\nQuestions with answers:")
    with_answers = sum(1 for q in unique_questions if q.get('answer'))
    print(f"  {with_answers} / {len(unique_questions)} ({100*with_answers/len(unique_questions):.1f}%)")

if __name__ == "__main__":
    main()

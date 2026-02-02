#!/usr/bin/env python3
"""
Extract California Bar Exam (CBX) essay questions and model answers from PDF files.

This script parses PDF files from the CBX Questions and CBX Answers folders,
extracts individual essay prompts with metadata, and stores them in the database.

Usage:
    python scripts/extract_cbx_essays.py [--db-path PATH] [--dry-run]
    
The script expects PDF files in these locations:
    - lunaire-spa/CBX Questions/
    - lunaire-spa/CBX Answers/
"""

import argparse
import os
import re
import sqlite3
import sys
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

try:
    import pdfplumber
except ImportError:
    try:
        from PyPDF2 import PdfReader
        pdfplumber = None
    except ImportError:
        print("ERROR: Neither pdfplumber nor PyPDF2 installed. Run: pip install pdfplumber")
        sys.exit(1)

# Add parent directory to path for imports
PROJECT_ROOT = Path(__file__).parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

# Default paths
DEFAULT_DB_PATH = PROJECT_ROOT / 'law_quiz.db'
QUESTIONS_DIR = PROJECT_ROOT / 'lunaire-spa' / 'CBX Questions'
ANSWERS_DIR = PROJECT_ROOT / 'lunaire-spa' / 'CBX Answers'


def extract_text_from_pdf(pdf_path: Path) -> str:
    """Extract all text from a PDF file."""
    try:
        if pdfplumber:
            # Use pdfplumber (more reliable)
            with pdfplumber.open(str(pdf_path)) as pdf:
                text_parts = []
                for page in pdf.pages:
                    page_text = page.extract_text()
                    if page_text:
                        text_parts.append(page_text)
                return '\n'.join(text_parts)
        else:
            # Fall back to PyPDF2
            reader = PdfReader(str(pdf_path))
            text_parts = []
            for page in reader.pages:
                page_text = page.extract_text()
                if page_text:
                    text_parts.append(page_text)
            return '\n'.join(text_parts)
    except Exception as e:
        print(f"  ERROR extracting text from {pdf_path.name}: {e}")
        return ""


def parse_exam_metadata(filename: str) -> Tuple[Optional[int], Optional[str]]:
    """
    Parse exam year and month from filename.
    
    Examples:
        Feb2023-CBX-Questions (1).pdf -> (2023, "February")
        July2012-Essays_R.pdf -> (2012, "July")
        February2014_CBX_Essays_PTs.pdf -> (2014, "February")
        October2020CBX_Questions (1).pdf -> (2020, "October")
    """
    # Normalize filename
    name = filename.lower()
    
    # Extract year (4 digits)
    year_match = re.search(r'(20\d{2})', name)
    year = int(year_match.group(1)) if year_match else None
    
    # Extract month
    month = None
    if 'feb' in name:
        month = "February"
    elif 'jul' in name:
        month = "July"
    elif 'oct' in name:
        month = "October"
    elif 'march' in name or 'mar' in name:
        month = "March"
    
    return year, month


def extract_essay_questions(text: str, year: int, month: str) -> List[Dict[str, Any]]:
    """
    Extract individual essay questions from PDF text.
    
    California Bar Exam essays are typically labeled as:
    - "QUESTION 1", "QUESTION 2", etc. (newer format)
    - "Essay Question 1", "Essay Question 2" (older format)
    - Sometimes just numbered sections
    """
    questions = []
    
    # Split on question markers - handle various formats
    # Pattern matches "QUESTION 1", "Question 1:", "ESSAY QUESTION 1", etc.
    question_pattern = r'(?:QUESTION|Question|ESSAY QUESTION|Essay Question)\s*(\d+)[:\.\s]'
    
    # Find all question starts
    matches = list(re.finditer(question_pattern, text, re.IGNORECASE))
    
    if not matches:
        # Try alternative pattern for older formats
        question_pattern = r'(?:^|\n)\s*(\d+)\.\s+(?=[A-Z])'
        matches = list(re.finditer(question_pattern, text))
    
    if not matches:
        # If no clear question markers, treat entire text as one essay (fallback)
        if len(text.strip()) > 500:  # Only if substantial content
            questions.append({
                'question_number': 1,
                'prompt_text': text.strip()[:8000],  # Limit size
                'subject': None
            })
        return questions
    
    # Extract each question
    for i, match in enumerate(matches):
        question_num = int(match.group(1))
        start_pos = match.end()
        
        # End at next question or end of text
        if i + 1 < len(matches):
            end_pos = matches[i + 1].start()
        else:
            end_pos = len(text)
        
        question_text = text[start_pos:end_pos].strip()
        
        # Clean up the text
        question_text = clean_text(question_text)
        
        # Skip if too short (likely parsing error)
        if len(question_text) < 100:
            continue
        
        # Try to detect subject from keywords
        subject = detect_subject(question_text)
        
        questions.append({
            'question_number': question_num,
            'prompt_text': question_text[:10000],  # Limit to 10k chars
            'subject': subject
        })
    
    return questions


def clean_text(text: str) -> str:
    """Clean extracted PDF text."""
    # Remove excessive whitespace
    text = re.sub(r'\n{3,}', '\n\n', text)
    text = re.sub(r' {2,}', ' ', text)
    
    # Remove page numbers and headers/footers (common patterns)
    text = re.sub(r'\n\s*\d+\s*\n', '\n', text)
    text = re.sub(r'California Bar Examination\s*\n', '', text, flags=re.IGNORECASE)
    text = re.sub(r'Page \d+ of \d+', '', text, flags=re.IGNORECASE)
    
    # Remove "Answer all questions" instructions that appear between questions
    text = re.sub(r'Answer (the|all) question[s]?\s*(below)?\.?\s*\n?', '', text, flags=re.IGNORECASE)
    
    return text.strip()


def detect_subject(text: str) -> Optional[str]:
    """Detect the legal subject from essay text."""
    text_lower = text.lower()
    
    # Subject detection based on key legal terms
    subjects = {
        'Constitutional Law': ['constitution', 'first amendment', 'due process', 'equal protection', 
                               'fourteenth amendment', 'commerce clause', 'federalism'],
        'Contracts': ['contract', 'breach', 'consideration', 'offer', 'acceptance', 'damages',
                      'promissory estoppel', 'parol evidence'],
        'Criminal Law': ['murder', 'manslaughter', 'robbery', 'burglary', 'assault', 'battery',
                         'criminal', 'felony', 'misdemeanor', 'mens rea', 'actus reus'],
        'Criminal Procedure': ['fourth amendment', 'miranda', 'search and seizure', 'exclusionary rule',
                               'reasonable suspicion', 'probable cause', 'arrest'],
        'Evidence': ['hearsay', 'relevance', 'privilege', 'witness', 'testimony', 'admission',
                     'character evidence', 'impeachment'],
        'Real Property': ['deed', 'mortgage', 'lease', 'easement', 'covenant', 'landlord', 'tenant',
                          'title', 'adverse possession', 'property'],
        'Torts': ['negligence', 'duty', 'breach', 'causation', 'damages', 'strict liability',
                  'defamation', 'intentional tort', 'product liability'],
        'Civil Procedure': ['jurisdiction', 'venue', 'personal jurisdiction', 'subject matter',
                            'discovery', 'pleading', 'res judicata', 'collateral estoppel'],
        'Professional Responsibility': ['attorney', 'client', 'confidential', 'ethics', 'conflict of interest',
                                        'legal malpractice', 'duty of loyalty'],
        'Community Property': ['community property', 'separate property', 'marital', 'divorce',
                               'spouse', 'quasi-community'],
        'Wills and Trusts': ['will', 'trust', 'intestate', 'probate', 'beneficiary', 'testator',
                             'executor', 'estate', 'inheritance'],
        'Remedies': ['injunction', 'specific performance', 'restitution', 'equitable relief'],
        'Business Associations': ['corporation', 'partnership', 'llc', 'shareholder', 'fiduciary duty',
                                   'director', 'officer', 'business judgment'],
    }
    
    # Count matches for each subject
    subject_scores = {}
    for subject, keywords in subjects.items():
        score = sum(1 for kw in keywords if kw in text_lower)
        if score > 0:
            subject_scores[subject] = score
    
    if subject_scores:
        # Return subject with highest score
        return max(subject_scores, key=subject_scores.get)
    
    return None


def extract_model_answers(answers_dir: Path) -> Dict[str, Dict[int, str]]:
    """
    Extract model answers from answer PDFs.
    Returns a dict keyed by exam_id (e.g., "2023-February") with question numbers mapping to answers.
    """
    model_answers = {}
    
    if not answers_dir.exists():
        print(f"Answers directory not found: {answers_dir}")
        return model_answers
    
    for pdf_file in answers_dir.glob("*.pdf"):
        print(f"  Parsing answers from: {pdf_file.name}")
        
        year, month = parse_exam_metadata(pdf_file.name)
        if not year or not month:
            print(f"    Could not parse year/month from filename, skipping")
            continue
        
        exam_id = f"{year}-{month}"
        text = extract_text_from_pdf(pdf_file)
        
        if not text:
            continue
        
        # Extract answers - look for various patterns:
        # - "QUESTION 1: SELECTED ANSWER A" (newer format)
        # - "Answer to Question X" or "Selected Answer to Question X" (older format)
        # - "SELECTED ANSWER A" after question number
        answer_patterns = [
            r'QUESTION\s*(\d+)\s*[:\-]\s*SELECTED\s+ANSWER',  # QUESTION 1: SELECTED ANSWER A
            r'(?:Answer(?:ed)?\s+(?:to\s+)?Question|Selected Answer(?:\s+to)?(?:\s+Question)?)\s*(\d+)',  # Answer to Question 1
        ]
        
        matches = []
        for pattern in answer_patterns:
            found = list(re.finditer(pattern, text, re.IGNORECASE))
            if found:
                matches = found
                break
        
        if matches:
            answers_for_exam = {}
            for i, match in enumerate(matches):
                q_num = int(match.group(1))
                start_pos = match.end()
                end_pos = matches[i + 1].start() if i + 1 < len(matches) else len(text)
                
                answer_text = text[start_pos:end_pos].strip()
                answer_text = clean_text(answer_text)
                
                if len(answer_text) > 100:  # Skip if too short
                    answers_for_exam[q_num] = answer_text[:15000]
            
            if answers_for_exam:
                model_answers[exam_id] = answers_for_exam
                print(f"    Found {len(answers_for_exam)} model answers for {exam_id}")
    
    return model_answers


def process_question_pdfs(questions_dir: Path, model_answers: Dict, dry_run: bool = False) -> List[Dict]:
    """Process all question PDFs and return extracted essays."""
    all_essays = []
    
    if not questions_dir.exists():
        print(f"Questions directory not found: {questions_dir}")
        return all_essays
    
    for pdf_file in sorted(questions_dir.glob("*.pdf")):
        print(f"\nProcessing: {pdf_file.name}")
        
        year, month = parse_exam_metadata(pdf_file.name)
        if not year or not month:
            print(f"  Could not parse year/month, skipping")
            continue
        
        exam_id = f"{year}-{month}"
        text = extract_text_from_pdf(pdf_file)
        
        if not text:
            print(f"  No text extracted")
            continue
        
        questions = extract_essay_questions(text, year, month)
        print(f"  Found {len(questions)} essay questions")
        
        # Look for matching model answers
        exam_answers = model_answers.get(exam_id, {})
        
        for q in questions:
            essay_data = {
                'exam_id': f"{exam_id}-Q{q['question_number']}",
                'exam_year': year,
                'exam_month': month,
                'question_number': q['question_number'],
                'subject': q['subject'],
                'prompt_text': q['prompt_text'],
                'model_answer': exam_answers.get(q['question_number']),
                'source_pdf': pdf_file.name
            }
            all_essays.append(essay_data)
            
            if dry_run:
                print(f"    Q{q['question_number']}: {q['subject'] or 'Unknown'} ({len(q['prompt_text'])} chars)")
    
    return all_essays


def save_to_database(essays: List[Dict], db_path: Path, use_postgres: bool = False):
    """Save extracted essays to database."""
    if use_postgres:
        import psycopg2
        conn = psycopg2.connect(os.environ.get('DATABASE_URL'))
        placeholder = '%s'
    else:
        conn = sqlite3.connect(str(db_path))
        placeholder = '?'
    
    cursor = conn.cursor()
    
    # Create table if using SQLite (PostgreSQL schema from init_postgres.py)
    if not use_postgres:
        cursor.execute('''
        CREATE TABLE IF NOT EXISTS essay_prompts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            exam_id TEXT UNIQUE NOT NULL,
            exam_year INTEGER NOT NULL,
            exam_month TEXT NOT NULL,
            question_number INTEGER NOT NULL,
            subject TEXT,
            prompt_text TEXT NOT NULL,
            model_answer TEXT,
            source_pdf TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
        ''')
    
    inserted = 0
    updated = 0
    
    for essay in essays:
        if use_postgres:
            cursor.execute(f'''
                INSERT INTO essay_prompts 
                (exam_id, exam_year, exam_month, question_number, subject, prompt_text, model_answer, source_pdf)
                VALUES ({placeholder}, {placeholder}, {placeholder}, {placeholder}, {placeholder}, {placeholder}, {placeholder}, {placeholder})
                ON CONFLICT (exam_id) DO UPDATE SET
                    prompt_text = EXCLUDED.prompt_text,
                    model_answer = COALESCE(EXCLUDED.model_answer, essay_prompts.model_answer),
                    subject = COALESCE(EXCLUDED.subject, essay_prompts.subject)
            ''', (essay['exam_id'], essay['exam_year'], essay['exam_month'], 
                  essay['question_number'], essay['subject'], essay['prompt_text'],
                  essay['model_answer'], essay['source_pdf']))
        else:
            cursor.execute(f'''
                INSERT OR REPLACE INTO essay_prompts 
                (exam_id, exam_year, exam_month, question_number, subject, prompt_text, model_answer, source_pdf)
                VALUES ({placeholder}, {placeholder}, {placeholder}, {placeholder}, {placeholder}, {placeholder}, {placeholder}, {placeholder})
            ''', (essay['exam_id'], essay['exam_year'], essay['exam_month'], 
                  essay['question_number'], essay['subject'], essay['prompt_text'],
                  essay['model_answer'], essay['source_pdf']))
        
        inserted += 1
    
    conn.commit()
    conn.close()
    
    print(f"\n✓ Saved {inserted} essay prompts to database")


def main():
    parser = argparse.ArgumentParser(description='Extract CBX essay questions from PDFs')
    parser.add_argument('--db-path', type=Path, default=DEFAULT_DB_PATH, help='Path to database')
    parser.add_argument('--dry-run', action='store_true', help='Parse PDFs but do not save to database')
    parser.add_argument('--use-postgres', action='store_true', help='Use PostgreSQL via DATABASE_URL')
    args = parser.parse_args()
    
    print("=" * 60)
    print("California Bar Exam Essay Extractor")
    print("=" * 60)
    
    # Step 1: Extract model answers first
    print("\n[Step 1] Extracting model answers...")
    model_answers = extract_model_answers(ANSWERS_DIR)
    print(f"Found model answers for {len(model_answers)} exams")
    
    # Step 2: Process question PDFs
    print("\n[Step 2] Processing question PDFs...")
    essays = process_question_pdfs(QUESTIONS_DIR, model_answers, args.dry_run)
    print(f"\nTotal essays extracted: {len(essays)}")
    
    # Subject breakdown
    subjects = {}
    for e in essays:
        subj = e['subject'] or 'Unknown'
        subjects[subj] = subjects.get(subj, 0) + 1
    
    print("\nSubject breakdown:")
    for subj, count in sorted(subjects.items(), key=lambda x: -x[1]):
        print(f"  {subj}: {count}")
    
    # Year range
    if essays:
        years = [e['exam_year'] for e in essays]
        print(f"\nYear range: {min(years)} - {max(years)}")
    
    # Step 3: Save to database
    if not args.dry_run:
        print("\n[Step 3] Saving to database...")
        save_to_database(essays, args.db_path, args.use_postgres)
    else:
        print("\n[Step 3] Dry run - skipping database save")
    
    print("\n✓ Done!")


if __name__ == '__main__':
    main()

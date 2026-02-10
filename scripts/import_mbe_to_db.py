#!/usr/bin/env python3
"""
Import MBE Questions to Database
Imports extracted MBE questions from CSV to law_quiz.db, checking for duplicates.
"""

import csv
import hashlib
import re
import sqlite3
from pathlib import Path

# Paths
ROOT_DIR = Path(__file__).parent.parent
DB_PATH = ROOT_DIR / 'law_quiz.db'
CSV_PATH = ROOT_DIR / 'mbe_extracted_questions.csv'

csv.field_size_limit(1000000)

def normalize_text(text: str) -> str:
    """Normalize text for comparison."""
    if not text:
        return ""
    # Lowercase, remove extra whitespace, remove punctuation
    text = text.lower()
    text = re.sub(r'\s+', ' ', text)
    text = re.sub(r'[^\w\s]', '', text)
    return text.strip()

def get_similarity_hash(question: str, choice_a: str = "", choice_b: str = "") -> str:
    """Create hash for deduplication based on question and first two choices."""
    combined = normalize_text(question)[:200] + normalize_text(choice_a)[:50] + normalize_text(choice_b)[:50]
    return hashlib.md5(combined.encode()).hexdigest()

def get_existing_questions(conn) -> dict:
    """Get existing questions for duplicate detection."""
    cursor = conn.cursor()
    cursor.execute("SELECT idx, question, choice_a, choice_b FROM questions")
    
    existing = {}
    for row in cursor.fetchall():
        idx, question, choice_a, choice_b = row
        hash_key = get_similarity_hash(question or "", choice_a or "", choice_b or "")
        existing[hash_key] = idx
        
        # Also store by normalized question prefix for fuzzy matching
        q_prefix = normalize_text(question or "")[:100]
        if q_prefix:
            existing[q_prefix] = idx
    
    return existing

def normalize_subject(subject: str) -> str:
    """Normalize subject names to match database format."""
    subject_map = {
        'Constitutional Law': 'constitutional',
        'Contracts': 'contracts',
        'Criminal Law': 'criminal',
        'Criminal Procedure': 'criminal',
        'Evidence': 'evidence',
        'Real Property': 'property',
        'Torts': 'torts',
        'Civil Procedure': 'civil_procedure',
    }
    return subject_map.get(subject, subject.lower() if subject else '')

def get_next_idx(conn) -> int:
    """Get the next available idx number."""
    cursor = conn.cursor()
    cursor.execute("SELECT MAX(CAST(idx AS INTEGER)) FROM questions WHERE idx GLOB '[0-9]*'")
    result = cursor.fetchone()[0]
    return (result or 0) + 1

def main():
    print("=" * 60)
    print("MBE Question Importer")
    print("=" * 60)
    
    if not DB_PATH.exists():
        print(f"Error: Database not found at {DB_PATH}")
        print("Please run initialize_db.py first.")
        return
    
    if not CSV_PATH.exists():
        print(f"Error: CSV not found at {CSV_PATH}")
        return
    
    # Connect to database
    conn = sqlite3.connect(str(DB_PATH))
    
    # Get existing questions for deduplication
    print("\nLoading existing questions for duplicate check...")
    existing = get_existing_questions(conn)
    print(f"Found {len(existing)//2} existing questions in database")
    
    # Read CSV
    print(f"\nReading questions from {CSV_PATH}...")
    with open(CSV_PATH, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        questions = list(reader)
    
    print(f"Found {len(questions)} questions in CSV")
    
    # Filter for questions with answers only
    questions_with_answers = [q for q in questions if q.get('answer')]
    print(f"Questions with answers: {len(questions_with_answers)}")
    
    # Get next idx
    next_idx = get_next_idx(conn)
    print(f"Starting idx: {next_idx}")
    
    # Process and insert questions
    cursor = conn.cursor()
    
    inserted = 0
    duplicates = 0
    errors = 0
    
    for q in questions_with_answers:
        question_text = q.get('question', '')
        choice_a = q.get('choice_a', '')
        choice_b = q.get('choice_b', '')
        
        # Check for duplicates
        hash_key = get_similarity_hash(question_text, choice_a, choice_b)
        q_prefix = normalize_text(question_text)[:100]
        
        if hash_key in existing or q_prefix in existing:
            duplicates += 1
            continue
        
        # Mark as seen
        existing[hash_key] = str(next_idx)
        existing[q_prefix] = str(next_idx)
        
        # Prepare row data
        idx = str(next_idx)
        subject = normalize_subject(q.get('subject', ''))
        
        try:
            cursor.execute('''
                INSERT INTO questions (
                    idx, dataset, example_id, prompt_id, source, subject, 
                    question_number, prompt, question, choice_a, choice_b, 
                    choice_c, choice_d, answer, gold_passage, gold_idx, 
                    generated, subtopic
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (
                idx,
                'mbe',
                f'mbe_{next_idx:04d}',
                q.get('prompt_id', ''),
                q.get('source', ''),
                subject,
                q.get('question_number', ''),
                q.get('prompt', ''),
                question_text,
                choice_a,
                choice_b,
                q.get('choice_c', ''),
                q.get('choice_d', ''),
                q.get('answer', ''),
                q.get('gold_passage', ''),
                q.get('gold_idx', ''),
                0,  # generated = 0 (these are real MBE questions)
                q.get('subtopic', ''),
            ))
            
            # Also insert explanations if provided
            explain = q.get('explain', '')
            explain_a = q.get('explain_a', '')
            explain_b = q.get('explain_b', '')
            explain_c = q.get('explain_c', '')
            explain_d = q.get('explain_d', '')
            
            if explain or explain_a:
                cursor.execute('''
                    INSERT OR REPLACE INTO question_explanations (
                        question_id, correct_answer, choice_a_explanation,
                        choice_b_explanation, choice_c_explanation, choice_d_explanation,
                        ai_explanation, created_at
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
                ''', (
                    idx,
                    q.get('answer', ''),
                    explain_a,
                    explain_b,
                    explain_c,
                    explain_d,
                    explain,
                ))
            
            inserted += 1
            next_idx += 1
            
        except Exception as e:
            errors += 1
            if errors < 5:
                print(f"Error inserting question: {e}")
    
    # Commit changes
    conn.commit()
    
    # Get final count
    cursor.execute("SELECT COUNT(*) FROM questions")
    total = cursor.fetchone()[0]
    
    cursor.execute("SELECT COUNT(*) FROM questions WHERE dataset = 'mbe'")
    mbe_count = cursor.fetchone()[0]
    
    conn.close()
    
    # Summary
    print(f"\n{'=' * 60}")
    print("IMPORT COMPLETE")
    print("=" * 60)
    print(f"Questions inserted:  {inserted}")
    print(f"Duplicates skipped:  {duplicates}")
    print(f"Errors:              {errors}")
    print(f"\nTotal questions in database: {total}")
    print(f"MBE questions in database:   {mbe_count}")

if __name__ == "__main__":
    main()

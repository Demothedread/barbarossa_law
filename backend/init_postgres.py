#!/usr/bin/env python3
"""
Initialize PostgreSQL database schema for production deployment on Render.
This script creates the required tables in the PostgreSQL database.
Run this once after deploying to Render to set up the database schema.

Usage:
  Set DATABASE_URL environment variable and run:
  python init_postgres.py
"""

import csv
import os
import sys
from pathlib import Path

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

try:
    import psycopg2
    from psycopg2.extras import execute_values
except ImportError:
    print("ERROR: psycopg2 not installed. Run: pip install psycopg2-binary")
    sys.exit(1)


DATABASE_URL = os.environ.get('DATABASE_URL')

if not DATABASE_URL:
    print("ERROR: DATABASE_URL environment variable not set")
    print("Set it to your Render PostgreSQL connection string")
    sys.exit(1)


def create_schema(conn):
    """Create all required database tables."""
    cursor = conn.cursor()
    
    print("Creating questions table...")
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS questions (
        idx TEXT PRIMARY KEY,
        dataset TEXT,
        example_id TEXT,
        prompt_id TEXT,
        source TEXT,
        subject TEXT,
        question_number TEXT,
        prompt TEXT,
        question TEXT,
        choice_a TEXT,
        choice_b TEXT,
        choice_c TEXT,
        choice_d TEXT,
        answer TEXT,
        gold_passage TEXT,
        gold_idx TEXT,
        generated INTEGER DEFAULT 0,
        subtopic TEXT
    )
    ''')
    
    print("Creating question_explanations table...")
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS question_explanations (
        question_id TEXT PRIMARY KEY,
        correct_answer TEXT,
        choice_a_explanation TEXT,
        choice_b_explanation TEXT,
        choice_c_explanation TEXT,
        choice_d_explanation TEXT,
        subtopic TEXT,
        ai_explanation TEXT,
        created_at TEXT,
        updated_at TEXT
    )
    ''')
    
    print("Creating quiz_history table...")
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS quiz_history (
        id SERIAL PRIMARY KEY,
        user_id TEXT,
        subject TEXT,
        correct INTEGER,
        total INTEGER,
        duration_seconds INTEGER,
        questions_json TEXT,
        answers_json TEXT,
        negative_time BOOLEAN,
        created_at TEXT
    )
    ''')
    
    print("Creating quiz_attempt_logs table...")
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS quiz_attempt_logs (
        id SERIAL PRIMARY KEY,
        user_id TEXT,
        question_id TEXT,
        selected_answer TEXT,
        correct_answer TEXT,
        is_correct INTEGER,
        subject TEXT,
        subtopic TEXT,
        mode TEXT,
        elapsed_seconds REAL,
        payload_json TEXT,
        created_at TEXT
    )
    ''')
    
    print("Creating essay_cache table...")
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS essay_cache (
        id SERIAL PRIMARY KEY,
        essay_prompt TEXT NOT NULL,
        rubric TEXT NOT NULL,
        model_answer TEXT NOT NULL,
        grade_data TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        hash_key TEXT UNIQUE NOT NULL
    )
    ''')
    
    print("Creating users table...")
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE,
        password_hash TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        preferences_json TEXT
    )
    ''')
    
    conn.commit()
    print("✓ Schema created successfully!")


def import_questions_from_csv(conn):
    """Import questions from qa.csv into PostgreSQL."""
    csv_path = Path(__file__).parent.parent / 'qa.csv'
    
    if not csv_path.exists():
        print(f"WARNING: {csv_path} not found, skipping question import")
        return
    
    cursor = conn.cursor()
    
    # Check if questions already exist
    cursor.execute("SELECT COUNT(*) FROM questions")
    count = cursor.fetchone()[0]
    
    if count > 0:
        print(f"✓ Questions already imported ({count} records), skipping")
        return
    
    print(f"Importing questions from {csv_path}...")
    
    questions = []
    with open(csv_path, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            questions.append((
                row.get('idx', ''),
                row.get('dataset', ''),
                row.get('example_id', ''),
                row.get('prompt_id', ''),
                row.get('source', ''),
                row.get('subject', ''),
                row.get('question_number', ''),
                row.get('prompt', ''),
                row.get('question', ''),
                row.get('choice_a', ''),
                row.get('choice_b', ''),
                row.get('choice_c', ''),
                row.get('choice_d', ''),
                row.get('answer', ''),
                row.get('gold_passage', ''),
                row.get('gold_idx', ''),
                0,  # generated
                row.get('subtopic', '')
            ))
    
    if questions:
        insert_query = '''
        INSERT INTO questions (
            idx, dataset, example_id, prompt_id, source, subject,
            question_number, prompt, question, choice_a, choice_b,
            choice_c, choice_d, answer, gold_passage, gold_idx,
            generated, subtopic
        ) VALUES %s
        ON CONFLICT (idx) DO NOTHING
        '''
        execute_values(cursor, insert_query, questions)
        conn.commit()
        print(f"✓ Imported {len(questions)} questions")
    else:
        print("WARNING: No questions found in CSV")


def main():
    """Main initialization function."""
    print("=" * 50)
    print("Barbarossa Law Quiz - PostgreSQL Initialization")
    print("=" * 50)
    
    try:
        print(f"\nConnecting to PostgreSQL...")
        conn = psycopg2.connect(DATABASE_URL)
        print("✓ Connected successfully!")
        
        create_schema(conn)
        import_questions_from_csv(conn)
        
        conn.close()
        print("\n✓ Database initialization complete!")
        
    except Exception as e:
        print(f"\nERROR: {e}")
        sys.exit(1)


if __name__ == '__main__':
    main()

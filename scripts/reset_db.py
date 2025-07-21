#!/usr/bin/env python3
"""
Reset Law Quizzer database - clears all data and reimports from questions.sql
Use this when you want to start fresh without prompts
"""

import os
import sqlite3
from pathlib import Path

# Path configurations
ROOT_DIR = Path(__file__).parent.parent
SQL_PATH = ROOT_DIR / 'questions.sql'
DB_PATH = ROOT_DIR / 'law_quiz.db'

def main():
    """Reset database with fresh data"""
    print(f"Resetting database at {DB_PATH}...")
    
    # Remove existing database file
    if DB_PATH.exists():
        os.remove(DB_PATH)
        print("Removed existing database file.")
    
    # Create parent directories if they don't exist
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    
    # Connect to database (this creates a new file)
    conn = sqlite3.connect(str(DB_PATH))
    cursor = conn.cursor()
    
    # Create schema
    print("Creating database schema...")
    
    # Create questions table
    cursor.execute('''
    CREATE TABLE questions (
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
        generated INTEGER DEFAULT 0
    )
    ''')
    
    # Create AI explanations table
    cursor.execute('''
    CREATE TABLE question_explanations (
        question_id TEXT PRIMARY KEY,
        ai_explanation TEXT,
        created_at TEXT,
        updated_at TEXT,
        FOREIGN KEY (question_id) REFERENCES questions(idx)
    )
    ''')
    
    # Create quiz history table
    cursor.execute('''
    CREATE TABLE quiz_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
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
    
    # Import questions
    print(f"Importing questions from {SQL_PATH}...")
    
    if not SQL_PATH.exists():
        print(f"Error: SQL file not found at {SQL_PATH}")
        conn.close()
        return False
    
    # Read and execute SQL file
    with open(SQL_PATH, 'r', encoding='utf-8') as f:
        sql_script = f.read()
    
    try:
        conn.executescript(sql_script)
        conn.commit()
        
        # Get question count
        cursor.execute("SELECT COUNT(*) FROM questions")
        count = cursor.fetchone()[0]
        
        print(f"Database reset successfully with {count} questions!")
        return True
        
    except sqlite3.Error as e:
        print(f"Error importing SQL: {e}")
        return False
    finally:
        conn.close()

if __name__ == "__main__":
    main()

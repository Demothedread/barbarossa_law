#!/usr/bin/env python3
"""
Initialize Law Quizzer SQLite database from questions.sql
This script creates or updates the SQLite database with questions from the SQL file
"""

import os
import sqlite3
from pathlib import Path

# Path configurations
ROOT_DIR = Path(__file__).parent.parent
SQL_PATH = ROOT_DIR / 'questions.sql'
DB_PATH = ROOT_DIR / 'law_quiz.db'

def create_schema(conn):
    """Create the database schema if it doesn't exist"""
    print("Creating questions table...")
    cursor = conn.cursor()
    
    # Create questions table if it doesn't exist
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
        gold_idx TEXT
    )
    ''')
    
    conn.commit()

def import_questions(conn):
    """Import questions from SQL file"""
    print(f"Importing questions from {SQL_PATH}...")
    
    if not SQL_PATH.exists():
        print(f"Error: SQL file not found at {SQL_PATH}")
        return False
    
    # Read SQL file
    with open(SQL_PATH, 'r', encoding='utf-8') as f:
        sql_script = f.read()
    
    # Execute SQL script
    try:
        conn.executescript(sql_script)
        conn.commit()
        return True
    except sqlite3.Error as e:
        print(f"Error importing SQL: {e}")
        return False

def main():
    """Main function"""
    print(f"Initializing database at {DB_PATH}...")
    
    # Create parent directories if they don't exist
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    
    # Connect to database
    conn = sqlite3.connect(str(DB_PATH))
    
    # Create schema if needed
    create_schema(conn)
    
    # Import questions from SQL file
    success = import_questions(conn)
    
    # Get question count
    cursor = conn.cursor()
    cursor.execute("SELECT COUNT(*) FROM questions")
    count = cursor.fetchone()[0]
    
    # Close connection
    conn.close()
    
    if success:
        print(f"Database initialized successfully with {count} questions!")
    else:
        print("Database initialization failed.")

if __name__ == "__main__":
    main()
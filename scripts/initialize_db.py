#!/usr/bin/env python3
"""
Initialize Law Quizzer SQLite database from questions.sql
This script creates or updates the SQLite database with questions from the SQL file
"""

import csv
import os
import sqlite3
from pathlib import Path

# Path configurations
ROOT_DIR = Path(__file__).parent.parent
SQL_PATH = ROOT_DIR / 'questions.sql'
DB_PATH = ROOT_DIR / 'law_quiz.db'

def get_table_columns(cursor, table_name):
    """Return a set of column names for a table."""
    cursor.execute(f"PRAGMA table_info({table_name})")
    return {row[1] for row in cursor.fetchall()}

def ensure_table_columns(cursor, table_name, columns):
    """Add missing columns to a table."""
    existing_columns = get_table_columns(cursor, table_name)
    for column_name, column_type, default_value in columns:
        if column_name not in existing_columns:
            default_clause = f" DEFAULT {default_value}" if default_value is not None else ""
            print(f"Adding '{column_name}' column to {table_name} table...")
            cursor.execute(
                f'ALTER TABLE {table_name} ADD COLUMN {column_name} {column_type}{default_clause}'
            )

def create_user_tables(conn):
    """Create user-related tables and ensure required columns exist."""
    print("Creating users table...")
    cursor = conn.cursor()
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE,
        email TEXT UNIQUE,
        password_hash TEXT,
        created_at TEXT,
        last_login TEXT,
        preferred_mode TEXT DEFAULT 'classic'
    )
    ''')

    ensure_table_columns(cursor, 'users', [
        ('username', 'TEXT', None),
        ('email', 'TEXT', None),
        ('password_hash', 'TEXT', None),
        ('created_at', 'TEXT', None),
        ('last_login', 'TEXT', None),
        ('preferred_mode', 'TEXT', "'classic'"),
    ])

    cursor.execute('''
    CREATE UNIQUE INDEX IF NOT EXISTS idx_users_username ON users(username)
    ''')
    cursor.execute('''
    CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email ON users(email)
    ''')

    print("Creating user_preferences table...")
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS user_preferences (
        user_id INTEGER PRIMARY KEY,
        audio_enabled INTEGER DEFAULT 1,
        background_music_enabled INTEGER DEFAULT 1,
        volume_level REAL DEFAULT 0.7,
        preferred_subjects TEXT DEFAULT '',
        theme_preference TEXT DEFAULT 'classic',
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
    ''')

    ensure_table_columns(cursor, 'user_preferences', [
        ('audio_enabled', 'INTEGER', 1),
        ('background_music_enabled', 'INTEGER', 1),
        ('volume_level', 'REAL', 0.7),
        ('preferred_subjects', 'TEXT', "''"),
        ('theme_preference', 'TEXT', "'classic'"),
    ])

    conn.commit()

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
        gold_idx TEXT,
        generated INTEGER DEFAULT 0,
        subtopic TEXT
    )
    ''')
    
    # Check if 'generated' column exists, if not add it
    cursor.execute("PRAGMA table_info(questions)")
    columns = [row[1] for row in cursor.fetchall()]
    if 'generated' not in columns:
        print("Adding 'generated' column to questions table...")
        cursor.execute('ALTER TABLE questions ADD COLUMN generated INTEGER DEFAULT 0')
    
    # Create AI explanations table with separate columns for each choice
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
        updated_at TEXT,
        FOREIGN KEY (question_id) REFERENCES questions(idx)
    )
    ''')
    
    # Check if new columns exist, if not add them
    cursor.execute("PRAGMA table_info(question_explanations)")
    explanation_columns = [row[1] for row in cursor.fetchall()]
    
    columns_to_add = [
        ('correct_answer', 'TEXT'),
        ('choice_a_explanation', 'TEXT'),
        ('choice_b_explanation', 'TEXT'),
        ('choice_c_explanation', 'TEXT'),
        ('choice_d_explanation', 'TEXT'),
        ('subtopic', 'TEXT')
    ]
    
    for column_name, column_type in columns_to_add:
        if column_name not in explanation_columns:
            print(f"Adding '{column_name}' column to question_explanations table...")
            cursor.execute(f'ALTER TABLE question_explanations ADD COLUMN {column_name} {column_type}')
    
    # Create quiz history table
    print("Creating quiz_history table...")
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS quiz_history (
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
    
    # Create quiz attempt logs table
    print("Creating quiz_attempt_logs table...")
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS quiz_attempt_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
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
    
    conn.commit()

def import_questions(conn):
    """Import questions from SQL file"""
    print(f"Importing questions from {SQL_PATH}...")
    
    if not SQL_PATH.exists():
        print(f"Error: SQL file not found at {SQL_PATH}")
        return False
    
    # Check if questions already exist
    cursor = conn.cursor()
    cursor.execute("SELECT COUNT(*) FROM questions")
    existing_count = cursor.fetchone()[0]
    
    response = 'R'  # Default to replace
    
    if existing_count > 0:
        print(f"Database already contains {existing_count} questions.")
        response = input("Do you want to (R)eplace all questions, (S)kip import, or (A)dd new ones? [R/S/A]: ").upper()
        
        if response == 'S':
            print("Skipping import - using existing questions.")
            return True
        elif response == 'R':
            print("Clearing existing questions...")
            cursor.execute("DELETE FROM questions")
            cursor.execute("DELETE FROM question_explanations")  # Clear related explanations
            conn.commit()
        elif response == 'A':
            print("Will attempt to add new questions (duplicates will be skipped)...")
        else:
            print("Invalid choice. Skipping import.")
            return True
    
    # Read SQL file
    with open(SQL_PATH, 'r', encoding='utf-8') as f:
        sql_script = f.read()
    
    # Execute SQL script
    try:
        if existing_count > 0 and response == 'A':
            # For adding new questions, we need to handle duplicates gracefully
            # Split the script into individual INSERT statements
            statements = sql_script.split('INSERT INTO questions')
            
            successful_inserts = 0
            skipped_duplicates = 0
            
            for i, statement in enumerate(statements[1:]):  # Skip the first empty part
                try:
                    full_statement = 'INSERT INTO questions' + statement.split(';')[0] + ';'
                    cursor.execute(full_statement)
                    successful_inserts += 1
                except sqlite3.IntegrityError:
                    # This is a duplicate, skip it
                    skipped_duplicates += 1
                except sqlite3.Error as e:
                    print(f"Error in statement {i+1}: {e}")
            
            conn.commit()
            print(f"Added {successful_inserts} new questions, skipped {skipped_duplicates} duplicates.")
        else:
            # Replace mode or fresh import
            conn.executescript(sql_script)
            conn.commit()
            print("Questions imported successfully.")
        
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
    create_user_tables(conn)
    
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

#!/usr/bin/env python3
"""
Initialize Law Quizzer SQLite database from questions.sql
This script creates or updates the SQLite database with questions from the SQL file
"""

import csv
import os
import re
import sqlite3
from pathlib import Path

# Path configurations
ROOT_DIR = Path(__file__).parent.parent
SQL_PATH = ROOT_DIR / 'questions.sql'
DB_PATH = ROOT_DIR / 'law_quiz.db'

# Whitelist of allowed table names in this database
ALLOWED_TABLES = {
    'questions',
    'question_explanations',
    'quiz_history',
    'users',
    'user_preferences'
}

# Whitelist of allowed SQLite column types
ALLOWED_COLUMN_TYPES = {
    'INTEGER',
    'TEXT',
    'REAL',
    'BLOB',
    'BOOLEAN'
}

def is_valid_identifier(name):
    """
    Validate that a string is a valid SQL identifier (table or column name).
    Only allows alphanumeric characters and underscores, must start with letter or underscore.
    """
    if not name:
        return False
    return bool(re.match(r'^[a-zA-Z_][a-zA-Z0-9_]*$', name))

def validate_table_name(table_name):
    """Validate table name against whitelist."""
    if table_name not in ALLOWED_TABLES:
        raise ValueError(f"Table name '{table_name}' is not in the allowed whitelist")
    if not is_valid_identifier(table_name):
        raise ValueError(f"Table name '{table_name}' contains invalid characters")
    return True

def validate_column_name(column_name):
    """Validate column name to prevent SQL injection."""
    if not is_valid_identifier(column_name):
        raise ValueError(f"Column name '{column_name}' contains invalid characters")
    return True

def validate_column_type(column_type):
    """
    Validate column type against allowed SQLite types.
    Since we only use simple types in this codebase (no modifiers),
    we restrict to basic type names only.
    """
    # For this codebase, we only need simple types without modifiers
    # Strip and uppercase for comparison
    type_str = column_type.strip().upper()
    
    # Must be exactly one of the allowed types (no modifiers)
    if type_str not in ALLOWED_COLUMN_TYPES:
        raise ValueError(f"Column type '{column_type}' is not an allowed SQLite type")
    
    # Additional check: ensure it only contains valid identifier characters
    if not re.match(r'^[a-zA-Z]+$', type_str):
        raise ValueError(f"Column type '{column_type}' contains invalid characters")
    
    return True

def validate_default_value(default_value):
    """
    Validate default value to prevent SQL injection.
    Default values should be safe literals (numbers, quoted strings, or NULL).
    """
    if default_value is None:
        return True
    
    # Convert to string for validation
    default_str = str(default_value).strip()
    
    # Allow numeric values
    if re.match(r'^-?\d+(\.\d+)?$', default_str):
        return True
    
    # Allow quoted strings with proper SQLite escaping (doubled single quotes)
    if re.match(r"^'([^']|'')*'$", default_str):
        return True
    
    # Allow NULL
    if default_str.upper() == 'NULL':
        return True
    
    # Allow common SQL keywords for defaults
    allowed_keywords = {'CURRENT_TIMESTAMP', 'CURRENT_DATE', 'CURRENT_TIME'}
    if default_str.upper() in allowed_keywords:
        return True
    
    raise ValueError(f"Default value '{default_value}' is not a safe literal")

def get_table_columns(cursor, table_name):
    """Return a set of column names for a table."""
    validate_table_name(table_name)
    # Safe to use f-string here: table_name validated against whitelist and identifier format
    # PRAGMA statements don't support parameterized queries in SQLite
    cursor.execute(f"PRAGMA table_info({table_name})")
    return {row[1] for row in cursor.fetchall()}

def ensure_table_columns(cursor, table_name, columns):
    """Add missing columns to a table."""
    validate_table_name(table_name)
    existing_columns = get_table_columns(cursor, table_name)
    for column_name, column_type, default_value in columns:
        if column_name not in existing_columns:
            # Validate column name, type, and default value to prevent SQL injection
            validate_column_name(column_name)
            validate_column_type(column_type)
            validate_default_value(default_value)
            
            default_clause = f" DEFAULT {default_value}" if default_value is not None else ""
            print(f"Adding '{column_name}' column to {table_name} table...")
            # Safe to use f-string here: all components validated before construction
            # ALTER TABLE doesn't support parameterized queries for identifiers/types
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
    
    # Add new columns to question_explanations if they don't exist
    columns_to_add = [
        ('correct_answer', 'TEXT', None),
        ('choice_a_explanation', 'TEXT', None),
        ('choice_b_explanation', 'TEXT', None),
        ('choice_c_explanation', 'TEXT', None),
        ('choice_d_explanation', 'TEXT', None),
        ('subtopic', 'TEXT', None)
    ]
    
    ensure_table_columns(cursor, 'question_explanations', columns_to_add)
    
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

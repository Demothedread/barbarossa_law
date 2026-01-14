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

# Whitelist of allowed table names to prevent SQL injection
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
    'BOOLEAN',
    'NUMERIC'
}

def validate_sql_identifier(identifier, identifier_type="identifier"):
    """
    Validate that a string is a safe SQL identifier (table or column name).
    Only allows alphanumeric characters and underscores, must start with letter or underscore.
    
    Args:
        identifier: The string to validate
        identifier_type: Description of what kind of identifier (for error messages)
    
    Returns:
        True if valid
        
    Raises:
        ValueError if identifier contains invalid characters
    """
    if not identifier:
        raise ValueError(f"Empty {identifier_type} name")
    if not re.match(r'^[a-zA-Z_][a-zA-Z0-9_]*$', identifier):
        raise ValueError(f"Invalid {identifier_type} name: {identifier}")
    return True

def validate_table_name(table_name):
    """
    Validate table name against whitelist and SQL identifier rules.
    
    Args:
        table_name: Name of the table to validate
        
    Returns:
        True if valid
        
    Raises:
        ValueError if table name is not allowed or invalid
    """
    validate_sql_identifier(table_name, "table")
    if table_name not in ALLOWED_TABLES:
        raise ValueError(f"Table name '{table_name}' is not in the allowed whitelist: {ALLOWED_TABLES}")
    return True

def validate_column_type(column_type):
    """
    Validate column type against allowed SQLite types.
    
    Args:
        column_type: SQLite column type to validate
        
    Returns:
        True if valid
        
    Raises:
        ValueError if type is not allowed
    """
    type_upper = column_type.strip().upper()
    if type_upper not in ALLOWED_COLUMN_TYPES:
        raise ValueError(f"Column type '{column_type}' is not in allowed types: {ALLOWED_COLUMN_TYPES}")
    return True

def validate_default_value(default_value):
    """
    Validate default value to ensure it's a safe literal.
    
    Args:
        default_value: The default value to validate (can be None, number, or quoted string)
        
    Returns:
        True if valid
        
    Raises:
        ValueError if default value is not a safe literal
    """
    if default_value is None:
        return True
    
    default_str = str(default_value).strip()
    
    # Allow numeric values
    if re.match(r'^-?\d+(\.\d+)?$', default_str):
        return True
    
    # Allow properly quoted strings (single quotes with escaped quotes)
    if re.match(r"^'([^']|'')*'$", default_str):
        return True
    
    # Allow NULL keyword
    if default_str.upper() == 'NULL':
        return True
    
    # Allow common SQL timestamp functions
    if default_str.upper() in {'CURRENT_TIMESTAMP', 'CURRENT_DATE', 'CURRENT_TIME'}:
        return True
    
    raise ValueError(f"Default value '{default_value}' is not a safe literal")

def table_exists(cursor, table_name):
    """
    Check if a table exists in the database.
    
    Args:
        cursor: Database cursor
        table_name: Name of table to check
        
    Returns:
        True if table exists, False otherwise
    """
    validate_table_name(table_name)
    cursor.execute(
        "SELECT name FROM sqlite_master WHERE type='table' AND name=?",
        (table_name,)
    )
    return cursor.fetchone() is not None

def get_table_columns(cursor, table_name):
    """
    Return a set of column names for a table.
    
    Args:
        cursor: Database cursor
        table_name: Name of the table
        
    Returns:
        Set of column names in the table
        
    Raises:
        ValueError if table_name is invalid
    """
    # Validate table_name to prevent SQL injection
    validate_table_name(table_name)
    # PRAGMA statements don't support parameterized queries in SQLite
    # Safe to use f-string here since table_name has been validated
    cursor.execute(f"PRAGMA table_info({table_name})")
    return {row[1] for row in cursor.fetchall()}

def ensure_table_columns(cursor, table_name, columns):
    """
    Add missing columns to an existing table.
    
    Args:
        cursor: Database cursor
        table_name: Name of the table to modify
        columns: List of tuples (column_name, column_type, default_value)
        
    Raises:
        ValueError if any parameter contains invalid SQL
    """
    # Validate table_name to prevent SQL injection
    validate_table_name(table_name)
    
    existing_columns = get_table_columns(cursor, table_name)
    
    for column_name, column_type, default_value in columns:
        if column_name not in existing_columns:
            # Validate all parameters before constructing SQL
            validate_sql_identifier(column_name, "column")
            validate_column_type(column_type)
            validate_default_value(default_value)
            
            default_clause = f" DEFAULT {default_value}" if default_value is not None else ""
            print(f"Adding '{column_name}' column to {table_name} table...")
            # ALTER TABLE doesn't support parameterized queries for DDL in SQLite
            # Safe to use f-string here since all parameters have been validated
            cursor.execute(
                f'ALTER TABLE {table_name} ADD COLUMN {column_name} {column_type}{default_clause}'
            )

def create_user_tables(conn):
    """
    Create user-related tables with proper constraints.
    
    This function creates the users and user_preferences tables if they don't exist.
    For existing tables (during upgrades), it uses ensure_table_columns to add any 
    missing columns that may have been added in newer versions of the schema.
    """
    cursor = conn.cursor()
    
    # Check if tables already exist (for migration logic)
    users_table_exists = table_exists(cursor, 'users')
    user_preferences_table_exists = table_exists(cursor, 'user_preferences')
    
    print("Creating users table...")
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL UNIQUE,
        email TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        created_at TEXT,
        last_login TEXT,
        preferred_mode TEXT DEFAULT 'classic'
    )
    ''')

    # Only migrate columns if table already existed (not on fresh creation)
    if users_table_exists:
        ensure_table_columns(cursor, 'users', [
            ('username', 'TEXT', None),
            ('email', 'TEXT', None),
            ('password_hash', 'TEXT', None),
            ('created_at', 'TEXT', None),
            ('last_login', 'TEXT', None),
            ('preferred_mode', 'TEXT', "'classic'"),
        ])

    # Note: UNIQUE constraints automatically create indexes in SQLite,
    # so explicit index creation is redundant and has been removed

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

    # Only migrate columns if table already existed (not on fresh creation)
    if user_preferences_table_exists:
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
    
    # Add 'generated' column if it doesn't exist (for migration from older schemas)
    # Note: Uses ensure_table_columns with proper validation
    ensure_table_columns(cursor, 'questions', [
        ('generated', 'INTEGER', 0),
        ('subtopic', 'TEXT', None)
    ])
    
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
    # Note: Uses ensure_table_columns with proper validation for SQL injection prevention
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

"""
Database adapter for Law Quizzer
Supports both SQLite (development) and PostgreSQL (production on Render)
"""

import os
import sqlite3
from contextlib import contextmanager
from pathlib import Path

# Check if we're in production (Render) or development
DATABASE_URL = os.environ.get('DATABASE_URL')
IS_PRODUCTION = DATABASE_URL is not None

if IS_PRODUCTION:
    import psycopg2
    from psycopg2.extras import RealDictCursor

# Local SQLite path for development
LOCAL_DB_PATH = Path(__file__).parent.parent / 'law_quiz.db'


class DatabaseAdapter:
    """
    Unified database adapter that works with both SQLite and PostgreSQL.
    Uses SQLite in development, PostgreSQL in production.
    """
    
    def __init__(self, db_path=None):
        """Initialize database adapter."""
        self.is_production = IS_PRODUCTION
        self.db_path = db_path or LOCAL_DB_PATH
        self.database_url = DATABASE_URL
        
        if self.is_production:
            print(f"Database: PostgreSQL (production)")
        else:
            print(f"Database: SQLite at {self.db_path}")
    
    @contextmanager
    def get_connection(self):
        """Get a database connection (context manager)."""
        conn = None
        try:
            if self.is_production:
                # PostgreSQL connection
                conn = psycopg2.connect(self.database_url)
                yield conn
            else:
                # SQLite connection
                conn = sqlite3.connect(str(self.db_path))
                conn.row_factory = sqlite3.Row
                yield conn
        finally:
            if conn:
                conn.close()
    
    def get_cursor(self, conn):
        """Get a cursor appropriate for the database type."""
        if self.is_production:
            return conn.cursor(cursor_factory=RealDictCursor)
        return conn.cursor()
    
    def placeholder(self, index=None):
        """Return the appropriate placeholder for parameterized queries."""
        if self.is_production:
            return '%s'
        return '?'
    
    def convert_query(self, query):
        """Convert SQLite-style query to PostgreSQL if needed."""
        if not self.is_production:
            return query
        
        # Replace ? with %s for PostgreSQL
        return query.replace('?', '%s')
    
    def row_to_dict(self, row):
        """Convert a database row to a dictionary."""
        if row is None:
            return None
        if self.is_production:
            # psycopg2 RealDictCursor already returns dict-like objects
            return dict(row)
        # SQLite Row object
        return dict(row)
    
    def rows_to_list(self, rows):
        """Convert database rows to a list of dictionaries."""
        return [self.row_to_dict(row) for row in rows]


# Global database adapter instance
db_adapter = DatabaseAdapter()


def get_db_connection():
    """Legacy function - returns a connection for backward compatibility."""
    if IS_PRODUCTION:
        return psycopg2.connect(DATABASE_URL)
    else:
        conn = sqlite3.connect(str(LOCAL_DB_PATH))
        conn.row_factory = sqlite3.Row
        return conn


def init_postgres_schema(conn):
    """Initialize PostgreSQL schema (run once on deployment)."""
    cursor = conn.cursor()
    
    # Create questions table
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
    
    # Create question_explanations table
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
    
    # Create quiz_history table
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
    
    # Create quiz_attempt_logs table
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
    
    # Create essay_cache table
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
    
    # Create users table
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
    print("PostgreSQL schema initialized successfully.")

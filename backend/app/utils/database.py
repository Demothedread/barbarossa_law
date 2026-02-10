"""
Database utilities for the Law Quizzer backend.
Provides common database operations and helper functions.
"""

import os
import sqlite3
from pathlib import Path
from typing import Any, Dict, List, Optional, Union

# Database configuration
DATABASE_URL = os.environ.get('DATABASE_URL')
USE_POSTGRES = bool(DATABASE_URL)

# DB_PATH is either a connection string (PostgreSQL) or Path object (SQLite)
DB_PATH: Union[str, Path]
if USE_POSTGRES:
    DB_PATH = DATABASE_URL  # type: ignore[assignment]
else:
    DB_PATH = Path(__file__).parent.parent.parent / 'law_quiz.db'


def get_db_path_as_path() -> Path:
    """Get DB_PATH as a Path object (for SQLite operations)."""
    if isinstance(DB_PATH, Path):
        return DB_PATH
    return Path(DB_PATH)


def get_db_connection():
    """Get database connection with proper setup"""
    if USE_POSTGRES:
        import psycopg2  # type: ignore[import-not-found]
        from psycopg2.extras import \
            RealDictCursor  # type: ignore[import-not-found]
        conn = psycopg2.connect(str(DB_PATH), cursor_factory=RealDictCursor)
        return conn
    else:
        conn = sqlite3.connect(str(DB_PATH))
        conn.row_factory = sqlite3.Row
        return conn


def get_placeholder() -> str:
    """Return the correct SQL placeholder based on database type."""
    return '%s' if USE_POSTGRES else '?'


def convert_query(query: str) -> str:
    """Convert SQLite-style query (?) to PostgreSQL (%s) if needed."""
    if USE_POSTGRES:
        return query.replace('?', '%s')
    return query


def row_to_dict(row: Any) -> Dict[str, Any]:
    """Convert a database row to a dictionary, handling both PostgreSQL and SQLite rows."""
    if row is None:
        return {}
    if isinstance(row, dict):
        return row
    # sqlite3.Row supports dict() conversion
    if hasattr(row, 'keys'):
        return dict(row)
    # Fallback: return as-is (shouldn't happen in practice)
    return {'value': row}


def get_row_value(row: Any, key_or_index: Union[str, int]) -> Any:
    """Get value from row, handling both dict (PostgreSQL) and tuple/Row (SQLite)."""
    if isinstance(row, dict):
        # For dict, try the key directly or common aliases
        if isinstance(key_or_index, int):
            # Integer index - get by position from dict values
            return list(row.values())[key_or_index]
        return row.get(key_or_index)
    # Convert sqlite3.Row to dict for key access
    if hasattr(row, 'keys'):
        d = dict(row)
        if isinstance(key_or_index, int):
            return list(d.values())[key_or_index]
        return d.get(key_or_index)
    # Fallback to index access
    return row[key_or_index] if isinstance(key_or_index, int) else None


def get_scalar(row: Any) -> Any:
    """Get the first value from a row (for single-column results like COUNT(*))."""
    if row is None:
        return None
    if isinstance(row, dict):
        return list(row.values())[0]
    return row[0]


def normalize_question_for_api(row: Any) -> Dict[str, Any]:
    """
    Normalize a question row for API response.
    - Maps 'idx' to 'id' for frontend compatibility
    - Ensures prompt is null/empty string handled properly
    - Adds choices array
    - Marks generated questions
    """
    question_dict = row_to_dict(row) if not isinstance(row, dict) else dict(row)
    
    # Map idx to id for frontend compatibility
    if 'idx' in question_dict:
        question_dict['id'] = question_dict['idx']
    
    # Ensure prompt is properly handled
    # - Empty string or null → None
    # - Numeric-only values (question numbers stored in wrong field) → None
    # - Very short non-meaningful text (< 10 chars with no spaces) → None
    prompt = question_dict.get('prompt', '')
    if prompt is None or (isinstance(prompt, str) and prompt.strip() == ''):
        question_dict['prompt'] = None
    else:
        cleaned_prompt = prompt.strip()
        # Filter out numeric-only prompts (question numbers mistakenly in prompt field)
        # and very short non-meaningful text that isn't a real fact pattern
        if (cleaned_prompt.isdigit() or
            (len(cleaned_prompt) < 10 and ' ' not in cleaned_prompt)):
            question_dict['prompt'] = None
        else:
            question_dict['prompt'] = cleaned_prompt
    
    # Ensure question text exists and is trimmed
    question_text = question_dict.get('question', '')
    if question_text:
        question_dict['question'] = question_text.strip()
    
    # Add choices array for convenience
    question_dict['choices'] = [
        question_dict.get('choice_a', ''),
        question_dict.get('choice_b', ''),
        question_dict.get('choice_c', ''),
        question_dict.get('choice_d', ''),
    ]
    
    # Ensure gold_passage/explanation is available
    if not question_dict.get('gold_passage'):
        question_dict['gold_passage'] = None
    
    # Mark if this is a generated question for UI display
    idx = question_dict.get('idx', '')
    question_dict['is_generated'] = (
        (isinstance(idx, str) and idx.startswith('vs_')) or 
        question_dict.get('generated', 0) == 1
    )
    
    return question_dict

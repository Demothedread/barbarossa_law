#!/usr/bin/env python3
"""
Migrate data from SQLite (law_quiz.db) to PostgreSQL.
Run init_postgres.py first to create the schema.

This script is idempotent - safe to run multiple times.
Uses UPSERT (ON CONFLICT) to avoid duplicates.

Usage:
    DATABASE_URL=postgres://... python migrate_sqlite_to_postgres.py [--force]
    
Options:
    --force    Overwrite existing data even if PostgreSQL already has records
"""

import json
import os
import sqlite3
import sys
from pathlib import Path

try:
    import psycopg2
    from psycopg2.extras import RealDictCursor, execute_values
except ImportError:
    print("ERROR: psycopg2 not installed. Run: pip install psycopg2-binary")
    sys.exit(1)


DATABASE_URL = os.environ.get('DATABASE_URL')
SQLITE_PATH = Path(__file__).parent.parent / 'law_quiz.db'
FORCE_MIGRATION = '--force' in sys.argv

if not DATABASE_URL:
    print("ERROR: DATABASE_URL environment variable not set")
    sys.exit(1)

if not SQLITE_PATH.exists():
    print(f"WARNING: SQLite database not found at {SQLITE_PATH}")
    print("Skipping migration - no source data to migrate.")
    sys.exit(0)  # Exit successfully - this is OK for fresh deployments


def get_pg_table_columns(pg_cursor, table_name):
    """Get list of column names for a PostgreSQL table."""
    pg_cursor.execute('''
        SELECT column_name FROM information_schema.columns 
        WHERE table_name = %s
        ORDER BY ordinal_position
    ''', (table_name,))
    return [row[0] for row in pg_cursor.fetchall()]


def migrate_questions(sqlite_conn, pg_conn):
    """Migrate questions table using upsert (idempotent)."""
    print("\nMigrating questions...")
    
    sqlite_cursor = sqlite_conn.cursor()
    pg_cursor = pg_conn.cursor()
    
    # Check existing count in PostgreSQL
    pg_cursor.execute("SELECT COUNT(*) FROM questions")
    existing = pg_cursor.fetchone()[0]
    
    if existing > 0 and not FORCE_MIGRATION:
        print(f"  PostgreSQL already has {existing} questions - using upsert mode")
    
    sqlite_cursor.execute("SELECT * FROM questions")
    rows = sqlite_cursor.fetchall()
    
    if not rows:
        print("  No questions found in SQLite")
        return
    
    # Get column names from SQLite
    columns = [desc[0] for desc in sqlite_cursor.description]
    
    questions = []
    for row in rows:
        row_dict = dict(zip(columns, row))
        questions.append((
            row_dict.get('idx'),
            row_dict.get('dataset'),
            row_dict.get('example_id'),
            row_dict.get('prompt_id'),
            row_dict.get('source'),
            row_dict.get('subject'),
            row_dict.get('question_number'),
            row_dict.get('prompt'),
            row_dict.get('question'),
            row_dict.get('choice_a'),
            row_dict.get('choice_b'),
            row_dict.get('choice_c'),
            row_dict.get('choice_d'),
            row_dict.get('answer'),
            row_dict.get('gold_passage'),
            row_dict.get('gold_idx'),
            row_dict.get('generated', 0),
            row_dict.get('subtopic'),
        ))
    
    insert_sql = '''
    INSERT INTO questions (
        idx, dataset, example_id, prompt_id, source, subject,
        question_number, prompt, question, choice_a, choice_b,
        choice_c, choice_d, answer, gold_passage, gold_idx,
        generated, subtopic
    ) VALUES %s
    ON CONFLICT (idx) DO UPDATE SET
        question = EXCLUDED.question,
        answer = EXCLUDED.answer,
        gold_passage = EXCLUDED.gold_passage,
        subtopic = EXCLUDED.subtopic
    '''
    
    execute_values(pg_cursor, insert_sql, questions)
    pg_conn.commit()
    print(f"  ✓ Migrated {len(questions)} questions")


def migrate_explanations(sqlite_conn, pg_conn):
    """Migrate question_explanations table."""
    print("\nMigrating question explanations...")
    
    sqlite_cursor = sqlite_conn.cursor()
    pg_cursor = pg_conn.cursor()
    
    try:
        sqlite_cursor.execute("SELECT * FROM question_explanations")
        rows = sqlite_cursor.fetchall()
    except sqlite3.OperationalError:
        print("  No question_explanations table in SQLite")
        return
    
    if not rows:
        print("  No explanations found in SQLite")
        return
    
    columns = [desc[0] for desc in sqlite_cursor.description]
    
    explanations = []
    for row in rows:
        row_dict = dict(zip(columns, row))
        explanations.append((
            row_dict.get('question_id'),
            row_dict.get('correct_answer'),
            row_dict.get('choice_a_explanation'),
            row_dict.get('choice_b_explanation'),
            row_dict.get('choice_c_explanation'),
            row_dict.get('choice_d_explanation') or row_dict.get('choic_e_d_explanation'),  # Handle typo
            row_dict.get('subtopic'),
            row_dict.get('ai_explanation'),
        ))
    
    insert_sql = '''
    INSERT INTO question_explanations (
        question_id, correct_answer, choice_a_explanation, 
        choice_b_explanation, choice_c_explanation, choice_d_explanation,
        subtopic, ai_explanation
    ) VALUES %s
    ON CONFLICT (question_id) DO UPDATE SET
        correct_answer = EXCLUDED.correct_answer,
        choice_a_explanation = EXCLUDED.choice_a_explanation,
        choice_b_explanation = EXCLUDED.choice_b_explanation,
        choice_c_explanation = EXCLUDED.choice_c_explanation,
        choice_d_explanation = EXCLUDED.choice_d_explanation,
        ai_explanation = EXCLUDED.ai_explanation
    '''
    
    execute_values(pg_cursor, insert_sql, explanations)
    pg_conn.commit()
    print(f"  ✓ Migrated {len(explanations)} explanations")


def migrate_quiz_history(sqlite_conn, pg_conn):
    """Migrate quiz_history table."""
    print("\nMigrating quiz history...")
    
    sqlite_cursor = sqlite_conn.cursor()
    pg_cursor = pg_conn.cursor()
    
    try:
        sqlite_cursor.execute("SELECT * FROM quiz_history")
        rows = sqlite_cursor.fetchall()
    except sqlite3.OperationalError:
        print("  No quiz_history table in SQLite")
        return
    
    if not rows:
        print("  No quiz history found in SQLite")
        return
    
    columns = [desc[0] for desc in sqlite_cursor.description]
    
    history = []
    for row in rows:
        row_dict = dict(zip(columns, row))
        history.append((
            row_dict.get('user_id'),
            row_dict.get('subject'),
            row_dict.get('correct'),
            row_dict.get('total'),
            row_dict.get('duration_seconds'),
            row_dict.get('questions_json'),
            row_dict.get('answers_json'),
            row_dict.get('negative_time'),
            row_dict.get('created_at'),
        ))
    
    insert_sql = '''
    INSERT INTO quiz_history (
        user_id, subject, correct, total, duration_seconds,
        questions_json, answers_json, negative_time, created_at
    ) VALUES %s
    '''
    
    execute_values(pg_cursor, insert_sql, history)
    pg_conn.commit()
    print(f"  ✓ Migrated {len(history)} quiz history records")


def migrate_users(sqlite_conn, pg_conn):
    """Migrate users table with dynamic column detection."""
    print("\nMigrating users...")
    
    sqlite_cursor = sqlite_conn.cursor()
    pg_cursor = pg_conn.cursor()
    
    try:
        sqlite_cursor.execute("SELECT * FROM users")
        rows = sqlite_cursor.fetchall()
    except sqlite3.OperationalError:
        print("  No users table in SQLite")
        return
    
    if not rows:
        print("  No users found in SQLite")
        return
    
    sqlite_columns = [desc[0] for desc in sqlite_cursor.description]
    pg_columns = get_pg_table_columns(pg_cursor, 'users')
    
    # Core columns that must exist
    core_columns = ['username', 'email', 'password_hash']
    # Optional columns that may or may not exist in PostgreSQL
    optional_columns = ['preferred_mode', 'preferences_json', 'last_login']
    
    # Build list of columns to insert (only those that exist in both SQLite and PostgreSQL)
    insert_columns = core_columns.copy()
    for col in optional_columns:
        if col in pg_columns:
            insert_columns.append(col)
    
    print(f"  Using columns: {insert_columns}")
    
    users = []
    for row in rows:
        row_dict = dict(zip(sqlite_columns, row))
        user_data = []
        for col in insert_columns:
            if col == 'preferred_mode':
                user_data.append(row_dict.get(col, 'classic'))
            else:
                user_data.append(row_dict.get(col))
        users.append(tuple(user_data))
    
    columns_str = ', '.join(insert_columns)
    insert_sql = f'''
    INSERT INTO users ({columns_str})
    VALUES %s
    ON CONFLICT (username) DO NOTHING
    '''
    
    execute_values(pg_cursor, insert_sql, users)
    pg_conn.commit()
    print(f"  ✓ Migrated {len(users)} users")


def migrate_attempt_logs(sqlite_conn, pg_conn):
    """Migrate quiz_attempt_logs table."""
    print("\nMigrating quiz attempt logs...")
    
    sqlite_cursor = sqlite_conn.cursor()
    pg_cursor = pg_conn.cursor()
    
    try:
        sqlite_cursor.execute("SELECT * FROM quiz_attempt_logs")
        rows = sqlite_cursor.fetchall()
    except sqlite3.OperationalError:
        print("  No quiz_attempt_logs table in SQLite")
        return
    
    if not rows:
        print("  No attempt logs found in SQLite")
        return
    
    columns = [desc[0] for desc in sqlite_cursor.description]
    
    logs = []
    for row in rows:
        row_dict = dict(zip(columns, row))
        logs.append((
            row_dict.get('user_id'),
            row_dict.get('question_id'),
            row_dict.get('selected_answer'),
            row_dict.get('correct_answer'),
            row_dict.get('is_correct'),
            row_dict.get('subject'),
            row_dict.get('subtopic'),
            row_dict.get('mode'),
            row_dict.get('elapsed_seconds'),
            row_dict.get('payload_json'),
            row_dict.get('created_at'),
        ))
    
    insert_sql = '''
    INSERT INTO quiz_attempt_logs (
        user_id, question_id, selected_answer, correct_answer,
        is_correct, subject, subtopic, mode, elapsed_seconds,
        payload_json, created_at
    ) VALUES %s
    '''
    
    execute_values(pg_cursor, insert_sql, logs)
    pg_conn.commit()
    print(f"  ✓ Migrated {len(logs)} attempt logs")


def build_question_usage_from_history(pg_conn):
    """Build question_usage table from quiz_history and quiz_attempt_logs."""
    print("\nBuilding question usage from history...")
    
    pg_cursor = pg_conn.cursor()
    
    # Build from quiz_attempt_logs
    pg_cursor.execute('''
    INSERT INTO question_usage (user_id, anonymous_id, question_id, times_seen, times_correct, last_seen_at)
    SELECT 
        NULL as user_id,
        user_id as anonymous_id,
        question_id,
        COUNT(*) as times_seen,
        SUM(CASE WHEN is_correct = 1 THEN 1 ELSE 0 END) as times_correct,
        MAX(created_at::timestamp) as last_seen_at
    FROM quiz_attempt_logs
    WHERE question_id IS NOT NULL AND user_id IS NOT NULL
    GROUP BY user_id, question_id
    ON CONFLICT DO NOTHING
    ''')
    
    pg_conn.commit()
    
    pg_cursor.execute("SELECT COUNT(*) FROM question_usage")
    count = pg_cursor.fetchone()[0]
    print(f"  ✓ Built {count} question usage records")


def print_summary(pg_conn):
    """Print migration summary."""
    pg_cursor = pg_conn.cursor()
    
    print("\n" + "=" * 50)
    print("Migration Summary")
    print("=" * 50)
    
    tables = [
        'questions', 'question_explanations', 'users', 
        'quiz_history', 'quiz_attempt_logs', 'question_usage'
    ]
    
    for table in tables:
        try:
            pg_cursor.execute(f"SELECT COUNT(*) FROM {table}")
            count = pg_cursor.fetchone()[0]
            print(f"  {table}: {count} rows")
        except Exception as e:
            print(f"  {table}: ERROR - {e}")


def main():
    """Main migration function."""
    print("=" * 50)
    print("SQLite to PostgreSQL Migration")
    print("=" * 50)
    print(f"\nSource: {SQLITE_PATH}")
    print(f"Target: PostgreSQL (DATABASE_URL)")
    
    # Connect to both databases
    print("\nConnecting to databases...")
    sqlite_conn = sqlite3.connect(str(SQLITE_PATH))
    sqlite_conn.row_factory = sqlite3.Row
    
    pg_conn = psycopg2.connect(DATABASE_URL)
    pg_conn.autocommit = False
    
    try:
        # Migrate each table
        migrate_questions(sqlite_conn, pg_conn)
        migrate_explanations(sqlite_conn, pg_conn)
        migrate_users(sqlite_conn, pg_conn)
        migrate_quiz_history(sqlite_conn, pg_conn)
        migrate_attempt_logs(sqlite_conn, pg_conn)
        build_question_usage_from_history(pg_conn)
        
        print_summary(pg_conn)
        
        print("\n✓ Migration completed successfully!")
        print("\nYou can now safely remove law_quiz.db from the backend folder.")
        print("The PostgreSQL database contains all your data.")
        
    except Exception as e:
        pg_conn.rollback()
        print(f"\nERROR: {e}")
        sys.exit(1)
    finally:
        sqlite_conn.close()
        pg_conn.close()


if __name__ == '__main__':
    main()

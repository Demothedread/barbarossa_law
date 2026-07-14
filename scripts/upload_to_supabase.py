#!/usr/bin/env python3
"""
Upload local SQLite data directly to Supabase PostgreSQL.
Uses psycopg2 with explicit connection parameters (avoids URL encoding issues).

Usage:
    python scripts/upload_to_supabase.py

Requires: psycopg2-binary
"""

import sqlite3
import sys
from pathlib import Path

try:
    import psycopg2
    from psycopg2.extras import execute_values
except ImportError:
    print("ERROR: psycopg2 not installed. Run: pip install psycopg2-binary")
    sys.exit(1)

SQLITE_PATH = Path(__file__).parent.parent / 'law_quiz.db'

# Supabase connection - using session mode pooler for IPv4 compatibility
# Update these if needed from your Supabase Dashboard > Connect button
SUPABASE_CONFIG = {
    "host": "aws-1-us-east-1.pooler.supabase.com",
    "port": 5432,
    "dbname": "postgres",
    "user": "postgres.hrcepttoscyhbntaqema",
    "password": "Barpreppers1!",
    "sslmode": "require",
    "connect_timeout": 30,
}

# Fallback: direct connection (requires IPv6)
SUPABASE_DIRECT = {
    "host": "db.hrcepttoscyhbntaqema.supabase.co",
    "port": 5432,
    "dbname": "postgres",
    "user": "postgres",
    "password": "Barpreppers1!",
    "sslmode": "require",
    "connect_timeout": 30,
}


def connect_supabase():
    """Try to connect to Supabase with multiple methods."""
    for name, config in [("pooler_session", SUPABASE_CONFIG), ("direct", SUPABASE_DIRECT)]:
        try:
            print(f"  Trying {name}...")
            conn = psycopg2.connect(**config)
            print(f"  Connected via {name}")
            return conn
        except Exception as e:
            print(f"  {name} failed: {e}")
    
    # Last resort: try from environment variable
    import os
    url = os.environ.get('SUPABASE_DB_URL')
    if url:
        try:
            print(f"  Trying SUPABASE_DB_URL env var...")
            conn = psycopg2.connect(url)
            print(f"  Connected via SUPABASE_DB_URL")
            return conn
        except Exception as e:
            print(f"  SUPABASE_DB_URL failed: {e}")
    
    return None


def migrate_table(sqlite_conn, pg_conn, table_name, columns, pk='idx', has_serial=False):
    """Migrate a single table from SQLite to Supabase PostgreSQL."""
    sqlite_cur = sqlite_conn.cursor()
    
    # Check if table exists in SQLite
    sqlite_cur.execute("SELECT name FROM sqlite_master WHERE type='table' AND name=?", (table_name,))
    if not sqlite_cur.fetchone():
        print(f"  {table_name}: not found in SQLite, skipping")
        return 0
    
    # Get actual columns
    sqlite_cur.execute(f"PRAGMA table_info({table_name})")
    sqlite_cols = [info[1] for info in sqlite_cur.fetchall()]
    actual_cols = [c for c in columns if c in sqlite_cols]
    
    if not actual_cols:
        print(f"  {table_name}: no matching columns, skipping")
        return 0
    
    col_list = ', '.join(actual_cols)
    sqlite_cur.execute(f"SELECT {col_list} FROM {table_name}")
    rows = sqlite_cur.fetchall()
    
    if not rows:
        print(f"  {table_name}: 0 rows, skipping")
        return 0
    
    # Convert to list of tuples
    data = [tuple(row) for row in rows]
    
    # Build insert query
    insert_sql = f"""
        INSERT INTO {table_name} ({col_list})
        VALUES %s
        ON CONFLICT ({pk}) DO NOTHING
    """
    
    pg_cur = pg_conn.cursor()
    
    # Insert in batches
    batch_size = 100
    total = 0
    for i in range(0, len(data), batch_size):
        batch = data[i:i + batch_size]
        execute_values(pg_cur, insert_sql, batch)
        total += len(batch)
        if total % 500 == 0:
            print(f"    ...{total}/{len(data)}")
    
    # Reset serial sequence
    if has_serial and pk == 'id':
        pg_cur.execute(f"""
            SELECT setval(pg_get_serial_sequence('{table_name}', 'id'),
                          COALESCE((SELECT MAX(id) FROM {table_name}), 1))
        """)
    
    pg_conn.commit()
    print(f"  {table_name}: {total} rows migrated")
    return total


def main():
    print("=" * 60)
    print("Upload SQLite data to Supabase")
    print("=" * 60)
    
    if not SQLITE_PATH.exists():
        print(f"ERROR: SQLite database not found at {SQLITE_PATH}")
        sys.exit(1)
    
    print(f"\nSource: {SQLITE_PATH}")
    
    # Connect to Supabase
    print("\nConnecting to Supabase...")
    pg_conn = connect_supabase()
    if not pg_conn:
        print("\nERROR: Could not connect to Supabase.")
        print("Options:")
        print("  1. Get your connection string from Supabase Dashboard > Connect button")
        print("  2. Set SUPABASE_DB_URL environment variable")
        print("  3. Update the connection params in this script")
        print("  4. Use the SQL files in scripts/supabase_import/ via Supabase SQL Editor")
        sys.exit(1)
    
    sqlite_conn = sqlite3.connect(str(SQLITE_PATH))
    
    total = 0
    print("\nMigrating tables...\n")
    
    # Questions
    total += migrate_table(sqlite_conn, pg_conn, 'questions', [
        'idx', 'dataset', 'example_id', 'prompt_id', 'source', 'subject',
        'question_number', 'prompt', 'question', 'choice_a', 'choice_b',
        'choice_c', 'choice_d', 'answer', 'gold_passage', 'gold_idx',
        'generated', 'subtopic'
    ], pk='idx')
    
    # Question explanations
    total += migrate_table(sqlite_conn, pg_conn, 'question_explanations', [
        'question_id', 'correct_answer', 'choice_a_explanation',
        'choice_b_explanation', 'choice_c_explanation', 'choice_d_explanation',
        'subtopic', 'ai_explanation', 'created_at', 'updated_at'
    ], pk='question_id')
    
    # Essay prompts
    total += migrate_table(sqlite_conn, pg_conn, 'essay_prompts', [
        'id', 'exam_id', 'exam_year', 'exam_month', 'question_number',
        'subject', 'prompt_text', 'model_answer', 'source_pdf', 'created_at'
    ], pk='id', has_serial=True)
    
    # Users
    total += migrate_table(sqlite_conn, pg_conn, 'users', [
        'id', 'username', 'email', 'password_hash', 'created_at'
    ], pk='id', has_serial=True)
    
    # User preferences
    total += migrate_table(sqlite_conn, pg_conn, 'user_preferences', [
        'user_id', 'audio_enabled', 'background_music_enabled',
        'volume_level', 'preferred_subjects', 'theme_preference'
    ], pk='user_id')
    
    # Quiz history
    total += migrate_table(sqlite_conn, pg_conn, 'quiz_history', [
        'id', 'user_id', 'subject', 'correct', 'total',
        'duration_seconds', 'questions_json', 'answers_json',
        'negative_time', 'created_at'
    ], pk='id', has_serial=True)
    
    sqlite_conn.close()
    pg_conn.close()
    
    print(f"\n{'=' * 60}")
    print(f"Migration complete! {total} total rows uploaded")
    print(f"{'=' * 60}")


if __name__ == '__main__':
    main()

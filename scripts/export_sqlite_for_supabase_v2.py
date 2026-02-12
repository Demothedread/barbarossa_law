#!/usr/bin/env python3
"""
Export ALL data from local SQLite into individual SQL batch files for Supabase import.
Uses SQLite as the canonical source (has more data than CSV).

Generates smaller batches (25 rows) to stay within MCP tool limits.
"""

import sqlite3
import sys
from pathlib import Path

OUTPUT_DIR = Path(__file__).parent / 'supabase_import'
OUTPUT_DIR.mkdir(exist_ok=True)

SQLITE_PATH = Path(__file__).parent.parent / 'law_quiz.db'

if not SQLITE_PATH.exists():
    print(f"ERROR: SQLite database not found at {SQLITE_PATH}")
    sys.exit(1)


def escape_sql(value):
    """Escape a value for SQL insertion."""
    if value is None:
        return 'NULL'
    if isinstance(value, bool):
        return 'TRUE' if value else 'FALSE'
    if isinstance(value, (int, float)):
        return str(value)
    s = str(value).replace("'", "''")
    return f"'{s}'"


def export_table(conn, table_name, columns, pk='idx', batch_size=25, has_serial=False):
    """Export a SQLite table to SQL batch files."""
    cursor = conn.cursor()
    
    # Check if table exists
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name=?", (table_name,))
    if not cursor.fetchone():
        print(f"  {table_name}: TABLE NOT FOUND")
        return 0
    
    # Get actual columns
    cursor.execute(f"PRAGMA table_info({table_name})")
    sqlite_cols = [info[1] for info in cursor.fetchall()]
    actual_cols = [c for c in columns if c in sqlite_cols]
    
    if not actual_cols:
        print(f"  {table_name}: no matching columns")
        return 0
    
    col_list = ', '.join(actual_cols)
    cursor.execute(f"SELECT {col_list} FROM {table_name}")
    rows = cursor.fetchall()
    
    if not rows:
        print(f"  {table_name}: 0 rows")
        return 0
    
    # Clear old files for this table
    for f in OUTPUT_DIR.glob(f'{table_name}_batch_*.sql'):
        f.unlink()
    
    batch_num = 0
    for i in range(0, len(rows), batch_size):
        batch = rows[i:i + batch_size]
        values = []
        for row in batch:
            vals = ', '.join(escape_sql(v) for v in row)
            values.append(f'({vals})')
        
        joined = ',\n'.join(values)
        sql = f"INSERT INTO {table_name} ({col_list})\nVALUES\n{joined}\nON CONFLICT ({pk}) DO NOTHING;\n"
        
        if has_serial and pk == 'id' and i + batch_size >= len(rows):
            sql += f"\nSELECT setval(pg_get_serial_sequence('{table_name}', 'id'), COALESCE((SELECT MAX(id) FROM {table_name}), 1));\n"
        
        filepath = OUTPUT_DIR / f'{table_name}_batch_{batch_num:03d}.sql'
        with open(filepath, 'w') as f:
            f.write(sql)
        batch_num += 1
    
    print(f"  {table_name}: {len(rows)} rows in {batch_num} batches")
    return len(rows)


def main():
    print("Exporting SQLite data for Supabase import...")
    print(f"Source: {SQLITE_PATH}")
    print(f"Output: {OUTPUT_DIR}/\n")
    
    # Clean output directory
    for f in OUTPUT_DIR.glob('*.sql'):
        f.unlink()
    
    conn = sqlite3.connect(str(SQLITE_PATH))
    
    total = 0
    
    # Questions (largest table - use smaller batches)
    total += export_table(conn, 'questions', [
        'idx', 'dataset', 'example_id', 'prompt_id', 'source', 'subject',
        'question_number', 'prompt', 'question', 'choice_a', 'choice_b',
        'choice_c', 'choice_d', 'answer', 'gold_passage', 'gold_idx',
        'generated', 'subtopic'
    ], pk='idx', batch_size=25)
    
    # Question explanations
    total += export_table(conn, 'question_explanations', [
        'question_id', 'correct_answer', 'choice_a_explanation',
        'choice_b_explanation', 'choice_c_explanation', 'choice_d_explanation',
        'subtopic', 'ai_explanation', 'created_at', 'updated_at'
    ], pk='question_id', batch_size=10)
    
    # Essay prompts
    total += export_table(conn, 'essay_prompts', [
        'id', 'exam_id', 'exam_year', 'exam_month', 'question_number',
        'subject', 'prompt_text', 'model_answer', 'source_pdf', 'created_at'
    ], pk='id', batch_size=25, has_serial=True)
    
    # Users
    total += export_table(conn, 'users', [
        'id', 'username', 'email', 'password_hash', 'created_at'
    ], pk='id', batch_size=25, has_serial=True)
    
    # User preferences
    total += export_table(conn, 'user_preferences', [
        'user_id', 'audio_enabled', 'background_music_enabled',
        'volume_level', 'preferred_subjects', 'theme_preference'
    ], pk='user_id', batch_size=25)
    
    # Quiz history
    total += export_table(conn, 'quiz_history', [
        'id', 'user_id', 'subject', 'correct', 'total',
        'duration_seconds', 'questions_json', 'answers_json',
        'negative_time', 'created_at'
    ], pk='id', batch_size=25, has_serial=True)
    
    conn.close()
    
    sql_files = sorted(OUTPUT_DIR.glob('*.sql'))
    print(f"\nGenerated {len(sql_files)} SQL files ({total} total rows)")


if __name__ == '__main__':
    main()

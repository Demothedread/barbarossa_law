#!/usr/bin/env python3
"""
Generate SQL INSERT statements from local SQLite database for Supabase import.
Outputs SQL files that can be run via the Supabase SQL Editor or MCP tool.

Usage:
    python scripts/export_sqlite_for_supabase.py
    
This creates SQL files in scripts/supabase_import/ directory.
"""

import csv
import json
import os
import sqlite3
import sys
from pathlib import Path

OUTPUT_DIR = Path(__file__).parent / 'supabase_import'
OUTPUT_DIR.mkdir(exist_ok=True)

SQLITE_PATH = Path(__file__).parent.parent / 'law_quiz.db'
CSV_PATH = Path(__file__).parent.parent / 'qa.csv'


def escape_sql(value):
    """Escape a value for SQL insertion."""
    if value is None:
        return 'NULL'
    if isinstance(value, bool):
        return 'TRUE' if value else 'FALSE'
    if isinstance(value, (int, float)):
        return str(value)
    # String value - escape single quotes
    s = str(value).replace("'", "''")
    return f"'{s}'"


def export_questions_from_csv():
    """Export questions from qa.csv to SQL INSERT statements."""
    if not CSV_PATH.exists():
        print(f"WARNING: {CSV_PATH} not found")
        return
    
    print(f"Reading questions from {CSV_PATH}...")
    
    def is_shifted_row(row):
        cd = row.get('choice_d', '').strip()
        answer = row.get('answer', '').strip()
        return len(cd) == 1 and cd in 'ABCD' and len(answer) > 1

    def fix_shifted_row(row):
        return {
            'idx': row.get('idx', ''),
            'dataset': row.get('dataset', ''),
            'example_id': row.get('example_id', ''),
            'prompt_id': row.get('prompt_id', ''),
            'source': row.get('source', ''),
            'subject': row.get('subject', ''),
            'subtopic': '',
            'question_number': row.get('subtopic', ''),
            'prompt': row.get('question_number', ''),
            'question': row.get('prompt', ''),
            'choice_a': row.get('question', ''),
            'choice_b': row.get('choice_a', ''),
            'choice_c': row.get('choice_b', ''),
            'choice_d': row.get('choice_c', ''),
            'answer': row.get('choice_d', ''),
            'gold_passage': row.get('answer', ''),
            'gold_idx': row.get('gold_passage', ''),
        }
    
    batch_size = 100  # Rows per SQL file
    batch_num = 0
    rows_in_batch = []
    total = 0
    shifted = 0
    
    with open(CSV_PATH, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            if is_shifted_row(row):
                row = fix_shifted_row(row)
                shifted += 1
            
            rows_in_batch.append(row)
            total += 1
            
            if len(rows_in_batch) >= batch_size:
                write_questions_batch(rows_in_batch, batch_num)
                batch_num += 1
                rows_in_batch = []
    
    # Write remaining rows
    if rows_in_batch:
        write_questions_batch(rows_in_batch, batch_num)
        batch_num += 1
    
    print(f"  Exported {total} questions ({shifted} shifted) in {batch_num} batches")


def write_questions_batch(rows, batch_num):
    """Write a batch of question rows to a SQL file."""
    filepath = OUTPUT_DIR / f'questions_batch_{batch_num:03d}.sql'
    
    values = []
    for r in rows:
        vals = ', '.join([
            escape_sql(r.get('idx', '')),
            escape_sql(r.get('dataset', '')),
            escape_sql(r.get('example_id', '')),
            escape_sql(r.get('prompt_id', '')),
            escape_sql(r.get('source', '')),
            escape_sql(r.get('subject', '')),
            escape_sql(r.get('question_number', '')),
            escape_sql(r.get('prompt', '')),
            escape_sql(r.get('question', '')),
            escape_sql(r.get('choice_a', '')),
            escape_sql(r.get('choice_b', '')),
            escape_sql(r.get('choice_c', '')),
            escape_sql(r.get('choice_d', '')),
            escape_sql(r.get('answer', '')),
            escape_sql(r.get('gold_passage', '')),
            escape_sql(r.get('gold_idx', '')),
            '0',  # generated
            escape_sql(r.get('subtopic', '')),
        ])
        values.append(f'({vals})')
    
    joined_values = ',\n'.join(values)
    sql = f"""INSERT INTO questions (
    idx, dataset, example_id, prompt_id, source, subject,
    question_number, prompt, question, choice_a, choice_b,
    choice_c, choice_d, answer, gold_passage, gold_idx,
    generated, subtopic
) VALUES
{joined_values}
ON CONFLICT (idx) DO NOTHING;
"""
    
    with open(filepath, 'w') as f:
        f.write(sql)


def export_sqlite_table(conn, table_name, columns, has_serial_id=False):
    """Export a SQLite table to SQL INSERT statements."""
    cursor = conn.cursor()
    
    try:
        cursor.execute(f"SELECT COUNT(*) FROM {table_name}")
        count = cursor.fetchone()[0]
    except sqlite3.OperationalError:
        print(f"  {table_name}: TABLE NOT FOUND, skipping")
        return
    
    if count == 0:
        print(f"  {table_name}: 0 rows, skipping")
        return
    
    # Get actual columns from SQLite
    cursor.execute(f"PRAGMA table_info({table_name})")
    sqlite_cols = [info[1] for info in cursor.fetchall()]
    
    # Use intersection
    actual_cols = [c for c in columns if c in sqlite_cols]
    if not actual_cols:
        print(f"  {table_name}: no matching columns, skipping")
        return
    
    col_list = ', '.join(actual_cols)
    cursor.execute(f"SELECT {col_list} FROM {table_name}")
    rows = cursor.fetchall()
    
    # Determine primary key for ON CONFLICT
    pk = 'idx' if 'idx' in actual_cols else ('question_id' if 'question_id' in actual_cols else 'id')
    
    values = []
    for row in rows:
        vals = ', '.join(escape_sql(v) for v in row)
        values.append(f'({vals})')
    
    # Split into batches
    batch_size = 100
    batch_num = 0
    for i in range(0, len(values), batch_size):
        batch = values[i:i + batch_size]
        filepath = OUTPUT_DIR / f'{table_name}_batch_{batch_num:03d}.sql'
        
        joined_values = ',\n'.join(batch)
        sql = f"""INSERT INTO {table_name} ({col_list})
VALUES
{joined_values}
ON CONFLICT ({pk}) DO NOTHING;
"""
        if has_serial_id and pk == 'id':
            sql += f"""
SELECT setval(pg_get_serial_sequence('{table_name}', 'id'),
              COALESCE((SELECT MAX(id) FROM {table_name}), 1));
"""
        
        with open(filepath, 'w') as f:
            f.write(sql)
        batch_num += 1
    
    print(f"  {table_name}: {count} rows in {batch_num} batch(es)")


def main():
    print("=" * 60)
    print("Export SQLite data for Supabase import")
    print("=" * 60)
    
    # Clean output directory
    for f in OUTPUT_DIR.glob('*.sql'):
        f.unlink()
    
    # Export questions from CSV (canonical source)
    print("\n1. Exporting questions from qa.csv...")
    export_questions_from_csv()
    
    # Export supplemental data from SQLite
    if SQLITE_PATH.exists():
        print(f"\n2. Exporting from SQLite ({SQLITE_PATH})...")
        conn = sqlite3.connect(str(SQLITE_PATH))
        
        export_sqlite_table(conn, 'question_explanations', [
            'question_id', 'correct_answer', 'choice_a_explanation',
            'choice_b_explanation', 'choice_c_explanation', 'choice_d_explanation',
            'subtopic', 'ai_explanation', 'created_at', 'updated_at'
        ])
        
        export_sqlite_table(conn, 'essay_prompts', [
            'id', 'exam_id', 'exam_year', 'exam_month', 'question_number',
            'subject', 'prompt_text', 'model_answer', 'source_pdf', 'created_at'
        ], has_serial_id=True)
        
        export_sqlite_table(conn, 'users', [
            'id', 'username', 'email', 'password_hash', 'created_at',
            'last_login', 'preferred_mode', 'preferences_json'
        ], has_serial_id=True)
        
        export_sqlite_table(conn, 'user_preferences', [
            'user_id', 'audio_enabled', 'background_music_enabled',
            'volume_level', 'preferred_subjects', 'theme_preference'
        ])
        
        export_sqlite_table(conn, 'quiz_history', [
            'id', 'user_id', 'subject', 'correct', 'total',
            'duration_seconds', 'questions_json', 'answers_json',
            'negative_time', 'created_at'
        ], has_serial_id=True)
        
        conn.close()
    else:
        print(f"\n2. SQLite not found at {SQLITE_PATH}, skipping")
    
    # Count output files
    sql_files = sorted(OUTPUT_DIR.glob('*.sql'))
    print(f"\nGenerated {len(sql_files)} SQL files in {OUTPUT_DIR}/")
    for f in sql_files:
        print(f"  {f.name}")
    
    print(f"\nNext: Run these SQL files against Supabase via SQL Editor or MCP tool")


if __name__ == '__main__':
    main()

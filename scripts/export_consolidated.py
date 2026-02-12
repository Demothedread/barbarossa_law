#!/usr/bin/env python3
"""
Generate a single consolidated SQL file for Supabase import.
This reads from SQLite and generates properly-typed PostgreSQL INSERT statements.
Handles SQLite integer→PostgreSQL boolean conversion.

Output: scripts/supabase_consolidated.sql (can be pasted into Supabase SQL Editor)
"""

import json
import sqlite3
from pathlib import Path

SQLITE_PATH = Path(__file__).parent.parent / 'law_quiz.db'
OUTPUT_DIR = Path(__file__).parent / 'supabase_consolidated'
OUTPUT_DIR.mkdir(exist_ok=True)

def escape_sql(val):
    """Escape a string value for SQL."""
    if val is None:
        return 'NULL'
    s = str(val)
    s = s.replace("'", "''")
    # Remove null bytes
    s = s.replace('\x00', '')
    return f"'{s}'"

def bool_val(val):
    """Convert SQLite integer to PostgreSQL boolean."""
    if val is None:
        return 'NULL'
    return 'true' if val else 'false'

def int_val(val):
    if val is None:
        return 'NULL'
    return str(int(val))

def float_val(val):
    if val is None:
        return 'NULL'
    return str(float(val))

def main():
    conn = sqlite3.connect(str(SQLITE_PATH))
    conn.row_factory = sqlite3.Row
    
    # ========== QUESTIONS ==========
    print("Exporting questions...")
    cur = conn.execute("SELECT * FROM questions ORDER BY idx")
    rows = cur.fetchall()
    
    # Split into files of 250 rows each (~750KB each, manageable for SQL Editor)
    batch_size = 250
    file_num = 0
    for i in range(0, len(rows), batch_size):
        batch = rows[i:i+batch_size]
        filename = OUTPUT_DIR / f'01_questions_{file_num:03d}.sql'
        with open(filename, 'w') as f:
            f.write(f"-- Questions batch {file_num} ({len(batch)} rows)\n")
            f.write("INSERT INTO questions (idx, dataset, example_id, prompt_id, source, subject, question_number, prompt, question, choice_a, choice_b, choice_c, choice_d, answer, gold_passage, gold_idx, generated, subtopic)\nVALUES\n")
            
            values = []
            for row in batch:
                vals = (
                    escape_sql(row['idx']),
                    escape_sql(row['dataset']),
                    escape_sql(row['example_id']),
                    escape_sql(row['prompt_id']),
                    escape_sql(row['source']),
                    escape_sql(row['subject']),
                    escape_sql(row['question_number']),
                    escape_sql(row['prompt']),
                    escape_sql(row['question']),
                    escape_sql(row['choice_a']),
                    escape_sql(row['choice_b']),
                    escape_sql(row['choice_c']),
                    escape_sql(row['choice_d']),
                    escape_sql(row['answer']),
                    escape_sql(row['gold_passage']),
                    escape_sql(row['gold_idx']),
                    int_val(row['generated']),
                    escape_sql(row['subtopic'])
                )
                values.append(f"({', '.join(vals)})")
            
            f.write(',\n'.join(values))
            f.write('\nON CONFLICT (idx) DO NOTHING;\n')
        
        file_num += 1
    
    print(f"  {len(rows)} questions → {file_num} files")
    
    # ========== QUESTION EXPLANATIONS ==========
    print("Exporting question_explanations...")
    cur = conn.execute("SELECT * FROM question_explanations ORDER BY question_id")
    rows = cur.fetchall()
    
    file_num = 0
    for i in range(0, len(rows), batch_size):
        batch = rows[i:i+batch_size]
        filename = OUTPUT_DIR / f'02_explanations_{file_num:03d}.sql'
        with open(filename, 'w') as f:
            f.write(f"-- Question explanations batch {file_num} ({len(batch)} rows)\n")
            f.write("INSERT INTO question_explanations (question_id, correct_answer, choice_a_explanation, choice_b_explanation, choice_c_explanation, choice_d_explanation, subtopic, ai_explanation, created_at, updated_at)\nVALUES\n")
            
            values = []
            for row in batch:
                vals = (
                    escape_sql(row['question_id']),
                    escape_sql(row['correct_answer']),
                    escape_sql(row['choice_a_explanation']),
                    escape_sql(row['choice_b_explanation']),
                    escape_sql(row['choice_c_explanation']),
                    escape_sql(row['choice_d_explanation']),
                    escape_sql(row['subtopic']),
                    escape_sql(row['ai_explanation']),
                    escape_sql(row['created_at']),
                    escape_sql(row['updated_at']),
                )
                values.append(f"({', '.join(vals)})")
            
            f.write(',\n'.join(values))
            f.write('\nON CONFLICT (question_id) DO NOTHING;\n')
        
        file_num += 1
    
    print(f"  {len(rows)} explanations → {file_num} files")
    
    # ========== ESSAY PROMPTS ==========
    print("Exporting essay_prompts...")
    cur = conn.execute("SELECT * FROM essay_prompts ORDER BY id")
    rows = cur.fetchall()
    
    filename = OUTPUT_DIR / '03_essay_prompts.sql'
    with open(filename, 'w') as f:
        f.write(f"-- Essay prompts ({len(rows)} rows)\n")
        f.write("INSERT INTO essay_prompts (id, exam_id, exam_year, exam_month, question_number, subject, prompt_text, model_answer, source_pdf, created_at)\nVALUES\n")
        
        values = []
        for row in rows:
            vals = (
                int_val(row['id']),
                escape_sql(row['exam_id']),
                int_val(row['exam_year']),
                escape_sql(row['exam_month']),
                int_val(row['question_number']),
                escape_sql(row['subject']),
                escape_sql(row['prompt_text']),
                escape_sql(row['model_answer']),
                escape_sql(row['source_pdf']),
                escape_sql(row['created_at']),
            )
            values.append(f"({', '.join(vals)})")
        
        f.write(',\n'.join(values))
        f.write("\nON CONFLICT (id) DO NOTHING;\n\n")
        f.write("SELECT setval(pg_get_serial_sequence('essay_prompts', 'id'), COALESCE((SELECT MAX(id) FROM essay_prompts), 1));\n")
    
    print(f"  {len(rows)} essay prompts → 1 file")
    
    conn.close()
    
    # Summary
    import os
    total_size = sum(f.stat().st_size for f in OUTPUT_DIR.glob('*.sql'))
    file_count = len(list(OUTPUT_DIR.glob('*.sql')))
    print(f"\nGenerated {file_count} SQL files in {OUTPUT_DIR}/")
    print(f"Total size: {total_size / 1024:.1f} KB")
    print(f"\nTo import: paste each file into Supabase SQL Editor (Dashboard > SQL Editor)")

if __name__ == '__main__':
    main()

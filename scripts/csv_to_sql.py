"""Convert a QA CSV file to SQL insert statements.

Usage:
    python csv_to_sql.py <csv_path> <output_sql_path>

The CSV is expected to have headers:
    idx,dataset,example_id,prompt_id,source,subject,question_number,prompt,question,
    choice_a,choice_b,choice_c,choice_d,answer,gold_passage,gold_idx

Duplicate questions (by 'question') are skipped.
"""

import csv
import os
import sqlite3
import sys
from pathlib import Path


def read_csv(csv_path: Path):
    """Yield unique rows from the CSV file, skipping duplicate questions."""
    seen = set()
    with csv_path.open(newline='', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            question = row.get('question', '').strip()
            if question and question not in seen:
                seen.add(question)
                # Only keep the expected columns
                yield {key: row.get(key, '').strip() for key in [
                    'idx', 'dataset', 'example_id', 'prompt_id', 'source', 'subject',
                    'question_number', 'prompt', 'question', 'choice_a', 'choice_b',
                    'choice_c', 'choice_d', 'answer', 'gold_passage', 'gold_idx'
                ]}


def write_sql(rows, out_path: Path):
    """Write SQL insert statements to *out_path* using the correct columns."""
    columns = (
        'idx', 'dataset', 'example_id', 'prompt_id', 'source', 'subject',
        'question_number', 'prompt', 'question', 'choice_a', 'choice_b',
        'choice_c', 'choice_d', 'answer', 'gold_passage', 'gold_idx'
    )
    with out_path.open('w', encoding='utf-8') as f:
        f.write('BEGIN TRANSACTION;\n')
        for row in rows:
            # Escape single quotes for SQL
            values = [row.get(col, '').replace("'", "''") for col in columns]
            f.write(
                f"INSERT INTO questions ({', '.join(columns)}) VALUES ('" +
                "', '".join(values) + "');\n"
            )
        f.write('COMMIT;\n')


def create_schema(conn):
    c = conn.cursor()
    c.execute('''
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
            gold_idx TEXT
        )
    ''')
    conn.commit()


def load_csv_to_db(csv_path, db_path):
    conn = sqlite3.connect(db_path)
    create_schema(conn)
    with open(csv_path, newline='', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        rows = 0
        for row in reader:
            vals = tuple(row.get(col, '') for col in [
                'idx', 'dataset', 'example_id', 'prompt_id', 'source', 'subject',
                'question_number', 'prompt', 'question', 'choice_a', 'choice_b',
                'choice_c', 'choice_d', 'answer', 'gold_passage', 'gold_idx'
            ])
            try:
                conn.execute(
                    '''INSERT OR REPLACE INTO questions (
                        idx, dataset, example_id, prompt_id, source, subject, question_number, prompt, question,
                        choice_a, choice_b, choice_c, choice_d, answer, gold_passage, gold_idx
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)''', vals)
                rows += 1
            except Exception as e:
                print(f"Skipping row {row.get('idx', '?')}: {e}")
    conn.commit()
    conn.close()
    print(f"Loaded {rows} questions into {db_path}")


def main(argv):
    if len(argv) != 3:
        print('Usage: python csv_to_sql.py <csv_path> <output_sql_path>')
        return 1
    csv_path = Path(argv[1])
    out_path = Path(argv[2])
    rows = list(read_csv(csv_path))
    write_sql(rows, out_path)
    print(f'Wrote {len(rows)} unique questions to {out_path}')
    return 0


if __name__ == '__main__':
    raise SystemExit(main(sys.argv))

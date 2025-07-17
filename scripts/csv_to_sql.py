"""Convert a QA CSV file to SQL insert statements.

Usage:
    python csv_to_sql.py <csv_path> <output_sql_path>

The CSV is expected to have headers:
    'Question ID', 'Subject Topic', 'Question Call',
    'Answer Choice A', 'Answer Choice B', 'Answer Choice C', 'Answer Choice D',
    'Correct Answer', 'Explanation'

Duplicate questions (by 'Question Call') are skipped.
"""

import csv
import sys
from pathlib import Path


def read_csv(csv_path: Path):
    """Yield unique rows from the CSV file."""
    seen = set()
    with csv_path.open(newline='', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            question = row.get('Question Call', '').strip()
            if question and question not in seen:
                seen.add(question)
                yield {
                    'Question ID': row.get('Question ID', ''),
                    'Subject Topic': row.get('Subject Topic', ''),
                    'Question Call': question,
                    'Answer Choice A': row.get('Answer Choice A', ''),
                    'Answer Choice B': row.get('Answer Choice B', ''),
                    'Answer Choice C': row.get('Answer Choice C', ''),
                    'Answer Choice D': row.get('Answer Choice D', ''),
                    'Correct Answer': row.get('Correct Answer', ''),
                    'Explanation': row.get('Explanation', ''),
                }


def write_sql(rows, out_path: Path):
    """Write SQL insert statements to *out_path*."""
    columns = (
        'QuestionID', 'Subject', 'Call',
        'AnswerA', 'AnswerB', 'AnswerC', 'AnswerD',
        'Correct', 'Explanation'
    )
    with out_path.open('w', encoding='utf-8') as f:
        f.write('BEGIN TRANSACTION;\n')
        for row in rows:
            values = [row['Question ID'], row['Subject Topic'], row['Question Call'],
                      row['Answer Choice A'], row['Answer Choice B'],
                      row['Answer Choice C'], row['Answer Choice D'],
                      row['Correct Answer'], row['Explanation']]
            escaped = [v.replace("'", "''") for v in values]
            f.write(
                "INSERT INTO questions ({cols}) VALUES ('{vals}');\n".format(
                    cols=', '.join(columns),
                    vals="', '".join(escaped)
                )
            )
        f.write('COMMIT;\n')


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
import csv
import sqlite3
import os

CSV_PATH = os.path.join(os.path.dirname(__file__), '..', 'qa (3).csv')
DB_PATH = os.path.join(os.path.dirname(__file__), '..', 'law_quiz.db')

def create_schema(conn):
    c = conn.cursor()
    c.execute('''
        CREATE TABLE IF NOT EXISTS questions (
            id TEXT PRIMARY KEY,
            subject TEXT,
            prompt TEXT,
            question TEXT,
            choice_a TEXT,
            choice_b TEXT,
            choice_c TEXT,
            choice_d TEXT,
            answer TEXT,
            explanation TEXT
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
            vals = (
                row['idx'],
                row.get('subject', None) or '',
                row.get('prompt', None) or '',
                row.get('question', None) or '',
                row.get('choice_a', None) or '',
                row.get('choice_b', None) or '',
                row.get('choice_c', None) or '',
                row.get('choice_d', None) or '',
                row.get('answer', None) or '',
                row.get('gold_passage', None) or ''
            )
            try:
                conn.execute('''INSERT OR REPLACE INTO questions (id, subject, prompt, question, choice_a, choice_b, choice_c, choice_d, answer, explanation) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)''', vals)
                rows += 1
            except Exception as e:
                print(f"Skipping row {row.get('idx', '?')}: {e}")
    conn.commit()
    conn.close()
    print(f"Loaded {rows} questions into {db_path}")

if __name__ == '__main__':
    load_csv_to_db(CSV_PATH, DB_PATH)

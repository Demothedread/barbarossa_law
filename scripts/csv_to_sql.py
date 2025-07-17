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

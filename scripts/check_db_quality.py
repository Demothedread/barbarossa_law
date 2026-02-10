#!/usr/bin/env python3
"""Quick check of law_quiz.db data quality."""
import sqlite3
from pathlib import Path

db_path = Path(__file__).parent.parent / 'law_quiz.db'
if not db_path.exists():
    print("law_quiz.db not found")
    exit()

conn = sqlite3.connect(str(db_path))
c = conn.cursor()

c.execute("SELECT COUNT(*) FROM questions")
total = c.fetchone()[0]

c.execute("SELECT COUNT(*) FROM questions WHERE prompt IS NOT NULL AND prompt != '' AND LENGTH(prompt) < 10")
short = c.fetchone()[0]

c.execute("SELECT idx, prompt, substr(question, 1, 60) FROM questions WHERE prompt IS NOT NULL AND prompt != '' AND LENGTH(prompt) < 10 LIMIT 10")
for row in c.fetchall():
    print(f"Short prompt: idx={row[0]}, prompt={repr(row[1])}, question={repr(row[2])}")

# Check for non-letter answers (indicates shifted data)
c.execute("SELECT COUNT(*) FROM questions WHERE answer NOT IN ('A','B','C','D')")
bad_answers = c.fetchone()[0]

c.execute("SELECT COUNT(*) FROM questions WHERE answer IN ('A','B','C','D')")
good_answers = c.fetchone()[0]

print(f"\nTotal: {total}")
print(f"Short prompts (<10 chars): {short}")
print(f"Good answers (A-D): {good_answers}")
print(f"Bad answers (not A-D): {bad_answers}")

if bad_answers > 0:
    c.execute("SELECT idx, substr(answer,1,40) FROM questions WHERE answer NOT IN ('A','B','C','D') LIMIT 5")
    for row in c.fetchall():
        print(f"  Bad: idx={row[0]}, answer={repr(row[1])}")

conn.close()

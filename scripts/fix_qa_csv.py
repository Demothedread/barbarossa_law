#!/usr/bin/env python3
"""
Fix column alignment in qa.csv.

The CSV header includes a 'subtopic' column, but most data rows are missing
the subtopic value, causing all subsequent fields to shift left by one position.

Detection: If choice_d is a single letter (A-D), the row is shifted because
choice_d actually contains the answer field.

Correction: Shift fields right from 'subtopic' onward to restore correct alignment.
"""

import csv
import sys
from pathlib import Path

ROOT_DIR = Path(__file__).parent.parent
CSV_PATH = ROOT_DIR / 'qa.csv'
OUTPUT_PATH = ROOT_DIR / 'qa_fixed.csv'

HEADERS = [
    'idx', 'dataset', 'example_id', 'prompt_id', 'source', 'subject',
    'subtopic', 'question_number', 'prompt', 'question',
    'choice_a', 'choice_b', 'choice_c', 'choice_d',
    'answer', 'gold_passage', 'gold_idx'
]


def is_shifted(row):
    """Detect if a CSV row has its columns shifted by one position.
    
    In shifted rows, choice_d contains the answer letter (A-D) instead of
    an actual choice text, and the answer field contains the gold_passage text.
    """
    cd = row.get('choice_d', '').strip()
    answer = row.get('answer', '').strip()
    # Shifted: choice_d is a single answer letter, and answer is long text
    return len(cd) == 1 and cd in 'ABCD' and len(answer) > 1


def fix_shifted_row(row):
    """Correct a shifted row by moving fields to their proper positions.
    
    In the shifted row:
      subtopic     → actually question_number
      question_num → actually prompt  
      prompt       → actually question
      question     → actually choice_a
      choice_a     → actually choice_b
      choice_b     → actually choice_c
      choice_c     → actually choice_d
      choice_d     → actually answer
      answer       → actually gold_passage
      gold_passage → actually gold_idx
    """
    return {
        'idx': row.get('idx', ''),
        'dataset': row.get('dataset', ''),
        'example_id': row.get('example_id', ''),
        'prompt_id': row.get('prompt_id', ''),
        'source': row.get('source', ''),
        'subject': row.get('subject', ''),
        'subtopic': '',  # Was missing in original data
        'question_number': row.get('subtopic', ''),      # subtopic had question_number
        'prompt': row.get('question_number', ''),          # question_number had prompt
        'question': row.get('prompt', ''),                 # prompt had question
        'choice_a': row.get('question', ''),               # question had choice_a
        'choice_b': row.get('choice_a', ''),               # choice_a had choice_b
        'choice_c': row.get('choice_b', ''),               # choice_b had choice_c
        'choice_d': row.get('choice_c', ''),               # choice_c had choice_d
        'answer': row.get('choice_d', ''),                 # choice_d had answer
        'gold_passage': row.get('answer', ''),             # answer had gold_passage
        'gold_idx': row.get('gold_passage', ''),           # gold_passage had gold_idx
    }


def main():
    if not CSV_PATH.exists():
        print(f"ERROR: {CSV_PATH} not found")
        sys.exit(1)

    shifted_count = 0
    good_count = 0
    fixed_rows = []

    with open(CSV_PATH, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            if is_shifted(row):
                fixed_rows.append(fix_shifted_row(row))
                shifted_count += 1
            else:
                # Row is properly aligned, keep as-is
                fixed_row = {h: row.get(h, '') for h in HEADERS}
                fixed_rows.append(fixed_row)
                good_count += 1

    print(f"Total rows: {shifted_count + good_count}")
    print(f"  Properly aligned: {good_count}")
    print(f"  Shifted (fixed): {shifted_count}")

    # Verify fix by checking a few rows
    print("\nVerification (first 3 fixed rows):")
    for i, row in enumerate(fixed_rows[:3]):
        answer = row['answer'].strip()
        cd = row['choice_d'].strip()
        q = row['question'].strip()[:60]
        print(f"  Row {i}: answer={answer}, choice_d_len={len(cd)}, question={q}...")

    # Write fixed CSV
    with open(OUTPUT_PATH, 'w', encoding='utf-8', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=HEADERS)
        writer.writeheader()
        writer.writerows(fixed_rows)

    print(f"\n✓ Fixed CSV written to {OUTPUT_PATH}")
    
    # Ask to replace original
    if '--replace' in sys.argv:
        import shutil
        backup = CSV_PATH.with_suffix('.csv.bak')
        shutil.copy2(CSV_PATH, backup)
        shutil.move(OUTPUT_PATH, CSV_PATH)
        print(f"✓ Original backed up to {backup}")
        print(f"✓ Fixed CSV replaces {CSV_PATH}")
    else:
        print(f"\nRun with --replace to overwrite original (backup will be created)")


if __name__ == '__main__':
    main()

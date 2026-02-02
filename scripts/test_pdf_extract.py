#!/usr/bin/env python3
"""Test PDF extraction patterns."""
import re
from pathlib import Path

import pdfplumber

pdf_path = Path('lunaire-spa/CBX Answers/February2025CBXessayQsandAnswer.pdf')
print(f'Testing: {pdf_path}')

with pdfplumber.open(str(pdf_path)) as pdf:
    text_parts = []
    for page in pdf.pages:
        page_text = page.extract_text()
        if page_text:
            text_parts.append(page_text)
    text = '\n'.join(text_parts)

print(f'Total text length: {len(text)}')

# Test patterns
patterns = [
    r'QUESTION\s*(\d+)\s*[:\-]\s*SELECTED\s+ANSWER',
    r'(?:Answer(?:ed)?\s+(?:to\s+)?Question|Selected Answer(?:\s+to)?(?:\s+Question)?)\s*(\d+)',
]

for pattern in patterns:
    matches = list(re.finditer(pattern, text, re.IGNORECASE))
    print(f'\nPattern: {pattern[:50]}...')
    print(f'  Found {len(matches)} matches')
    for m in matches[:3]:
        print(f'    Question {m.group(1)} at pos {m.start()}')

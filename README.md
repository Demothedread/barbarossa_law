# Lawquizzer

Utilities for working with law-related quiz questions.

## Overview
This repository provides a simple script to convert a CSV file of questions
into a set of SQL statements. It does **not** include the actual question data.

The original CSV is expected to come from an external vector store and must
contain the following columns:

- Question ID
- Subject Topic
- Question Call
- Answer Choice A
- Answer Choice B
- Answer Choice C
- Answer Choice D
- Correct Answer
- Explanation

Duplicate questions (by text of `Question Call`) are ignored when exporting.

## Usage
```
python scripts/csv_to_sql.py path/to/qa.csv output.sql
```
The resulting `output.sql` can be executed in SQLite or a similar database.

## Limitations
Accessing the OpenAI vector stores referenced by ID is not possible from this
environment due to network restrictions. You will need to download `qa.csv`
and any additional files manually before running the script.

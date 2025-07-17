# LawQuizzer

A simple web-based quiz framework for reviewing law questions.

## Synopsis
LawQuizzer presents a configurable quiz with timers, navigation, answer elimination, text highlighting, and a post-quiz review that shows each question with correct answers and explanations.

## Prerequisites
- Node.js 20+

## Install
```bash
npm install
```

## Start
Serve the `src/` directory with any static server. For example:
```bash
npx serve src
```

## Deployment
Host the contents of `src/` on any static hosting service.

## FAQ
**Q:** How do I change questions?
**A:** Edit the question data inside `src/js/question-data.js`.

## Use Cases
- Quick review sessions for law exam preparation.
- Practicing timed multiple-choice questions.
- Tracking performance by topic with average time spent.

## End-to-End Tests
Run Jest unit tests with:
```bash
npm test
```

## CSV-toSQL Setup Overview
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


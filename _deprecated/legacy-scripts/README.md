# Law Quizzer Scripts

This directory contains utility scripts for the Law Quizzer application.

## Available Scripts

### assign_subtopics.py

This script analyzes questions in the `qa.csv` file and automatically assigns appropriate subtopics 
based on the categories in the `subtopicBreakdown.csv` file. It uses keyword matching and content analysis
to make the best guess about which subtopic a question belongs to.

#### Usage

```bash
# Run the script to process qa.csv and update it with subtopics
python scripts/assign_subtopics.py

# Make it executable first (if needed)
chmod +x scripts/assign_subtopics.py
./scripts/assign_subtopics.py
```

#### How It Works

1. The script reads both `qa.csv` and `subtopicBreakdown.csv` files
2. For each question in `qa.csv` that has a subject but no subtopic:
   - It analyzes the question text, choices, and explanations
   - It matches keywords related to subtopics for that subject
   - It assigns the most appropriate subtopic based on keyword frequency
3. The script outputs an updated CSV with subtopics assigned

### update_db_subtopics.py

This script updates the database with subtopic information from the qa.csv file. It first ensures that the subtopic column exists in the database, then updates the records based on the subtopics assigned in the CSV.

#### Usage

```bash
# Run the script to update the database with subtopics
python scripts/update_db_subtopics.py

# Make it executable first (if needed)
chmod +x scripts/update_db_subtopics.py
./scripts/update_db_subtopics.py
```

#### How It Works

1. The script checks if a subtopic column exists in the questions table and adds it if needed
2. It runs the assign_subtopics.py script to ensure the CSV file has subtopics assigned
3. It then reads the CSV and updates the corresponding database records

## Benefits of Subtopic Classification

- Enhances question categorization for better study analytics
- Enables more targeted practice on specific subtopics
- Improves study efficiency by identifying weak areas at a granular level
- Allows for more specific question selection based on subtopic performance
- Better aligns with the actual Bar Exam subject distribution
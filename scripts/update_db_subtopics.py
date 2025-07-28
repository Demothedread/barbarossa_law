#!/usr/bin/env python3
"""
Script to update the database with subtopics from qa.csv
"""

import csv
import os
import sqlite3
import sys
from pathlib import Path

# Make the script executable
os.chmod(__file__, 0o755)

# Add subtopic column to questions table if it doesn't exist
def add_subtopic_column():
    """Add a subtopic column to the questions table if it doesn't already exist"""
    conn = sqlite3.connect(str(DB_PATH))
    cursor = conn.cursor()
    
    # Check if subtopic column exists
    cursor.execute("PRAGMA table_info(questions)")
    columns = [col[1] for col in cursor.fetchall()]
    
    if 'subtopic' not in columns:
        print("Adding subtopic column to questions table...")
        cursor.execute("ALTER TABLE questions ADD COLUMN subtopic TEXT")
        print("Subtopic column added successfully.")
    else:
        print("Subtopic column already exists.")
    
    conn.commit()
    conn.close()

# Update database with subtopics from CSV
def update_subtopics_from_csv():
    """Update the database with subtopics from qa.csv"""
    # First, run the assign_subtopics script to ensure CSV has subtopics
    try:
        print("Processing subtopics in qa.csv...")
        from assign_subtopics import process_qa_csv
        qa_path = BASE_DIR / "qa.csv"
        subtopic_path = BASE_DIR / "subtopicBreakdown.csv"
        process_qa_csv(qa_path, subtopic_path)
    except Exception as e:
        print(f"Warning: Could not process subtopics in CSV: {e}")
        return
    
    conn = sqlite3.connect(str(DB_PATH))
    cursor = conn.cursor()
    
    # Read the updated CSV and update the database
    qa_path = BASE_DIR / "qa.csv"
    with open(qa_path, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        updated_count = 0
        
        for row in reader:
            if row.get('subtopic'):
                cursor.execute(
                    "UPDATE questions SET subtopic = ? WHERE idx = ?",
                    (row['subtopic'], row['idx'])
                )
                if cursor.rowcount > 0:
                    updated_count += 1
    
    conn.commit()
    conn.close()
    print(f"Updated {updated_count} questions with subtopics in the database.")

if __name__ == "__main__":
    BASE_DIR = Path(__file__).parent.parent
    DB_PATH = BASE_DIR / 'law_quiz.db'
    
    if not DB_PATH.exists():
        print(f"Error: Database file {DB_PATH} not found.")
        print("Please run initialize_db.py first to create the database.")
        sys.exit(1)
    
    # Add subtopic column if needed
    add_subtopic_column()
    
    # Update subtopics from CSV
    update_subtopics_from_csv()
    
    print("Database update completed successfully.")
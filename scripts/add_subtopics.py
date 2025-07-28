import csv

# Load subtopics from subtopicBreakdown.csv
with open('subtopicBreakdown.csv', newline='') as f:
    reader = csv.DictReader(f)
    subtopics = {row['Subject']: [row['Subtopic'] for row in reader if row['Subject'] == row['Subject']]}

# Example mapping function (replace with actual NLP or rules)
def assign_subtopic(question_text, subject):
    # Simple keyword-based mapping (expand as needed)
    mapping = {
        'Negligence': 'Negligence',
        'Hearsay': 'Hearsay and circumstances of its admissibility',
        'Venue': 'Jurisdiction and venue',
        # ...add more mappings...
    }
    for keyword, subtopic in mapping.items():
        if keyword.lower() in question_text.lower():
            return subtopic
    # Default to first subtopic for the subject if no match
    return subtopics[subject][0]

# Read qa.csv and write new file with Subtopic column
with open('qa.csv', newline='') as infile, open('qa_with_subtopics.csv', 'w', newline='') as outfile:
    reader = csv.DictReader(infile)
    fieldnames = reader.fieldnames[:2] + ['Subtopic'] + reader.fieldnames[2:]
    writer = csv.DictWriter(outfile, fieldnames=fieldnames)
    writer.writeheader()
    for row in reader:
        subject = row['topic']
        question_text = row['question']
        row['Subtopic'] = assign_subtopic(question_text, subject)
        writer.writerow(row)

from flask import Flask, request, jsonify
import sqlite3
import os
import random

DB_PATH = os.path.join(os.path.dirname(__file__), '..', 'law_quiz.db')

def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

app = Flask(__name__)

@app.route('/api/questions')
def api_questions():
    n = int(request.args.get('n', 10))
    subject = request.args.get('subject', '').strip()
    conn = get_db()
    cur = conn.cursor()
    if subject:
        rows = cur.execute('SELECT * FROM questions WHERE subject=?', (subject,)).fetchall()
    else:
        rows = cur.execute('SELECT * FROM questions').fetchall()
    total = len(rows)
    if n > total:
        n = total
    picked = random.sample(rows, n)
    questions = []
    for row in picked:
        questions.append({
            'id': row['id'],
            'subject': row['subject'],
            'prompt': row['prompt'],
            'question': row['question'],
            'choices': [row['choice_a'],row['choice_b'],row['choice_c'],row['choice_d']],
            'answer': row['answer'],
            'explanation': row['explanation']
        })
    return jsonify({'questions': questions, 'available': total})

@app.route('/api/subjects')
def api_subjects():
    conn = get_db()
    cur = conn.cursor()
    rows = cur.execute('SELECT DISTINCT subject FROM questions WHERE subject IS NOT NULL AND subject != ""').fetchall()
    subjects = sorted(row['subject'] for row in rows if row['subject'].strip())
    return jsonify({'subjects': subjects})

@app.route('/api/log', methods=['POST'])
def api_log():
    data = request.json
    # Append logs to a file (or you could store in DB table)
    logfile = os.path.join(os.path.dirname(__file__), '..', 'quiz_attempts_log.jsonl')
    with open(logfile, 'a', encoding='utf-8') as f:
        f.write(str(data)+'\n')
    return jsonify({'success': True})

if __name__ == '__main__':
    app.run(debug=True, port=5001)

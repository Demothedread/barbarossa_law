#!/usr/bin/env python3
"""
Law Quizzer Backend API Server
Provides REST endpoints for the web frontend
"""

import json
import random
import sqlite3
from datetime import datetime
from pathlib import Path

from flask import Flask, jsonify, request
from flask_cors import CORS

app = Flask(__name__)
CORS(app)  # Enable CORS for frontend requests

# Database path
DB_PATH = Path(__file__).parent.parent / 'law_quiz.db'

def get_db_connection():
    """Get database connection with proper setup"""
    conn = sqlite3.connect(str(DB_PATH))
    conn.row_factory = sqlite3.Row
    return conn

@app.route('/api/subjects', methods=['GET'])
def get_subjects():
    """Get all available subjects"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute('SELECT DISTINCT subject FROM questions WHERE subject IS NOT NULL ORDER BY subject')
        subjects = [row[0] for row in cursor.fetchall()]
        conn.close()
        return jsonify({'subjects': subjects})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/questions', methods=['GET'])
def get_questions():
    """Get random questions with optional subject filter"""
    try:
        n = int(request.args.get('n', 10))
        subject = request.args.get('subject', '')
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Build query based on subject filter
        if subject:
            query = 'SELECT * FROM questions WHERE subject = ?'
            cursor.execute(query, (subject,))
        else:
            query = 'SELECT * FROM questions'
            cursor.execute(query)
        
        all_questions = cursor.fetchall()
        conn.close()
        
        if not all_questions:
            return jsonify({'questions': [], 'available': 0})
        
        # Convert to list of dicts and add choices array
        questions_list = []
        for row in all_questions:
            question_dict = dict(row)
            question_dict['choices'] = [
                question_dict['choice_a'],
                question_dict['choice_b'], 
                question_dict['choice_c'],
                question_dict['choice_d']
            ]
            
            # Ensure gold_passage is available for the review screen
            if 'gold_passage' not in question_dict or not question_dict['gold_passage']:
                question_dict['gold_passage'] = "No explanation available for this question."
                
            questions_list.append(question_dict)
        
        # Randomly sample n questions
        selected_questions = random.sample(questions_list, min(n, len(questions_list)))
        
        return jsonify({
            'questions': selected_questions,
            'available': len(questions_list)
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/log', methods=['POST'])
def log_quiz_attempt():
    """Log a quiz attempt"""
    try:
        data = request.get_json()
        
        # For now, just return success
        # In a real app, you'd store this in a database
        return jsonify({'success': True})
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({'status': 'healthy', 'timestamp': datetime.now().isoformat()})

if __name__ == '__main__':
    print(f"Starting Law Quizzer API server...")
    print(f"Database path: {DB_PATH}")
    print(f"Database exists: {DB_PATH.exists()}")
    
    app.run(host='localhost', port=5001, debug=True)
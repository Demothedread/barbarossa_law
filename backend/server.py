#!/usr/bin/env python3
"""
Law Quizzer Backend API Server
Provides REST endpoints for the web frontend
"""

import asyncio
import json
import os
import random
import sqlite3
from datetime import datetime
from pathlib import Path

# Load environment variables
from dotenv import load_dotenv

load_dotenv(dotenv_path=Path(__file__).parent.parent / '.env-local')

# Import our AI explanation service and vector store service
from ai_explanations import AIExplainService, ensure_explanations_table
from flask import Flask, jsonify, request
from flask_cors import CORS
from vector_store_service_v2 import (VectorStoreServiceV2,
                                     extract_questions_from_vector_store_v2)

app = Flask(__name__)
CORS(app)  # Enable CORS for frontend requests

# Database path
DB_PATH = Path(__file__).parent / 'law_quiz.db'

# Initialize AI explanation service if API key is available
ai_service = None
vector_store_service = None
if os.environ.get("OPENAI_API_KEY"):
    # Ensure the explanations table exists
    ensure_explanations_table(DB_PATH)
    ai_service = AIExplainService(DB_PATH)
    
    # Initialize vector store service
    try:
        vector_store_service = VectorStoreServiceV2(DB_PATH)
        print("Vector store service v2 initialized successfully.")
    except Exception as e:
        print(f"WARNING: Could not initialize vector store service: {e}")
else:
    print("WARNING: OPENAI_API_KEY not set. AI explanations and vector store will not be available.")

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
    """Get random questions with optional subject and type filters"""
    try:
        n = int(request.args.get('n', 10))
        subject = request.args.get('subject', '')
        question_type = request.args.get('type', 'mix')  # 'generated', 'mbe', 'mix'
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Build query based on filters
        where_conditions = []
        params = []
        
        if subject:
            where_conditions.append('subject = ?')
            params.append(subject)
        
        # Filter by question type
        if question_type == 'generated':
            # Only generated questions (those with IDs starting with 'vs_' or marked as generated)
            where_conditions.append("(idx LIKE 'vs_%' OR generated = 1)")
        elif question_type == 'mbe':
            # Only original MBE questions (not generated)
            where_conditions.append("(idx NOT LIKE 'vs_%' AND (generated IS NULL OR generated = 0))")
        # For 'mix', we include all questions (no additional filter)
        
        if where_conditions:
            query = f'SELECT * FROM questions WHERE {" AND ".join(where_conditions)}'
            cursor.execute(query, params)
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
            
            # Mark if this is a generated question for UI display
            question_dict['is_generated'] = (
                question_dict['idx'].startswith('vs_') or 
                question_dict.get('generated', 0) == 1
            )
                
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

@app.route('/api/explanations', methods=['POST'])
async def get_ai_explanations():
    """Get AI-generated explanations for a list of question IDs"""
    try:
        if not ai_service:
            return jsonify({'error': 'AI explanations not available. Set OPENAI_API_KEY env variable'}), 500
        
        data = request.get_json()
        question_ids = data.get('question_ids', [])
        
        if not question_ids:
            return jsonify({'error': 'No question IDs provided'}), 400
        
        # Generate explanations asynchronously
        explanations = await ai_service.generate_explanations_for_quiz(question_ids)
        
        return jsonify({'explanations': explanations})
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/quiz-history', methods=['POST'])
def log_quiz_history():
    """Save quiz history with performance metrics"""
    try:
        data = request.get_json()
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Create quiz_history table if it doesn't exist
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS quiz_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id TEXT,
            subject TEXT,
            correct INTEGER,
            total INTEGER,
            duration_seconds INTEGER,
            questions_json TEXT,
            answers_json TEXT,
            negative_time BOOLEAN,
            created_at TEXT
        )
        """)
        
        # Insert quiz history
        cursor.execute("""
        INSERT INTO quiz_history (
            user_id, subject, correct, total, duration_seconds,
            questions_json, answers_json, negative_time, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            data.get('user_id', 'anonymous'),
            data.get('subject', ''),
            data.get('correct', 0),
            data.get('total', 0),
            data.get('duration_seconds', 0),
            json.dumps(data.get('questions', [])),
            json.dumps(data.get('answers', [])),
            data.get('negative_time', False),
            datetime.now().isoformat()
        ))
        
        conn.commit()
        conn.close()
        
        return jsonify({'success': True, 'id': cursor.lastrowid})
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/quiz-history', methods=['GET'])
def get_quiz_history():
    """Get quiz history with optional filters"""
    try:
        user_id = request.args.get('user_id', 'anonymous')
        subject = request.args.get('subject', '')
        limit = int(request.args.get('limit', 50))
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Check if table exists
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='quiz_history'")
        if not cursor.fetchone():
            return jsonify({'history': []})
        
        # Build query based on filters
        if subject:
            query = """
            SELECT * FROM quiz_history 
            WHERE user_id = ? AND subject = ?
            ORDER BY created_at DESC LIMIT ?
            """
            cursor.execute(query, (user_id, subject, limit))
        else:
            query = """
            SELECT * FROM quiz_history 
            WHERE user_id = ?
            ORDER BY created_at DESC LIMIT ?
            """
            cursor.execute(query, (user_id, limit))
        
        history = [dict(row) for row in cursor.fetchall()]
        
        # Calculate statistics
        stats = {
            'total_quizzes': len(history),
            'total_questions': sum(item['total'] for item in history),
            'total_correct': sum(item['correct'] for item in history),
            'avg_score': 0,
            'by_subject': {}
        }
        
        if stats['total_questions'] > 0:
            stats['avg_score'] = (stats['total_correct'] / stats['total_questions']) * 100
        
        # Group by subject
        for item in history:
            subject = item['subject'] or 'Unknown'
            if subject not in stats['by_subject']:
                stats['by_subject'][subject] = {
                    'quizzes': 0,
                    'questions': 0,
                    'correct': 0,
                    'avg_score': 0
                }
            
            subj_stats = stats['by_subject'][subject]
            subj_stats['quizzes'] += 1
            subj_stats['questions'] += item['total']
            subj_stats['correct'] += item['correct']
            
            if subj_stats['questions'] > 0:
                subj_stats['avg_score'] = (subj_stats['correct'] / subj_stats['questions']) * 100
        
        conn.close()
        
        return jsonify({
            'history': history,
            'stats': stats
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500
@app.route('/api/extract-questions', methods=['POST'])
async def extract_questions_from_vector_store_endpoint():
    """Extract questions from OpenAI vector store and add to database"""
    try:
        if not vector_store_service:
            return jsonify({'error': 'Vector store service not available. Set OPENAI_API_KEY env variable'}), 500
        
        data = request.get_json() or {}
        num_questions = data.get('num_questions', 10)
        
        if not isinstance(num_questions, int) or num_questions < 1 or num_questions > 50:
            return jsonify({'error': 'num_questions must be an integer between 1 and 50'}), 400
        
        # Extract questions asynchronously
        results = await vector_store_service.extract_and_save_questions(num_questions)
        
        return jsonify({
            'success': True,
            'message': f"Extracted {results['questions_extracted']} questions, saved {results['questions_saved']} to database",
            'results': results
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/vector-store/status', methods=['GET'])
def get_vector_store_status():
    """Get status of vector store connection"""
    try:
        if not vector_store_service:
            return jsonify({
                'available': False,
                'message': 'Vector store service not initialized. Check OPENAI_API_KEY.'
            })
        
        return jsonify({
            'available': True,
            'vector_store_id': vector_store_service.vector_store_id,
            'message': 'Vector store service is ready'
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


if __name__ == '__main__':
    print("Starting Law Quizzer Backend API Server...")
    print(f"Database path: {DB_PATH}")
    print(f"OpenAI API Key configured: {'Yes' if os.environ.get('OPENAI_API_KEY') else 'No'}")
    print(f"Vector store service available: {'Yes' if vector_store_service else 'No'}")
    print(f"AI explanations available: {'Yes' if ai_service else 'No'}")
    print("\nServer will be available at: http://localhost:5001/api")
    print("Health check endpoint: http://localhost:5001/api/health")
    print("\nPress Ctrl+C to stop the server\n")
    
    # Run the Flask development server
    app.run(
        host='0.0.0.0',  # Allow connections from any IP
        port=5001,       # Port 5001 as specified in the frontend
        debug=True,      # Enable debug mode for development
        use_reloader=False  # Disable reloader to avoid issues with async functions
    )

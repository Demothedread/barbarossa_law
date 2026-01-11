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
try:
    from dotenv import load_dotenv
    load_dotenv(dotenv_path=Path(__file__).parent.parent / '.env-local')
except ImportError:
    print("python-dotenv not available - using system environment variables")

# Import our AI explanation service and vector store service
from ai_explanations import (
    AIExplainService,
    ensure_explanations_table,
    migrate_explanations_table,
)
from auth import (authenticate_user, create_user, generate_jwt_token,
                  get_user_from_token, require_auth, update_user_preferences)
from essay_grader import EssayGraderService
from flask import Flask, g, jsonify, request
from flask_cors import CORS
from vector_store_service_v2 import (VectorStoreServiceV2,
                                     extract_questions_from_vector_store_v2)

app = Flask(__name__)
CORS(app)  # Enable CORS for frontend requests

# Database path
DB_PATH = Path(__file__).parent.parent / 'law_quiz.db'

# Initialized services
ai_service = None
essay_grader_service = None
vector_store_service = None

def initialize_services():
    """Initialize optional services and check configuration."""
    global ai_service, essay_grader_service, vector_store_service

    if not DB_PATH.exists():
        print(
            f"WARNING: Database not found at {DB_PATH}. Run scripts/initialize_db.py to create it."
        )
    else:
        print(f"Using database at {DB_PATH}")

    if os.environ.get("OPENAI_API_KEY"):
        ensure_explanations_table(DB_PATH)
        migrate_explanations_table(DB_PATH)
        ai_service = AIExplainService(DB_PATH)
        essay_grader_service = EssayGraderService()
        try:
            vector_store_service = VectorStoreServiceV2(DB_PATH)
            print("Vector store service v2 initialized successfully.")
        except Exception as e:
            print(f"WARNING: Could not initialize vector store service: {e}")
    else:
        print(
            "WARNING: OPENAI_API_KEY not set. AI explanations, essay grading, and vector store will not be available."
        )


initialize_services()

def get_db_connection():
    """Get database connection with proper setup"""
    conn = sqlite3.connect(str(DB_PATH))
    conn.row_factory = sqlite3.Row
    return conn

def ensure_quiz_attempt_logs_table(cursor):
    """Ensure quiz attempt logs table exists. Schema migrations are handled by initialize_db.py."""
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS quiz_attempt_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT,
        question_id TEXT,
        selected_answer TEXT,
        correct_answer TEXT,
        is_correct INTEGER,
        subject TEXT,
        subtopic TEXT,
        mode TEXT,
        elapsed_seconds REAL,
        payload_json TEXT,
        created_at TEXT
    )
    """)

def normalize_quiz_attempt_payload(data):
    """Validate and normalize quiz attempt payload."""
    if not isinstance(data, dict):
        return None, ["Payload must be a JSON object."]

    question_id = data.get("question_id")
    if question_id is None:
        question_id = data.get("idx")

    selected_answer = data.get("selected_answer")
    if selected_answer is None:
        selected_answer = data.get("answer")
    correct_answer = data.get("correct_answer")
    is_correct = data.get("is_correct")
    elapsed_seconds = data.get("elapsed_seconds", data.get("time_spent_seconds"))

    errors = []
    if not question_id:
        errors.append("question_id is required.")
    if not selected_answer:
        errors.append("selected_answer is required.")

    if is_correct is None and correct_answer is None:
        errors.append("is_correct or correct_answer is required.")

    if elapsed_seconds is not None and not isinstance(elapsed_seconds, (int, float)):
        errors.append("elapsed_seconds must be a number when provided.")

    if errors:
        return None, errors

    computed_is_correct = is_correct
    if computed_is_correct is None and correct_answer is not None:
        computed_is_correct = selected_answer == correct_answer

    normalized = {
        "user_id": data.get("user_id", "anonymous"),
        "question_id": question_id,
        "selected_answer": selected_answer,
        "correct_answer": correct_answer,
        "is_correct": int(bool(computed_is_correct)),
        "subject": data.get("subject"),
        "subtopic": data.get("subtopic"),
        "mode": data.get("mode"),
        "elapsed_seconds": elapsed_seconds,
        "payload_json": json.dumps(data),
        "created_at": datetime.now().isoformat(),
    }
    return normalized, []

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
        subtopic = request.args.get('subtopic', '')
        question_type = request.args.get('type', 'mix')  # 'generated', 'mbe', 'mix'
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Build query based on filters
        where_conditions = []
        params = []
        
        if subject:
            where_conditions.append('subject = ?')
            params.append(subject)
        
        if subtopic:
            where_conditions.append('subtopic = ?')
            params.append(subtopic)
        
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
        if data is None:
            return jsonify({'error': 'Request body is required'}), 400
        normalized, errors = normalize_quiz_attempt_payload(data)
        if errors:
            return jsonify({'error': 'Invalid attempt data', 'details': errors}), 400

        conn = get_db_connection()
        cursor = conn.cursor()
        ensure_quiz_attempt_logs_table(cursor)

        cursor.execute("""
        INSERT INTO quiz_attempt_logs (
            user_id, question_id, selected_answer, correct_answer, is_correct,
            subject, subtopic, mode, elapsed_seconds, payload_json, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            normalized["user_id"],
            normalized["question_id"],
            normalized["selected_answer"],
            normalized["correct_answer"],
            normalized["is_correct"],
            normalized["subject"],
            normalized["subtopic"],
            normalized["mode"],
            normalized["elapsed_seconds"],
            normalized["payload_json"],
            normalized["created_at"],
        ))

        conn.commit()
        inserted_id = cursor.lastrowid
        conn.close()

        return jsonify({'success': True, 'id': inserted_id})

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({'status': 'healthy', 'timestamp': datetime.now().isoformat()})


@app.route('/api/config', methods=['GET'])
def config_check():
    """Return basic configuration status"""
    return jsonify({
        'database_exists': DB_PATH.exists(),
        'openai_configured': bool(os.environ.get('OPENAI_API_KEY')),
    })

@app.route('/api/explanations', methods=['POST'])
async def get_ai_explanations():
    """Get AI-generated explanations for a list of question IDs in new format"""
    try:
        if not ai_service:
            return jsonify({'error': 'AI explanations not available. Set OPENAI_API_KEY env variable'}), 500
        
        data = request.get_json()
        question_ids = data.get('question_ids', [])
        
        if not question_ids:
            return jsonify({'error': 'No question IDs provided'}), 400
        
        # Generate explanations asynchronously and transform to new format
        explanations = await ai_service.generate_explanations_for_quiz(question_ids)
        
        # Transform to new schema format
        transformed_explanations = {}
        for question_id, explanation_data in explanations.items():
            if 'explanations' in explanation_data:
                # New format: map explanations to individual choice columns
                transformed_explanations[question_id] = {
                    'correct_answer': explanation_data.get('correct_answer', ''),
                    'choice_a_explanation': explanation_data['explanations'].get('A', ''),
                    'choice_b_explanation': explanation_data['explanations'].get('B', ''),
                    'choice_c_explanation': explanation_data['explanations'].get('C', ''),
                    'choice_d_explanation': explanation_data['explanations'].get('D', ''),
                    'subtopic': explanation_data.get('subtopic', '')
                }
            else:
                # Fallback for old format
                transformed_explanations[question_id] = {
                    'correct_answer': '',
                    'choice_a_explanation': 'Explanation format error - please regenerate.',
                    'choice_b_explanation': 'Explanation format error - please regenerate.',
                    'choice_c_explanation': 'Explanation format error - please regenerate.',
                    'choice_d_explanation': 'Explanation format error - please regenerate.',
                    'subtopic': explanation_data.get('subtopic', '')
                }
        
        return jsonify({'explanations': transformed_explanations})
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/essay-grade', methods=['POST'])
async def grade_essay_response():
    """Grade a user-submitted essay response with precedent-based scoring."""
    try:
        if not essay_grader_service:
            return jsonify({'error': 'Essay grading not available. Set OPENAI_API_KEY env variable'}), 500

        data = request.get_json() or {}
        question_text = data.get('question', '').strip()
        answer_text = data.get('answer', '').strip()
        max_points = data.get('max_points')

        if not question_text or not answer_text:
            return jsonify({'error': 'Question and answer are required'}), 400

        if max_points is not None:
            try:
                max_points = int(max_points)
            except (TypeError, ValueError):
                return jsonify({'error': 'max_points must be an integer'}), 400

            # Enforce a reasonable range for max_points to prevent abuse via direct API calls
            if max_points <= 0 or max_points > 500:
                return jsonify({'error': 'max_points must be between 1 and 500'}), 400
        result = await essay_grader_service.grade_essay(question_text, answer_text, max_points)
        return jsonify({'success': True, 'grade': result})

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/quiz-history', methods=['POST'])
def log_quiz_history():
    """Save quiz history with comprehensive performance metrics"""
    try:
        data = request.get_json()
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Create enhanced quiz_history table
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS quiz_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id TEXT,
            subject TEXT,
            subtopic TEXT,
            correct INTEGER,
            total INTEGER,
            duration_seconds INTEGER,
            questions_json TEXT,
            answers_json TEXT,
            time_per_question_json TEXT,
            question_difficulties_json TEXT,
            mode TEXT,
            negative_time BOOLEAN,
            streak_correct INTEGER DEFAULT 0,
            streak_total INTEGER DEFAULT 0,
            avg_time_per_question REAL,
            accuracy_percentage REAL,
            created_at TEXT
        )
        """)
        
        # Calculate enhanced metrics
        questions = data.get('questions', [])
        answers = data.get('answers', [])
        time_per_question = data.get('time_per_question', [])
        mode = data.get('mode', 'classic')
        
        # Calculate accuracy percentage
        accuracy = (data.get('correct', 0) / max(data.get('total', 1), 1)) * 100
        
        # Calculate average time per question
        avg_time = data.get('duration_seconds', 0) / max(data.get('total', 1), 1)
        
        # Calculate current streak (consecutive correct answers)
        streak_correct = 0
        streak_total = 0
        if answers:
            for i in range(len(answers) - 1, -1, -1):
                streak_total += 1
                if answers[i] is not None and i < len(questions):
                    # Check if answer is correct (simplified check)
                    if streak_correct == streak_total - 1:  # Still in streak
                        streak_correct += 1
                    else:
                        break
                else:
                    break
        
        # Extract subtopic from first question if available
        subtopic = data.get('subtopic', '')
        if not subtopic and questions:
            # Try to get subtopic from question data
            subtopic = questions[0].get('subtopic', '') if isinstance(questions[0], dict) else ''
        
        # Insert enhanced quiz history
        cursor.execute("""
        INSERT INTO quiz_history (
            user_id, subject, subtopic, correct, total, duration_seconds,
            questions_json, answers_json, time_per_question_json,
            question_difficulties_json, mode, negative_time, streak_correct,
            streak_total, avg_time_per_question, accuracy_percentage, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            data.get('user_id', 'anonymous'),
            data.get('subject', ''),
            subtopic,
            data.get('correct', 0),
            data.get('total', 0),
            data.get('duration_seconds', 0),
            json.dumps(questions),
            json.dumps(answers),
            json.dumps(time_per_question),
            json.dumps(data.get('question_difficulties', [])),
            mode,
            data.get('negative_time', False),
            streak_correct,
            streak_total,
            avg_time,
            accuracy,
            datetime.now().isoformat()
        ))
        
        conn.commit()
        conn.close()
        
        return jsonify({'success': True, 'id': cursor.lastrowid})
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/quiz-history', methods=['GET'])
def get_quiz_history():
    """Get quiz history with comprehensive statistics"""
    try:
        user_id = request.args.get('user_id', 'anonymous')
        subject = request.args.get('subject', '')
        mode = request.args.get('mode', '')
        limit = int(request.args.get('limit', 50))
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Check if table exists
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='quiz_history'")
        if not cursor.fetchone():
            return jsonify({'history': [], 'stats': {}, 'analytics': {}})
        
        # Build query based on filters
        query_params = [user_id]
        where_clauses = ["user_id = ?"]
        
        if subject:
            where_clauses.append("subject = ?")
            query_params.append(subject)
        
        if mode:
            where_clauses.append("mode = ?")
            query_params.append(mode)
        
        query = f"""
        SELECT * FROM quiz_history
        WHERE {' AND '.join(where_clauses)}
        ORDER BY created_at DESC LIMIT ?
        """
        query_params.append(str(limit))
        
        cursor.execute(query, query_params)
        history = [dict(row) for row in cursor.fetchall()]
        
        # Calculate comprehensive statistics
        stats = calculate_comprehensive_stats(history)
        
        # Calculate advanced analytics
        analytics = calculate_advanced_analytics(history, cursor, user_id)
        
        conn.close()
        
        return jsonify({
            'history': history,
            'stats': stats,
            'analytics': analytics
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

def calculate_comprehensive_stats(history):
    """Calculate comprehensive statistics from quiz history"""
    if not history:
        return {
            'total_quizzes': 0,
            'total_questions': 0,
            'total_correct': 0,
            'avg_score': 0,
            'avg_time_per_question': 0,
            'by_subject': {},
            'by_mode': {},
            'by_subtopic': {},
            'recent_performance': []
        }
    
    stats = {
        'total_quizzes': len(history),
        'total_questions': sum(item['total'] for item in history),
        'total_correct': sum(item['correct'] for item in history),
        'total_time': sum(item.get('duration_seconds', 0) for item in history),
        'avg_score': 0,
        'avg_time_per_question': 0,
        'by_subject': {},
        'by_mode': {},
        'by_subtopic': {},
        'recent_performance': []
    }
    
    if stats['total_questions'] > 0:
        stats['avg_score'] = (stats['total_correct'] / stats['total_questions']) * 100
        stats['avg_time_per_question'] = stats['total_time'] / stats['total_questions']
    
    # Group by subject
    for item in history:
        subject = item.get('subject') or 'Unknown'
        if subject not in stats['by_subject']:
            stats['by_subject'][subject] = {
                'quizzes': 0,
                'questions': 0,
                'correct': 0,
                'avg_score': 0,
                'total_time': 0,
                'avg_time_per_question': 0
            }
        
        subj_stats = stats['by_subject'][subject]
        subj_stats['quizzes'] += 1
        subj_stats['questions'] += item['total']
        subj_stats['correct'] += item['correct']
        subj_stats['total_time'] += item.get('duration_seconds', 0)
        
        if subj_stats['questions'] > 0:
            subj_stats['avg_score'] = (subj_stats['correct'] / subj_stats['questions']) * 100
            subj_stats['avg_time_per_question'] = subj_stats['total_time'] / subj_stats['questions']
    
    # Group by mode
    for item in history:
        mode = item.get('mode', 'classic')
        if mode not in stats['by_mode']:
            stats['by_mode'][mode] = {
                'quizzes': 0,
                'questions': 0,
                'correct': 0,
                'avg_score': 0,
                'total_time': 0,
                'avg_time_per_question': 0
            }
        
        mode_stats = stats['by_mode'][mode]
        mode_stats['quizzes'] += 1
        mode_stats['questions'] += item['total']
        mode_stats['correct'] += item['correct']
        mode_stats['total_time'] += item.get('duration_seconds', 0)
        
        if mode_stats['questions'] > 0:
            mode_stats['avg_score'] = (mode_stats['correct'] / mode_stats['questions']) * 100
            mode_stats['avg_time_per_question'] = mode_stats['total_time'] / mode_stats['questions']
    
    # Group by subtopic
    for item in history:
        subtopic = item.get('subtopic')
        if subtopic:
            if subtopic not in stats['by_subtopic']:
                stats['by_subtopic'][subtopic] = {
                    'quizzes': 0,
                    'questions': 0,
                    'correct': 0,
                    'avg_score': 0,
                    'total_time': 0,
                    'avg_time_per_question': 0,
                    'subject': item.get('subject', 'Unknown')
                }
            
            subtopic_stats = stats['by_subtopic'][subtopic]
            subtopic_stats['quizzes'] += 1
            subtopic_stats['questions'] += item['total']
            subtopic_stats['correct'] += item['correct']
            subtopic_stats['total_time'] += item.get('duration_seconds', 0)
            
            if subtopic_stats['questions'] > 0:
                subtopic_stats['avg_score'] = (subtopic_stats['correct'] / subtopic_stats['questions']) * 100
                subtopic_stats['avg_time_per_question'] = subtopic_stats['total_time'] / subtopic_stats['questions']
    
    # Recent performance (last 10 quizzes)
    recent_history = history[:10]
    for quiz in recent_history:
        stats['recent_performance'].append({
            'date': quiz.get('created_at'),
            'score': (quiz['correct'] / max(quiz['total'], 1)) * 100,
            'subject': quiz.get('subject', 'Unknown'),
            'mode': quiz.get('mode', 'classic'),
            'duration': quiz.get('duration_seconds', 0),
            'questions': quiz['total']
        })
    
    return stats

def calculate_advanced_analytics(history, cursor, user_id):
    """Calculate advanced analytics including streaks, learning curves, and improvement metrics"""
    if not history:
        return {
            'current_streak': 0,
            'longest_streak': 0,
            'learning_curve': [],
            'weak_areas': [],
            'improvement_trend': 0,
            'study_time_total': 0,
            'goal_progress': 0
        }
    
    analytics = {
        'current_streak': 0,
        'longest_streak': 0,
        'learning_curve': [],
        'weak_areas': [],
        'improvement_trend': 0,
        'study_time_total': sum(item.get('duration_seconds', 0) for item in history),
        'goal_progress': 0
    }
    
    # Calculate current and longest streaks
    current_streak = 0
    longest_streak = 0
    temp_streak = 0
    
    # Sort by date to get chronological order
    sorted_history = sorted(history, key=lambda x: x.get('created_at', ''))
    
    for quiz in sorted_history:
        accuracy = (quiz['correct'] / max(quiz['total'], 1)) * 100
        if accuracy >= 65:  # Passing score
            temp_streak += 1
            current_streak = temp_streak
        else:
            temp_streak = 0
        longest_streak = max(longest_streak, temp_streak)
    
    # If the most recent quiz wasn't passing, current streak is 0
    if sorted_history:
        latest_quiz = sorted_history[-1]
        latest_accuracy = (latest_quiz['correct'] / max(latest_quiz['total'], 1)) * 100
        if latest_accuracy < 65:
            current_streak = 0
    
    analytics['current_streak'] = current_streak
    analytics['longest_streak'] = longest_streak
    
    # Learning curve (performance over time)
    if len(sorted_history) >= 3:
        # Group by week or month for learning curve
        learning_points = []
        for i, quiz in enumerate(sorted_history):
            accuracy = (quiz['correct'] / max(quiz['total'], 1)) * 100
            learning_points.append({
                'quiz_number': i + 1,
                'accuracy': accuracy,
                'date': quiz.get('created_at'),
                'avg_time': quiz.get('avg_time_per_question', 0)
            })
        analytics['learning_curve'] = learning_points[-20:]  # Last 20 data points
    
    # Identify weak areas (subjects/subtopics with <65% accuracy)
    weak_areas = []
    
    # Group by subject to find weak subjects
    subject_performance = {}
    for quiz in history:
        subject = quiz.get('subject', 'Unknown')
        if subject not in subject_performance:
            subject_performance[subject] = {'correct': 0, 'total': 0}
        subject_performance[subject]['correct'] += quiz['correct']
        subject_performance[subject]['total'] += quiz['total']
    
    for subject, perf in subject_performance.items():
        if perf['total'] > 0:
            accuracy = (perf['correct'] / perf['total']) * 100
            if accuracy < 65:
                weak_areas.append({
                    'type': 'subject',
                    'name': subject,
                    'accuracy': accuracy,
                    'questions_attempted': perf['total'],
                    'priority': 'high' if accuracy < 50 else 'medium'
                })
    
    # Group by subtopic to find weak subtopics
    subtopic_performance = {}
    for quiz in history:
        subtopic = quiz.get('subtopic')
        if subtopic:
            if subtopic not in subtopic_performance:
                subtopic_performance[subtopic] = {'correct': 0, 'total': 0, 'subject': quiz.get('subject', 'Unknown')}
            subtopic_performance[subtopic]['correct'] += quiz['correct']
            subtopic_performance[subtopic]['total'] += quiz['total']
    
    for subtopic, perf in subtopic_performance.items():
        if perf['total'] > 0:
            accuracy = (perf['correct'] / perf['total']) * 100
            if accuracy < 65:
                weak_areas.append({
                    'type': 'subtopic',
                    'name': subtopic,
                    'subject': perf['subject'],
                    'accuracy': accuracy,
                    'questions_attempted': perf['total'],
                    'priority': 'high' if accuracy < 50 else 'medium'
                })
    
    # Sort weak areas by priority and accuracy
    weak_areas.sort(key=lambda x: (x['priority'] == 'high', -x['accuracy']))
    analytics['weak_areas'] = weak_areas[:10]  # Top 10 weak areas
    
    # Calculate improvement trend (compare first half vs second half of history)
    if len(history) >= 6:
        mid_point = len(history) // 2
        first_half = history[-mid_point:]  # Older quizzes (chronologically first)
        second_half = history[:mid_point]  # Newer quizzes (chronologically second)
        
        first_half_avg = sum((q['correct'] / max(q['total'], 1)) * 100 for q in first_half) / len(first_half)
        second_half_avg = sum((q['correct'] / max(q['total'], 1)) * 100 for q in second_half) / len(second_half)
        
        analytics['improvement_trend'] = second_half_avg - first_half_avg
    
    # Goal progress (percentage toward 65% overall accuracy)
    overall_accuracy = sum(q['correct'] for q in history) / max(sum(q['total'] for q in history), 1) * 100
    analytics['goal_progress'] = min(overall_accuracy / 65 * 100, 100)
    
    return analytics
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

@app.route('/api/subtopics', methods=['GET'])
def get_subtopics():
    
    """Get all available subtopics, optionally filtered by subject"""
    try:
        subject = request.args.get('subject', '')
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        if subject:
            cursor.execute("SELECT DISTINCT subtopic FROM questions WHERE subject = ? AND subtopic IS NOT NULL", (subject,))
        else:
            cursor.execute("SELECT DISTINCT subtopic FROM questions WHERE subtopic IS NOT NULL")
        
        subtopics = [row[0] for row in cursor.fetchall()]
        conn.close()
        
        return jsonify(subtopics)
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/subtopic-stats', methods=['GET'])
def get_subtopic_stats():
    """Get performance statistics broken down by subtopic with actual performance data"""
    try:
        user_id = request.args.get('user_id', 'anonymous')
        subject = request.args.get('subject', '')
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Get subtopic performance from quiz history
        if subject:
            query = """
            SELECT subtopic, subject,
                   SUM(total) as total_questions,
                   SUM(correct) as correct_answers,
                   AVG(accuracy_percentage) as avg_accuracy,
                   AVG(avg_time_per_question) as avg_time,
                   COUNT(*) as quiz_count
            FROM quiz_history
            WHERE user_id = ? AND subject = ? AND subtopic IS NOT NULL AND subtopic != ''
            GROUP BY subtopic, subject
            ORDER BY subtopic
            """
            cursor.execute(query, (user_id, subject))
        else:
            query = """
            SELECT subtopic, subject,
                   SUM(total) as total_questions,
                   SUM(correct) as correct_answers,
                   AVG(accuracy_percentage) as avg_accuracy,
                   AVG(avg_time_per_question) as avg_time,
                   COUNT(*) as quiz_count
            FROM quiz_history
            WHERE user_id = ? AND subtopic IS NOT NULL AND subtopic != ''
            GROUP BY subtopic, subject
            ORDER BY subject, subtopic
            """
            cursor.execute(query, (user_id,))
        
        subtopic_stats = []
        for row in cursor.fetchall():
            subtopic, subject_name, total_questions, correct_answers, avg_accuracy, avg_time, quiz_count = row
            
            # Calculate actual accuracy percentage
            accuracy_percent = (correct_answers / max(total_questions, 1)) * 100 if total_questions > 0 else 0
            
            subtopic_stats.append({
                'subtopic': subtopic,
                'subject': subject_name,
                'total_questions': total_questions or 0,
                'correct_answers': correct_answers or 0,
                'accuracy_percent': round(accuracy_percent, 1),
                'avg_time_per_question': round(avg_time or 0, 1),
                'quiz_count': quiz_count or 0,
                'needs_practice': accuracy_percent < 65
            })
        
        conn.close()
        
        # For frontend compatibility, also return a flat subtopics array
        subtopics_flat = [item['subtopic'] for item in subtopic_stats]
        return jsonify({
            'subtopic_stats': subtopic_stats,
            'subtopics': subtopics_flat,
            'total_subtopics': len(subtopic_stats)
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/analytics/advanced', methods=['GET'])
def get_advanced_analytics():
    """Get advanced analytics including learning trends, predictions, and insights"""
    try:
        user_id = request.args.get('user_id', 'anonymous')
        days = int(request.args.get('days', 30))  # Default to last 30 days
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Get quiz history for the specified period
        query = """
        SELECT * FROM quiz_history
        WHERE user_id = ? AND created_at >= datetime('now', '-{} days')
        ORDER BY created_at ASC
        """.format(days)
        cursor.execute(query, (user_id,))
        recent_history = [dict(row) for row in cursor.fetchall()]
        
        # Get all-time history for comparison
        cursor.execute("SELECT * FROM quiz_history WHERE user_id = ? ORDER BY created_at ASC", (user_id,))
        all_history = [dict(row) for row in cursor.fetchall()]
        
        analytics = {
            'period_days': days,
            'recent_performance': calculate_performance_metrics(recent_history),
            'all_time_performance': calculate_performance_metrics(all_history),
            'learning_velocity': calculate_learning_velocity(all_history),
            'study_patterns': calculate_study_patterns(recent_history),
            'predictions': calculate_predictions(all_history),
            'recommendations': generate_study_recommendations(all_history)
        }
        
        conn.close()
        return jsonify(analytics)
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/statistics/export', methods=['GET'])
def export_statistics():
    """Export comprehensive statistics in various formats"""
    try:
        user_id = request.args.get('user_id', 'anonymous')
        format_type = request.args.get('format', 'json')  # json, csv
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Get comprehensive data
        cursor.execute("SELECT * FROM quiz_history WHERE user_id = ? ORDER BY created_at DESC", (user_id,))
        history = [dict(row) for row in cursor.fetchall()]
        
        stats = calculate_comprehensive_stats(history)
        analytics = calculate_advanced_analytics(history, cursor, user_id)
        
        export_data = {
            'user_id': user_id,
            'export_date': datetime.now().isoformat(),
            'summary': {
                'total_quizzes': stats['total_quizzes'],
                'total_questions': stats['total_questions'],
                'overall_accuracy': stats['avg_score'],
                'total_study_time_hours': stats.get('total_time', 0) / 3600,
                'current_streak': analytics['current_streak'],
                'goal_progress': analytics['goal_progress']
            },
            'detailed_stats': stats,
            'analytics': analytics,
            'quiz_history': history
        }
        
        conn.close()
        
        if format_type == 'csv':
            # Convert to CSV format for download
            import csv
            import io
            
            output = io.StringIO()
            
            # Write summary stats
            writer = csv.writer(output)
            writer.writerow(['Metric', 'Value'])
            writer.writerow(['Total Quizzes', export_data['summary']['total_quizzes']])
            writer.writerow(['Total Questions', export_data['summary']['total_questions']])
            writer.writerow(['Overall Accuracy (%)', round(export_data['summary']['overall_accuracy'], 1)])
            writer.writerow(['Study Time (Hours)', round(export_data['summary']['total_study_time_hours'], 1)])
            writer.writerow(['Current Streak', export_data['summary']['current_streak']])
            writer.writerow(['Goal Progress (%)', round(export_data['summary']['goal_progress'], 1)])
            writer.writerow([])
            
            # Write quiz history
            writer.writerow(['Date', 'Subject', 'Mode', 'Score (%)', 'Questions', 'Time (min)'])
            for quiz in history:
                score = (quiz['correct'] / max(quiz['total'], 1)) * 100
                time_min = quiz.get('duration_seconds', 0) / 60
                writer.writerow([
                    quiz.get('created_at', ''),
                    quiz.get('subject', ''),
                    quiz.get('mode', 'classic'),
                    round(score, 1),
                    quiz['total'],
                    round(time_min, 1)
                ])
            
            csv_content = output.getvalue()
            output.close()
            
            from flask import make_response
            response = make_response(csv_content)
            response.headers['Content-Type'] = 'text/csv'
            response.headers['Content-Disposition'] = f'attachment; filename=quiz_stats_{user_id}_{datetime.now().strftime("%Y%m%d")}.csv'
            return response
        
        return jsonify(export_data)
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

def calculate_performance_metrics(history):
    """Calculate performance metrics for a given history period"""
    if not history:
        return {'accuracy': 0, 'total_questions': 0, 'avg_time': 0, 'quiz_count': 0}
    
    total_correct = sum(q['correct'] for q in history)
    total_questions = sum(q['total'] for q in history)
    total_time = sum(q.get('duration_seconds', 0) for q in history)
    
    return {
        'accuracy': (total_correct / max(total_questions, 1)) * 100,
        'total_questions': total_questions,
        'avg_time_per_question': total_time / max(total_questions, 1),
        'quiz_count': len(history),
        'study_time_hours': total_time / 3600
    }

def calculate_learning_velocity(history):
    """Calculate how quickly the user is improving"""
    if len(history) < 4:
        return {'trend': 'insufficient_data', 'rate': 0}
    
    # Split into quarters and compare improvement
    quarter_size = len(history) // 4
    quarters = [
        history[:quarter_size],
        history[quarter_size:quarter_size*2],
        history[quarter_size*2:quarter_size*3],
        history[quarter_size*3:]
    ]
    
    quarter_accuracies = []
    for quarter in quarters:
        if quarter:
            total_correct = sum(q['correct'] for q in quarter)
            total_questions = sum(q['total'] for q in quarter)
            accuracy = (total_correct / max(total_questions, 1)) * 100
            quarter_accuracies.append(accuracy)
    
    if len(quarter_accuracies) >= 2:
        improvement = quarter_accuracies[-1] - quarter_accuracies[0]
        if improvement > 10:
            trend = 'rapid_improvement'
        elif improvement > 5:
            trend = 'steady_improvement'
        elif improvement > -5:
            trend = 'stable'
        else:
            trend = 'declining'
        
        return {'trend': trend, 'rate': improvement, 'quarterly_scores': quarter_accuracies}
    
    return {'trend': 'insufficient_data', 'rate': 0}

def calculate_study_patterns(history):
    """Analyze study patterns and habits"""
    if not history:
        return {}
    
    import json
    from datetime import datetime
    
    patterns = {
        'sessions_per_week': 0,
        'avg_session_length': 0,
        'preferred_times': [],
        'consistency_score': 0
    }
    
    # Calculate sessions per week (approximate)
    if history:
        date_range = (datetime.fromisoformat(history[-1]['created_at']) -
                     datetime.fromisoformat(history[0]['created_at'])).days
        weeks = max(date_range / 7, 1)
        patterns['sessions_per_week'] = len(history) / weeks
    
    # Calculate average session length
    total_time = sum(q.get('duration_seconds', 0) for q in history)
    patterns['avg_session_length'] = total_time / max(len(history), 1) / 60  # minutes
    
    return patterns

def calculate_predictions(history):
    """Generate predictions about future performance"""
    if len(history) < 5:
        return {'confidence': 'low', 'predictions': []}
    
    # Simple linear regression on recent performance
    recent = history[-10:] if len(history) >= 10 else history
    accuracies = [(q['correct'] / max(q['total'], 1)) * 100 for q in recent]
    
    if len(accuracies) >= 3:
        # Calculate trend
        x_vals = list(range(len(accuracies)))
        y_vals = accuracies
        
        # Simple linear regression
        n = len(x_vals)
        sum_x = sum(x_vals)
        sum_y = sum(y_vals)
        sum_xy = sum(x * y for x, y in zip(x_vals, y_vals))
        sum_x2 = sum(x * x for x in x_vals)
        
        slope = (n * sum_xy - sum_x * sum_y) / (n * sum_x2 - sum_x * sum_x)
        
        predictions = {
            'trend_direction': 'improving' if slope > 0 else 'declining' if slope < 0 else 'stable',
            'predicted_next_score': max(0, min(100, y_vals[-1] + slope)),
            'confidence': 'medium' if len(recent) >= 7 else 'low'
        }
        
        return predictions
    
    return {'confidence': 'low', 'predictions': []}

def generate_study_recommendations(history):
    """Generate personalized study recommendations"""
    if not history:
        return []
    
    recommendations = []
    
    # Calculate subject performance
    subject_performance = {}
    for quiz in history:
        subject = quiz.get('subject', 'Unknown')
        if subject not in subject_performance:
            subject_performance[subject] = {'correct': 0, 'total': 0}
        subject_performance[subject]['correct'] += quiz['correct']
        subject_performance[subject]['total'] += quiz['total']
    
    # Find subjects that need work
    for subject, perf in subject_performance.items():
        if perf['total'] > 0:
            accuracy = (perf['correct'] / perf['total']) * 100
            if accuracy < 60:
                recommendations.append({
                    'type': 'subject_focus',
                    'priority': 'high',
                    'message': f'Focus on {subject} - current accuracy is {accuracy:.1f}%',
                    'action': f'Practice more {subject} questions'
                })
            elif accuracy < 70:
                recommendations.append({
                    'type': 'subject_review',
                    'priority': 'medium',
                    'message': f'Review {subject} concepts - accuracy is {accuracy:.1f}%',
                    'action': f'Review {subject} explanations and take practice quizzes'
                })
    
    # Check study frequency
    if len(history) > 0:
        from datetime import datetime, timedelta
        last_quiz = datetime.fromisoformat(history[0]['created_at'])
        days_since = (datetime.now() - last_quiz).days
        
        if days_since > 7:
            recommendations.append({
                'type': 'study_frequency',
                'priority': 'high',
                'message': f'It\'s been {days_since} days since your last quiz',
                'action': 'Take a practice quiz to maintain your progress'
            })
        elif days_since > 3:
            recommendations.append({
                'type': 'study_frequency',
                'priority': 'medium',
                'message': 'Regular practice helps maintain performance',
                'action': 'Consider taking a quiz today'
            })
    
    return recommendations[:5]  # Return top 5 recommendations

@app.route('/api/explanations/store', methods=['POST'])
def store_ai_explanations():
    """Store AI explanations in the database with new schema"""
    try:
        if not ai_service:
            return jsonify({'error': 'AI explanations not available. Set OPENAI_API_KEY env variable'}), 500
        
        data = request.get_json()
        explanations_data = data.get('explanations', {})
        
        if not explanations_data:
            return jsonify({'error': 'No explanations data provided'}), 400
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        stored_count = 0
        for question_id, explanation_obj in explanations_data.items():
            try:
                # Extract data from the explanation object
                correct_answer = explanation_obj.get('correct_answer', '')
                choice_a_explanation = explanation_obj.get('choice_a_explanation', '')
                choice_b_explanation = explanation_obj.get('choice_b_explanation', '')
                choice_c_explanation = explanation_obj.get('choice_c_explanation', '')
                choice_d_explanation = explanation_obj.get('choice_d_explanation', '')
                subtopic = explanation_obj.get('subtopic', '')
                
                # Store the complete AI explanation as JSON for backwards compatibility
                ai_explanation_json = json.dumps(explanation_obj)
                
                # Insert/update in database
                cursor.execute('''
                INSERT INTO question_explanations (
                    question_id, correct_answer, choice_a_explanation, choice_b_explanation,
                    choice_c_explanation, choice_d_explanation, subtopic, ai_explanation,
                    created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT(question_id) DO UPDATE SET
                    correct_answer = excluded.correct_answer,
                    choice_a_explanation = excluded.choice_a_explanation,
                    choice_b_explanation = excluded.choice_b_explanation,
                    choice_c_explanation = excluded.choice_c_explanation,
                    choice_d_explanation = excluded.choice_d_explanation,
                    subtopic = excluded.subtopic,
                    ai_explanation = excluded.ai_explanation,
                    updated_at = excluded.updated_at
                ''', (
                    question_id, correct_answer, choice_a_explanation, choice_b_explanation,
                    choice_c_explanation, choice_d_explanation, subtopic, ai_explanation_json,
                    datetime.now().isoformat(), datetime.now().isoformat()
                ))
                stored_count += 1
            except Exception as e:
                print(f"Error storing explanation for question {question_id}: {e}")
                continue
        
        conn.commit()
        conn.close()
        
        return jsonify({
            'success': True,
            'stored_count': stored_count,
            'message': f'Successfully stored {stored_count} explanations'
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/explanations/check', methods=['POST'])
def check_existing_explanations():
    """Check which questions already have explanations stored"""
    try:
        data = request.get_json()
        question_ids = data.get('question_ids', [])
        
        if not question_ids:
            return jsonify({'error': 'No question IDs provided'}), 400
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Check which questions have explanations
        placeholders = ','.join('?' * len(question_ids))
        cursor.execute(f'''
        SELECT question_id FROM question_explanations 
        WHERE question_id IN ({placeholders})
        AND choice_a_explanation IS NOT NULL
        ''', question_ids)
        
        existing_ids = [row[0] for row in cursor.fetchall()]
        
        conn.close()
        
        # Return object indicating which questions have explanations
        result = {q_id: q_id in existing_ids for q_id in question_ids}
        
        return jsonify({
            'explanations_exist': result,
            'total_existing': len(existing_ids),
            'total_requested': len(question_ids)
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# Authentication Routes
@app.route('/api/auth/register', methods=['POST'])
def register():
    """Register a new user"""
    try:
        data = request.get_json()
        username = data.get('username', '').strip()
        email = data.get('email', '').strip()
        password = data.get('password', '')
        
        # Validation
        if not username or len(username) < 3:
            return jsonify({'error': 'Username must be at least 3 characters long'}), 400
        
        if not email or '@' not in email:
            return jsonify({'error': 'Valid email address is required'}), 400
        
        if not password or len(password) < 6:
            return jsonify({'error': 'Password must be at least 6 characters long'}), 400
        
        # Create user
        user = create_user(username, email, password, DB_PATH)
        
        # Generate JWT token
        token = generate_jwt_token(user['id'], user['username'])
        
        return jsonify({
            'success': True,
            'message': 'User registered successfully',
            'user': user,
            'token': token
        })
        
    except ValueError as e:
        return jsonify({'error': str(e)}), 400
    except Exception as e:
        return jsonify({'error': 'Registration failed'}), 500

@app.route('/api/auth/login', methods=['POST'])
def login():
    """Login user"""
    try:
        data = request.get_json()
        username = data.get('username', '').strip()
        password = data.get('password', '')
        
        if not username or not password:
            return jsonify({'error': 'Username and password are required'}), 400
        
        # Authenticate user
        user = authenticate_user(username, password, DB_PATH)
        
        # Generate JWT token
        token = generate_jwt_token(user['id'], user['username'])
        
        return jsonify({
            'success': True,
            'message': 'Login successful',
            'user': user,
            'token': token
        })
        
    except ValueError as e:
        return jsonify({'error': str(e)}), 401
    except Exception as e:
        return jsonify({'error': 'Login failed'}), 500

@app.route('/api/auth/logout', methods=['POST'])
@require_auth
def logout():
    """Logout user (client-side token removal)"""
    return jsonify({
        'success': True,
        'message': 'Logout successful'
    })

@app.route('/api/auth/me', methods=['GET'])
@require_auth
def get_current_user():
    """Get current user information"""
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header:
            return jsonify({'error': 'No authorization header'}), 401
            
        token = auth_header.split(' ')[1] if ' ' in auth_header else auth_header
        user = get_user_from_token(token, DB_PATH)
        
        return jsonify({
            'success': True,
            'user': user
        })
        
    except Exception as e:
        return jsonify({'error': 'Failed to get user information'}), 500

@app.route('/api/auth/preferences', methods=['PUT'])
@require_auth
def update_preferences():
    """Update user preferences"""
    try:
        data = request.get_json()
        user_id = g.user_id
        
        success = update_user_preferences(user_id, data, DB_PATH)
        
        if success:
            return jsonify({
                'success': True,
                'message': 'Preferences updated successfully'
            })
        else:
            return jsonify({'error': 'Failed to update preferences'}), 500
            
    except Exception as e:
        return jsonify({'error': 'Failed to update preferences'}), 500


if __name__ == '__main__':
    print("Starting Law Quizzer Backend API Server...")
    print(f"Database path: {DB_PATH}")
    print(f"OpenAI API Key configured: {'Yes' if os.environ.get('OPENAI_API_KEY') else 'No'}")
    print(f"Vector store service available: {'Yes' if vector_store_service else 'No'}")
    print(f"AI explanations available: {'Yes' if ai_service else 'No'}")
    print(f"Essay grading available: {'Yes' if essay_grader_service else 'No'}")
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

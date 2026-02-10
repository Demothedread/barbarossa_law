"""
Quiz Blueprint - handles quiz history and tracking endpoints.
"""

import json
from datetime import datetime
from typing import Any, Dict, List

from flask import Blueprint, jsonify, request

from ..utils.database import (USE_POSTGRES, convert_query, get_db_connection,
                              get_placeholder, get_scalar, row_to_dict)

quiz_bp = Blueprint('quiz', __name__, url_prefix='/api')


def calculate_comprehensive_stats(history: List[Dict[str, Any]]) -> Dict[str, Any]:
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
    
    stats: Dict[str, Any] = {
        'total_quizzes': len(history),
        'total_questions': sum(item.get('total', 0) for item in history),
        'total_correct': sum(item.get('correct', 0) for item in history),
        'avg_score': 0,
        'avg_time_per_question': 0,
        'by_subject': {},
        'by_mode': {},
        'by_subtopic': {},
        'recent_performance': []
    }
    
    if stats['total_questions'] > 0:
        stats['avg_score'] = (stats['total_correct'] / stats['total_questions']) * 100
    
    total_time = sum(item.get('duration_seconds', 0) for item in history)
    if stats['total_questions'] > 0:
        stats['avg_time_per_question'] = total_time / stats['total_questions']
    
    # Group by subject
    for item in history:
        subject = item.get('subject', 'Unknown')
        if subject not in stats['by_subject']:
            stats['by_subject'][subject] = {'total': 0, 'correct': 0, 'quizzes': 0}
        stats['by_subject'][subject]['total'] += item.get('total', 0)
        stats['by_subject'][subject]['correct'] += item.get('correct', 0)
        stats['by_subject'][subject]['quizzes'] += 1
    
    # Group by mode
    for item in history:
        mode = item.get('mode', 'classic')
        if mode not in stats['by_mode']:
            stats['by_mode'][mode] = {'total': 0, 'correct': 0, 'quizzes': 0}
        stats['by_mode'][mode]['total'] += item.get('total', 0)
        stats['by_mode'][mode]['correct'] += item.get('correct', 0)
        stats['by_mode'][mode]['quizzes'] += 1
    
    # Recent performance (last 10)
    for item in history[:10]:
        if item.get('total', 0) > 0:
            stats['recent_performance'].append({
                'date': item.get('created_at', ''),
                'score': (item.get('correct', 0) / item.get('total', 1)) * 100,
                'subject': item.get('subject', 'Unknown')
            })
    
    return stats


def calculate_advanced_analytics(history: List[Dict[str, Any]]) -> Dict[str, Any]:
    """Calculate advanced analytics from quiz history"""
    if not history:
        return {}
    
    analytics: Dict[str, Any] = {
        'improvement_trend': [],
        'time_analysis': {},
        'difficulty_analysis': {}
    }
    
    # Calculate improvement trend (compare recent vs older)
    if len(history) >= 4:
        recent = history[:len(history)//2]
        older = history[len(history)//2:]
        
        recent_avg = sum(h.get('correct', 0) for h in recent) / max(sum(h.get('total', 1) for h in recent), 1)
        older_avg = sum(h.get('correct', 0) for h in older) / max(sum(h.get('total', 1) for h in older), 1)
        
        analytics['improvement_trend'] = {
            'recent_avg': recent_avg * 100,
            'older_avg': older_avg * 100,
            'change': (recent_avg - older_avg) * 100
        }
    
    return analytics


@quiz_bp.route('/quiz-history', methods=['POST'])
def log_quiz_history():
    """Save quiz history with comprehensive performance metrics"""
    try:
        data = request.get_json()
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Create enhanced quiz_history table
        if USE_POSTGRES:
            cursor.execute("""
            CREATE TABLE IF NOT EXISTS quiz_history (
                id SERIAL PRIMARY KEY,
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
        else:
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
        
        questions = data.get('questions', [])
        answers = data.get('answers', [])
        time_per_question = data.get('time_per_question', [])
        mode = data.get('mode', 'classic')
        
        accuracy = (data.get('correct', 0) / max(data.get('total', 1), 1)) * 100
        avg_time = data.get('duration_seconds', 0) / max(data.get('total', 1), 1)
        
        streak_correct = 0
        streak_total = 0
        
        subtopic = data.get('subtopic', '')
        if not subtopic and questions:
            subtopic = questions[0].get('subtopic', '') if isinstance(questions[0], dict) else ''
        
        cursor.execute(convert_query("""
        INSERT INTO quiz_history (
            user_id, subject, subtopic, correct, total, duration_seconds,
            questions_json, answers_json, time_per_question_json,
            question_difficulties_json, mode, negative_time, streak_correct,
            streak_total, avg_time_per_question, accuracy_percentage, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """), (
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
        lastrowid = cursor.lastrowid
        conn.close()
        
        return jsonify({'success': True, 'id': lastrowid})
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@quiz_bp.route('/quiz-history', methods=['GET'])
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
        if USE_POSTGRES:
            cursor.execute("""
                SELECT EXISTS (
                    SELECT FROM information_schema.tables 
                    WHERE table_name = 'quiz_history'
                )
            """)
            exists = cursor.fetchone()
            if not exists or not list(exists.values())[0]:
                return jsonify({'history': [], 'stats': {}, 'analytics': {}})
        else:
            cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='quiz_history'")
            if not cursor.fetchone():
                return jsonify({'history': [], 'stats': {}, 'analytics': {}})
        
        query_params: List[Any] = [user_id]
        where_clauses = ["user_id = " + get_placeholder()]
        
        if subject:
            where_clauses.append("subject = " + get_placeholder())
            query_params.append(subject)
        
        if mode:
            where_clauses.append("mode = " + get_placeholder())
            query_params.append(mode)
        
        query = f"""
        SELECT * FROM quiz_history
        WHERE {' AND '.join(where_clauses)}
        ORDER BY created_at DESC LIMIT {get_placeholder()}
        """
        query_params.append(limit)
        
        cursor.execute(query, query_params)
        history = [row_to_dict(row) for row in cursor.fetchall()]
        
        stats = calculate_comprehensive_stats(history)
        analytics = calculate_advanced_analytics(history)
        
        conn.close()
        
        return jsonify({
            'history': history,
            'stats': stats,
            'analytics': analytics
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@quiz_bp.route('/daily-progress', methods=['GET'])
def get_daily_progress():
    """Get daily progress for a user."""
    try:
        user_id = request.args.get('user_id', 'anonymous')
        date = request.args.get('date', datetime.now().strftime('%Y-%m-%d'))
        
        conn = get_db_connection()
        cursor = conn.cursor()
        placeholder = get_placeholder()
        
        # Check if table exists
        if USE_POSTGRES:
            cursor.execute("""
                SELECT EXISTS (
                    SELECT FROM information_schema.tables 
                    WHERE table_name = 'daily_progress'
                )
            """)
            result = cursor.fetchone()
            if not result or not list(result.values())[0]:
                conn.close()
                return jsonify({'progress': None})
        else:
            cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='daily_progress'")
            if not cursor.fetchone():
                conn.close()
                return jsonify({'progress': None})
        
        cursor.execute(convert_query(
            "SELECT * FROM daily_progress WHERE user_id = ? AND date = ?"
        ), (user_id, date))
        
        row = cursor.fetchone()
        conn.close()
        
        if row:
            return jsonify({'progress': row_to_dict(row)})
        return jsonify({'progress': None})
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@quiz_bp.route('/daily-progress', methods=['POST'])
def update_daily_progress():
    """Update daily progress for a user."""
    try:
        data = request.get_json()
        user_id = data.get('user_id', 'anonymous')
        date = data.get('date', datetime.now().strftime('%Y-%m-%d'))
        
        conn = get_db_connection()
        cursor = conn.cursor()
        placeholder = get_placeholder()
        
        # Create table if not exists
        if USE_POSTGRES:
            cursor.execute("""
            CREATE TABLE IF NOT EXISTS daily_progress (
                id SERIAL PRIMARY KEY,
                user_id TEXT,
                date TEXT,
                questions_answered INTEGER DEFAULT 0,
                questions_correct INTEGER DEFAULT 0,
                essays_written INTEGER DEFAULT 0,
                study_minutes INTEGER DEFAULT 0,
                subjects_json TEXT,
                updated_at TEXT,
                UNIQUE(user_id, date)
            )
            """)
        else:
            cursor.execute("""
            CREATE TABLE IF NOT EXISTS daily_progress (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id TEXT,
                date TEXT,
                questions_answered INTEGER DEFAULT 0,
                questions_correct INTEGER DEFAULT 0,
                essays_written INTEGER DEFAULT 0,
                study_minutes INTEGER DEFAULT 0,
                subjects_json TEXT,
                updated_at TEXT,
                UNIQUE(user_id, date)
            )
            """)
        
        # Upsert progress
        if USE_POSTGRES:
            cursor.execute(f'''
                INSERT INTO daily_progress (user_id, date, questions_answered, questions_correct, 
                    essays_written, study_minutes, subjects_json, updated_at)
                VALUES ({placeholder}, {placeholder}, {placeholder}, {placeholder}, 
                    {placeholder}, {placeholder}, {placeholder}, {placeholder})
                ON CONFLICT (user_id, date) DO UPDATE SET
                    questions_answered = EXCLUDED.questions_answered,
                    questions_correct = EXCLUDED.questions_correct,
                    essays_written = EXCLUDED.essays_written,
                    study_minutes = EXCLUDED.study_minutes,
                    subjects_json = EXCLUDED.subjects_json,
                    updated_at = EXCLUDED.updated_at
            ''', (
                user_id, date,
                data.get('questions_answered', 0),
                data.get('questions_correct', 0),
                data.get('essays_written', 0),
                data.get('study_minutes', 0),
                json.dumps(data.get('subjects', {})),
                datetime.now().isoformat()
            ))
        else:
            cursor.execute(f'''
                INSERT INTO daily_progress (user_id, date, questions_answered, questions_correct,
                    essays_written, study_minutes, subjects_json, updated_at)
                VALUES ({placeholder}, {placeholder}, {placeholder}, {placeholder},
                    {placeholder}, {placeholder}, {placeholder}, {placeholder})
                ON CONFLICT(user_id, date) DO UPDATE SET
                    questions_answered = excluded.questions_answered,
                    questions_correct = excluded.questions_correct,
                    essays_written = excluded.essays_written,
                    study_minutes = excluded.study_minutes,
                    subjects_json = excluded.subjects_json,
                    updated_at = excluded.updated_at
            ''', (
                user_id, date,
                data.get('questions_answered', 0),
                data.get('questions_correct', 0),
                data.get('essays_written', 0),
                data.get('study_minutes', 0),
                json.dumps(data.get('subjects', {})),
                datetime.now().isoformat()
            ))
        
        conn.commit()
        conn.close()
        
        return jsonify({'success': True})
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@quiz_bp.route('/track-review', methods=['POST'])
def track_review():
    """Track when a user reviews a question."""
    try:
        data = request.get_json()
        question_id = data.get('question_id')
        
        if not question_id:
            return jsonify({'error': 'question_id required'}), 400
        
        # This is a lightweight tracking endpoint
        # Just acknowledge the review was tracked
        return jsonify({'success': True})
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

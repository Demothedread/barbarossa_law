"""
Questions Blueprint - handles all question-related endpoints.
"""

import random
from datetime import datetime
from typing import Any, List

from flask import Blueprint, jsonify, request

from ..utils.database import (USE_POSTGRES, convert_query, get_db_connection,
                              get_placeholder, get_scalar,
                              normalize_question_for_api, row_to_dict)

questions_bp = Blueprint('questions', __name__, url_prefix='/api')


@questions_bp.route('/subjects', methods=['GET'])
def get_subjects():
    """Get all available subjects"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute('SELECT DISTINCT subject FROM questions WHERE subject IS NOT NULL ORDER BY subject')
        rows = cursor.fetchall()
        subjects = [row_to_dict(row)['subject'] for row in rows]
        conn.close()
        return jsonify({'subjects': subjects})
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@questions_bp.route('/questions', methods=['GET'])
def get_questions():
    """Get random questions with optional subject and type filters"""
    try:
        n = int(request.args.get('n', 10))
        subject = request.args.get('subject', '')
        subtopic = request.args.get('subtopic', '')
        question_type = request.args.get('type', 'mix')
        
        conn = get_db_connection()
        cursor = conn.cursor()
        placeholder = get_placeholder()
        
        where_conditions: List[str] = []
        params: List[Any] = []
        
        if subject:
            where_conditions.append(f'subject = {placeholder}')
            params.append(subject)
        
        if subtopic:
            where_conditions.append(f'subtopic = {placeholder}')
            params.append(subtopic)
        
        if question_type == 'generated':
            where_conditions.append("(idx LIKE 'vs_%' OR generated = 1)")
        elif question_type == 'mbe':
            where_conditions.append("(idx NOT LIKE 'vs_%' AND (generated IS NULL OR generated = 0))")
        
        if where_conditions:
            query = f'SELECT * FROM questions WHERE {" AND ".join(where_conditions)}'
            cursor.execute(query, params)
        else:
            cursor.execute('SELECT * FROM questions')
        
        all_questions = cursor.fetchall()
        conn.close()
        
        if not all_questions:
            return jsonify({'questions': [], 'available': 0})
        
        questions_list = [normalize_question_for_api(row) for row in all_questions]
        selected_questions = random.sample(questions_list, min(n, len(questions_list)))
        
        return jsonify({
            'questions': selected_questions,
            'available': len(questions_list)
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@questions_bp.route('/questions/smart', methods=['GET'])
def get_smart_questions():
    """Get questions with smart selection that avoids repeats for users."""
    try:
        n = int(request.args.get('n', 10))
        subject = request.args.get('subject', '')
        subtopic = request.args.get('subtopic', '')
        question_type = request.args.get('type', 'mix')
        user_id = request.args.get('user_id', '')
        anonymous_id = request.args.get('anonymous_id', '')
        
        conn = get_db_connection()
        cursor = conn.cursor()
        placeholder = get_placeholder()
        
        where_conditions: List[str] = []
        params: List[Any] = []
        
        if subject:
            where_conditions.append(f'q.subject = {placeholder}')
            params.append(subject)
        
        if subtopic:
            where_conditions.append(f'q.subtopic = {placeholder}')
            params.append(subtopic)
        
        if question_type == 'generated':
            where_conditions.append("(q.idx LIKE 'vs_%' OR q.generated = 1)")
        elif question_type == 'mbe':
            where_conditions.append("(q.idx NOT LIKE 'vs_%' AND (q.generated IS NULL OR q.generated = 0))")
        
        where_clause = f'WHERE {" AND ".join(where_conditions)}' if where_conditions else ''
        
        # Check for question_usage table
        has_usage_table = False
        user_has_history = False
        
        try:
            if USE_POSTGRES:
                cursor.execute("""
                    SELECT EXISTS (
                        SELECT FROM information_schema.tables 
                        WHERE table_name = 'question_usage'
                    )
                """)
            else:
                cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='question_usage'")
            has_usage_table = bool(cursor.fetchone())
            
            if has_usage_table and (user_id or anonymous_id):
                if user_id:
                    cursor.execute(convert_query(
                        "SELECT COUNT(*) FROM question_usage WHERE user_id = ?"
                    ), (user_id,))
                else:
                    cursor.execute(convert_query(
                        "SELECT COUNT(*) FROM question_usage WHERE anonymous_id = ?"
                    ), (anonymous_id,))
                count_result = get_scalar(cursor.fetchone())
                user_has_history = (count_result or 0) > 0
        except Exception:
            pass
        
        if has_usage_table and user_has_history and (user_id or anonymous_id):
            user_filter = f'qu.user_id = {placeholder}' if user_id else f'qu.anonymous_id = {placeholder}'
            user_param = user_id if user_id else anonymous_id
            
            unseen_query = f'''
                SELECT q.* FROM questions q
                LEFT JOIN question_usage qu ON q.idx = qu.question_id 
                    AND ({user_filter})
                {where_clause}
                {"AND" if where_clause else "WHERE"} qu.question_id IS NULL
            '''
            cursor.execute(unseen_query, params + [user_param])
            unseen_questions = cursor.fetchall()
            
            wrong_query = f'''
                SELECT q.* FROM questions q
                INNER JOIN question_usage qu ON q.idx = qu.question_id
                {where_clause}
                {"AND" if where_clause else "WHERE"} {user_filter}
                AND qu.times_correct < qu.times_seen
                ORDER BY qu.times_correct ASC, qu.last_seen_at ASC
            '''
            cursor.execute(wrong_query, params + [user_param])
            wrong_questions = cursor.fetchall()
            
            all_candidates = list(unseen_questions) + list(wrong_questions)
            
            if len(all_candidates) < n:
                cursor.execute(f'SELECT * FROM questions q {where_clause}', params)
                all_candidates = cursor.fetchall()
        else:
            cursor.execute(f'SELECT * FROM questions q {where_clause}', params)
            all_candidates = cursor.fetchall()
        
        conn.close()
        
        if not all_candidates:
            return jsonify({'questions': [], 'available': 0, 'smart_selection': False})
        
        questions_list = [normalize_question_for_api(row) for row in all_candidates]
        
        selected = questions_list[:n] if len(questions_list) >= n else questions_list
        if len(questions_list) > n:
            priority_count = min(n // 2, len(selected))
            remaining = questions_list[priority_count:]
            random.shuffle(remaining)
            selected = questions_list[:priority_count] + remaining[:n - priority_count]
        
        return jsonify({
            'questions': selected,
            'available': len(questions_list),
            'smart_selection': has_usage_table and user_has_history
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@questions_bp.route('/questions/usage', methods=['POST'])
def update_question_usage():
    """Update question usage tracking after a quiz."""
    try:
        data = request.get_json()
        user_id = data.get('user_id')
        anonymous_id = data.get('anonymous_id')
        answers = data.get('answers', [])
        
        if not answers:
            return jsonify({'error': 'No answers provided'}), 400
        
        if not user_id and not anonymous_id:
            return jsonify({'error': 'user_id or anonymous_id required'}), 400
        
        conn = get_db_connection()
        cursor = conn.cursor()
        placeholder = get_placeholder()
        
        # Ensure table exists
        if USE_POSTGRES:
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS question_usage (
                    id SERIAL PRIMARY KEY,
                    user_id INTEGER,
                    anonymous_id TEXT,
                    question_id TEXT,
                    times_seen INTEGER DEFAULT 1,
                    times_correct INTEGER DEFAULT 0,
                    last_seen_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    UNIQUE(user_id, question_id)
                )
            ''')
        else:
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS question_usage (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id INTEGER,
                    anonymous_id TEXT,
                    question_id TEXT,
                    times_seen INTEGER DEFAULT 1,
                    times_correct INTEGER DEFAULT 0,
                    last_seen_at TEXT,
                    UNIQUE(user_id, question_id),
                    UNIQUE(anonymous_id, question_id)
                )
            ''')
        
        updated_count = 0
        for answer in answers:
            question_id = answer.get('question_id')
            is_correct = 1 if answer.get('correct', False) else 0
            
            if not question_id:
                continue
            
            now = datetime.now().isoformat()
            
            if USE_POSTGRES:
                if user_id:
                    cursor.execute(f'''
                        INSERT INTO question_usage (user_id, question_id, times_seen, times_correct, last_seen_at)
                        VALUES ({placeholder}, {placeholder}, 1, {placeholder}, CURRENT_TIMESTAMP)
                        ON CONFLICT (user_id, question_id) DO UPDATE SET
                            times_seen = question_usage.times_seen + 1,
                            times_correct = question_usage.times_correct + EXCLUDED.times_correct,
                            last_seen_at = CURRENT_TIMESTAMP
                    ''', (user_id, question_id, is_correct))
                else:
                    cursor.execute(f'''
                        INSERT INTO question_usage (anonymous_id, question_id, times_seen, times_correct, last_seen_at)
                        VALUES ({placeholder}, {placeholder}, 1, {placeholder}, CURRENT_TIMESTAMP)
                        ON CONFLICT DO NOTHING
                    ''', (anonymous_id, question_id, is_correct))
            else:
                if user_id:
                    cursor.execute(f'''
                        INSERT INTO question_usage (user_id, question_id, times_seen, times_correct, last_seen_at)
                        VALUES ({placeholder}, {placeholder}, 1, {placeholder}, {placeholder})
                        ON CONFLICT(user_id, question_id) DO UPDATE SET
                            times_seen = times_seen + 1,
                            times_correct = times_correct + excluded.times_correct,
                            last_seen_at = excluded.last_seen_at
                    ''', (user_id, question_id, is_correct, now))
                else:
                    cursor.execute(f'''
                        INSERT INTO question_usage (anonymous_id, question_id, times_seen, times_correct, last_seen_at)
                        VALUES ({placeholder}, {placeholder}, 1, {placeholder}, {placeholder})
                        ON CONFLICT(anonymous_id, question_id) DO UPDATE SET
                            times_seen = times_seen + 1,
                            times_correct = times_correct + excluded.times_correct,
                            last_seen_at = excluded.last_seen_at
                    ''', (anonymous_id, question_id, is_correct, now))
            
            updated_count += 1
        
        conn.commit()
        conn.close()
        
        return jsonify({'success': True, 'updated': updated_count})
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@questions_bp.route('/subtopics', methods=['GET'])
def get_subtopics():
    """Get subtopics for a subject"""
    try:
        subject = request.args.get('subject', '')
        
        conn = get_db_connection()
        cursor = conn.cursor()
        placeholder = get_placeholder()
        
        if subject:
            cursor.execute(convert_query(
                'SELECT DISTINCT subtopic FROM questions WHERE subject = ? AND subtopic IS NOT NULL ORDER BY subtopic'
            ), (subject,))
        else:
            cursor.execute('SELECT DISTINCT subtopic FROM questions WHERE subtopic IS NOT NULL ORDER BY subtopic')
        
        rows = cursor.fetchall()
        subtopics = [row_to_dict(row)['subtopic'] for row in rows]
        conn.close()
        
        return jsonify({'subtopics': subtopics})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

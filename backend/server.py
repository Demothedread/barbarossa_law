#!/usr/bin/env python3
"""
Law Quizzer Backend API Server
Provides REST endpoints for the web frontend
"""

import asyncio
import json
import os
import random
import re
import sqlite3
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Optional, Union

# Load environment variables
try:
    from dotenv import load_dotenv
    load_dotenv(dotenv_path=Path(__file__).parent.parent / '.env-local')
except ImportError:
    print("python-dotenv not available - using system environment variables")

# Import our AI explanation service and vector store service
from ai_explanations import (AIExplainService, ensure_explanations_table,
                             migrate_explanations_table)
from auth import (authenticate_user, create_user, generate_jwt_token,
                  get_user_from_token, require_auth, update_user_preferences)
from essay_grader import EssayGraderService
from flask import Flask, g, jsonify, request
from flask_cors import CORS
from vector_store_service_v2 import VectorStoreServiceV2

app = Flask(__name__)

# CORS configuration
# In production: Vercel frontend proxies /api/* requests to Render backend
# The proxy means requests may not have Origin headers, so we allow all origins
# at Flask-CORS level. Security is handled by Vercel's proxy configuration.
CORS(app, 
     resources={r"/api/*": {"origins": "*"}}, 
     supports_credentials=True,
     allow_headers=['Content-Type', 'Authorization', 'X-Requested-With'],
     methods=['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'])

# Database configuration - use PostgreSQL in production, SQLite locally
DATABASE_URL = os.environ.get('DATABASE_URL')
USE_POSTGRES = bool(DATABASE_URL)

# DB_PATH is either a connection string (PostgreSQL) or Path object (SQLite)
DB_PATH: Union[str, Path]
if USE_POSTGRES:
    DB_PATH = DATABASE_URL  # type: ignore[assignment]  # Connection string for PostgreSQL
    print("Using PostgreSQL database")
else:
    DB_PATH = Path(__file__).parent.parent / 'law_quiz.db'
    print(f"Using SQLite database at {DB_PATH}")

# Initialized services
ai_service: Optional[AIExplainService] = None
essay_grader_service: Optional[EssayGraderService] = None
vector_store_service: Optional[VectorStoreServiceV2] = None

def get_db_path_as_path() -> Path:
    """Get DB_PATH as a Path object (for SQLite operations)."""
    if isinstance(DB_PATH, Path):
        return DB_PATH
    return Path(DB_PATH)

def initialize_services():
    """Initialize optional services and check configuration."""
    global ai_service, essay_grader_service, vector_store_service

    if USE_POSTGRES:
        print("PostgreSQL database configured via DATABASE_URL")
    elif isinstance(DB_PATH, Path) and not DB_PATH.exists():
        print(
            f"WARNING: Database not found at {DB_PATH}. Run scripts/initialize_db.py to create it."
        )
    else:
        print(f"Using database at {DB_PATH}")

    if os.environ.get("OPENAI_API_KEY"):
        # Only run SQLite-specific table creation in local dev mode
        # In production (PostgreSQL), init_postgres.py handles schema creation
        if not USE_POSTGRES and isinstance(DB_PATH, Path):
            ensure_explanations_table(DB_PATH)
            migrate_explanations_table(DB_PATH)
        
        # Initialize services with appropriate db_path
        db_path_for_services = get_db_path_as_path() if not USE_POSTGRES else Path(".")
        ai_service = AIExplainService(db_path_for_services, use_postgres=USE_POSTGRES)
        essay_grader_service = EssayGraderService(db_path=db_path_for_services if not USE_POSTGRES else None, use_postgres=USE_POSTGRES)
        try:
            vector_store_service = VectorStoreServiceV2(db_path_for_services, use_postgres=USE_POSTGRES)
            print("Vector store service v2 initialized successfully.")
        except Exception as e:
            print(f"WARNING: Could not initialize vector store service: {e}")
    else:
        print(
            "WARNING: OPENAI_API_KEY not set. AI explanations, essay grading, and vector store will not be available."
        )


from db_adapter import DatabaseAdapter

# Create database adapter instance
db_adapter = DatabaseAdapter(DB_PATH if not USE_POSTGRES else None)  # type: ignore[arg-type]

initialize_services()

def get_db_connection():
    """Get database connection with proper setup"""
    if USE_POSTGRES:
        import psycopg2  # type: ignore[import-not-found]
        from psycopg2.extras import \
            RealDictCursor  # type: ignore[import-not-found]
        conn = psycopg2.connect(str(DB_PATH), cursor_factory=RealDictCursor)
        return conn
    else:
        conn = sqlite3.connect(str(DB_PATH))
        conn.row_factory = sqlite3.Row
        return conn

def get_placeholder():
    """Return the correct SQL placeholder based on database type."""
    return '%s' if USE_POSTGRES else '?'

def convert_query(query: str) -> str:
    """Convert SQLite-style query (?) to PostgreSQL (%s) if needed."""
    if USE_POSTGRES:
        return query.replace('?', '%s')
    return query

def row_to_dict(row: Any) -> Dict[str, Any]:
    """Convert a database row to a dictionary, handling both PostgreSQL and SQLite rows."""
    if row is None:
        return {}
    if isinstance(row, dict):
        return row
    # sqlite3.Row supports dict() conversion
    if hasattr(row, 'keys'):
        return dict(row)
    # Fallback: return as-is (shouldn't happen in practice)
    return {'value': row}

def get_row_value(row: Any, key_or_index: Union[str, int]) -> Any:
    """Get value from row, handling both dict (PostgreSQL) and tuple/Row (SQLite)."""
    if isinstance(row, dict):
        # For dict, try the key directly or common aliases
        if isinstance(key_or_index, int):
            # Integer index - get by position from dict values
            return list(row.values())[key_or_index]
        return row.get(key_or_index)
    # Convert sqlite3.Row to dict for key access
    if hasattr(row, 'keys'):
        d = dict(row)
        if isinstance(key_or_index, int):
            return list(d.values())[key_or_index]
        return d.get(key_or_index)
    # Fallback to index access
    return row[key_or_index] if isinstance(key_or_index, int) else None

def get_scalar(row: Any) -> Any:
    """Get the first value from a row (for single-column results like COUNT(*))."""
    if row is None:
        return None
    if isinstance(row, dict):
        return list(row.values())[0]
    return row[0]


def normalize_question_for_api(row: Any) -> Dict[str, Any]:
    """
    Normalize a question row for API response.
    - Maps 'idx' to 'id' for frontend compatibility
    - Ensures prompt is null/empty string handled properly
    - Adds choices array
    - Marks generated questions
    """
    question_dict = row_to_dict(row) if not isinstance(row, dict) else dict(row)
    
    # Map idx to id for frontend compatibility
    if 'idx' in question_dict:
        question_dict['id'] = question_dict['idx']
    
    # Ensure prompt is properly handled (empty string or null → omit or empty)
    prompt = question_dict.get('prompt', '')
    if prompt is None or (isinstance(prompt, str) and prompt.strip() == ''):
        question_dict['prompt'] = None
    else:
        question_dict['prompt'] = prompt.strip()
    
    # Ensure question text exists and is trimmed
    question_text = question_dict.get('question', '')
    if question_text:
        question_dict['question'] = question_text.strip()
    
    # Add choices array for convenience
    question_dict['choices'] = [
        question_dict.get('choice_a', ''),
        question_dict.get('choice_b', ''),
        question_dict.get('choice_c', ''),
        question_dict.get('choice_d', ''),
    ]
    
    # Ensure gold_passage/explanation is available
    if not question_dict.get('gold_passage'):
        question_dict['gold_passage'] = None
    
    # Mark if this is a generated question for UI display
    idx = question_dict.get('idx', '')
    question_dict['is_generated'] = (
        (isinstance(idx, str) and idx.startswith('vs_')) or 
        question_dict.get('generated', 0) == 1
    )
    
    return question_dict


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

def normalize_quiz_attempt_payload(data: Any) -> tuple[Optional[Dict[str, Any]], List[str]]:
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

    errors: List[str] = []
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
        rows = cursor.fetchall()
        # Convert all rows to dicts for consistent access
        subjects = [row_to_dict(row)['subject'] for row in rows]
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
        
        # Use correct placeholder for database type
        placeholder = '%s' if USE_POSTGRES else '?'
        
        # Build query based on filters
        where_conditions: List[str] = []
        params: List[Any] = []
        
        if subject:
            where_conditions.append(f'subject = {placeholder}')
            params.append(subject)
        
        if subtopic:
            where_conditions.append(f'subtopic = {placeholder}')
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
        
        # Convert to normalized format using helper
        questions_list = [normalize_question_for_api(row) for row in all_questions]
        
        # Randomly sample n questions
        selected_questions = random.sample(questions_list, min(n, len(questions_list)))
        
        return jsonify({
            'questions': selected_questions,
            'available': len(questions_list)
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/questions/smart', methods=['GET'])
def get_smart_questions():
    """
    Get questions with smart selection that avoids repeats for users.
    Prioritizes questions the user hasn't seen, then questions they got wrong.
    """
    try:
        n = int(request.args.get('n', 10))
        subject = request.args.get('subject', '')
        subtopic = request.args.get('subtopic', '')
        question_type = request.args.get('type', 'mix')
        user_id = request.args.get('user_id', '')
        anonymous_id = request.args.get('anonymous_id', '')
        
        conn = get_db_connection()
        cursor = conn.cursor()
        placeholder = '%s' if USE_POSTGRES else '?'
        
        # Build base query
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
        
        # Check if question_usage table exists and user has history
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
        
        # Smart selection logic
        if has_usage_table and user_has_history and (user_id or anonymous_id):
            # Get questions user hasn't seen
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
            
            # Get questions user got wrong (but has seen)
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
            
            # Combine: prioritize unseen, then wrong answers
            all_candidates = list(unseen_questions) + list(wrong_questions)
            
            # If not enough, fall back to all questions
            if len(all_candidates) < n:
                cursor.execute(f'SELECT * FROM questions q {where_clause}', params)
                all_candidates = cursor.fetchall()
        else:
            # No user history - return random questions
            cursor.execute(f'SELECT * FROM questions q {where_clause}', params)
            all_candidates = cursor.fetchall()
        
        conn.close()
        
        if not all_candidates:
            return jsonify({'questions': [], 'available': 0, 'smart_selection': False})
        
        # Convert to normalized format using helper
        questions_list = [normalize_question_for_api(row) for row in all_candidates]
        
        # Select n questions (prioritizing order from smart selection)
        selected = questions_list[:n] if len(questions_list) >= n else questions_list
        if len(questions_list) > n:
            # Add some randomization while keeping priority
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


@app.route('/api/questions/usage', methods=['POST'])
def update_question_usage():
    """
    Update question usage tracking after a quiz.
    Call this when a quiz is completed to track which questions the user has seen.
    """
    try:
        data = request.get_json()
        user_id = data.get('user_id')
        anonymous_id = data.get('anonymous_id')
        answers = data.get('answers', [])  # List of {question_id, selected, correct}
        
        if not answers:
            return jsonify({'error': 'No answers provided'}), 400
        
        if not user_id and not anonymous_id:
            return jsonify({'error': 'user_id or anonymous_id required'}), 400
        
        conn = get_db_connection()
        cursor = conn.cursor()
        placeholder = '%s' if USE_POSTGRES else '?'
        
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
            cursor.execute('''
                CREATE UNIQUE INDEX IF NOT EXISTS idx_question_usage_anonymous_unique 
                ON question_usage(anonymous_id, question_id) 
                WHERE anonymous_id IS NOT NULL
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
                    cursor.execute(f'''
                        UPDATE question_usage SET
                            times_seen = times_seen + 1,
                            times_correct = times_correct + {placeholder},
                            last_seen_at = CURRENT_TIMESTAMP
                        WHERE anonymous_id = {placeholder} AND question_id = {placeholder}
                    ''', (is_correct, anonymous_id, question_id))
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


@app.route('/api/questions/<question_id>/second-best', methods=['GET'])
async def get_second_best_analysis(question_id):
    """
    Get AI analysis of the second-best (closest wrong) answer for a question.
    Useful for understanding why certain wrong answers are tempting.
    """
    try:
        if not ai_service:
            return jsonify({'error': 'AI service not available'}), 500
        
        conn = get_db_connection()
        cursor = conn.cursor()
        placeholder = '%s' if USE_POSTGRES else '?'
        
        # Check cache first
        try:
            cursor.execute(convert_query(
                'SELECT * FROM question_second_best WHERE question_id = ?'
            ), (question_id,))
            cached = cursor.fetchone()
            if cached:
                cached_dict = dict(cached)
                return jsonify({
                    'question_id': question_id,
                    'second_best_choice': cached_dict['second_best_choice'],
                    'analysis': cached_dict['analysis_text'],
                    'confidence': cached_dict.get('confidence_score', 0.8),
                    'cached': True
                })
        except Exception:
            pass  # Table might not exist yet
        
        # Get the question
        cursor.execute(convert_query(
            'SELECT * FROM questions WHERE idx = ?'
        ), (question_id,))
        question = cursor.fetchone()
        
        if not question:
            conn.close()
            return jsonify({'error': 'Question not found'}), 404
        
        question_dict = dict(question)
        
        # Generate second-best analysis using AI
        prompt = f"""Analyze this multiple choice question and identify the SECOND BEST answer (the most tempting wrong answer).

Question: {question_dict['question']}

A) {question_dict['choice_a']}
B) {question_dict['choice_b']}
C) {question_dict['choice_c']}
D) {question_dict['choice_d']}

Correct Answer: {question_dict['answer']}

Respond in JSON format:
{{
    "second_best_choice": "X",
    "analysis": "Brief explanation of why this wrong answer is the most tempting and how to distinguish it from the correct answer",
    "confidence": 0.8
}}"""
        
        import openai
        client = openai.OpenAI()
        
        response = await asyncio.to_thread(
            client.chat.completions.create,
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": prompt}],
            response_format={"type": "json_object"}
        )
        
        content = response.choices[0].message.content
        if content is None:
            conn.close()
            return jsonify({'error': 'AI returned empty response'}), 500
        
        result = json.loads(content)
        
        # Cache the result
        try:
            if USE_POSTGRES:
                cursor.execute('''
                    CREATE TABLE IF NOT EXISTS question_second_best (
                        question_id TEXT PRIMARY KEY,
                        second_best_choice TEXT NOT NULL,
                        analysis_text TEXT,
                        confidence_score REAL,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    )
                ''')
            else:
                cursor.execute('''
                    CREATE TABLE IF NOT EXISTS question_second_best (
                        question_id TEXT PRIMARY KEY,
                        second_best_choice TEXT NOT NULL,
                        analysis_text TEXT,
                        confidence_score REAL,
                        created_at TEXT
                    )
                ''')
            
            now = datetime.now().isoformat()
            if USE_POSTGRES:
                cursor.execute(f'''
                    INSERT INTO question_second_best (question_id, second_best_choice, analysis_text, confidence_score)
                    VALUES ({placeholder}, {placeholder}, {placeholder}, {placeholder})
                    ON CONFLICT (question_id) DO UPDATE SET
                        second_best_choice = EXCLUDED.second_best_choice,
                        analysis_text = EXCLUDED.analysis_text,
                        confidence_score = EXCLUDED.confidence_score
                ''', (question_id, result['second_best_choice'], result['analysis'], result.get('confidence', 0.8)))
            else:
                cursor.execute(f'''
                    INSERT OR REPLACE INTO question_second_best (question_id, second_best_choice, analysis_text, confidence_score, created_at)
                    VALUES ({placeholder}, {placeholder}, {placeholder}, {placeholder}, {placeholder})
                ''', (question_id, result['second_best_choice'], result['analysis'], result.get('confidence', 0.8), now))
            
            conn.commit()
        except Exception as e:
            print(f"Warning: Could not cache second-best analysis: {e}")
        
        conn.close()
        
        return jsonify({
            'question_id': question_id,
            'second_best_choice': result['second_best_choice'],
            'analysis': result['analysis'],
            'confidence': result.get('confidence', 0.8),
            'cached': False
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/log', methods=['POST'])
def log_quiz_attempt():
    """Log a quiz attempt"""
    conn = None
    try:
        data = request.get_json()
        if data is None:
            return jsonify({'error': 'Request body is required'}), 400
        normalized, errors = normalize_quiz_attempt_payload(data)
        if errors:
            return jsonify({'error': 'Invalid attempt data', 'details': errors}), 400
        
        if normalized is None:
            return jsonify({'error': 'Failed to normalize payload'}), 400

        conn = get_db_connection()
        try:
            cursor = conn.cursor()
            ensure_quiz_attempt_logs_table(cursor)

            cursor.execute(convert_query("""
            INSERT INTO quiz_attempt_logs (
                user_id, question_id, selected_answer, correct_answer, is_correct,
                subject, subtopic, mode, elapsed_seconds, payload_json, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """), (
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

            return jsonify({'success': True, 'id': inserted_id})
        finally:
            conn.close()

    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        if conn:
            conn.close()

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({'status': 'healthy', 'timestamp': datetime.now().isoformat()})


@app.route('/', methods=['GET'])
def root():
    """Root endpoint - redirect or info page"""
    return jsonify({
        'name': 'Barbarossa Bar Prep API',
        'version': '1.0.0',
        'docs': '/api/health',
        'status': 'running',
        'endpoints': {
            'health': '/api/health',
            'subjects': '/api/subjects',
            'questions': '/api/questions',
            'essays': '/api/essay-prompts'
        }
    })


@app.route('/api/config', methods=['GET'])
def config_check():
    """Return basic configuration status"""
    db_exists = False
    if isinstance(DB_PATH, Path):
        db_exists = DB_PATH.exists()
    else:
        # PostgreSQL - assume exists if configured
        db_exists = USE_POSTGRES
    
    return jsonify({
        'database_exists': db_exists,
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
        query_params: List[Any] = [user_id]
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
        analytics = calculate_advanced_analytics(history)
        
        conn.close()
        
        return jsonify({
            'history': history,
            'stats': stats,
            'analytics': analytics
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

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

def calculate_advanced_analytics(history: List[Dict[str, Any]]) -> Dict[str, Any]:
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
    
    analytics: Dict[str, Any] = {
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
    weak_areas: List[Dict[str, Any]] = []
    
    # Group by subject to find weak subjects
    subject_performance: Dict[str, Dict[str, int]] = {}
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
    subtopic_performance: Dict[str, Dict[str, Any]] = {}
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


# =============================================================================
# MBE QUESTION GENERATION ENDPOINTS
# Advanced question generation with dual vector stores, deduplication, and voting
# =============================================================================

# Lazy import to avoid circular dependencies
_mbe_generator = None

def get_mbe_generator():
    """Get or create the MBE question generator instance."""
    global _mbe_generator
    if _mbe_generator is None:
        from mbe_question_generator import MBEQuestionGenerator
        db_path = get_db_path_as_path() if not USE_POSTGRES else Path(".")
        _mbe_generator = MBEQuestionGenerator(db_path, use_postgres=USE_POSTGRES)
    return _mbe_generator


@app.route('/api/generate-mbe-questions', methods=['POST'])
async def generate_mbe_questions_endpoint():
    """
    Generate MBE questions using the advanced dual-vector-store system.
    
    Request body:
    {
        "subject": "Contracts",  // Required
        "subtopic": "Formation of contracts",  // Optional - uses probability weighting if omitted
        "count": 5,  // Optional, default 5, max 20
        "user_id": "user123"  // Optional, for tracking
    }
    
    Response:
    {
        "success": true,
        "batch_id": "gen_abc123",
        "requested": 5,
        "generated": 5,
        "saved": 5,
        "fallback_used": false,
        "source": "mbe_extraction" | "outline_based" | "hybrid",
        "questions": [...]
    }
    """
    try:
        if not os.environ.get("OPENAI_API_KEY"):
            return jsonify({
                'error': 'MBE question generation requires OPENAI_API_KEY'
            }), 500
        
        data = request.get_json() or {}
        
        # Validate required fields
        subject = data.get('subject')
        if not subject:
            return jsonify({'error': 'subject is required'}), 400
        
        # Optional fields with defaults
        subtopic = data.get('subtopic')
        count = min(data.get('count', 5), 20)  # Cap at 20
        user_id = data.get('user_id')
        
        if count < 1:
            return jsonify({'error': 'count must be at least 1'}), 400
        
        # Generate questions
        generator = get_mbe_generator()
        result = await generator.generate_questions(
            subject=subject,
            subtopic=subtopic,
            count=count,
            user_id=user_id
        )
        
        return jsonify({
            'success': True,
            **result
        })
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500


@app.route('/api/questions/<question_id>/vote', methods=['POST'])
async def vote_on_question(question_id: str):
    """
    Vote on an AI-generated question quality.
    
    'up' vote = approve as model question (high quality, keep forever)
    'down' vote = reject (exclude from regular rotation)
    
    Request body:
    {
        "vote": "up" | "down",
        "user_id": "user123",  // Optional
        "anonymous_id": "anon123"  // Optional
    }
    """
    try:
        data = request.get_json() or {}
        
        vote = data.get('vote')
        if vote not in ('up', 'down'):
            return jsonify({'error': 'vote must be "up" or "down"'}), 400
        
        user_id = data.get('user_id')
        anonymous_id = data.get('anonymous_id')
        
        if not user_id and not anonymous_id:
            return jsonify({'error': 'Either user_id or anonymous_id is required'}), 400
        
        generator = get_mbe_generator()
        result = await generator.vote_question(
            question_id=question_id,
            vote=vote,
            user_id=user_id,
            anonymous_id=anonymous_id
        )
        
        if 'error' in result:
            return jsonify(result), 400
        
        return jsonify(result)
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/questions/<question_id>/approve', methods=['POST'])
async def approve_question(question_id: str):
    """
    Shortcut to approve a question as a model question.
    Equivalent to voting 'up'.
    """
    try:
        data = request.get_json() or {}
        user_id = data.get('user_id')
        anonymous_id = data.get('anonymous_id')
        
        if not user_id and not anonymous_id:
            return jsonify({'error': 'Either user_id or anonymous_id is required'}), 400
        
        generator = get_mbe_generator()
        result = await generator.vote_question(
            question_id=question_id,
            vote='up',
            user_id=user_id,
            anonymous_id=anonymous_id
        )
        
        if 'error' in result:
            return jsonify(result), 400
        
        return jsonify({
            'success': True,
            'question_id': question_id,
            'status': 'approved',
            **result
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/generation-stats', methods=['GET'])
def get_generation_stats():
    """
    Get statistics about AI question generation.
    
    Returns counts of generated questions by source, subject,
    model vs non-model, and recent generation batches.
    """
    try:
        generator = get_mbe_generator()
        stats = generator.get_generation_stats()
        return jsonify(stats)
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/subtopic-weights', methods=['GET'])
def get_subtopic_weights():
    """
    Get probability weights for subtopics based on MBE distribution.
    
    Query params:
    - subject: Required subject to get weights for
    """
    try:
        subject = request.args.get('subject')
        if not subject:
            return jsonify({'error': 'subject parameter is required'}), 400
        
        generator = get_mbe_generator()
        weights = generator._get_subtopic_weights(subject)
        
        return jsonify({
            'subject': subject,
            'weights': weights
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/questions/<question_id>/vote-status', methods=['GET'])
def get_question_vote_status(question_id: str):
    """
    Get the vote status for a specific question.
    
    Query params:
    - user_id: Optional user ID to check their specific vote
    - anonymous_id: Optional anonymous ID to check their specific vote
    """
    try:
        user_id = request.args.get('user_id')
        anonymous_id = request.args.get('anonymous_id')
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Get aggregate vote counts
        cursor.execute(convert_query("""
            SELECT vote, COUNT(*) as count 
            FROM question_votes 
            WHERE question_id = ? 
            GROUP BY vote
        """), (question_id,))
        
        vote_counts = {"up": 0, "down": 0}
        for row in cursor.fetchall():
            row_dict = row_to_dict(row)
            vote_counts[row_dict['vote']] = row_dict['count']
        
        # Get question approval status
        cursor.execute(convert_query("""
            SELECT is_model_question, approval_status, generated
            FROM questions WHERE idx = ?
        """), (question_id,))
        
        question_row = cursor.fetchone()
        question_info = row_to_dict(question_row) if question_row else {}
        
        # Get user's specific vote if requested
        user_vote = None
        if user_id or anonymous_id:
            if user_id:
                cursor.execute(convert_query("""
                    SELECT vote FROM question_votes 
                    WHERE question_id = ? AND user_id = ?
                """), (question_id, user_id))
            else:
                cursor.execute(convert_query("""
                    SELECT vote FROM question_votes 
                    WHERE question_id = ? AND anonymous_id = ?
                """), (question_id, anonymous_id))
            
            vote_row = cursor.fetchone()
            if vote_row:
                user_vote = row_to_dict(vote_row).get('vote')
        
        conn.close()
        
        return jsonify({
            'question_id': question_id,
            'is_generated': bool(question_info.get('generated', 0)),
            'is_model_question': bool(question_info.get('is_model_question', 0)),
            'approval_status': question_info.get('approval_status'),
            'vote_counts': vote_counts,
            'user_vote': user_vote
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
            cursor.execute(convert_query("SELECT DISTINCT subtopic FROM questions WHERE subject = ? AND subtopic IS NOT NULL"), (subject,))
        else:
            cursor.execute("SELECT DISTINCT subtopic FROM questions WHERE subtopic IS NOT NULL")
        
        rows = cursor.fetchall()
        subtopics = [row_to_dict(row)['subtopic'] for row in rows]
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
            row_dict = dict(row) if isinstance(row, dict) else {
                'subtopic': row[0], 'subject': row[1], 'total_questions': row[2],
                'correct_answers': row[3], 'avg_accuracy': row[4], 'avg_time': row[5], 'quiz_count': row[6]
            }
            subtopic = row_dict['subtopic']
            subject_name = row_dict['subject']
            total_questions = row_dict['total_questions']
            correct_answers = row_dict['correct_answers']
            avg_time = row_dict['avg_time']
            quiz_count = row_dict['quiz_count']
            
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
        # Note: PostgreSQL uses different date syntax
        if USE_POSTGRES:
            query = """
            SELECT * FROM quiz_history
            WHERE user_id = %s AND created_at >= NOW() - INTERVAL '%s days'
            ORDER BY created_at ASC
            """
            cursor.execute(query, (user_id, days))
        else:
            query = f"""
            SELECT * FROM quiz_history
            WHERE user_id = ? AND created_at >= datetime('now', '-{days} days')
            ORDER BY created_at ASC
            """
            cursor.execute(query, (user_id,))
        recent_history = [dict(row) for row in cursor.fetchall()]
        
        # Get all-time history for comparison
        cursor.execute(convert_query("SELECT * FROM quiz_history WHERE user_id = ? ORDER BY created_at ASC"), (user_id,))
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
        cursor.execute(convert_query("SELECT * FROM quiz_history WHERE user_id = ? ORDER BY created_at DESC"), (user_id,))
        history = [dict(row) for row in cursor.fetchall()]
        
        stats = calculate_comprehensive_stats(history)
        analytics = calculate_advanced_analytics(history)
        
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

def calculate_performance_metrics(history: List[Dict[str, Any]]) -> Dict[str, Any]:
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

def calculate_learning_velocity(history: List[Dict[str, Any]]) -> Dict[str, Any]:
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

def calculate_study_patterns(history: List[Dict[str, Any]]) -> Dict[str, Any]:
    """Analyze study patterns and habits"""
    if not history:
        return {}
    
    from datetime import datetime as dt
    
    patterns: Dict[str, Any] = {
        'sessions_per_week': 0,
        'avg_session_length': 0,
        'preferred_times': [],
        'consistency_score': 0
    }
    
    # Calculate sessions per week (approximate)
    if history:
        date_range = (dt.fromisoformat(history[-1]['created_at']) -
                     dt.fromisoformat(history[0]['created_at'])).days
        weeks = max(date_range / 7, 1)
        patterns['sessions_per_week'] = len(history) / weeks
    
    # Calculate average session length
    total_time = sum(q.get('duration_seconds', 0) for q in history)
    patterns['avg_session_length'] = total_time / max(len(history), 1) / 60  # minutes
    
    return patterns

def calculate_predictions(history: List[Dict[str, Any]]) -> Dict[str, Any]:
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

def generate_study_recommendations(history: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Generate personalized study recommendations"""
    if not history:
        return []
    
    recommendations: List[Dict[str, Any]] = []
    
    # Calculate subject performance
    subject_performance: Dict[str, Dict[str, int]] = {}
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
        from datetime import datetime as dt
        last_quiz = dt.fromisoformat(history[0]['created_at'])
        days_since = (dt.now() - last_quiz).days
        
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
                if USE_POSTGRES:
                    cursor.execute('''
                    INSERT INTO question_explanations (
                        question_id, correct_answer, choice_a_explanation, choice_b_explanation,
                        choice_c_explanation, choice_d_explanation, subtopic, ai_explanation,
                        created_at, updated_at
                    ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                    ON CONFLICT(question_id) DO UPDATE SET
                        correct_answer = EXCLUDED.correct_answer,
                        choice_a_explanation = EXCLUDED.choice_a_explanation,
                        choice_b_explanation = EXCLUDED.choice_b_explanation,
                        choice_c_explanation = EXCLUDED.choice_c_explanation,
                        choice_d_explanation = EXCLUDED.choice_d_explanation,
                        subtopic = EXCLUDED.subtopic,
                        ai_explanation = EXCLUDED.ai_explanation,
                        updated_at = EXCLUDED.updated_at
                    ''', (
                        question_id, correct_answer, choice_a_explanation, choice_b_explanation,
                        choice_c_explanation, choice_d_explanation, subtopic, ai_explanation_json,
                        datetime.now().isoformat(), datetime.now().isoformat()
                    ))
                else:
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
        placeholder = '%s' if USE_POSTGRES else '?'
        
        # Check which questions have explanations
        placeholders_str = ','.join([placeholder] * len(question_ids))
        cursor.execute(f'''
        SELECT question_id FROM question_explanations 
        WHERE question_id IN ({placeholders_str})
        AND choice_a_explanation IS NOT NULL
        ''', question_ids)
        
        rows = cursor.fetchall()
        existing_ids = [row_to_dict(row)['question_id'] for row in rows]
        
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


# Daily Progress Tracking Routes
@app.route('/api/daily-progress', methods=['GET'])
def get_daily_progress():
    """Get daily progress for a user"""
    try:
        user_id = request.args.get('user_id', 'anonymous')
        date = request.args.get('date', datetime.now().strftime('%Y-%m-%d'))
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Create daily_progress table if it doesn't exist
        cursor.execute('''
        CREATE TABLE IF NOT EXISTS daily_progress (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id TEXT NOT NULL,
            date TEXT NOT NULL,
            questions_answered INTEGER DEFAULT 0,
            questions_reviewed INTEGER DEFAULT 0,
            question_ids_json TEXT DEFAULT '[]',
            reviewed_ids_json TEXT DEFAULT '[]',
            created_at TEXT,
            updated_at TEXT,
            UNIQUE(user_id, date)
        )
        ''')
        
        cursor.execute('''
        SELECT * FROM daily_progress WHERE user_id = ? AND date = ?
        ''', (user_id, date))
        
        row = cursor.fetchone()
        
        if row:
            progress = dict(row)
            progress['question_ids'] = json.loads(progress.get('question_ids_json', '[]'))
            progress['reviewed_ids'] = json.loads(progress.get('reviewed_ids_json', '[]'))
        else:
            progress = {
                'user_id': user_id,
                'date': date,
                'questions_answered': 0,
                'questions_reviewed': 0,
                'question_ids': [],
                'reviewed_ids': []
            }
        
        conn.close()
        return jsonify({'progress': progress})
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/daily-progress', methods=['POST'])
def update_daily_progress():
    """Update daily progress (questions answered/reviewed)"""
    try:
        data = request.get_json()
        user_id = data.get('user_id', 'anonymous')
        date = data.get('date', datetime.now().strftime('%Y-%m-%d'))
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Create table if needed
        cursor.execute('''
        CREATE TABLE IF NOT EXISTS daily_progress (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id TEXT NOT NULL,
            date TEXT NOT NULL,
            questions_answered INTEGER DEFAULT 0,
            questions_reviewed INTEGER DEFAULT 0,
            question_ids_json TEXT DEFAULT '[]',
            reviewed_ids_json TEXT DEFAULT '[]',
            created_at TEXT,
            updated_at TEXT,
            UNIQUE(user_id, date)
        )
        ''')
        
        # Get current progress
        cursor.execute(convert_query('SELECT * FROM daily_progress WHERE user_id = ? AND date = ?'), (user_id, date))
        existing = cursor.fetchone()
        
        if existing:
            existing_dict = dict(existing)
            current_question_ids = json.loads(existing_dict.get('question_ids_json') or '[]')
            current_reviewed_ids = json.loads(existing_dict.get('reviewed_ids_json') or '[]')
        else:
            current_question_ids = []
            current_reviewed_ids = []
        
        # Merge new question IDs
        new_question_ids = data.get('question_ids', [])
        new_reviewed_ids = data.get('reviewed_ids', [])
        
        for qid in new_question_ids:
            if qid not in current_question_ids:
                current_question_ids.append(qid)
        
        for rid in new_reviewed_ids:
            if rid not in current_reviewed_ids:
                current_reviewed_ids.append(rid)
        
        # Update or insert
        if USE_POSTGRES:
            cursor.execute('''
            INSERT INTO daily_progress (user_id, date, questions_answered, questions_reviewed, 
                                         question_ids_json, reviewed_ids_json, created_at, updated_at)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            ON CONFLICT(user_id, date) DO UPDATE SET
                questions_answered = EXCLUDED.questions_answered,
                questions_reviewed = EXCLUDED.questions_reviewed,
                question_ids_json = EXCLUDED.question_ids_json,
                reviewed_ids_json = EXCLUDED.reviewed_ids_json,
                updated_at = EXCLUDED.updated_at
            ''', (
                user_id, date, 
                len(current_question_ids), len(current_reviewed_ids),
                json.dumps(current_question_ids), json.dumps(current_reviewed_ids),
                datetime.now().isoformat(), datetime.now().isoformat()
            ))
        else:
            cursor.execute('''
            INSERT INTO daily_progress (user_id, date, questions_answered, questions_reviewed, 
                                         question_ids_json, reviewed_ids_json, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(user_id, date) DO UPDATE SET
                questions_answered = excluded.questions_answered,
                questions_reviewed = excluded.questions_reviewed,
                question_ids_json = excluded.question_ids_json,
                reviewed_ids_json = excluded.reviewed_ids_json,
                updated_at = excluded.updated_at
            ''', (
                user_id, date, 
                len(current_question_ids), len(current_reviewed_ids),
                json.dumps(current_question_ids), json.dumps(current_reviewed_ids),
                datetime.now().isoformat(), datetime.now().isoformat()
            ))
        
        conn.commit()
        conn.close()
        
        return jsonify({
            'success': True,
            'progress': {
                'user_id': user_id,
                'date': date,
                'questions_answered': len(current_question_ids),
                'questions_reviewed': len(current_reviewed_ids),
                'question_ids': current_question_ids,
                'reviewed_ids': current_reviewed_ids
            }
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/daily-progress/history', methods=['GET'])
def get_daily_progress_history():
    """Get daily progress history for the last N days"""
    try:
        user_id = request.args.get('user_id', 'anonymous')
        days = int(request.args.get('days', 30))
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        if USE_POSTGRES:
            cursor.execute('''
            SELECT * FROM daily_progress 
            WHERE user_id = %s AND date >= CURRENT_DATE - INTERVAL '%s days'
            ORDER BY date DESC
            ''', (user_id, days))
        else:
            cursor.execute('''
            SELECT * FROM daily_progress 
            WHERE user_id = ? AND date >= date('now', '-' || ? || ' days')
            ORDER BY date DESC
            ''', (user_id, days))
        
        history = []
        for row in cursor.fetchall():
            item = dict(row)
            item['question_ids'] = json.loads(item.get('question_ids_json', '[]'))
            item['reviewed_ids'] = json.loads(item.get('reviewed_ids_json', '[]'))
            history.append(item)
        
        conn.close()
        
        return jsonify({
            'history': history,
            'total_days': len(history),
            'goals_met': sum(1 for h in history if h['questions_answered'] >= 50 and h['questions_reviewed'] >= 50)
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/explanation-feedback', methods=['POST'])
def save_explanation_feedback():
    """Save user feedback on an AI-generated explanation (thumbs up/down)"""
    try:
        data = request.get_json()
        question_id = data.get('question_id')
        user_id = data.get('user_id', 'anonymous')
        thumbs_up = data.get('thumbs_up')
        
        if question_id is None or thumbs_up is None:
            return jsonify({'error': 'question_id and thumbs_up are required'}), 400
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Create feedback table if needed
        cursor.execute('''
        CREATE TABLE IF NOT EXISTS explanation_feedback (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            question_id TEXT NOT NULL,
            user_id TEXT NOT NULL,
            thumbs_up INTEGER NOT NULL,
            created_at TEXT,
            UNIQUE(question_id, user_id)
        )
        ''')
        
        # Insert or update feedback
        if USE_POSTGRES:
            cursor.execute('''
            INSERT INTO explanation_feedback (question_id, user_id, thumbs_up, created_at)
            VALUES (%s, %s, %s, %s)
            ON CONFLICT(question_id, user_id) DO UPDATE SET
                thumbs_up = EXCLUDED.thumbs_up,
                created_at = EXCLUDED.created_at
            ''', (question_id, user_id, 1 if thumbs_up else 0, datetime.now().isoformat()))
        else:
            cursor.execute('''
            INSERT INTO explanation_feedback (question_id, user_id, thumbs_up, created_at)
            VALUES (?, ?, ?, ?)
            ON CONFLICT(question_id, user_id) DO UPDATE SET
                thumbs_up = excluded.thumbs_up,
                created_at = excluded.created_at
            ''', (question_id, user_id, 1 if thumbs_up else 0, datetime.now().isoformat()))
        
        # If thumbs down, mark the explanation as not to be stored/cached
        if not thumbs_up:
            # Remove from question_explanations if it exists and was AI-generated
            cursor.execute(convert_query('''
            DELETE FROM question_explanations 
            WHERE question_id = ? AND ai_explanation IS NOT NULL
            '''), (question_id,))
        
        conn.commit()
        
        # Get aggregate feedback stats for this question
        cursor.execute(convert_query('''
        SELECT 
            SUM(CASE WHEN thumbs_up = 1 THEN 1 ELSE 0 END) as up_count,
            SUM(CASE WHEN thumbs_up = 0 THEN 1 ELSE 0 END) as down_count
        FROM explanation_feedback WHERE question_id = ?
        '''), (question_id,))
        
        stats = cursor.fetchone()
        conn.close()
        
        if stats:
            stats_dict = dict(stats) if isinstance(stats, dict) else {'up_count': stats[0], 'down_count': stats[1]}
            return jsonify({
                'success': True,
                'message': 'Feedback saved',
                'stats': {
                    'up_count': stats_dict.get('up_count') or 0,
                    'down_count': stats_dict.get('down_count') or 0
                }
            })
        
        return jsonify({
            'success': True,
            'message': 'Feedback saved',
            'stats': {'up_count': 0, 'down_count': 0}
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/explanation-feedback/<question_id>', methods=['GET'])
def get_explanation_feedback(question_id):
    """Get feedback status for a question's explanation"""
    try:
        user_id = request.args.get('user_id', 'anonymous')
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Get user's feedback
        cursor.execute(convert_query('''
        SELECT thumbs_up FROM explanation_feedback 
        WHERE question_id = ? AND user_id = ?
        '''), (question_id, user_id))
        
        user_feedback = cursor.fetchone()
        
        # Get aggregate stats
        cursor.execute(convert_query('''
        SELECT 
            SUM(CASE WHEN thumbs_up = 1 THEN 1 ELSE 0 END) as up_count,
            SUM(CASE WHEN thumbs_up = 0 THEN 1 ELSE 0 END) as down_count
        FROM explanation_feedback WHERE question_id = ?
        '''), (question_id,))
        
        stats = cursor.fetchone()
        conn.close()
        
        user_feedback_value = None
        if user_feedback:
            user_feedback_dict = dict(user_feedback) if isinstance(user_feedback, dict) else {'thumbs_up': user_feedback[0]}
            user_feedback_value = user_feedback_dict.get('thumbs_up')
        
        stats_result = {'up_count': 0, 'down_count': 0}
        if stats:
            stats_dict = dict(stats) if isinstance(stats, dict) else {'up_count': stats[0], 'down_count': stats[1]}
            stats_result = {
                'up_count': stats_dict.get('up_count') or 0,
                'down_count': stats_dict.get('down_count') or 0
            }
        
        return jsonify({
            'user_feedback': user_feedback_value,
            'stats': stats_result
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/track-review', methods=['POST'])
def track_question_review():
    """Track when a user views an explanation (for daily review goal)"""
    try:
        data = request.get_json()
        question_id = data.get('question_id')
        user_id = data.get('user_id', 'anonymous')
        
        if not question_id:
            return jsonify({'error': 'question_id is required'}), 400
        
        today = datetime.now().strftime('%Y-%m-%d')
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Create table if needed
        cursor.execute('''
        CREATE TABLE IF NOT EXISTS daily_progress (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id TEXT NOT NULL,
            date TEXT NOT NULL,
            questions_answered INTEGER DEFAULT 0,
            questions_reviewed INTEGER DEFAULT 0,
            question_ids_json TEXT DEFAULT '[]',
            reviewed_ids_json TEXT DEFAULT '[]',
            created_at TEXT,
            updated_at TEXT,
            UNIQUE(user_id, date)
        )
        ''')
        
        # Get or create today's progress
        cursor.execute(convert_query('SELECT * FROM daily_progress WHERE user_id = ? AND date = ?'), (user_id, today))
        existing = cursor.fetchone()
        
        if existing:
            existing_dict = dict(existing)
            reviewed_ids = json.loads(existing_dict.get('reviewed_ids_json') or '[]')
            question_ids = json.loads(existing_dict.get('question_ids_json') or '[]')
        else:
            reviewed_ids = []
            question_ids = []
        
        # Add to reviewed if not already there
        already_reviewed = question_id in reviewed_ids
        if not already_reviewed:
            reviewed_ids.append(question_id)
        
        # Update database
        if USE_POSTGRES:
            cursor.execute('''
            INSERT INTO daily_progress (user_id, date, questions_answered, questions_reviewed, 
                                         question_ids_json, reviewed_ids_json, created_at, updated_at)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            ON CONFLICT(user_id, date) DO UPDATE SET
                questions_reviewed = EXCLUDED.questions_reviewed,
                reviewed_ids_json = EXCLUDED.reviewed_ids_json,
                updated_at = EXCLUDED.updated_at
            ''', (
                user_id, today, 
                len(question_ids), len(reviewed_ids),
                json.dumps(question_ids), json.dumps(reviewed_ids),
                datetime.now().isoformat(), datetime.now().isoformat()
            ))
        else:
            cursor.execute('''
            INSERT INTO daily_progress (user_id, date, questions_answered, questions_reviewed, 
                                         question_ids_json, reviewed_ids_json, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(user_id, date) DO UPDATE SET
                questions_reviewed = excluded.questions_reviewed,
                reviewed_ids_json = excluded.reviewed_ids_json,
                updated_at = excluded.updated_at
            ''', (
                user_id, today, 
                len(question_ids), len(reviewed_ids),
                json.dumps(question_ids), json.dumps(reviewed_ids),
                datetime.now().isoformat(), datetime.now().isoformat()
            ))
        
        conn.commit()
        conn.close()
        
        return jsonify({
            'success': True,
            'already_reviewed': already_reviewed,
            'reviews_today': len(reviewed_ids),
            'review_goal': 50,
            'goal_met': len(reviewed_ids) >= 50
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
        db_path_for_auth = get_db_path_as_path() if not USE_POSTGRES else Path(".")
        user = create_user(username, email, password, db_path_for_auth)
        
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
        print(f"Registration error: {type(e).__name__}: {e}")
        return jsonify({'error': 'Registration failed', 'detail': str(e)}), 500

# ==================== Essay Endpoints ====================

# Essay vector store ID for California Bar grading
ESSAY_VECTOR_STORE_ID = os.environ.get('ESSAY_VECTOR_STORE_ID', 'vs_68884d7436748191984636f06588ef5b')

@app.route('/api/essay-prompts', methods=['GET'])
def get_essay_prompts():
    """Get essay prompts with optional filters."""
    try:
        subject = request.args.get('subject', '')
        year = request.args.get('year', '')
        month = request.args.get('month', '')
        limit = int(request.args.get('limit', 50))
        offset = int(request.args.get('offset', 0))
        
        conn = get_db_connection()
        cursor = conn.cursor()
        placeholder = '%s' if USE_POSTGRES else '?'
        
        where_conditions: List[str] = []
        params: List[Any] = []
        
        if subject:
            where_conditions.append(f'subject = {placeholder}')
            params.append(subject)
        
        if year:
            where_conditions.append(f'exam_year = {placeholder}')
            params.append(int(year))
        
        if month:
            where_conditions.append(f'exam_month = {placeholder}')
            params.append(month)
        
        where_clause = f'WHERE {" AND ".join(where_conditions)}' if where_conditions else ''
        
        # Get total count
        cursor.execute(f'SELECT COUNT(*) FROM essay_prompts {where_clause}', params)
        total = get_scalar(cursor.fetchone())
        
        # Get prompts (without full text for list view)
        query = f'''
            SELECT id, exam_id, exam_year, exam_month, question_number, subject, 
                   source_pdf, created_at,
                   LENGTH(prompt_text) as prompt_length,
                   CASE WHEN model_answer IS NOT NULL THEN 1 ELSE 0 END as has_model_answer
            FROM essay_prompts 
            {where_clause}
            ORDER BY exam_year DESC, exam_month, question_number
            LIMIT {placeholder} OFFSET {placeholder}
        '''
        cursor.execute(query, params + [limit, offset])
        prompts = cursor.fetchall()
        conn.close()
        
        return jsonify({
            'prompts': [dict(row) for row in prompts],
            'total': total,
            'limit': limit,
            'offset': offset
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/essay-prompts/<int:prompt_id>', methods=['GET'])
def get_essay_prompt(prompt_id):
    """Get a single essay prompt with full text."""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        placeholder = '%s' if USE_POSTGRES else '?'
        
        cursor.execute(f'''
            SELECT * FROM essay_prompts WHERE id = {placeholder}
        ''', (prompt_id,))
        
        prompt = cursor.fetchone()
        conn.close()
        
        if not prompt:
            return jsonify({'error': 'Essay prompt not found'}), 404
        
        return jsonify({'prompt': dict(prompt)})
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# =============================================================================
# AI CHAT ENDPOINT - Study Assistant
# =============================================================================

@app.route('/api/ai/chat', methods=['POST'])
def ai_chat():
    """
    AI Chat endpoint for the study assistant widget.
    Uses OpenAI's API with the vector store for context-aware responses.
    """
    if not vector_store_service:
        return jsonify({
            'error': 'AI service not configured',
            'message': 'OpenAI API key not set'
        }), 503
    
    data = request.get_json()
    if not data:
        return jsonify({'error': 'No data provided'}), 400
    
    message = data.get('message', '').strip()
    conversation_history = data.get('history', [])
    
    if not message:
        return jsonify({'error': 'Message is required'}), 400
    
    try:
        # Build the conversation context
        system_prompt = """You are a knowledgeable study assistant specializing in California Bar Exam preparation. 
You have access to comprehensive legal materials through a vector store containing bar exam content.

Your role is to:
1. Answer questions about legal concepts, rules, and doctrines
2. Explain legal principles in clear, understandable terms
3. Provide examples and hypotheticals to illustrate concepts
4. Help students understand how to apply legal rules to fact patterns
5. Clarify common misconceptions and tricky areas

Be concise but thorough. When appropriate, mention which subjects or topics the question relates to.
If you're unsure about something, say so rather than making up information.

Format your responses with clear structure:
- Use bullet points for lists
- Bold key terms when introducing them
- Provide brief examples where helpful"""

        # Use the vector store service's async method via asyncio
        import asyncio
        
        async def get_ai_response():
            import aiohttp

            # Build messages array with history
            messages = [{"role": "system", "content": system_prompt}]
            
            # Add conversation history (last 10 exchanges to stay within context limits)
            for entry in conversation_history[-10:]:
                messages.append({
                    "role": entry.get("role", "user"),
                    "content": entry.get("content", "")
                })
            
            # Add current message
            messages.append({"role": "user", "content": message})
            
            # Call OpenAI Chat API
            async with aiohttp.ClientSession() as session:
                headers = {
                    "Authorization": f"Bearer {vector_store_service.api_key}",
                    "Content-Type": "application/json"
                }
                
                payload = {
                    "model": "gpt-4o-mini",
                    "messages": messages,
                    "max_tokens": 1000,
                    "temperature": 0.7
                }
                
                async with session.post(
                    "https://api.openai.com/v1/chat/completions",
                    headers=headers,
                    json=payload
                ) as response:
                    if response.status != 200:
                        error_text = await response.text()
                        raise Exception(f"OpenAI API error: {response.status} - {error_text}")
                    
                    result = await response.json()
                    return result['choices'][0]['message']['content']
        
        # Run the async function
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        try:
            response_text = loop.run_until_complete(get_ai_response())
        finally:
            loop.close()
        
        return jsonify({
            'response': response_text,
            'success': True
        })
        
    except Exception as e:
        print(f"AI Chat error: {e}")
        return jsonify({
            'error': 'Failed to get AI response',
            'message': str(e)
        }), 500


@app.route('/api/essay-prompts/subjects', methods=['GET'])
def get_essay_subjects():
    """Get all available essay subjects with counts."""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT subject, COUNT(*) as count 
            FROM essay_prompts 
            WHERE subject IS NOT NULL 
            GROUP BY subject 
            ORDER BY count DESC
        ''')
        
        rows = cursor.fetchall()
        subjects = [{'subject': row_to_dict(r)['subject'], 'count': row_to_dict(r)['count']} for r in rows]
        conn.close()
        
        return jsonify({'subjects': subjects})
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/essay-prompts/years', methods=['GET'])
def get_essay_years():
    """Get all available exam years with counts."""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT exam_year, exam_month, COUNT(*) as count 
            FROM essay_prompts 
            GROUP BY exam_year, exam_month 
            ORDER BY exam_year DESC, exam_month
        ''')
        
        rows = cursor.fetchall()
        years = [{'year': row_to_dict(r)['exam_year'], 'month': row_to_dict(r)['exam_month'], 'count': row_to_dict(r)['count']} for r in rows]
        conn.close()
        
        return jsonify({'years': years})
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# Local development server
if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5001))
    debug = os.environ.get('FLASK_ENV') != 'production'
    print(f"Starting Barbarossa API server on port {port}...")
    print(f"Database: {'PostgreSQL' if USE_POSTGRES else 'SQLite'}")
    print(f"CORS origins: {CORS_ORIGINS}")
    app.run(host='0.0.0.0', port=port, debug=debug)

"""
Essays Blueprint - handles essay prompts and grading endpoints.
"""

import os
from typing import Any, List

from flask import Blueprint, jsonify, request

from ..utils.database import (USE_POSTGRES, get_db_connection, get_placeholder,
                              get_scalar, row_to_dict)

essays_bp = Blueprint('essays', __name__, url_prefix='/api')

# Essay vector store ID for California Bar grading
ESSAY_VECTOR_STORE_ID = os.environ.get('ESSAY_VECTOR_STORE_ID', 'vs_68884d7436748191984636f06588ef5b')


@essays_bp.route('/essay-prompts', methods=['GET'])
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
        placeholder = get_placeholder()
        
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
            'prompts': [row_to_dict(row) for row in prompts],
            'total': total,
            'limit': limit,
            'offset': offset
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@essays_bp.route('/essay-prompts/<int:prompt_id>', methods=['GET'])
def get_essay_prompt(prompt_id):
    """Get a single essay prompt with full text."""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        placeholder = get_placeholder()
        
        cursor.execute(f'''
            SELECT * FROM essay_prompts WHERE id = {placeholder}
        ''', (prompt_id,))
        
        prompt = cursor.fetchone()
        conn.close()
        
        if not prompt:
            return jsonify({'error': 'Essay prompt not found'}), 404
        
        return jsonify({'prompt': row_to_dict(prompt)})
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@essays_bp.route('/essay-prompts/subjects', methods=['GET'])
def get_essay_subjects():
    """Get unique subjects from essay prompts."""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT DISTINCT subject FROM essay_prompts 
            WHERE subject IS NOT NULL 
            ORDER BY subject
        ''')
        
        rows = cursor.fetchall()
        subjects = [row_to_dict(row)['subject'] for row in rows]
        conn.close()
        
        return jsonify({'subjects': subjects})
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@essays_bp.route('/essay-prompts/years', methods=['GET'])
def get_essay_years():
    """Get unique years from essay prompts."""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT DISTINCT exam_year FROM essay_prompts 
            WHERE exam_year IS NOT NULL 
            ORDER BY exam_year DESC
        ''')
        
        rows = cursor.fetchall()
        years = [row_to_dict(row)['exam_year'] for row in rows]
        conn.close()
        
        return jsonify({'years': years})
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

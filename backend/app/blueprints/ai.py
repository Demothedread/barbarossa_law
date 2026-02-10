"""
AI Blueprint - handles AI explanations, chat, and vector store endpoints.
"""

from typing import Optional

from flask import Blueprint, jsonify, request

ai_bp = Blueprint('ai', __name__, url_prefix='/api')

# These will be set by the main app
ai_service = None
essay_grader_service = None
vector_store_service = None


def init_ai_services(ai_svc, essay_svc, vector_svc):
    """Initialize AI services for the blueprint."""
    global ai_service, essay_grader_service, vector_store_service
    ai_service = ai_svc
    essay_grader_service = essay_svc
    vector_store_service = vector_svc


@ai_bp.route('/explanations', methods=['POST'])
async def get_ai_explanations():
    """Get AI-generated explanations for a list of question IDs."""
    try:
        if not ai_service:
            return jsonify({'error': 'AI explanations not available. Set OPENAI_API_KEY env variable'}), 500
        
        data = request.get_json()
        question_ids = data.get('question_ids', [])
        
        if not question_ids:
            return jsonify({'error': 'No question IDs provided'}), 400
        
        explanations = await ai_service.generate_explanations_for_quiz(question_ids)
        
        transformed_explanations = {}
        for question_id, explanation_data in explanations.items():
            if 'explanations' in explanation_data:
                transformed_explanations[question_id] = {
                    'correct_answer': explanation_data.get('correct_answer', ''),
                    'choice_a_explanation': explanation_data['explanations'].get('A', ''),
                    'choice_b_explanation': explanation_data['explanations'].get('B', ''),
                    'choice_c_explanation': explanation_data['explanations'].get('C', ''),
                    'choice_d_explanation': explanation_data['explanations'].get('D', ''),
                    'subtopic': explanation_data.get('subtopic', '')
                }
            else:
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


@ai_bp.route('/essay-grade', methods=['POST'])
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

            if max_points <= 0 or max_points > 500:
                return jsonify({'error': 'max_points must be between 1 and 500'}), 400

        result = await essay_grader_service.grade_essay(question_text, answer_text, max_points)
        return jsonify({'success': True, 'grade': result})

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@ai_bp.route('/ai/chat', methods=['POST'])
async def ai_chat():
    """AI chat endpoint for study assistance."""
    try:
        if not ai_service:
            return jsonify({'error': 'AI service not available'}), 500
        
        data = request.get_json() or {}
        message = data.get('message', '').strip()
        context = data.get('context', {})
        history = data.get('history', [])
        
        if not message:
            return jsonify({'error': 'Message is required'}), 400
        
        response = await ai_service.chat(message, context=context, history=history)
        return jsonify({'response': response})
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@ai_bp.route('/vector-store/status', methods=['GET'])
def get_vector_store_status():
    """Get vector store service status."""
    try:
        if not vector_store_service:
            return jsonify({
                'available': False,
                'message': 'Vector store service not initialized'
            })
        
        status = vector_store_service.get_status()
        return jsonify({
            'available': True,
            'status': status
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@ai_bp.route('/generate-mbe-questions', methods=['POST'])
async def generate_mbe_questions():
    """Generate new MBE-style questions using vector store."""
    try:
        if not vector_store_service:
            return jsonify({'error': 'Vector store service not available'}), 500
        
        data = request.get_json() or {}
        subject = data.get('subject', '')
        subtopic = data.get('subtopic')
        count = data.get('count', 1)
        
        if not subject:
            return jsonify({'error': 'Subject is required'}), 400
        
        if count < 1 or count > 10:
            return jsonify({'error': 'Count must be between 1 and 10'}), 400
        
        result = await vector_store_service.generate_questions(
            subject=subject,
            subtopic=subtopic,
            count=count
        )
        
        return jsonify(result)
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@ai_bp.route('/generation-stats', methods=['GET'])
def get_generation_stats():
    """Get question generation statistics."""
    try:
        from ..utils.database import get_db_connection, row_to_dict
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT subject, COUNT(*) as count 
            FROM questions 
            WHERE generated = 1 
            GROUP BY subject
        ''')
        rows = cursor.fetchall()
        conn.close()
        
        stats = {row_to_dict(row)['subject']: row_to_dict(row)['count'] for row in rows}
        return jsonify({'stats': stats})
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@ai_bp.route('/subtopic-weights', methods=['GET'])
def get_subtopic_weights():
    """Get subtopic weights for question generation."""
    try:
        from ..utils.database import (get_db_connection, get_placeholder,
                                      row_to_dict)
        
        subject = request.args.get('subject', '')
        if not subject:
            return jsonify({'error': 'Subject is required'}), 400
        
        conn = get_db_connection()
        cursor = conn.cursor()
        placeholder = get_placeholder()
        
        query = f'''
            SELECT subtopic, COUNT(*) as count 
            FROM questions 
            WHERE subject = {placeholder} AND subtopic IS NOT NULL 
            GROUP BY subtopic
        '''
        cursor.execute(query, (subject,))
        rows = cursor.fetchall()
        conn.close()
        
        weights = {}
        for row in rows:
            row_dict = row_to_dict(row)
            subtopic = row_dict['subtopic']
            if subtopic:
                weights[subtopic] = row_dict['count']
        
        return jsonify({'weights': weights})
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

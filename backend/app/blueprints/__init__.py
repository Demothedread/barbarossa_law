"""Blueprints for the Law Quizzer backend."""

from .ai import ai_bp, init_ai_services
from .essays import essays_bp
from .questions import questions_bp
from .quiz import quiz_bp

__all__ = [
    'ai_bp',
    'essays_bp',
    'questions_bp',
    'quiz_bp',
    'init_ai_services',
]

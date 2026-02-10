"""
Law Quizzer Backend Application Package.

This package provides a modular Flask application with blueprints
for different API domains.
"""

import os
from pathlib import Path
from typing import Optional

from flask import Flask
from flask_cors import CORS


def create_app(config: Optional[dict] = None) -> Flask:
    """Create and configure the Flask application."""
    app = Flask(__name__)
    
    # Load configuration
    if config:
        app.config.update(config)
    
    # CORS configuration
    CORS(app, 
         resources={r"/api/*": {"origins": "*"}}, 
         supports_credentials=True,
         allow_headers=['Content-Type', 'Authorization', 'X-Requested-With'],
         methods=['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'])
    
    # Register blueprints
    from .blueprints import ai_bp, essays_bp, questions_bp, quiz_bp
    
    app.register_blueprint(questions_bp)
    app.register_blueprint(ai_bp)
    app.register_blueprint(quiz_bp)
    app.register_blueprint(essays_bp)
    
    # Health check endpoint
    @app.route('/api/health', methods=['GET'])
    def health_check():
        from flask import jsonify
        return jsonify({'status': 'healthy'})
    
    # Root endpoint
    @app.route('/', methods=['GET'])
    def root():
        from flask import jsonify
        return jsonify({
            'name': 'Law Quizzer API',
            'version': '2.0.0',
            'endpoints': '/api/*'
        })
    
    return app


__all__ = ['create_app']

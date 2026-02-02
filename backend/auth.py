#!/usr/bin/env python3
"""
Authentication utilities for Law Quizzer
Handles JWT tokens, password hashing, and user management
"""

import bcrypt
import jwt
import sqlite3
from datetime import datetime, timedelta
from functools import wraps
from pathlib import Path
from flask import request, jsonify, current_app, g
import os
from typing import Optional

# PostgreSQL support
DATABASE_URL = os.environ.get('DATABASE_URL')
USE_POSTGRES = bool(DATABASE_URL)

# JWT Secret key - in production this should be a secure random key
JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY', 'your-secret-key-change-in-production')
JWT_ALGORITHM = 'HS256'
JWT_EXPIRATION_HOURS = 24


def get_db_connection(db_path: Optional[Path] = None):
    """Get database connection - PostgreSQL in production, SQLite locally."""
    if USE_POSTGRES:
        import psycopg2
        from psycopg2.extras import RealDictCursor
        conn = psycopg2.connect(DATABASE_URL, cursor_factory=RealDictCursor)
        return conn
    else:
        conn = sqlite3.connect(str(db_path))
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

def hash_password(password: str) -> str:
    """Hash a password using bcrypt"""
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    """Verify a password against its hash"""
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def generate_jwt_token(user_id: int, username: str) -> str:
    """Generate a JWT token for a user"""
    payload = {
        'user_id': user_id,
        'username': username,
        'exp': datetime.utcnow() + timedelta(hours=JWT_EXPIRATION_HOURS),
        'iat': datetime.utcnow()
    }
    return jwt.encode(payload, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)

def decode_jwt_token(token: str) -> dict:
    """Decode and verify a JWT token"""
    try:
        payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise ValueError('Token has expired')
    except jwt.InvalidTokenError:
        raise ValueError('Invalid token')

def get_user_from_token(token: str, db_path: Path) -> dict:
    """Get user information from a JWT token"""
    payload = decode_jwt_token(token)
    user_id = payload.get('user_id')
    
    conn = get_db_connection(db_path)
    cursor = conn.cursor()
    
    p = get_placeholder()
    cursor.execute(convert_query('''
        SELECT u.*, up.audio_enabled, up.background_music_enabled, 
               up.volume_level, up.preferred_subjects, up.theme_preference
        FROM users u
        LEFT JOIN user_preferences up ON u.id = up.user_id
        WHERE u.id = ?
    '''), (user_id,))
    
    user = cursor.fetchone()
    conn.close()
    
    if not user:
        raise ValueError('User not found')
    
    return dict(user)

def require_auth(f):
    """Decorator to require authentication for a route"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        auth_header = request.headers.get('Authorization')
        
        if not auth_header:
            return jsonify({'error': 'No authorization header'}), 401
        
        try:
            # Extract token from "Bearer <token>" format
            token = auth_header.split(' ')[1] if ' ' in auth_header else auth_header
            payload = decode_jwt_token(token)
            
            # Add user info to Flask's g object
            g.user_id = payload.get('user_id')
            g.username = payload.get('username')
            
        except (IndexError, ValueError) as e:
            return jsonify({'error': 'Invalid token'}), 401
        
        return f(*args, **kwargs)
    
    return decorated_function

def create_user(username: str, email: str, password: str, db_path: Path) -> dict:
    """Create a new user account"""
    conn = get_db_connection(db_path)
    cursor = conn.cursor()
    
    try:
        # Check if username or email already exists
        cursor.execute(convert_query('SELECT id FROM users WHERE username = ? OR email = ?'), (username, email))
        if cursor.fetchone():
            raise ValueError('Username or email already exists')
        
        # Hash password and create user
        password_hash = hash_password(password)
        
        if USE_POSTGRES:
            # PostgreSQL uses RETURNING to get the inserted ID
            cursor.execute('''
                INSERT INTO users (username, email, password_hash, created_at)
                VALUES (%s, %s, %s, %s)
                RETURNING id
            ''', (username, email, password_hash, datetime.now().isoformat()))
            user_id = cursor.fetchone()['id']
        else:
            cursor.execute('''
                INSERT INTO users (username, email, password_hash, created_at)
                VALUES (?, ?, ?, ?)
            ''', (username, email, password_hash, datetime.now().isoformat()))
            user_id = cursor.lastrowid
        
        # Create default preferences
        cursor.execute(convert_query('''
            INSERT INTO user_preferences (user_id, audio_enabled, background_music_enabled, 
                                        volume_level, theme_preference)
            VALUES (?, 1, 1, 0.7, 'classic')
        '''), (user_id,))
        
        conn.commit()
        
        # Return user info without password
        cursor.execute(convert_query('''
            SELECT u.id, u.username, u.email, u.created_at,
                   up.audio_enabled, up.background_music_enabled, up.volume_level,
                   up.preferred_subjects, up.theme_preference
            FROM users u
            LEFT JOIN user_preferences up ON u.id = up.user_id
            WHERE u.id = ?
        '''), (user_id,))
        
        user = dict(cursor.fetchone())
        return user
        
    except Exception as e:
        conn.rollback()
        if 'unique' in str(e).lower() or 'duplicate' in str(e).lower():
            raise ValueError('Username or email already exists')
        raise
    finally:
        conn.close()

def authenticate_user(username: str, password: str, db_path: Path) -> dict:
    """Authenticate a user with username and password"""
    conn = get_db_connection(db_path)
    cursor = conn.cursor()
    
    try:
        # Get user by username or email
        cursor.execute(convert_query('''
            SELECT u.*, up.audio_enabled, up.background_music_enabled, 
                   up.volume_level, up.preferred_subjects, up.theme_preference
            FROM users u
            LEFT JOIN user_preferences up ON u.id = up.user_id
            WHERE u.username = ? OR u.email = ?
        '''), (username, username))
        
        user = cursor.fetchone()
        
        if not user or not verify_password(password, user['password_hash']):
            raise ValueError('Invalid username or password')
        
        # Update last login
        cursor.execute(convert_query('''
            UPDATE users SET last_login = ? WHERE id = ?
        '''), (datetime.now().isoformat(), user['id']))
        
        conn.commit()
        
        # Return user info without password
        user_dict = dict(user)
        del user_dict['password_hash']
        return user_dict
        
    finally:
        conn.close()

def update_user_preferences(user_id: int, preferences: dict, db_path: Path) -> bool:
    """Update user preferences"""
    conn = get_db_connection(db_path)
    cursor = conn.cursor()
    
    try:
        # Build dynamic update query based on provided preferences
        update_fields = []
        values = []
        
        allowed_fields = ['audio_enabled', 'background_music_enabled', 'volume_level', 
                         'preferred_subjects', 'theme_preference']
        
        for field in allowed_fields:
            if field in preferences:
                update_fields.append(f'{field} = ?')
                values.append(preferences[field])
        
        if not update_fields:
            return True  # Nothing to update
        
        values.append(user_id)
        
        if USE_POSTGRES:
            # PostgreSQL uses ON CONFLICT for upsert
            cursor.execute('''
                INSERT INTO user_preferences 
                (user_id, audio_enabled, background_music_enabled, volume_level, 
                 preferred_subjects, theme_preference)
                VALUES (%s, %s, %s, %s, %s, %s)
                ON CONFLICT (user_id) DO UPDATE SET
                    audio_enabled = EXCLUDED.audio_enabled,
                    background_music_enabled = EXCLUDED.background_music_enabled,
                    volume_level = EXCLUDED.volume_level,
                    preferred_subjects = EXCLUDED.preferred_subjects,
                    theme_preference = EXCLUDED.theme_preference
            ''', (
                user_id,
                preferences.get('audio_enabled', 1),
                preferences.get('background_music_enabled', 1),
                preferences.get('volume_level', 0.7),
                preferences.get('preferred_subjects', ''),
                preferences.get('theme_preference', 'classic')
            ))
        else:
            # SQLite uses INSERT OR REPLACE
            cursor.execute('''
                INSERT OR REPLACE INTO user_preferences 
                (user_id, audio_enabled, background_music_enabled, volume_level, 
                 preferred_subjects, theme_preference)
                VALUES (?, ?, ?, ?, ?, ?)
            ''', (
                user_id,
                preferences.get('audio_enabled', 1),
                preferences.get('background_music_enabled', 1),
                preferences.get('volume_level', 0.7),
                preferences.get('preferred_subjects', ''),
                preferences.get('theme_preference', 'classic')
            ))
        
        conn.commit()
        return True
        
    except Exception as e:
        print(f"Error updating preferences: {e}")
        return False
    finally:
        conn.close()
#!/usr/bin/env python3
"""
AI Explanations Module for Law Quizzer
Handles API calls to OpenAI's models for generating answer explanations
"""

import asyncio
import json
import os
import sqlite3
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Optional

import aiohttp

# Default to GPT-4o-mini as it's currently the best price-performance model
DEFAULT_MODEL = "gpt-4o-mini"

class AIExplainService:
    def __init__(self, db_path: Path, api_key: Optional[str] = None):
        """Initialize the AI explanation service
        
        Args:
            db_path: Path to the SQLite database
            api_key: OpenAI API key (uses env var OPENAI_API_KEY if not provided)
        """
        self.db_path = db_path
        self.api_key = api_key or os.environ.get("OPENAI_API_KEY")
        if not self.api_key:
            raise ValueError("OpenAI API key not found. Set OPENAI_API_KEY environment variable.")
    
    async def _call_openai_api(self, prompt: str) -> Dict[str, Any]:
        """Make an async call to OpenAI API
        
        Args:
            prompt: The prompt to send to OpenAI
            
        Returns:
            JSON response from OpenAI
        """
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {self.api_key}"
        }
        
        payload = {
            "model": DEFAULT_MODEL,
            "messages": [
                {"role": "system", "content": self._get_system_prompt()},
                {"role": "user", "content": prompt}
            ],
            "temperature": 0.2,  # Lower temperature for more consistent results
            "response_format": {"type": "json_object"}  # Request JSON format
        }
        
        async with aiohttp.ClientSession() as session:
            async with session.post(
                "https://api.openai.com/v1/chat/completions",
                headers=headers,
                json=payload
            ) as response:
                if response.status != 200:
                    error_text = await response.text()
                    raise Exception(f"OpenAI API error: {response.status} - {error_text}")
                
                result = await response.json()
                return result
    
    def _get_system_prompt(self) -> str:
        """Return the system prompt for the OpenAI API"""
        return """You are a California Bar Exam expert specialized in explaining multiple choice questions.
For each law question I provide, analyze each answer choice and explain:
1) Which choice is correct and WHY it's the best application of the law
2) Why each incorrect choice is wrong

Your explanations should:
- Be concise (3-5 sentences per answer choice)
- Clearly state the relevant rule of law as you would in a bar exam essay
- Include helpful mnemonics, anagrams, or memory devices where appropriate
- Be specifically tailored for California Bar Exam preparation
- Be precise and accurate in your legal reasoning

Format your response as a JSON object with this structure:
{
  "correct_answer": "A/B/C/D",
  "explanations": {
    "A": "explanation for why A is right/wrong...",
    "B": "explanation for why B is right/wrong...",
    "C": "explanation for why C is right/wrong...",
    "D": "explanation for why D is right/wrong..."
  }
}

The explanation for the correct answer should be the most detailed and should articulate the rule of law clearly.
"""

    async def generate_explanation(self, question_data: Dict[str, Any]) -> Dict[str, Any]:
        """Generate AI explanation for a question
        
        Args:
            question_data: Dictionary containing question data
            
        Returns:
            Dictionary with AI explanations
        """
        # Extract question components
        prompt_text = question_data.get('prompt', '')
        question_text = question_data['question']
        
        # Construct the prompt
        user_prompt = f"""Question context: {prompt_text}

Question: {question_text}

Answer choices:
A. {question_data['choice_a']}
B. {question_data['choice_b']}
C. {question_data['choice_c']}
D. {question_data['choice_d']}

Correct answer: {question_data['answer']}

Provide your analysis of all answer choices according to the format specified."""

        try:
            response = await self._call_openai_api(user_prompt)
            ai_content = json.loads(response['choices'][0]['message']['content'])
            
            # Validate the response format
            if not isinstance(ai_content, dict) or 'explanations' not in ai_content:
                raise ValueError("Invalid response format from OpenAI")
                
            return ai_content
            
        except Exception as e:
            print(f"Error generating explanation: {e}")
            return {
                "correct_answer": question_data['answer'],
                "explanations": {
                    "A": "Error generating explanation.",
                    "B": "Error generating explanation.",
                    "C": "Error generating explanation.",
                    "D": "Error generating explanation."
                }
            }
    
    async def generate_explanations_for_quiz(self, question_ids: List[str]) -> Dict[str, Dict]:
        """Generate explanations for a batch of questions
        
        Args:
            question_ids: List of question IDs to generate explanations for
            
        Returns:
            Dictionary mapping question IDs to their explanations
        """
        conn = sqlite3.connect(str(self.db_path))
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        
        results = {}
        
        for q_id in question_ids:
            # Check if we already have an explanation
            cursor.execute(
                "SELECT ai_explanation FROM question_explanations WHERE question_id = ?",
                (q_id,)
            )
            existing = cursor.fetchone()
            
            if existing and existing['ai_explanation']:
                # Use cached explanation
                results[q_id] = json.loads(existing['ai_explanation'])
                continue
            
            # Get question data
            cursor.execute("SELECT * FROM questions WHERE idx = ?", (q_id,))
            question = cursor.fetchone()
            
            if not question:
                continue
            
            # Convert to dict
            question_dict = dict(question)
            
            # Generate explanation
            explanation = await self.generate_explanation(question_dict)
            
            # Store in DB
            cursor.execute(
                """
                INSERT INTO question_explanations (question_id, ai_explanation, created_at)
                VALUES (?, ?, ?)
                ON CONFLICT(question_id) DO UPDATE SET
                    ai_explanation = excluded.ai_explanation,
                    updated_at = ?
                """,
                (
                    q_id,
                    json.dumps(explanation),
                    datetime.now().isoformat(),
                    datetime.now().isoformat()
                )
            )
            
            results[q_id] = explanation
        
        conn.commit()
        conn.close()
        
        return results

# Create the table if it doesn't exist
def ensure_explanations_table(db_path: Path):
    """Ensure the question_explanations table exists"""
    conn = sqlite3.connect(str(db_path))
    cursor = conn.cursor()
    
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS question_explanations (
        question_id TEXT PRIMARY KEY,
        ai_explanation TEXT,
        created_at TEXT,
        updated_at TEXT
    )
    """)
    
    conn.commit()
    conn.close()

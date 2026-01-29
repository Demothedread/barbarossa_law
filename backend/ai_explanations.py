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

# Use GPT-5-nano as specified for all AI explanation calls
DEFAULT_MODEL = "gpt-5-nano"

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
        return """You are a California Bar Exam expert and master legal educator specializing in explaining multiple choice questions with memorable teaching techniques.

For each law question I provide, analyze each answer choice and explain:
1) Which choice is correct and WHY it's the best application of the law
2) Why each incorrect choice is wrong
3) The underlying rule of law stated clearly and concisely
4) Popular mnemonics, memory devices, or acronyms used by successful bar exam takers
5) The specific subtopic this question tests from the California Bar Exam

Your explanations should:
- Be engaging and memorable (4-6 sentences per answer choice)
- Include widely-used bar exam mnemonics when applicable
- Provide practical memory hooks that stick with students
- Be specifically tailored for California Bar Exam preparation
- Use active voice and confident, authoritative tone
- Include relevant California-specific legal nuances when applicable

SUBTOPIC CLASSIFICATION: You must classify each question into ONE of these exact subtopics based on the California Bar Exam breakdown:

**Civil Procedure:**
- "Jurisdiction and venue"
- "Pretrial procedures"
- "Motions"
- "Law applied by federal courts"
- "Jury trials"
- "Verdicts and judgments"
- "Appealability and review"

**Constitutional Law:**
- "Individual rights"
- "The nature of judicial review"
- "The separation of powers"
- "The relation of nation and states in a federal system (federalism)"

**Contracts:**
- "Formation of contracts"
- "Performance, breach, and discharge"
- "Defenses to enforceability"
- "Contract content and meaning"
- "Remedies"
- "Third-party rights"

**Criminal Law and Procedure:**
- "Constitutional protection of accused persons"
- "Homicide"
- "Other crimes"
- "Inchoate crimes, parties"
- "General principles of Criminal Law"

**Evidence:**
- "Relevancy and reasons for excluding relevant evidence"
- "Hearsay and circumstances of its admissibility"
- "Presentation of evidence"
- "Privileges and other policy exclusions"
- "Writings, recordings, and photographs"

**Real Property:**
- "Ownership of real property"
- "Rights in real property"
- "Real estate contracts"
- "Mortgages/security devices"
- "Titles"

**Torts:**
- "Negligence"
- "Intentional torts"
- "Strict liability and products liability"
- "Other torts"

Format your response as a JSON object with this structure:
{
  "subtopic": "exact subtopic name from the list above",
  "explanations": {
    "A": "explanation for why A is right/wrong with reasoning...",
    "B": "explanation for why B is right/wrong with reasoning...",
    "C": "explanation for why C is right/wrong with reasoning...",
    "D": "explanation for why D is right/wrong with reasoning..."
  }
}

The subtopic must be one of the exact strings listed above. The explanation for the correct answer should be the most detailed.
"""

    async def generate_explanation(self, question_data: Dict[str, Any]) -> Dict[str, Any]:
        """Generate AI explanation for a question
        
        Args:
            question_data: Dictionary containing question data
            
        Returns:
            Dictionary with AI explanations in standard format
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
            
            # Validate the response format and ensure standard structure
            if not isinstance(ai_content, dict):
                raise ValueError("Invalid response format from OpenAI: not a dict")
                
            # Ensure we have explanations object with A, B, C, D keys
            if 'explanations' not in ai_content:
                # If we got a flat structure with A, B, C, D, wrap it
                if all(k in ai_content for k in ['A', 'B', 'C', 'D']):
                    explanations_dict = {
                        "A": ai_content.get("A", "No explanation provided."),
                        "B": ai_content.get("B", "No explanation provided."),
                        "C": ai_content.get("C", "No explanation provided."),
                        "D": ai_content.get("D", "No explanation provided.")
                    }
                    ai_content = {
                        "explanations": explanations_dict,
                        "subtopic": ai_content.get("subtopic", "General principles")
                    }
                else:
                    raise ValueError("Invalid response format from OpenAI: missing explanations")
            
            # Ensure we have a subtopic field
            if 'subtopic' not in ai_content:
                ai_content['subtopic'] = "General principles"
                
            return ai_content
            
        except Exception as e:
            print(f"Error generating explanation for question {question_data.get('idx', 'unknown')}: {e}")
            return {
                "subtopic": "General principles",
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
            Dictionary mapping question IDs to their explanations in format:
            {
                "question_id": {
                    "question_id": "question_id",
                    "correct_answer": "A",
                    "explanations": {
                        "A": "explanation for choice A",
                        "B": "explanation for choice B", 
                        "C": "explanation for choice C",
                        "D": "explanation for choice D"
                    },
                    "subtopic": "subtopic name"
                }
            }
            
        This format ensures each answer choice is mapped to its explanation
        which can be displayed in clickable boxes during the post-exam review.
        """
        conn = sqlite3.connect(str(self.db_path))
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        
        results = {}
        
        for q_id in question_ids:
            # Check if we already have an explanation
            cursor.execute(
                "SELECT ai_explanation, subtopic FROM question_explanations WHERE question_id = ?",
                (q_id,)
            )
            existing = cursor.fetchone()
            
            # Get question data to get correct answer
            cursor.execute("SELECT * FROM questions WHERE idx = ?", (q_id,))
            question = cursor.fetchone()
            
            if not question:
                continue
                
            # Convert to dict
            question_dict = dict(question)
            correct_answer = question_dict.get('answer', '')
            
            if existing and existing['ai_explanation']:
                try:
                    # Use cached explanation and ensure proper format
                    cached_explanation = json.loads(existing['ai_explanation'])
                    
                    # Get subtopic from database column first, then fall back to JSON
                    subtopic_data = existing.get('subtopic') or cached_explanation.get('subtopic', 'General principles')
                    
                    # Ensure standard structure regardless of what's in DB
                    if 'explanations' in cached_explanation:
                        # Already has correct structure
                        explanation_data = cached_explanation['explanations']
                    elif all(k in cached_explanation for k in ['A', 'B', 'C', 'D']):
                        # Direct A, B, C, D mapping - reformat
                        explanation_data = {
                            "A": cached_explanation.get("A", "No explanation available."),
                            "B": cached_explanation.get("B", "No explanation available."),
                            "C": cached_explanation.get("C", "No explanation available."),
                            "D": cached_explanation.get("D", "No explanation available.")
                        }
                    else:
                        # Unexpected format, create placeholder
                        explanation_data = {
                            "A": "Explanation format error - please regenerate.",
                            "B": "Explanation format error - please regenerate.",
                            "C": "Explanation format error - please regenerate.", 
                            "D": "Explanation format error - please regenerate."
                        }
                        subtopic_data = 'General principles'
                        
                    results[q_id] = {
                        "question_id": q_id,
                        "correct_answer": correct_answer,
                        "subtopic": subtopic_data,
                        "explanations": explanation_data
                    }
                    continue
                except (json.JSONDecodeError, TypeError) as e:
                    print(f"Error parsing cached explanation for {q_id}: {e}")
                    # Fall through to regenerate
            
            # Generate explanation
            explanation = await self.generate_explanation(question_dict)
            
            # Extract explanations and subtopic
            explanations_data = explanation.get('explanations', {})
            subtopic_data = explanation.get('subtopic', 'General principles')
            
            if not explanations_data and all(k in explanation for k in ['A', 'B', 'C', 'D']):
                # Handle case where API returned flat structure
                explanations_data = {
                    "A": explanation.get("A", "No explanation available."),
                    "B": explanation.get("B", "No explanation available."),
                    "C": explanation.get("C", "No explanation available."),
                    "D": explanation.get("D", "No explanation available.")
                }
            
            # Ensure proper format before storing in DB
            explanation_json = json.dumps(explanation)
            
            # Store in DB with subtopic
            cursor.execute(
                """
                INSERT INTO question_explanations (question_id, ai_explanation, subtopic, created_at)
                VALUES (?, ?, ?, ?)
                ON CONFLICT(question_id) DO UPDATE SET
                    ai_explanation = excluded.ai_explanation,
                    subtopic = excluded.subtopic,
                    updated_at = ?
                """,
                (
                    q_id,
                    explanation_json,
                    subtopic_data,
                    datetime.now().isoformat(),
                    datetime.now().isoformat()
                )
            )
            
            # Return with proper format including question_id, correct_answer and subtopic
            results[q_id] = {
                "question_id": q_id,
                "correct_answer": correct_answer,
                "subtopic": subtopic_data,
                "explanations": explanations_data
            }
        
        conn.commit()
        conn.close()
        
        return results

# Create the table if it doesn't exist
def ensure_explanations_table(db_path: Path):
    """Ensure the question_explanations table exists with subtopic column"""
    conn = sqlite3.connect(str(db_path))
    cursor = conn.cursor()
    
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS question_explanations (
        question_id TEXT PRIMARY KEY,
        ai_explanation TEXT,
        subtopic TEXT,
        created_at TEXT,
        updated_at TEXT
    )
    """)
    
    # Check if subtopic column exists, if not add it
    cursor.execute("PRAGMA table_info(question_explanations)")
    columns = [row[1] for row in cursor.fetchall()]
    if 'subtopic' not in columns:
        cursor.execute('ALTER TABLE question_explanations ADD COLUMN subtopic TEXT')
        print("Added 'subtopic' column to question_explanations table.")
    
    conn.commit()
    conn.close()

def migrate_explanations_table(db_path: Path):
    """
    Ensure 'subtopic' column exists in 'question_explanations' table.
    This function is called during service initialization to handle schema updates.
    """
    conn = sqlite3.connect(str(db_path))
    cursor = conn.cursor()

    # Check if 'subtopic' column exists in question_explanations
    cursor.execute("PRAGMA table_info(question_explanations)")
    columns = [row[1] for row in cursor.fetchall()]
    if 'subtopic' not in columns:
        # Add the subtopic column
        cursor.execute("ALTER TABLE question_explanations ADD COLUMN subtopic TEXT")
        print("Added 'subtopic' column to 'question_explanations' table.")

    conn.commit()
    conn.close()
    print("Question explanations table migration complete.")

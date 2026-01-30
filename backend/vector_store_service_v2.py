#!/usr/bin/env python3
"""
Vector Store Service v2 for Law Quizzer
Uses OpenAI Assistants API to query the vector store and extract questions
"""

import asyncio
import json
import os
import sqlite3
import uuid
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Optional

import aiohttp

# Vector Store ID from OpenAI's API platform
DEFAULT_VECTOR_STORE_ID = "vs_6875b6f14b788191aed0702450e5ca49"

class VectorStoreServiceV2:
    def __init__(self, db_path: Path, api_key: Optional[str] = None, vector_store_id: Optional[str] = None, use_postgres: bool = False):
        """Initialize the vector store service
        
        Args:
            db_path: Path to the SQLite database or PostgreSQL connection string
            api_key: OpenAI API key (uses env var OPENAI_API_KEY if not provided)
            vector_store_id: Vector store ID (uses env var or default if not provided)
            use_postgres: Whether to use PostgreSQL instead of SQLite
        """
        self.db_path = db_path
        self.api_key = api_key or os.environ.get("OPENAI_API_KEY")
        self.vector_store_id = vector_store_id or os.environ.get("VECTOR_STORE_ID", DEFAULT_VECTOR_STORE_ID)
        self.use_postgres = use_postgres
        
        if not self.api_key:
            raise ValueError("OpenAI API key not found. Set OPENAI_API_KEY environment variable.")
        
        self.base_url = "https://api.openai.com/v1"
        self.headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
            "OpenAI-Beta": "assistants=v2"
        }
    
    def _get_connection(self):
        """Get database connection - PostgreSQL or SQLite based on configuration."""
        if self.use_postgres:
            import psycopg2
            return psycopg2.connect(str(self.db_path))
        else:
            return sqlite3.connect(str(self.db_path))

    async def generate_questions_using_assistant(self, num_questions: int = 5) -> List[Dict[str, Any]]:
        """Generate questions by asking the assistant to create them based on vector store content
        
        Args:
            num_questions: Number of questions to generate
            
        Returns:
            List of question dictionaries
        """
        try:
            # Create an assistant with the vector store
            assistant_payload = {
                "name": "CA Bar Exam Question Generator",
                "instructions": f"""You are an expert California Bar Exam question creator. Based on the legal materials in the vector store, create {num_questions} original multiple choice questions suitable for California Bar Exam preparation.

Each question should:
1. Be based on real legal principles from the provided materials
2. Have exactly 4 answer choices (A, B, C, D)
3. Have one clearly correct answer
4. Include a clear legal scenario or fact pattern
5. Cover different areas of law when possible

Format your response as a JSON object:
{{
  "questions": [
    {{
      "question": "The actual question text...",
      "prompt": "Any context or fact pattern...",
      "choice_a": "First answer choice",
      "choice_b": "Second answer choice", 
      "choice_c": "Third answer choice",
      "choice_d": "Fourth answer choice",
      "answer": "A/B/C/D",
      "subject": "Legal subject area",
      "explanation": "Brief explanation of correct answer"
    }}
  ]
}}

Create exactly {num_questions} high-quality questions.""",
                "model": "gpt-4o-mini",
                "tools": [{"type": "file_search"}],
                "tool_resources": {
                    "file_search": {
                        "vector_store_ids": [self.vector_store_id]
                    }
                }
            }
            
            async with aiohttp.ClientSession() as session:
                # Create assistant
                url = f"{self.base_url}/assistants"
                async with session.post(url, headers=self.headers, json=assistant_payload) as response:
                    if response.status != 200:
                        error_text = await response.text()
                        print(f"Error creating assistant: {response.status} - {error_text}")
                        return []
                    
                    assistant_data = await response.json()
                    assistant_id = assistant_data['id']
                    print(f"Created assistant: {assistant_id}")
                
                try:
                    # Create a thread
                    thread_payload = {}
                    url = f"{self.base_url}/threads"
                    async with session.post(url, headers=self.headers, json=thread_payload) as response:
                        if response.status != 200:
                            print(f"Error creating thread: {response.status}")
                            return []
                        
                        thread_data = await response.json()
                        thread_id = thread_data['id']
                        print(f"Created thread: {thread_id}")
                    
                    # Add message to thread
                    message_payload = {
                        "role": "user",
                        "content": f"Please create {num_questions} California Bar Exam multiple choice questions based on the legal materials in the vector store. Make sure each question tests important legal concepts and follows proper bar exam format."
                    }
                    url = f"{self.base_url}/threads/{thread_id}/messages"
                    async with session.post(url, headers=self.headers, json=message_payload) as response:
                        if response.status != 200:
                            print(f"Error adding message: {response.status}")
                            return []
                    
                    # Run the assistant
                    run_payload = {
                        "assistant_id": assistant_id
                    }
                    url = f"{self.base_url}/threads/{thread_id}/runs"
                    async with session.post(url, headers=self.headers, json=run_payload) as response:
                        if response.status != 200:
                            print(f"Error starting run: {response.status}")
                            return []
                        
                        run_data = await response.json()
                        run_id = run_data['id']
                        print(f"Started run: {run_id}")
                    
                    # Wait for completion
                    max_attempts = 60  # Increased timeout for generation
                    print("Waiting for assistant to generate questions...")
                    for attempt in range(max_attempts):
                        await asyncio.sleep(3)
                        
                        url = f"{self.base_url}/threads/{thread_id}/runs/{run_id}"
                        async with session.get(url, headers=self.headers) as response:
                            if response.status == 200:
                                run_status = await response.json()
                                status = run_status['status']
                                print(f"Run status: {status}")
                                
                                if status == 'completed':
                                    break
                                elif status in ['failed', 'cancelled', 'expired']:
                                    print(f"Run failed with status: {status}")
                                    if 'last_error' in run_status:
                                        print(f"Error details: {run_status['last_error']}")
                                    return []
                                elif status in ['in_progress', 'queued']:
                                    continue  # Keep waiting
                    else:
                        print("Run timed out")
                        return []
                    
                    # Get messages
                    url = f"{self.base_url}/threads/{thread_id}/messages"
                    async with session.get(url, headers=self.headers) as response:
                        if response.status == 200:
                            messages_data = await response.json()
                            
                            # Find assistant's response
                            for message in messages_data['data']:
                                if message['role'] == 'assistant':
                                    content_blocks = message['content']
                                    for block in content_blocks:
                                        if block['type'] == 'text':
                                            response_text = block['text']['value']
                                            print("Received response from assistant")
                                            
                                            # Try to parse JSON
                                            try:
                                                # Look for JSON in the response
                                                start = response_text.find('{')
                                                end = response_text.rfind('}') + 1
                                                if start != -1 and end > start:
                                                    json_text = response_text[start:end]
                                                    result = json.loads(json_text)
                                                    return result.get('questions', [])
                                                else:
                                                    print("No JSON found in response")
                                                    return []
                                            except json.JSONDecodeError as e:
                                                print(f"Error parsing JSON response: {e}")
                                                print(f"Response text: {response_text[:500]}...")
                                                return []
                        
                        return []
                
                finally:
                    # Clean up assistant
                    print("Cleaning up assistant...")
                    url = f"{self.base_url}/assistants/{assistant_id}"
                    async with session.delete(url, headers=self.headers):
                        pass  # Clean up, don't care about response
            
        except Exception as e:
            print(f"Error generating questions using assistant: {e}")
            return []

    async def save_questions_to_db(self, questions: List[Dict[str, Any]]) -> int:
        """Save extracted questions to the database"""
        if not questions:
            return 0
        
        conn = self._get_connection()
        cursor = conn.cursor()
        
        saved_count = 0
        
        for question in questions:
            try:
                # Generate a unique ID for the question
                question_id = f"vs_{uuid.uuid4().hex[:12]}"
                
                # Validate required fields
                required_fields = ['question', 'choice_a', 'choice_b', 'choice_c', 'choice_d', 'answer']
                if not all(field in question and question[field] for field in required_fields):
                    print(f"Skipping question with missing required fields: {question}")
                    continue
                
                # Prepare question data with defaults
                question_data = {
                    'idx': question_id,
                    'dataset': 'vector_store_generated',
                    'example_id': question_id,
                    'prompt_id': question_id,
                    'source': 'vector_store_generated',
                    'subject': question.get('subject', 'Mixed'),
                    'question_number': '',
                    'prompt': question.get('prompt', ''),
                    'question': question['question'],
                    'choice_a': question['choice_a'],
                    'choice_b': question['choice_b'],
                    'choice_c': question['choice_c'],
                    'choice_d': question['choice_d'],
                    'answer': question['answer'].upper(),
                    'gold_passage': question.get('explanation', ''),
                    'gold_idx': question_id
                }
                
                # Insert into database (ignore duplicates)
                if self.use_postgres:
                    cursor.execute('''
                        INSERT INTO questions (
                            idx, dataset, example_id, prompt_id, source, subject, question_number,
                            prompt, question, choice_a, choice_b, choice_c, choice_d, answer, gold_passage, gold_idx, generated
                        ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                        ON CONFLICT (idx) DO NOTHING
                    ''', (
                        question_data['idx'], question_data['dataset'], question_data['example_id'],
                        question_data['prompt_id'], question_data['source'], question_data['subject'],
                        question_data['question_number'], question_data['prompt'], question_data['question'],
                        question_data['choice_a'], question_data['choice_b'], question_data['choice_c'],
                        question_data['choice_d'], question_data['answer'], question_data['gold_passage'],
                        question_data['gold_idx'], 1  # Mark as generated
                    ))
                else:
                    cursor.execute('''
                        INSERT OR IGNORE INTO questions (
                            idx, dataset, example_id, prompt_id, source, subject, question_number,
                            prompt, question, choice_a, choice_b, choice_c, choice_d, answer, gold_passage, gold_idx, generated
                        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    ''', (
                        question_data['idx'], question_data['dataset'], question_data['example_id'],
                        question_data['prompt_id'], question_data['source'], question_data['subject'],
                        question_data['question_number'], question_data['prompt'], question_data['question'],
                        question_data['choice_a'], question_data['choice_b'], question_data['choice_c'],
                        question_data['choice_d'], question_data['answer'], question_data['gold_passage'],
                        question_data['gold_idx'], 1  # Mark as generated
                    ))
                
                if cursor.rowcount > 0:
                    saved_count += 1
                    print(f"Saved question: {question_data['question'][:50]}...")
                    
            except Exception as e:
                print(f"Error saving question to database: {e}")
                continue
        
        conn.commit()
        conn.close()
        
        return saved_count

    async def extract_and_save_questions(self, num_questions_needed: int = 5) -> Dict[str, Any]:
        """Main method to generate questions from vector store and save to database"""
        results = {
            'questions_extracted': 0,
            'questions_saved': 0,
            'content_sources_processed': 1,  # Using assistant as one "source"
            'errors': []
        }
        
        try:
            print(f"Generating {num_questions_needed} questions using vector store...")
            questions = await self.generate_questions_using_assistant(num_questions_needed)
            
            results['questions_extracted'] = len(questions)
            
            if questions:
                # Save to database
                print(f"Saving {len(questions)} questions to database...")
                saved_count = await self.save_questions_to_db(questions)
                results['questions_saved'] = saved_count
                
                print(f"Successfully generated {len(questions)} questions and saved {saved_count} to database.")
            else:
                error_msg = "No questions generated by assistant"
                results['errors'].append(error_msg)
                print(error_msg)
            
        except Exception as e:
            error_msg = f"Error in extract_and_save_questions: {e}"
            print(error_msg)
            results['errors'].append(error_msg)
        
        return results

# Update the server to use the new service
async def extract_questions_from_vector_store_v2(db_path: Path, num_questions: int = 5) -> Dict[str, Any]:
    """Standalone function to extract questions from vector store using v2 service"""
    try:
        service = VectorStoreServiceV2(db_path)
        return await service.extract_and_save_questions(num_questions)
    except Exception as e:
        return {
            'questions_extracted': 0,
            'questions_saved': 0,
            'content_sources_processed': 0,
            'errors': [f"Failed to initialize vector store service: {e}"]
        }
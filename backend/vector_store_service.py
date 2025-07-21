#!/usr/bin/env python3
"""
Vector Store Service for Law Quizzer
Handles connection to OpenAI Vector Store to extract questions and add them to the database
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

class VectorStoreService:
    def __init__(self, db_path: Path, api_key: Optional[str] = None, vector_store_id: Optional[str] = None):
        """Initialize the vector store service
        
        Args:
            db_path: Path to the SQLite database
            api_key: OpenAI API key (uses env var OPENAI_API_KEY if not provided)
            vector_store_id: Vector store ID (uses env var or default if not provided)
        """
        self.db_path = db_path
        self.api_key = api_key or os.environ.get("OPENAI_API_KEY")
        self.vector_store_id = vector_store_id or os.environ.get("VECTOR_STORE_ID", DEFAULT_VECTOR_STORE_ID)
        
        if not self.api_key:
            raise ValueError("OpenAI API key not found. Set OPENAI_API_KEY environment variable.")
        
        self.base_url = "https://api.openai.com/v1"
        self.headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
            "OpenAI-Beta": "assistants=v2"
        }
    
    def _get_extraction_system_prompt(self) -> str:
        """Return the system prompt for extracting questions from vector store content"""
        return """You are an expert at extracting California Bar Exam multiple choice questions from legal documents and materials.

Your task is to identify and extract well-formed multiple choice questions from the provided text. Each question should:

1. Have a clear legal scenario or fact pattern
2. Include exactly 4 answer choices (A, B, C, D)
3. Have one clearly correct answer
4. Be appropriate for California Bar Exam preparation
5. Include the subject area (e.g., "Contracts", "Torts", "Criminal Law", etc.)

Format your response as a JSON object with this structure:
{
  "questions": [
    {
      "question": "The actual question text...",
      "prompt": "Any context or fact pattern that precedes the question...",
      "choice_a": "First answer choice...",
      "choice_b": "Second answer choice...",
      "choice_c": "Third answer choice...",
      "choice_d": "Fourth answer choice...",
      "answer": "A/B/C/D",
      "subject": "Legal subject area",
      "source": "vector_store_extraction",
      "explanation": "Brief explanation of why the answer is correct..."
    }
  ]
}

Only extract questions that are complete and well-formed. If no valid questions are found, return an empty questions array.
"""

    async def list_vector_store_files(self) -> List[Dict[str, Any]]:
        """List files in the vector store
        
        Returns:
            List of file objects from the vector store
        """
        try:
            async with aiohttp.ClientSession() as session:
                url = f"{self.base_url}/vector_stores/{self.vector_store_id}/files"
                async with session.get(url, headers=self.headers) as response:
                    if response.status == 200:
                        data = await response.json()
                        return data.get('data', [])
                    else:
                        error_text = await response.text()
                        print(f"Error listing vector store files: {response.status} - {error_text}")
                        return []
        except Exception as e:
            print(f"Error listing vector store files: {e}")
            return []

    async def get_file_content(self, file_id: str) -> str:
        """Get content of a specific file
        
        Args:
            file_id: ID of the file to retrieve
            
        Returns:
            Content of the file as string
        """
        try:
            async with aiohttp.ClientSession() as session:
                url = f"{self.base_url}/files/{file_id}/content"
                async with session.get(url, headers=self.headers) as response:
                    if response.status == 200:
                        content = await response.text()
                        return content
                    else:
                        print(f"Error getting file content for {file_id}: {response.status}")
                        return ""
        except Exception as e:
            print(f"Error getting file content for {file_id}: {e}")
            return ""

    async def search_vector_store_content(self, query: str = "bar exam questions", limit: int = 10) -> List[str]:
        """Search the vector store for relevant content by examining files
        
        Args:
            query: Search query for finding relevant content
            limit: Maximum number of content pieces to return
            
        Returns:
            List of content strings from the vector store
        """
        try:
            # Get list of files in vector store
            files = await self.list_vector_store_files()
            
            if not files:
                print("No files found in vector store")
                return []
            
            content_results = []
            
            # Process files up to the limit
            for i, file_obj in enumerate(files[:limit]):
                if len(content_results) >= limit:
                    break
                    
                file_id = file_obj.get('id')
                if not file_id:
                    continue
                
                print(f"Processing file {i+1}/{min(len(files), limit)}: {file_id}")
                
                # Get file content
                content = await self.get_file_content(file_id)
                
                if content and len(content.strip()) > 100:  # Only include substantial content
                    # Check if content contains relevant keywords
                    content_lower = content.lower()
                    if any(keyword in content_lower for keyword in ['question', 'choice', 'answer', 'bar exam', 'multiple choice']):
                        content_results.append(content)
                
                # Add delay to avoid rate limits
                await asyncio.sleep(0.5)
            
            return content_results
            
        except Exception as e:
            print(f"Error searching vector store content: {e}")
            return []

    async def extract_questions_with_structured_output(self, content: str) -> List[Dict[str, Any]]:
        """Extract questions from content using OpenAI's chat completion with structured output request
        
        Args:
            content: Text content to extract questions from
            
        Returns:
            List of question dictionaries
        """
        try:
            # Truncate content if too long
            max_content_length = 6000
            if len(content) > max_content_length:
                content = content[:max_content_length] + "..."
            
            payload = {
                "model": "gpt-4o-mini",
                "messages": [
                    {"role": "system", "content": self._get_extraction_system_prompt()},
                    {"role": "user", "content": f"Extract any California Bar Exam multiple choice questions from this content:\n\n{content}"}
                ],
                "response_format": {"type": "json_object"},
                "temperature": 0.2
            }
            
            async with aiohttp.ClientSession() as session:
                url = f"{self.base_url}/chat/completions"
                async with session.post(url, headers=self.headers, json=payload) as response:
                    if response.status == 200:
                        data = await response.json()
                        content_text = data['choices'][0]['message']['content']
                        
                        try:
                            result = json.loads(content_text)
                            return result.get('questions', [])
                        except json.JSONDecodeError as e:
                            print(f"Error parsing JSON response: {e}")
                            return []
                    else:
                        error_text = await response.text()
                        print(f"Error in OpenAI API call: {response.status} - {error_text}")
                        return []
                        
        except Exception as e:
            print(f"Error extracting questions from content: {e}")
            return []

    async def save_questions_to_db(self, questions: List[Dict[str, Any]]) -> int:
        """Save extracted questions to the database
        
        Args:
            questions: List of question dictionaries to save
            
        Returns:
            Number of questions successfully saved
        """
        if not questions:
            return 0
        
        conn = sqlite3.connect(str(self.db_path))
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
                    'dataset': 'vector_store',
                    'example_id': question_id,
                    'prompt_id': question_id,
                    'source': question.get('source', 'vector_store_extraction'),
                    'subject': question.get('subject', 'Unknown'),
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
                cursor.execute('''
                    INSERT OR IGNORE INTO questions (
                        idx, dataset, example_id, prompt_id, source, subject, question_number,
                        prompt, question, choice_a, choice_b, choice_c, choice_d, answer, gold_passage, gold_idx
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ''', (
                    question_data['idx'], question_data['dataset'], question_data['example_id'],
                    question_data['prompt_id'], question_data['source'], question_data['subject'],
                    question_data['question_number'], question_data['prompt'], question_data['question'],
                    question_data['choice_a'], question_data['choice_b'], question_data['choice_c'],
                    question_data['choice_d'], question_data['answer'], question_data['gold_passage'],
                    question_data['gold_idx']
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

    async def extract_and_save_questions(self, num_questions_needed: int = 10) -> Dict[str, Any]:
        """Main method to extract questions from vector store and save to database
        
        Args:
            num_questions_needed: Target number of new questions to extract
            
        Returns:
            Dictionary with extraction results
        """
        results = {
            'questions_extracted': 0,
            'questions_saved': 0,
            'content_sources_processed': 0,
            'errors': []
        }
        
        try:
            # Search vector store for content
            print(f"Searching vector store {self.vector_store_id} for content...")
            content_list = await self.search_vector_store_content(limit=15)  # Get more content to process
            results['content_sources_processed'] = len(content_list)
            
            if not content_list:
                error_msg = "No content found in vector store"
                results['errors'].append(error_msg)
                print(error_msg)
                return results
            
            all_questions = []
            
            # Process each piece of content
            for i, content in enumerate(content_list):
                if len(all_questions) >= num_questions_needed:
                    break
                    
                print(f"Extracting questions from content source {i+1}/{len(content_list)}...")
                questions = await self.extract_questions_with_structured_output(content)
                
                if questions:
                    all_questions.extend(questions)
                    print(f"Found {len(questions)} questions in content source {i+1}")
                
                # Add delay to avoid rate limits
                await asyncio.sleep(1)
            
            results['questions_extracted'] = len(all_questions)
            
            if all_questions:
                # Take only the number we need
                questions_to_save = all_questions[:num_questions_needed]
                
                # Save to database
                print(f"Saving {len(questions_to_save)} questions to database...")
                saved_count = await self.save_questions_to_db(questions_to_save)
                results['questions_saved'] = saved_count
                
                print(f"Successfully extracted {len(all_questions)} questions and saved {saved_count} to database.")
            else:
                error_msg = "No valid questions extracted from content"
                results['errors'].append(error_msg)
                print(error_msg)
            
        except Exception as e:
            error_msg = f"Error in extract_and_save_questions: {e}"
            print(error_msg)
            results['errors'].append(error_msg)
        
        return results

# Standalone function for easy integration
async def extract_questions_from_vector_store(db_path: Path, num_questions: int = 10) -> Dict[str, Any]:
    """Standalone function to extract questions from vector store
    
    Args:
        db_path: Path to the SQLite database
        num_questions: Number of questions to extract
        
    Returns:
        Dictionary with extraction results
    """
    try:
        service = VectorStoreService(db_path)
        return await service.extract_and_save_questions(num_questions)
    except Exception as e:
        return {
            'questions_extracted': 0,
            'questions_saved': 0,
            'content_sources_processed': 0,
            'errors': [f"Failed to initialize vector store service: {e}"]
        }
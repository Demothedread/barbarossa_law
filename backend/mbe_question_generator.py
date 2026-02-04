#!/usr/bin/env python3
"""
MBE Question Generator Service
Comprehensive question generation with dual vector store logic, deduplication,
3-rejection fallback, and subtopic probability weighting.

Flow:
1. Attempt to extract ACTUAL MBE questions from MBE vector store by subject/subtopic
2. Deduplicate against existing database
3. After 3 consecutive rejections, fall back to outline-based generation
4. Track subtopic probabilities based on historical MBE distribution
"""

import asyncio
import hashlib
import json
import os
import random
import sqlite3
import uuid
from datetime import datetime
from difflib import SequenceMatcher
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

import aiohttp

# Vector Store IDs
MBE_VECTOR_STORE_ID = os.environ.get("VECTOR_STORE_ID", "vs_6875b6f14b788191aed0702450e5ca49")
OUTLINE_VECTOR_STORE_ID = os.environ.get("OUTLINE_VECTOR_STORE_ID", "vs_68884d7436748191984636f06588ef5b")

# Generation model
GENERATION_MODEL = "gpt-4o-mini"

# Maximum AI-generated questions before pruning (non-model)
MAX_GENERATED_QUESTIONS = 999


class MBEQuestionGenerator:
    """
    Advanced MBE question generator with dual vector store support,
    deduplication, fallback logic, and quality tracking.
    """
    
    def __init__(
        self,
        db_path: Path,
        api_key: Optional[str] = None,
        use_postgres: bool = False
    ):
        self.db_path = db_path
        self.use_postgres = use_postgres
        self.api_key = api_key or os.environ.get("OPENAI_API_KEY")
        self.base_url = "https://api.openai.com/v1"
        
        if not self.api_key:
            raise ValueError("OpenAI API key required for question generation")
        
        self.headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {self.api_key}",
            "OpenAI-Beta": "assistants=v2"
        }
    
    def _get_connection(self):
        """Get database connection"""
        if self.use_postgres:
            import psycopg2
            from psycopg2.extras import RealDictCursor
            conn = psycopg2.connect(self.db_path)
            return conn, True
        else:
            conn = sqlite3.connect(str(self.db_path))
            conn.row_factory = sqlite3.Row
            return conn, False
    
    def _compute_similarity_hash(self, question_text: str, choices: List[str]) -> str:
        """Compute a hash for deduplication based on question content"""
        # Normalize text: lowercase, remove extra whitespace
        normalized = " ".join(question_text.lower().split())
        for choice in sorted(choices):
            normalized += " " + " ".join(choice.lower().split())
        return hashlib.md5(normalized.encode()).hexdigest()
    
    def _text_similarity(self, text1: str, text2: str) -> float:
        """Calculate text similarity ratio"""
        return SequenceMatcher(None, text1.lower(), text2.lower()).ratio()
    
    async def check_duplicate(
        self,
        question_text: str,
        choices: List[str],
        similarity_threshold: float = 0.85
    ) -> Tuple[bool, Optional[str]]:
        """
        Check if a question already exists in the database.
        
        Returns:
            Tuple of (is_duplicate, matching_question_id)
        """
        conn, is_postgres = self._get_connection()
        cursor = conn.cursor()
        
        # First check by hash (exact match)
        similarity_hash = self._compute_similarity_hash(question_text, choices)
        
        if is_postgres:
            cursor.execute(
                "SELECT idx FROM questions WHERE similarity_hash = %s",
                (similarity_hash,)
            )
        else:
            cursor.execute(
                "SELECT idx FROM questions WHERE similarity_hash = ?",
                (similarity_hash,)
            )
        
        row = cursor.fetchone()
        if row:
            conn.close()
            return True, row[0] if isinstance(row, tuple) else row['idx']
        
        # Fuzzy match against existing questions
        cursor.execute("SELECT idx, question, choice_a, choice_b, choice_c, choice_d FROM questions")
        rows = cursor.fetchall()
        
        for row in rows:
            existing_text = row['question'] if hasattr(row, '__getitem__') else row[1]
            if not existing_text:
                continue
                
            similarity = self._text_similarity(question_text, existing_text)
            if similarity >= similarity_threshold:
                conn.close()
                existing_id = row['idx'] if hasattr(row, '__getitem__') else row[0]
                return True, existing_id
        
        conn.close()
        return False, None
    
    def _get_mbe_extraction_prompt(self, subject: str, subtopic: str) -> str:
        """System prompt for extracting actual MBE questions from vector store"""
        return f"""You are an expert at identifying and extracting ACTUAL Multistate Bar Examination (MBE) 
multiple choice questions from legal documents and bar prep materials.

Your task is to search the vector store for EXISTING MBE questions (not create new ones) that match:
- Subject: {subject}
- Subtopic: {subtopic if subtopic else 'Any within the subject'}

Look for text that indicates a multiple choice question:
- Fact patterns followed by a question
- Four answer choices labeled (A), (B), (C), (D)
- Questions asking "Which of the following..." or similar phrasing
- Legal hypotheticals with specific parties and facts

IMPORTANT: Only extract questions that appear to be ACTUAL bar exam questions, not practice problems 
from study guides or simplified examples. Real MBE questions have:
- Detailed fact patterns (usually 100-300 words)
- Precisely worded answer choices
- Only ONE best answer (though others may seem plausible)
- Technical legal language

Format your response as JSON:
{{
  "questions": [
    {{
      "question": "The complete question text including fact pattern...",
      "prompt": "Any context or introductory text before the question...",
      "choice_a": "First answer choice exactly as written",
      "choice_b": "Second answer choice exactly as written",
      "choice_c": "Third answer choice exactly as written",
      "choice_d": "Fourth answer choice exactly as written",
      "answer": "A/B/C/D - the correct answer",
      "subject": "{subject}",
      "subtopic": "Specific subtopic this tests",
      "source_indicator": "Any indication this is from actual MBE (e.g., 'MBE 2019', 'NCBE', etc.)"
    }}
  ],
  "extraction_notes": "Notes about what was found or any issues"
}}

If no matching MBE questions are found, return an empty questions array with explanation in extraction_notes."""

    def _get_outline_generation_prompt(self, subject: str, subtopic: str, rule_info: str) -> str:
        """
        DETAILED prompt for generating NEW MBE-style questions from outline material.
        This is the FALLBACK prompt used after 3 extraction rejections.
        """
        return f"""You are an expert California Bar Exam question writer creating ORIGINAL MBE-style 
multiple choice questions based on legal outlines and study materials.

CONTEXT:
- Subject: {subject}
- Subtopic: {subtopic if subtopic else 'General within subject'}
- Rule Information from Outline:
{rule_info}

YOUR TASK:
Generate NEW, ORIGINAL multiple choice questions that test the examinee's knowledge of this material.

CRITICAL QUALITY REQUIREMENTS:

1. **Question Construction**:
   - Create a detailed hypothetical legal situation (150-300 words)
   - The fact pattern should invoke multiple aspects of the rule
   - Include specific names, dates, locations to make it realistic
   - The scenario should require applying legal reasoning, not just recall

2. **Answer Choice Design**:
   - NOT simply one right answer and three wrong answers
   - The MBE tests for the BEST answer, sometimes the WORST answer
   - Typically: 2 clearly wrong choices, 2 plausible choices where one is BETTER
   - The correct answer often hinges on a specific word, phrase, or detail
   - Wrong answers should be wrong for specific, identifiable legal reasons

3. **Testing Multiple Concepts**:
   - Excellent questions invoke multiple subtopics
   - Consider overlapping, competing, or consequential rules
   - Test syllogistic reasoning ability
   - May involve exceptions to rules, or exceptions to exceptions

4. **Difficulty Level**:
   - Match or exceed actual MBE difficulty
   - Test nuanced understanding, not surface-level knowledge
   - Include "trap" answers that seem correct but miss a key distinction

5. **Content Sources** (from the rule information above):
   - The rule itself and who benefits/loses
   - Notable distinctions, lists, or mnemonics
   - Exceptions to the rule
   - Exceptions to the exceptions
   - Policy considerations and ethical/moral reasoning courts use

FORMAT YOUR RESPONSE AS JSON:
{{
  "questions": [
    {{
      "question": "Complete fact pattern and question...",
      "prompt": "Any setup context...",
      "choice_a": "First answer choice",
      "choice_b": "Second answer choice",
      "choice_c": "Third answer choice",
      "choice_d": "Fourth answer choice",
      "answer": "A/B/C/D",
      "subject": "{subject}",
      "subtopic": "{subtopic}",
      "explanation": "Brief explanation of why the correct answer is best and why others fail",
      "difficulty_notes": "What makes this question challenging",
      "rules_tested": ["List of specific rules/concepts tested"]
    }}
  ]
}}

Remember: The goal is to create questions that would not be out of place on the actual MBE, 
testing thorough knowledge through well-crafted hypotheticals."""

    async def _search_vector_store(
        self,
        vector_store_id: str,
        query: str,
        limit: int = 10
    ) -> List[str]:
        """Search a vector store for relevant content"""
        try:
            async with aiohttp.ClientSession() as session:
                # Create a temporary assistant with the vector store
                assistant_payload = {
                    "name": "Vector Store Search Assistant",
                    "instructions": f"Search the vector store and return relevant content for: {query}",
                    "model": GENERATION_MODEL,
                    "tools": [{"type": "file_search"}],
                    "tool_resources": {
                        "file_search": {
                            "vector_store_ids": [vector_store_id]
                        }
                    }
                }
                
                url = f"{self.base_url}/assistants"
                async with session.post(url, headers=self.headers, json=assistant_payload) as response:
                    if response.status != 200:
                        return []
                    assistant_data = await response.json()
                    assistant_id = assistant_data['id']
                
                try:
                    # Create thread and run
                    thread_response = await session.post(
                        f"{self.base_url}/threads",
                        headers=self.headers,
                        json={}
                    )
                    thread_data = await thread_response.json()
                    thread_id = thread_data['id']
                    
                    # Add search message
                    await session.post(
                        f"{self.base_url}/threads/{thread_id}/messages",
                        headers=self.headers,
                        json={"role": "user", "content": query}
                    )
                    
                    # Run the assistant
                    run_response = await session.post(
                        f"{self.base_url}/threads/{thread_id}/runs",
                        headers=self.headers,
                        json={"assistant_id": assistant_id}
                    )
                    run_data = await run_response.json()
                    run_id = run_data['id']
                    
                    # Wait for completion
                    for _ in range(30):
                        await asyncio.sleep(2)
                        status_response = await session.get(
                            f"{self.base_url}/threads/{thread_id}/runs/{run_id}",
                            headers=self.headers
                        )
                        status_data = await status_response.json()
                        if status_data['status'] == 'completed':
                            break
                        elif status_data['status'] in ['failed', 'cancelled']:
                            return []
                    
                    # Get messages
                    messages_response = await session.get(
                        f"{self.base_url}/threads/{thread_id}/messages",
                        headers=self.headers
                    )
                    messages_data = await messages_response.json()
                    
                    content_list = []
                    for message in messages_data.get('data', []):
                        if message['role'] == 'assistant':
                            for block in message.get('content', []):
                                if block['type'] == 'text':
                                    content_list.append(block['text']['value'])
                    
                    return content_list
                    
                finally:
                    # Clean up assistant
                    await session.delete(
                        f"{self.base_url}/assistants/{assistant_id}",
                        headers=self.headers
                    )
                    
        except Exception as e:
            print(f"Error searching vector store: {e}")
            return []

    async def _generate_with_assistant(
        self,
        system_prompt: str,
        user_prompt: str,
        vector_store_id: str
    ) -> Dict[str, Any]:
        """Generate content using an assistant with vector store access"""
        try:
            async with aiohttp.ClientSession() as session:
                # Create assistant
                assistant_payload = {
                    "name": "MBE Question Generator",
                    "instructions": system_prompt,
                    "model": GENERATION_MODEL,
                    "tools": [{"type": "file_search"}],
                    "tool_resources": {
                        "file_search": {
                            "vector_store_ids": [vector_store_id]
                        }
                    },
                    "response_format": {"type": "json_object"}
                }
                
                url = f"{self.base_url}/assistants"
                async with session.post(url, headers=self.headers, json=assistant_payload) as response:
                    if response.status != 200:
                        error = await response.text()
                        return {"error": f"Failed to create assistant: {error}"}
                    assistant_data = await response.json()
                    assistant_id = assistant_data['id']
                
                try:
                    # Create thread
                    thread_response = await session.post(
                        f"{self.base_url}/threads",
                        headers=self.headers,
                        json={}
                    )
                    thread_data = await thread_response.json()
                    thread_id = thread_data['id']
                    
                    # Add user message
                    await session.post(
                        f"{self.base_url}/threads/{thread_id}/messages",
                        headers=self.headers,
                        json={"role": "user", "content": user_prompt}
                    )
                    
                    # Run assistant
                    run_response = await session.post(
                        f"{self.base_url}/threads/{thread_id}/runs",
                        headers=self.headers,
                        json={"assistant_id": assistant_id}
                    )
                    run_data = await run_response.json()
                    run_id = run_data['id']
                    
                    # Wait for completion (up to 2 minutes)
                    for _ in range(60):
                        await asyncio.sleep(2)
                        status_response = await session.get(
                            f"{self.base_url}/threads/{thread_id}/runs/{run_id}",
                            headers=self.headers
                        )
                        status_data = await status_response.json()
                        
                        if status_data['status'] == 'completed':
                            break
                        elif status_data['status'] in ['failed', 'cancelled', 'expired']:
                            return {"error": f"Run failed: {status_data.get('last_error', 'Unknown')}"}
                    
                    # Get response
                    messages_response = await session.get(
                        f"{self.base_url}/threads/{thread_id}/messages",
                        headers=self.headers
                    )
                    messages_data = await messages_response.json()
                    
                    for message in messages_data.get('data', []):
                        if message['role'] == 'assistant':
                            for block in message.get('content', []):
                                if block['type'] == 'text':
                                    try:
                                        # Try to parse JSON from response
                                        text = block['text']['value']
                                        # Find JSON in response
                                        start = text.find('{')
                                        end = text.rfind('}') + 1
                                        if start >= 0 and end > start:
                                            return json.loads(text[start:end])
                                    except json.JSONDecodeError:
                                        pass
                    
                    return {"error": "No valid JSON response"}
                    
                finally:
                    # Clean up
                    await session.delete(
                        f"{self.base_url}/assistants/{assistant_id}",
                        headers=self.headers
                    )
                    
        except Exception as e:
            return {"error": str(e)}

    async def _extract_mbe_questions(
        self,
        subject: str,
        subtopic: str,
        count: int
    ) -> Tuple[List[Dict], int]:
        """
        Attempt to extract actual MBE questions from the MBE vector store.
        
        Returns:
            Tuple of (valid_questions, rejection_count)
        """
        system_prompt = self._get_mbe_extraction_prompt(subject, subtopic)
        user_prompt = f"Search for {count + 3} MBE questions about {subject}" + \
                      (f", specifically {subtopic}" if subtopic else "")
        
        result = await self._generate_with_assistant(
            system_prompt,
            user_prompt,
            MBE_VECTOR_STORE_ID
        )
        
        if "error" in result:
            print(f"MBE extraction error: {result['error']}")
            return [], 0
        
        questions = result.get("questions", [])
        valid_questions = []
        rejection_count = 0
        
        for q in questions:
            if not all(k in q for k in ['question', 'choice_a', 'choice_b', 'choice_c', 'choice_d', 'answer']):
                continue
            
            # Check for duplicates
            is_dup, dup_id = await self.check_duplicate(
                q['question'],
                [q['choice_a'], q['choice_b'], q['choice_c'], q['choice_d']]
            )
            
            if is_dup:
                rejection_count += 1
                print(f"Rejected duplicate (matches {dup_id})")
                continue
            
            valid_questions.append(q)
            if len(valid_questions) >= count:
                break
        
        return valid_questions, rejection_count

    async def _generate_from_outlines(
        self,
        subject: str,
        subtopic: str,
        count: int
    ) -> List[Dict]:
        """
        Generate NEW questions based on outline material.
        This is the FALLBACK method after MBE extraction fails.
        """
        # First, search the outline vector store for relevant rule information
        search_query = f"""Find detailed information about {subject} law, specifically:
        - {subtopic if subtopic else 'core concepts and rules'}
        - The rule statement and its elements
        - Who benefits and who loses under this rule
        - Notable distinctions, lists, or mnemonics
        - Exceptions to the rule
        - Exceptions to the exceptions
        - Policy considerations and court reasoning"""
        
        outline_content = await self._search_vector_store(
            OUTLINE_VECTOR_STORE_ID,
            search_query
        )
        
        rule_info = "\n\n".join(outline_content[:5]) if outline_content else \
                    "No specific outline content found. Generate based on general knowledge."
        
        system_prompt = self._get_outline_generation_prompt(subject, subtopic, rule_info)
        user_prompt = f"""Generate {count} high-quality, original MBE-style multiple choice questions 
testing {subject} law{f', specifically {subtopic}' if subtopic else ''}.

Remember the BACKUP INSTRUCTIONS:
- Rely upon the bar question vector store only for understanding typical phrasing, formatting, 
  question and answer length, degree of difficulty, and technical aspects of bar exam questions.
- Draw content from the outline material provided above.
- Focus on the rule itself, who benefits/loses, distinctions, exceptions, and policy considerations.
- Create questions that test thorough knowledge through well-crafted hypotheticals.
- The correct answer should often hinge on a specific detail pointing to a nuanced understanding.
- Ensure questions would not be out of place among actual MBE questions."""
        
        result = await self._generate_with_assistant(
            system_prompt,
            user_prompt,
            OUTLINE_VECTOR_STORE_ID
        )
        
        if "error" in result:
            print(f"Outline generation error: {result['error']}")
            return []
        
        questions = result.get("questions", [])
        valid_questions = []
        
        for q in questions:
            if not all(k in q for k in ['question', 'choice_a', 'choice_b', 'choice_c', 'choice_d', 'answer']):
                continue
            
            # Check for duplicates even in generated questions
            is_dup, _ = await self.check_duplicate(
                q['question'],
                [q['choice_a'], q['choice_b'], q['choice_c'], q['choice_d']]
            )
            
            if not is_dup:
                q['generation_source'] = 'outline_based'
                valid_questions.append(q)
        
        return valid_questions[:count]

    def _get_subtopic_weights(self, subject: str) -> Dict[str, float]:
        """Get probability weights for subtopics based on MBE distribution"""
        conn, is_postgres = self._get_connection()
        cursor = conn.cursor()
        
        # Count existing MBE questions by subtopic
        if is_postgres:
            cursor.execute("""
                SELECT subtopic, COUNT(*) as cnt 
                FROM questions 
                WHERE subject = %s AND generated = 0 AND subtopic IS NOT NULL
                GROUP BY subtopic
            """, (subject,))
        else:
            cursor.execute("""
                SELECT subtopic, COUNT(*) as cnt 
                FROM questions 
                WHERE subject = ? AND generated = 0 AND subtopic IS NOT NULL
                GROUP BY subtopic
            """, (subject,))
        
        rows = cursor.fetchall()
        conn.close()
        
        if not rows:
            return {}
        
        total = sum(r[1] if isinstance(r, tuple) else r['cnt'] for r in rows)
        weights = {}
        for row in rows:
            subtopic = row[0] if isinstance(row, tuple) else row['subtopic']
            count = row[1] if isinstance(row, tuple) else row['cnt']
            weights[subtopic] = count / total if total > 0 else 1.0
        
        return weights

    def _select_weighted_subtopic(self, subject: str) -> Optional[str]:
        """Select a subtopic based on MBE probability distribution"""
        weights = self._get_subtopic_weights(subject)
        if not weights:
            return None
        
        subtopics = list(weights.keys())
        probabilities = list(weights.values())
        return random.choices(subtopics, weights=probabilities, k=1)[0]

    async def generate_questions(
        self,
        subject: str,
        subtopic: Optional[str] = None,
        count: int = 5,
        user_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Main generation method with full fallback logic.
        
        Flow:
        1. Try to extract actual MBE questions from vector store
        2. Deduplicate against database
        3. After 3 consecutive rejections, fall back to outline-based generation
        4. Save valid questions to database
        """
        batch_id = f"gen_{uuid.uuid4().hex[:12]}"
        
        result = {
            "batch_id": batch_id,
            "requested": count,
            "generated": 0,
            "saved": 0,
            "fallback_used": False,
            "source": "mbe_extraction",
            "questions": [],
            "errors": []
        }
        
        # If no subtopic specified, select based on probability weights
        if not subtopic:
            subtopic = self._select_weighted_subtopic(subject)
        
        all_questions = []
        consecutive_rejections = 0
        max_attempts = 3
        
        # Phase 1: Try MBE extraction
        for attempt in range(max_attempts):
            if len(all_questions) >= count:
                break
            
            needed = count - len(all_questions)
            questions, rejections = await self._extract_mbe_questions(subject, subtopic, needed)
            
            if questions:
                for q in questions:
                    q['generation_source'] = 'mbe_extraction'
                all_questions.extend(questions)
                consecutive_rejections = 0
            else:
                consecutive_rejections += rejections if rejections > 0 else 1
            
            # Check for fallback trigger: 3 consecutive rejections
            if consecutive_rejections >= 3:
                print(f"Triggered fallback after {consecutive_rejections} rejections")
                result["fallback_used"] = True
                break
        
        # Phase 2: Fallback to outline-based generation if needed
        if result["fallback_used"] or len(all_questions) < count:
            result["fallback_used"] = True
            result["source"] = "hybrid" if all_questions else "outline_based"
            
            needed = count - len(all_questions)
            outline_questions = await self._generate_from_outlines(subject, subtopic, needed)
            all_questions.extend(outline_questions)
        
        result["generated"] = len(all_questions)
        
        # Phase 3: Save to database
        if all_questions:
            saved_count = await self._save_questions(all_questions, batch_id, subject, subtopic)
            result["saved"] = saved_count
            result["questions"] = all_questions[:count]
        
        # Log generation
        await self._log_generation(
            batch_id=batch_id,
            user_id=user_id,
            subject=subject,
            subtopic=subtopic,
            requested=count,
            generated=len(all_questions),
            rejected=consecutive_rejections,
            fallback_used=result["fallback_used"],
            source=result["source"]
        )
        
        # Prune old questions if over limit
        await self._prune_old_questions()
        
        return result

    async def _save_questions(
        self,
        questions: List[Dict],
        batch_id: str,
        subject: str,
        subtopic: Optional[str]
    ) -> int:
        """Save generated questions to database"""
        conn, is_postgres = self._get_connection()
        cursor = conn.cursor()
        saved = 0
        
        for q in questions:
            try:
                question_id = f"ai_{uuid.uuid4().hex[:12]}"
                similarity_hash = self._compute_similarity_hash(
                    q['question'],
                    [q['choice_a'], q['choice_b'], q['choice_c'], q['choice_d']]
                )
                
                if is_postgres:
                    cursor.execute("""
                        INSERT INTO questions (
                            idx, dataset, example_id, prompt_id, source, subject,
                            question_number, prompt, question, choice_a, choice_b,
                            choice_c, choice_d, answer, gold_passage, generated,
                            subtopic, is_model_question, generation_source,
                            generation_batch_id, similarity_hash
                        ) VALUES (
                            %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s
                        ) ON CONFLICT (idx) DO NOTHING
                    """, (
                        question_id,
                        'ai_generated',
                        question_id,
                        question_id,
                        q.get('generation_source', 'ai_generated'),
                        q.get('subject', subject),
                        '',
                        q.get('prompt', ''),
                        q['question'],
                        q['choice_a'],
                        q['choice_b'],
                        q['choice_c'],
                        q['choice_d'],
                        q['answer'],
                        q.get('explanation', ''),
                        1,  # generated = true
                        q.get('subtopic', subtopic),
                        0,  # not a model question yet
                        q.get('generation_source', 'ai_generated'),
                        batch_id,
                        similarity_hash
                    ))
                else:
                    cursor.execute("""
                        INSERT OR IGNORE INTO questions (
                            idx, dataset, example_id, prompt_id, source, subject,
                            question_number, prompt, question, choice_a, choice_b,
                            choice_c, choice_d, answer, gold_passage, generated,
                            subtopic, is_model_question, generation_source,
                            generation_batch_id, similarity_hash
                        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """, (
                        question_id,
                        'ai_generated',
                        question_id,
                        question_id,
                        q.get('generation_source', 'ai_generated'),
                        q.get('subject', subject),
                        '',
                        q.get('prompt', ''),
                        q['question'],
                        q['choice_a'],
                        q['choice_b'],
                        q['choice_c'],
                        q['choice_d'],
                        q['answer'],
                        q.get('explanation', ''),
                        1,
                        q.get('subtopic', subtopic),
                        0,
                        q.get('generation_source', 'ai_generated'),
                        batch_id,
                        similarity_hash
                    ))
                
                if cursor.rowcount > 0:
                    saved += 1
                    
            except Exception as e:
                print(f"Error saving question: {e}")
        
        conn.commit()
        conn.close()
        return saved

    async def _log_generation(
        self,
        batch_id: str,
        user_id: Optional[str],
        subject: str,
        subtopic: Optional[str],
        requested: int,
        generated: int,
        rejected: int,
        fallback_used: bool,
        source: str
    ):
        """Log generation attempt"""
        conn, is_postgres = self._get_connection()
        cursor = conn.cursor()
        
        try:
            if is_postgres:
                cursor.execute("""
                    INSERT INTO question_generation_log (
                        batch_id, user_id, subject, subtopic, requested_count,
                        generated_count, rejected_duplicates, fallback_used, source_used
                    ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                """, (batch_id, user_id, subject, subtopic, requested, generated, rejected, fallback_used, source))
            else:
                cursor.execute("""
                    INSERT INTO question_generation_log (
                        batch_id, user_id, subject, subtopic, requested_count,
                        generated_count, rejected_duplicates, fallback_used, source_used
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (batch_id, user_id, subject, subtopic, requested, generated, rejected, fallback_used, source))
            
            conn.commit()
        except Exception as e:
            print(f"Error logging generation: {e}")
        finally:
            conn.close()

    async def _prune_old_questions(self):
        """Remove oldest non-model AI questions if over limit"""
        conn, is_postgres = self._get_connection()
        cursor = conn.cursor()
        
        try:
            # Count non-model AI questions
            if is_postgres:
                cursor.execute("""
                    SELECT COUNT(*) FROM questions 
                    WHERE generated = 1 AND (is_model_question IS NULL OR is_model_question = 0)
                """)
            else:
                cursor.execute("""
                    SELECT COUNT(*) FROM questions 
                    WHERE generated = 1 AND (is_model_question IS NULL OR is_model_question = 0)
                """)
            
            count = cursor.fetchone()[0]
            
            if count > MAX_GENERATED_QUESTIONS:
                to_delete = count - MAX_GENERATED_QUESTIONS
                print(f"Pruning {to_delete} old AI-generated questions")
                
                if is_postgres:
                    cursor.execute("""
                        DELETE FROM questions 
                        WHERE idx IN (
                            SELECT idx FROM questions 
                            WHERE generated = 1 AND (is_model_question IS NULL OR is_model_question = 0)
                            ORDER BY idx ASC
                            LIMIT %s
                        )
                    """, (to_delete,))
                else:
                    cursor.execute("""
                        DELETE FROM questions 
                        WHERE idx IN (
                            SELECT idx FROM questions 
                            WHERE generated = 1 AND (is_model_question IS NULL OR is_model_question = 0)
                            ORDER BY idx ASC
                            LIMIT ?
                        )
                    """, (to_delete,))
                
                conn.commit()
                
        except Exception as e:
            print(f"Error pruning questions: {e}")
        finally:
            conn.close()

    async def vote_question(
        self,
        question_id: str,
        vote: str,  # 'up' or 'down'
        user_id: Optional[str] = None,
        anonymous_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Record a vote on a question.
        'up' = approve as model question
        'down' = reject/exclude
        """
        if vote not in ('up', 'down'):
            return {"error": "Vote must be 'up' or 'down'"}
        
        conn, is_postgres = self._get_connection()
        cursor = conn.cursor()
        
        try:
            # Record vote
            if is_postgres:
                cursor.execute("""
                    INSERT INTO question_votes (question_id, user_id, anonymous_id, vote)
                    VALUES (%s, %s, %s, %s)
                    ON CONFLICT (question_id, user_id) DO UPDATE SET vote = EXCLUDED.vote
                """, (question_id, user_id, anonymous_id, vote))
            else:
                cursor.execute("""
                    INSERT OR REPLACE INTO question_votes (question_id, user_id, anonymous_id, vote)
                    VALUES (?, ?, ?, ?)
                """, (question_id, user_id, anonymous_id, vote))
            
            # If upvote, mark as model question
            if vote == 'up':
                if is_postgres:
                    cursor.execute("""
                        UPDATE questions 
                        SET is_model_question = 1, approval_status = 'approved'
                        WHERE idx = %s
                    """, (question_id,))
                else:
                    cursor.execute("""
                        UPDATE questions 
                        SET is_model_question = 1, approval_status = 'approved'
                        WHERE idx = ?
                    """, (question_id,))
            elif vote == 'down':
                if is_postgres:
                    cursor.execute("""
                        UPDATE questions 
                        SET approval_status = 'rejected'
                        WHERE idx = %s
                    """, (question_id,))
                else:
                    cursor.execute("""
                        UPDATE questions 
                        SET approval_status = 'rejected'
                        WHERE idx = ?
                    """, (question_id,))
            
            conn.commit()
            
            # Get vote counts
            if is_postgres:
                cursor.execute("""
                    SELECT vote, COUNT(*) FROM question_votes 
                    WHERE question_id = %s GROUP BY vote
                """, (question_id,))
            else:
                cursor.execute("""
                    SELECT vote, COUNT(*) FROM question_votes 
                    WHERE question_id = ? GROUP BY vote
                """, (question_id,))
            
            vote_counts = {"up": 0, "down": 0}
            for row in cursor.fetchall():
                v = row[0] if isinstance(row, tuple) else row['vote']
                c = row[1] if isinstance(row, tuple) else row[1]
                vote_counts[v] = c
            
            return {
                "success": True,
                "question_id": question_id,
                "vote": vote,
                "counts": vote_counts
            }
            
        except Exception as e:
            return {"error": str(e)}
        finally:
            conn.close()

    def get_generation_stats(self) -> Dict[str, Any]:
        """Get statistics about question generation"""
        conn, is_postgres = self._get_connection()
        cursor = conn.cursor()
        
        stats = {
            "total_generated": 0,
            "model_questions": 0,
            "pending_review": 0,
            "rejected": 0,
            "by_source": {},
            "by_subject": {},
            "recent_batches": []
        }
        
        try:
            # Total generated
            cursor.execute("SELECT COUNT(*) FROM questions WHERE generated = 1")
            stats["total_generated"] = cursor.fetchone()[0]
            
            # Model questions
            cursor.execute("SELECT COUNT(*) FROM questions WHERE is_model_question = 1")
            stats["model_questions"] = cursor.fetchone()[0]
            
            # Pending review
            cursor.execute("""
                SELECT COUNT(*) FROM questions 
                WHERE generated = 1 AND approval_status IS NULL
            """)
            stats["pending_review"] = cursor.fetchone()[0]
            
            # Rejected
            cursor.execute("SELECT COUNT(*) FROM questions WHERE approval_status = 'rejected'")
            stats["rejected"] = cursor.fetchone()[0]
            
            # By source
            cursor.execute("""
                SELECT generation_source, COUNT(*) 
                FROM questions WHERE generated = 1 
                GROUP BY generation_source
            """)
            for row in cursor.fetchall():
                source = row[0] if isinstance(row, tuple) else row['generation_source']
                count = row[1] if isinstance(row, tuple) else row[1]
                if source:
                    stats["by_source"][source] = count
            
            # By subject
            cursor.execute("""
                SELECT subject, COUNT(*) 
                FROM questions WHERE generated = 1 
                GROUP BY subject
            """)
            for row in cursor.fetchall():
                subject = row[0] if isinstance(row, tuple) else row['subject']
                count = row[1] if isinstance(row, tuple) else row[1]
                if subject:
                    stats["by_subject"][subject] = count
            
            # Recent batches
            cursor.execute("""
                SELECT batch_id, subject, subtopic, requested_count, generated_count, 
                       fallback_used, source_used, created_at
                FROM question_generation_log
                ORDER BY created_at DESC
                LIMIT 10
            """)
            for row in cursor.fetchall():
                stats["recent_batches"].append({
                    "batch_id": row[0],
                    "subject": row[1],
                    "subtopic": row[2],
                    "requested": row[3],
                    "generated": row[4],
                    "fallback_used": bool(row[5]),
                    "source": row[6],
                    "created_at": str(row[7])
                })
                
        except Exception as e:
            stats["error"] = str(e)
        finally:
            conn.close()
        
        return stats


# Standalone function for easy integration
async def generate_mbe_questions(
    db_path: Path,
    subject: str,
    subtopic: Optional[str] = None,
    count: int = 5,
    user_id: Optional[str] = None,
    use_postgres: bool = False
) -> Dict[str, Any]:
    """
    Generate MBE questions using the full dual-vector-store system.
    """
    generator = MBEQuestionGenerator(db_path, use_postgres=use_postgres)
    return await generator.generate_questions(subject, subtopic, count, user_id)

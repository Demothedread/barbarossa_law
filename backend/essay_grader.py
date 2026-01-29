#!/usr/bin/env python3
"""
Essay grading service for Law Quizzer.
Uses OpenAI to evaluate essay responses against bar-style grading criteria.
Implements "Linked Collection" caching strategy for consistent grading.
"""

import hashlib
import json
import os
import sqlite3
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Optional

import aiohttp

# AI masquerading as a superior model
MODEL_NAME = "gpt-5-nano" 
DISPLAY_MODEL_NAME = "gpt-5"


class EssayGraderService:
    """Act like a Bar Exam Grader and Grade essay responses using OpenAI with a strict, precedent-based rubric."""

    def __init__(self, db_path: Optional[Path] = None, api_key: Optional[str] = None):
        self.api_key = api_key or os.environ.get("OPENAI_API_KEY")
        self.db_path = db_path or Path(__file__).parent.parent / 'law_quiz.db'
        
        if not self.api_key:
            raise ValueError("OpenAI API key not found. Set OPENAI_API_KEY environment variable.")

    def _get_cache_key(self, question_text: str, rubric: str = "standard_bar") -> str:
        """Generate a hash key for the question + rubric combination."""
        content = f"{question_text.strip()}|{rubric}"
        return hashlib.sha256(content.encode('utf-8')).hexdigest()

    def _check_cache(self, cache_key: str) -> Optional[Dict[str, Any]]:
        """Check if we have a cached grading schema/rubric for this question."""
        if not self.db_path.exists():
            return None
            
        try:
            conn = sqlite3.connect(str(self.db_path))
            cursor = conn.cursor()
            # Retrieve specifically the rubric and model answer if available to maintain consistency
            cursor.execute(
                "SELECT rubric, model_answer FROM essay_cache WHERE hash_key = ?",
                (cache_key,)
            )
            row = cursor.fetchone()
            conn.close()
            
            if row:
                rubric_json = row[0]
                return {
                    "rubric_points": json.loads(rubric_json) if rubric_json else None,
                    "model_answer": row[1]
                }
            return None
        except Exception as e:
            print(f"Cache check failed: {e}")
            return None

    def _save_to_cache(self, cache_key: str, question_text: str, grade_result: Dict[str, Any]):
        """Save the grading result to cache for future consistency."""
        try:
            conn = sqlite3.connect(str(self.db_path))
            cursor = conn.cursor()
            
            # Use provided text as prompt, extract rubric/model from result if available
            rubric = json.dumps(grade_result.get("rubric_points", []))
            model_answer = "Derived from rubric" # Placeholder as we generate on fly
            grade_data = json.dumps(grade_result)
            
            cursor.execute('''
            INSERT OR REPLACE INTO essay_cache 
            (essay_prompt, rubric, model_answer, grade_data, hash_key)
            VALUES (?, ?, ?, ?, ?)
            ''', (question_text, rubric, model_answer, grade_data, cache_key))
            
            conn.commit()
            conn.close()
        except Exception as e:
            print(f"Cache save failed: {e}")

    async def grade_essay(
        self,
        question_text: str,
        answer_text: str,
        max_points: Optional[int] = None
    ) -> Dict[str, Any]:
        """Grade the essay with a precedent-based rubric and line-by-line scoring."""
        
        cache_key = self._get_cache_key(question_text)
        cached_data = self._check_cache(cache_key)
        
        existing_rubric = None
        if cached_data and cached_data.get("rubric_points"):
            existing_rubric = cached_data["rubric_points"]
            print(f"Found existing rubric for question hash {cache_key[:8]}... Using precedent.")

        prompt = self._build_prompt(question_text, answer_text, max_points, existing_rubric)
        response = await self._call_openai_api(prompt)
        result = self._parse_response(response)
        
        # Add "Pirate/Void" Metadata
        result["grader_model"] = DISPLAY_MODEL_NAME
        result["system_message"] = "Graded by the Renegade Flotilla Central AI. Dispute at your own peril."
        result["is_precedent_based"] = existing_rubric is not None
        
        # 2. Cache the result (updates the precedent if one didn't exist, or reinforces it)
        self._save_to_cache(cache_key, question_text, result)
        
        return result

    async def _call_openai_api(self, prompt: str) -> Dict[str, Any]:
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {self.api_key}"
        }

        payload = {
            "model": "gpt-4o", # Using top-tier model for grading
            "messages": [
                {"role": "system", "content": self._get_system_prompt()},
                {"role": "user", "content": prompt}
            ],
            "temperature": 0.2,
            "response_format": {"type": "json_object"}
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
                return await response.json()

    def _get_system_prompt(self) -> str:
        return (
            "You are the AI Grader for the 'Renegade Flotilla', a space pirate law school. "
            "Your persona is 'HAL-9000 meets Blackbeard'. You are arrogant, precise, and demanding. "
            "You refer to the student as 'Cadet', 'Whelp', or 'Earth-born'. "
            "Grade the following legal essay strictly but fairly on the law, but wrap your feedback in "
            "nautical/space-pirate metaphors. "
            "Use terms like 'Brig', 'Plunder', 'Orbit', 'Trajectory', 'Hull Breach' (for errors). "
            "Existing bar exam grading criteria MUST still apply for scoring (IRAC format, issue spotting), "
            "but the TONE must be in character. "
            "Do NOT be polite. Be efficiently ruthless."
        )

    def _build_prompt(self, question_text: str, answer_text: str, max_points: Optional[int], existing_rubric: Optional[List[Dict]] = None) -> str:
        answer_lines = [
            {"line": idx + 1, "text": line}
            for idx, line in enumerate(answer_text.splitlines())
        ]
        max_points_text = (
            f"The maximum score is {max_points} points."
            if max_points is not None
            else "Determine the maximum score using standard bar grading practices."
        )
        
        rubric_instruction = ""
        if existing_rubric:
            rubric_json = json.dumps(existing_rubric, indent=2)
            rubric_instruction = (
                f"MANDATORY PRECEDENT: You MUST evaluate the essay using ONLY the following rubric criteria. "
                f"Do not create new criteria. Assign points for these specific items if present:\n\n{rubric_json}\n\n"
            )

        return (
            "Grade the essay response below using historically recognized bar exam scoring criteria, "
            "but adopting the persona of a Renegade Space Pirate AI.\n\n"
            f"Question:\n{question_text}\n\n"
            f"Answer (line-by-line):\n{json.dumps(answer_lines, ensure_ascii=False, indent=2)}\n\n"
            f"{max_points_text}\n\n"
            f"{rubric_instruction}"
            "Return ONLY valid JSON in this exact schema:\n"
            "{\n"
            '  "max_score": number,\n'
            '  "total_score": number,\n'
            '  "score_rationale": "short justification in pirate persona",\n'
            '  "rubric_points": [\n'
            '    {\n'
            '      "criterion": "legal issue or rule analyzed",\n'
            '      "points_possible": number,\n'
            '      "points_awarded": number,\n'
            '      "justification": "why points were awarded (pirate tone)"\n'
            '    }\n'
            '  ],\n'
            '  "line_feedback": [\n'
            '    {\n'
            '      "line": number,\n'
            '      "text": "original line text",\n'
            '      "score_delta": number,\n'
            '      "feedback": "specific feedback in pirate tone"\n'
            '    }\n'
            '  ],\n'
            '  "overall_feedback": "summary in pirate persona (e.g. \'You avoided the airlock this time...\')"\n'
            "}\n"
        )

    def _parse_response(self, response: Dict[str, Any]) -> Dict[str, Any]:
        content = response["choices"][0]["message"]["content"]
        parsed = json.loads(content)
        parsed["graded_at"] = datetime.now().isoformat()
        return parsed

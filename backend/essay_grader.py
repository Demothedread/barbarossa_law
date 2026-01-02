#!/usr/bin/env python3
"""
Essay grading service for Law Quizzer.
Uses OpenAI to evaluate essay responses against bar-style grading criteria.
"""

import json
import os
from datetime import datetime
from typing import Any, Dict, List, Optional

import aiohttp

MODEL_NAME = "gpt-5.2"


class EssayGraderService:
    """Grade essay responses using OpenAI with a strict, precedent-based rubric."""

    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or os.environ.get("OPENAI_API_KEY")
        if not self.api_key:
            raise ValueError("OpenAI API key not found. Set OPENAI_API_KEY environment variable.")

    async def grade_essay(
        self,
        question_text: str,
        answer_text: str,
        max_points: Optional[int] = None
    ) -> Dict[str, Any]:
        """Grade the essay with a precedent-based rubric and line-by-line scoring."""
        prompt = self._build_prompt(question_text, answer_text, max_points)
        response = await self._call_openai_api(prompt)
        return self._parse_response(response)

    async def _call_openai_api(self, prompt: str) -> Dict[str, Any]:
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {self.api_key}"
        }

        payload = {
            "model": MODEL_NAME,
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
            "You are a California Bar Exam essay grader. "
            "Grade only on well-cited, historically recognized scoring criteria from past bar exams. "
            "Do NOT invent new standards, hypothetical rules, or speculative points. "
            "If the answer does not match recognized scoring reasons, award zero for that item. "
            "Use the same rubric style and point allocations as prior exam graders. "
            "Provide line-by-line scoring feedback and a final score out of the declared max points. "
            "If max points are unclear, infer a reasonable bar-style point total and state it explicitly."
        )

    def _build_prompt(self, question_text: str, answer_text: str, max_points: Optional[int]) -> str:
        answer_lines = [
            {"line": idx + 1, "text": line}
            for idx, line in enumerate(answer_text.splitlines())
        ]
        max_points_text = (
            f"The maximum score is {max_points} points."
            if max_points is not None
            else "Determine the maximum score using standard bar grading practices."
        )

        return (
            "Grade the essay response below using only historically recognized bar exam scoring criteria.\n\n"
            f"Question:\n{question_text}\n\n"
            f"Answer (line-by-line):\n{json.dumps(answer_lines, ensure_ascii=False, indent=2)}\n\n"
            f"{max_points_text}\n\n"
            "Return ONLY valid JSON in this exact schema:\n"
            "{\n"
            '  "max_score": number,\n'
            '  "total_score": number,\n'
            '  "score_rationale": "short justification grounded in prior grading criteria",\n'
            '  "rubric_points": [\n'
            '    {\n'
            '      "criterion": "recognized scoring issue/point",\n'
            '      "points_possible": number,\n'
            '      "points_awarded": number,\n'
            '      "justification": "why points were awarded or withheld based on precedent"\n'
            "    }\n"
            "  ],\n"
            '  "line_feedback": [\n'
            "    {\n"
            '      "line": number,\n'
            '      "text": "original line text",\n'
            '      "score_delta": number,\n'
            '      "feedback": "point-based explanation tied to recognized criteria"\n'
            "    }\n"
            "  ],\n"
            '  "overall_feedback": "concise, criteria-based summary"\n'
            "}\n"
        )

    def _parse_response(self, response: Dict[str, Any]) -> Dict[str, Any]:
        content = response["choices"][0]["message"]["content"]
        parsed = json.loads(content)
        parsed["graded_at"] = datetime.now().isoformat()
        return parsed

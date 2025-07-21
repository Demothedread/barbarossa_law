# Vector Store Integration for Law Quizzer

## Overview
This document describes the OpenAI Vector Store integration that allows the Law Quizzer application to automatically extract and generate new questions from the vector store `vs_6875b6f14b788191aed0702450e5ca49`.

## Architecture

### Components Created

1. **Vector Store Service V2** (`backend/vector_store_service_v2.py`)
   - Uses OpenAI Assistants API to connect to the vector store
   - Generates structured California Bar Exam questions based on vector store content
   - Implements proper JSON parsing and database integration
   - Includes error handling and cleanup mechanisms

2. **API Endpoints** (`backend/server.py`)
   - `POST /api/extract-questions` - Triggers question extraction from vector store
   - `GET /api/vector-store/status` - Checks vector store service availability

3. **Database Integration**
   - Automatically saves generated questions to the existing SQLite database
   - Uses unique IDs with "vs_" prefix for vector store questions
   - Handles duplicate prevention with `INSERT OR IGNORE`

4. **Environment Configuration**
   - Added `VECTOR_STORE_ID` to `.env-local`
   - Automatic fallback to default vector store ID if not configured

## Usage

### Via API Endpoint
```bash
curl -X POST http://localhost:5000/api/extract-questions \
  -H "Content-Type: application/json" \
  -d '{"num_questions": 5}'
```

### Via Test Script
```bash
python scripts/test_vector_store_v2.py
```

### Response Format
```json
{
  "success": true,
  "message": "Extracted 5 questions, saved 5 to database",
  "results": {
    "questions_extracted": 5,
    "questions_saved": 5,
    "content_sources_processed": 1,
    "errors": []
  }
}
```

## Question Generation Process

1. **Assistant Creation**: Creates a temporary OpenAI assistant with access to the vector store
2. **Thread Management**: Creates a conversation thread for question generation
3. **Content Analysis**: Assistant analyzes vector store content to identify legal concepts
4. **Question Generation**: Generates California Bar Exam style multiple choice questions
5. **Structured Output**: Returns questions in JSON format with all required fields
6. **Database Storage**: Saves valid questions to the database with proper metadata
7. **Cleanup**: Removes temporary assistant to avoid resource accumulation

## Generated Question Format

Each question includes:
- **question**: The main question text
- **prompt**: Context or fact pattern
- **choice_a/b/c/d**: Four answer choices
- **answer**: Correct answer (A, B, C, or D)
- **subject**: Legal subject area
- **explanation**: Brief explanation of the correct answer

## Database Schema

Questions are stored in the existing `questions` table with:
- `idx`: Unique ID with "vs_" prefix
- `source`: "vector_store_generated"
- `dataset`: "vector_store_generated"
- All standard question fields (choices, answer, etc.)

## Configuration

### Environment Variables
```bash
OPENAI_API_KEY="your-api-key"
VECTOR_STORE_ID="vs_6875b6f14b788191aed0702450e5ca49"
```

### API Limits
- Maximum 50 questions per request (configurable)
- Built-in rate limiting with delays
- Timeout handling for long-running operations

## Testing

### Successful Test Results
- ✅ Vector store connection established
- ✅ Assistant creation and management working
- ✅ Question generation producing valid output
- ✅ Database integration saving questions correctly
- ✅ JSON parsing handling structured output properly
- ✅ Cleanup mechanisms preventing resource leaks

### Test Output Example
```
Testing Vector Store Integration V2
==================================================
Generating 3 questions using vector store assistant...
Created assistant: asst_uMBLWjQ47RPfqj4Re6sg44BB
Created thread: thread_KzItUsOgaUo17phPp40dDhIg
Started run: run_kZnUDZuJG6zywKK2ZXCFz2Gf
Run status: completed
Received response from assistant
Saving 3 questions to database...
Successfully generated 3 questions and saved 3 to database.

✅ Successfully generated and added 3 new questions to the database!
```

## Implementation Notes

- Uses OpenAI's latest Assistants API v2
- Implements proper async/await patterns
- Includes comprehensive error handling
- Automatically cleans up temporary resources
- Generates questions based on actual vector store content
- Maintains compatibility with existing quiz infrastructure

## Future Enhancements

1. **Batch Processing**: Support for larger question generation batches
2. **Subject Filtering**: Generate questions for specific legal subjects
3. **Difficulty Levels**: Control question complexity
4. **Quality Metrics**: Track question generation success rates
5. **Caching**: Cache generated questions to reduce API calls
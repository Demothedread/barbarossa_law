# Law Quizzer Copilot Instructions
- reuse the same terminal, do not open a new one unless necessary.
- when opening a new terminal, ensure you pause for at least 8 second before typing any commands. If an initial command fails, wait 3 seconds, and try once more. 
## Architecture Overview

**Dual-Mode Quiz Application**: Supports both static CLI quiz (`scripts/law_quiz.py` using `qa.csv`) and web-based quiz with AI explanations (frontend + Flask backend + SQLite).

**Key Components**:
- Frontend: Vanilla JS modules in `src/js/` with Tailwind CSS
- Backend: Flask API (`backend/server.py`) with async AI explanation service
- Database: SQLite (`law_quiz.db`) with questions, explanations, and quiz history
- CLI Tool: Standalone Python script reading CSV directly

## Critical Development Workflows

**Start Development Environment**:
```bash
npm start  # Launches Flask API (port 5001) + static server (port 3000)
```

**Database Management**:
```bash
python scripts/initialize_db.py  # Create/update schema, handles all migrations
python scripts/reset_db.py       # Reset database state
```

**Testing**:
```bash
npm test  # Jest tests with ES modules
```

## Project-Specific Patterns

**Frontend Module Architecture**: Uses factory pattern for UI components:
```javascript
// Pattern: src/js/lq-*.js modules export create* functions
import { createQuiz } from './lq-quiz.js';
const quizElement = createQuiz(questions, opts, onComplete);
```

**API Integration**: Single source API module (`lq-api.js`) with consistent error handling:
```javascript
// All backend calls go through lq-api.js
const res = await fetchQuestionsByType(opts.n, opts.subject, opts.questionType);
```

**AI Explanations Flow**:
1. Backend generates via `AIExplainService` using OpenAI API
2. Stored in `question_explanations` table as JSON with explanation mapped to answer choice
3. Frontend displays expandable explanations in review UI
4. Audio feedback (happy.wav/sad.wav) based on >65% score threshold

**Database Schema Conventions**:
- Questions have `generated` column (0=MBE, 1=AI-generated)
- AI-generated questions use same header format as MBE questions
- Question IDs: MBE format `mbe_###` or AI format `ai_###`
- AI explanations stored as JSON: `{"A": "explanation...", "B": "explanation..."}`
- Question tracking prevents reuse, especially for correctly answered questions

## Environment Configuration

**Required Environment Variables**:
- `OPENAI_API_KEY`: Enables AI explanations and question generation
- Without API key: Falls back to basic quiz functionality

**Database Paths**:
- Backend uses `Path(__file__).parent.parent / 'law_quiz.db'`
- CLI uses `qa.csv` directly (completely independent)
- All database migrations handled by `initialize_db.py`

## Integration Points

**Frontend-Backend Communication**:
- API base: `http://localhost:5001/api`
- Key endpoints: `/subjects`, `/questions?type=mix|mbe|generated`, `/explanations`
- CORS enabled for local development

**Question Selection Logic**:
- Random selection with ID tracking to prevent reuse
- Correct answers tracked to avoid repetition
- "mbe": Original bar exam questions (`generated = 0`)
- "generated": AI-created questions (`generated = 1`) 
- "mix": Random selection from both pools

**Statistics & Study Aid Tracking**:
- Advanced analytics by topic and subject
- Performance tracking per question type
- Study progress metrics stored in quiz_history table

## Styling Approach

**Tailwind CSS**: Use utility-first approach with global Tailwind classes
- Avoid custom CSS complexity - use Tailwind utilities
- Apply Occam's Razor: simplest solution preferred over complex implementations
- Minimal custom components, maximum utility reuse

## Testing Patterns

Uses Jest with ES modules configuration:
- Mock DOM elements for UI component testing
- Test question manager logic and quiz state management
- Run with `--experimental-vm-modules` flag for ES6 imports

## Simplicity Guidelines

- **One README per directory maximum**
- **Avoid code clutter** - prefer clean, minimal implementations
- **Database migrations**: All handled by `initialize_db.py`
- **AI responses**: Always JSON format for consistency
- **Question tracking**: Simple ID-based system to prevent reuse

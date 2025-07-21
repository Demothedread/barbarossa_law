# Law Quizzer - AI-Enhanced Web Application

A comprehensive law quiz application with AI-powered explanations, advanced analytics, and professional features for California Bar Exam preparation.

## 🆕 Latest Features (v2.0)

### 🤖 **AI-Powered Answer Explanations**
- **OpenAI GPT-4o-mini Integration**: Get detailed explanations for every answer choice
- **California Bar Exam Focus**: Explanations tailored for bar exam preparation
- **Mnemonic Devices**: AI provides memory aids and study techniques
- **Cached Results**: Explanations are stored locally to improve performance
- **Question-Specific Analysis**: Only generates explanations for questions in your quiz

### ⏱️ **Enhanced Timer System**
- **Overtime Allowed**: Continue working after time expires
- **Negative Time Tracking**: Monitor how much extra time was used
- **Performance Metrics**: Overtime usage tracked in statistics
- **Visual Indicators**: Clear warnings when time expires

### 📊 **Advanced Performance Analytics**
- **Comprehensive Dashboard**: Track progress across all subjects and sessions
- **Trend Visualization**: Interactive charts showing score improvements over time
- **65% Threshold**: Visual indicator for California Bar passing score
- **Subject Breakdown**: Detailed analysis by legal topic
- **Session History**: Review individual quiz performances with timestamps

### ✨ **Enhanced Quiz Experience**
- **Text Highlighting**: Three-color highlighting system for important passages
- **Smart Navigation**: Question-by-question review with detailed explanations
- **Confirmation Dialogs**: Prevent accidental exam submission
- **Improved UI**: Professional design with better accessibility

## Setup Instructions

### 1. Prerequisites
- Python 3.8+
- OpenAI API account (for AI explanations)

### 2. Installation

```bash
# Install backend dependencies
cd backend
pip install -r requirements.txt

# Initialize database with all tables
cd ..
python scripts/initialize_db.py
```

### 3. OpenAI API Configuration

1. **Get API Key**: Visit [OpenAI Platform](https://platform.openai.com/account/api-keys)
2. **Create Environment File**:
   ```bash
   cp .env.example .env
   ```
3. **Add Your API Key** to `.env`:
   ```env
   OPENAI_API_KEY=sk-your-actual-api-key-here
   ```

### 4. Start the Application

**Backend Server (Terminal 1):**
```bash
cd backend
python server.py
# Backend runs on http://localhost:5001
```

**Frontend Server (Terminal 2):**
```bash
python dev-server.py
# Frontend opens automatically at http://localhost:3000
```

## 🚀 How It Works

### Quiz Flow
1. **Configuration**: Select questions, subject, and timing
2. **Interactive Quiz**: Answer with highlighting and elimination tools
3. **AI Analysis**: System fetches explanations for your specific questions
4. **Detailed Review**: Navigate through each question with AI insights
5. **Performance Tracking**: Results saved to personal analytics dashboard

### AI Explanation System
```python
# Example AI prompt structure:
"""
You are a California Bar Exam expert. For this law question, explain:
1. Why the correct answer is the best legal application
2. Why each incorrect choice is wrong
3. Include relevant mnemonics or memory devices
4. State the rule of law clearly and concisely
"""
```

### Performance Analytics
- **Individual Sessions**: Date, subject, score, time used
- **Trend Analysis**: Line charts with 65% passing threshold
- **Subject Mastery**: Performance breakdown by legal topic
- **Overtime Tracking**: Monitor time management skills

## 🛠️ Technical Architecture

### Frontend (Vanilla JavaScript)
```
src/js/
├── lq-main.js          # Application controller
├── lq-api.js           # API communication layer
├── lq-quiz.js          # Quiz interface with highlighting
├── lq-review.js        # AI-enhanced review screen
├── lq-statistics.js    # Analytics dashboard
└── lq-start-menu.js    # Quiz configuration
```

### Backend (Python Flask)
```
backend/
├── server.py           # Main API server
├── ai_explanations.py  # OpenAI integration
└── requirements.txt    # Dependencies
```

### Database Schema
```sql
-- Questions from your law_quiz.db
questions (idx, question, choices, answer, gold_passage, ...)

-- AI-generated explanations (cached)
question_explanations (question_id, ai_explanation, created_at)

-- Performance tracking
quiz_history (user_id, subject, correct, total, duration_seconds, negative_time, ...)
```

## 📊 API Endpoints

### Core Endpoints
- `GET /api/subjects` - Available quiz subjects
- `GET /api/questions` - Random questions with filtering
- `POST /api/explanations` - Generate AI explanations
- `POST /api/quiz-history` - Save quiz results
- `GET /api/quiz-history` - Retrieve performance data

### AI Integration
```javascript
// Request AI explanations for quiz questions
const explanations = await fetchAIExplanations(questionIds);

// Response format:
{
  "question_id": {
    "correct_answer": "A",
    "explanations": {
      "A": "This is correct because...",
      "B": "This is wrong because...",
      "C": "This fails because...",
      "D": "This is incorrect since..."
    }
  }
}
```

## 🎨 UI Components

### Statistics Dashboard
- Performance summary cards
- Interactive Chart.js visualizations
- Subject breakdown tables
- Recent quiz history with pass/fail indicators

### Enhanced Review Screen
- Question-by-question navigation
- Side-by-side correct/incorrect answer highlighting
- AI explanations in formatted boxes
- Rule of law passages with proper styling

### Quiz Interface Improvements
- Three-color text highlighting (yellow, cyan, lime)
- "End Exam" confirmation dialog
- Overtime warnings and tracking
- Improved accessibility and mobile support

## 🔧 Configuration Options

### Environment Variables (.env)
```env
OPENAI_API_KEY=your_key_here    # Required for AI explanations
DB_PATH=law_quiz.db             # Database location
HOST=localhost                  # Server host
PORT=5001                       # Backend port
DEBUG=True                      # Development mode
```

### Customization
- **AI Model**: Change `DEFAULT_MODEL` in `ai_explanations.py`
- **Passing Threshold**: Modify 65% threshold in statistics display
- **Color Scheme**: Update CSS custom properties in `styles.css`
- **Timer Settings**: Adjust default timing in quiz configuration

## 📈 Performance Considerations

### AI API Usage
- **Caching**: Explanations stored in SQLite to avoid repeat API calls
- **Async Processing**: Non-blocking explanation generation
- **Error Handling**: Graceful fallbacks when AI service is unavailable
- **Cost Management**: Only generate explanations for quiz questions

### Frontend Optimization
- **Chart.js CDN**: External loading for visualization library
- **Modular JavaScript**: ES6 modules for better code organization
- **CSS Custom Properties**: Consistent theming with minimal overhead
- **Local Storage**: Client-side performance tracking

## 🚀 Deployment

### Production Setup
1. **Environment Security**: Use production OpenAI API key
2. **Database Persistence**: Configure SQLite file location
3. **HTTPS**: Enable secure connections for API calls
4. **Rate Limiting**: Implement API usage controls
5. **Error Monitoring**: Add logging and error tracking

### Scaling Considerations
- **Database**: Consider PostgreSQL for multi-user deployments
- **Caching**: Redis for improved AI explanation caching
- **Load Balancing**: nginx for frontend static file serving
- **API Gateway**: Rate limiting and authentication for OpenAI calls

## 📝 Development Notes

### Contributing
- Follow existing code structure and naming conventions
- Test AI explanations with sample questions before deployment
- Ensure accessibility standards are maintained
- Update documentation for new features

### Future Enhancements
- **User Authentication**: Personal accounts and progress tracking
- **Custom Question Sets**: Import/export functionality
- **Study Plans**: Adaptive learning recommendations
- **Mobile App**: Native iOS/Android applications
- **Collaborative Features**: Study groups and shared progress

## 📄 License

Educational use license. Ensure compliance with OpenAI usage policies and any question content licensing requirements.

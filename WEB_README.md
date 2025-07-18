# Law Quizzer Web Interface

A comprehensive web-based quiz application for testing legal knowledge across various subjects.

## Features

- 🎯 **Interactive Quiz Interface**: Modern, responsive web interface with timer and progress tracking
- 📚 **Subject Selection**: Choose from multiple legal subjects or take mixed quizzes
- ⏱️ **Customizable Timing**: Set time per question (0.5-10 minutes)
- 📊 **Performance Analytics**: Track your progress with detailed statistics
- 💡 **Answer Explanations**: Learn from detailed explanations after each quiz
- 🎨 **Text Highlighting**: Highlight important parts of questions during the quiz
- 📱 **Responsive Design**: Works seamlessly on desktop, tablet, and mobile devices

## Quick Start

### Prerequisites

- Python 3.7+ installed
- A web browser

### Setup

1. **Install Backend Dependencies**
   ```bash
   cd backend
   pip install -r requirements.txt
   ```

2. **Start the Backend API Server**
   ```bash
   cd backend
   python server.py
   ```
   The API server will start on `http://localhost:5001`

3. **Start the Frontend Development Server**
   ```bash
   # In a new terminal, from the project root
   python dev-server.py
   ```
   The web interface will open automatically at `http://localhost:3000`

### Alternative: Static File Serving

If you prefer to use your own web server, serve the files from the `src/` directory:

```bash
# Using Python's built-in server
cd src
python -m http.server 3000

# Using Node.js (if you have it installed)
cd src
npx serve .

# Using any other static file server
```

## Usage

1. **Home Page**: Choose number of questions, subject, and timing
2. **Quiz Interface**: 
   - Answer questions with A/B/C/D buttons
   - Use the ✖ buttons to eliminate wrong choices
   - Highlight important text in questions
   - Navigate between questions with Prev/Next
3. **Results**: View detailed breakdown of answers and explanations
4. **Statistics**: Track your performance over time across different subjects

## File Structure

```
src/
├── index.html          # Main HTML file
├── css/
│   └── styles.css      # All styling and responsive design
└── js/
    ├── lq-main.js      # Main application logic and navigation
    ├── lq-api.js       # Backend API communication
    ├── lq-quiz.js      # Quiz interface and logic
    ├── lq-review.js    # Results and review screen
    ├── lq-start-menu.js # Quiz configuration screen
    ├── lq-timer.js     # Timer utilities
    ├── lq-progress.js  # Progress tracking
    └── lq-question-manager.js # Question selection logic

backend/
├── server.py           # Flask API server
└── requirements.txt    # Python dependencies

dev-server.py           # Development server for frontend
```

## API Endpoints

The backend provides these REST endpoints:

- `GET /api/subjects` - Get all available subjects
- `GET /api/questions?n=10&subject=...` - Get random questions
- `POST /api/log` - Log quiz attempts
- `GET /api/health` - Health check

## Development

### Frontend Development

The frontend is built with vanilla JavaScript ES6+ modules and modern CSS. Key features:

- **Modular Architecture**: Each component is in its own module
- **Responsive Design**: Mobile-first CSS with flexbox and grid
- **Progressive Enhancement**: Works without JavaScript for basic functionality
- **Accessibility**: Semantic HTML and keyboard navigation support

### Backend Development

The backend is a simple Flask application that:

- Serves questions from the SQLite database
- Provides subject filtering and random selection
- Handles CORS for development
- Logs quiz attempts (can be extended to database storage)

### Customization

You can customize the interface by:

1. **Styling**: Edit `src/css/styles.css` - uses CSS custom properties for easy theming
2. **Quiz Logic**: Modify `src/js/lq-quiz.js` for different question types or scoring
3. **API Integration**: Update `src/js/lq-api.js` to connect to different backends
4. **Database**: Extend `backend/server.py` to add new features or data sources

## Troubleshooting

**Backend not connecting**: Ensure the Flask server is running on port 5001 and check CORS settings.

**Questions not loading**: Verify the database path in `backend/server.py` points to your `law_quiz.db` file.

**Styling issues**: Check that `src/css/styles.css` is loading correctly and CSS custom properties are supported in your browser.

**Performance**: For production deployment, consider using a proper web server (nginx, Apache) and WSGI server (gunicorn, uWSGI) for the backend.

## License

This project is designed for educational purposes. Please ensure any question content used complies with applicable copyright and licensing requirements.
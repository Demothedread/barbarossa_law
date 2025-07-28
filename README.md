
# Law Quizzer

A modern, AI-powered web and CLI quiz platform for California Bar Exam and legal study. Features advanced analytics, digital scratch paper, and seamless user experience.

## Features

- **Interactive Web Quiz**: Responsive UI with timer, progress, and digital scratch paper
- **AI Explanations**: OpenAI-powered, subtopic-classified answer explanations
- **Subject & Subtopic Selection**: Filter by subject and subtopic (CA Bar breakdown)
- **Customizable Timing**: Set minutes per question, pause/resume timer
- **Performance Analytics**: Track scores, overtime, and subtopic mastery
- **Text Highlighting**: Three-color highlight system for question text
- **Question Types**: MBE, AI-generated, or mixed
- **CLI Mode**: Standalone Python script for terminal quizzes
- **Digital Scratch Paper**: Slide-out notepad, persistent during exam, copy/download as .txt

## Quick Start

### Prerequisites
- Python 3.8+
- Node.js v20+
- pip (Python package installer)
- OpenAI API key (optional, for AI features)

### Installation

```bash
# Clone and enter repo
git clone <repo-url>
cd lawquizzer

# Install JS dependencies
npm install

# Install Python backend dependencies
cd backend
pip install -r requirements.txt
cd ..

# Initialize database
python scripts/initialize_db.py
```

### Configuration
- To enable AI explanations, set `OPENAI_API_KEY` in your environment or `.env` file.

### Running the App

```bash
npm start
```
- Launches Flask API (http://localhost:5001) and static server (http://localhost:3000)

### CLI Mode

```bash
python scripts/law_quiz.py
```

## Usage
- **Start Quiz**: Choose number, subject, subtopic, type, and timer
- **During Quiz**: Answer, highlight, eliminate, use scratch paper (📝 tab)
- **Review**: See AI explanations, subtopic, and performance breakdown
- **Analytics**: Track progress by subject, subtopic, and over time

## Digital Scratch Paper
- Click the 📝 tab to open/close
- Notes persist throughout the exam (localStorage)
- Copy to clipboard or download as .txt

## Project Structure
- `src/`: Frontend (HTML, CSS, JS)
- `backend/`: Flask API, AI explanation service
- `scripts/`: DB and CLI tools
- `qa.csv`: Question dataset
- `law_quiz.db`: SQLite database
- `tests/`: Jest unit tests

## Testing

```bash
npm test
```
- Runs Jest tests for frontend logic

## License
Specify your license here.

---
For full documentation, see code comments and in-app help. All other README files have been consolidated here.

 # LawQuizzer

 LawQuizzer is a simple web-based quiz platform for reviewing law exam questions. It provides a static front-end for a seamless quiz-taking experience and a Flask-based API to serve questions and log results.

 ## Prerequisites

 - Node.js v20+
 - Python 3.x
 - pip (Python package installer)
 - Python packages: Flask (install via `pip install Flask`)

 ## Installation

 1. Clone the repository and navigate into it:

    ```bash
    git clone <repo-url>
    cd lawquizzer
    ```

 2. Install JavaScript dependencies:

    ```bash
    npm install
    ```

 3. Install Python dependencies:

    ```bash
    pip install Flask
    ```
             
 ## Starting the Application

 Use the provided npm script to launch both the back-end API and front-end server:

 ```bash
 npm start
 ```

 This runs the `start.sh` script to:
 - Start the Flask API on http://localhost:5001
 - Serve the static front-end from `src/` on http://localhost:3000

 Press `Ctrl+C` to stop both services.

 ### Manual Startup (Optional)
 1. Start the Flask API:
    ```bash
    python3 scripts/flask_api.py
    ```
    The API will be available at http://localhost:5001/api

 2. In another terminal, serve the front-end:
    ```bash
    npx serve src
    ```
    The front-end will be available at http://localhost:3000

 ## Running Tests

 Run the Jest unit tests:

 ```bash
 npm test
 ```

 ## Project Structure

 - `src/`: Static front-end (HTML, CSS, JavaScript)
 - `scripts/`: Helper scripts
   - `flask_api.py`: Flask API server
   - `law_quiz.py`: CLI quiz runner (Python)
   - `csv_to_sql.py`: Convert CSV to SQL for DB import
 - `qa.csv`: Sample questions dataset
 - `law_quiz.db`: SQLite DB for the API
 - `start.sh`: Startup script to launch API and front-end
 - `tests/`: Jest tests for core logic

 ## FAQ

 **Q:** How do I change questions?
 **A:**
 - For the front-end CLI version, edit `src/js/question-data.js`.
 - For the API version, update the SQLite database (`law_quiz.db`) via `scripts/csv_to_sql.py` and reload data.

 ## License

 Specify your license here.

import sqlite3
import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

import server


def _seed_auth_tables(db_path: Path) -> None:
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    cursor.execute("""
        CREATE TABLE users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE,
            email TEXT UNIQUE,
            password_hash TEXT,
            created_at TEXT,
            preferred_mode TEXT,
            last_login TEXT
        )
    """)
    cursor.execute("""
        CREATE TABLE user_preferences (
            user_id INTEGER PRIMARY KEY,
            audio_enabled INTEGER,
            background_music_enabled INTEGER,
            volume_level REAL,
            preferred_subjects TEXT,
            theme_preference TEXT
        )
    """)
    conn.commit()
    conn.close()


@pytest.fixture()
def client(tmp_path, monkeypatch):
    db_path = tmp_path / "test.db"
    _seed_auth_tables(db_path)

    monkeypatch.setattr(server, "DB_PATH", db_path)
    monkeypatch.setattr(server, "ai_service", None)
    server.app.config["TESTING"] = True

    with server.app.test_client() as test_client:
        yield test_client


def test_auth_register_login_and_me(client):
    register_response = client.post("/api/auth/register", json={
        "username": "alice",
        "email": "alice@example.com",
        "password": "password123"
    })
    assert register_response.status_code == 200
    token = register_response.json["token"]

    login_response = client.post("/api/auth/login", json={
        "username": "alice",
        "password": "password123"
    })
    assert login_response.status_code == 200

    me_response = client.get("/api/auth/me", headers={
        "Authorization": f"Bearer {token}"
    })
    assert me_response.status_code == 200
    assert me_response.json["user"]["username"] == "alice"


def test_auth_login_rejects_invalid_credentials(client):
    response = client.post("/api/auth/login", json={
        "username": "missing",
        "password": "bad"
    })
    assert response.status_code == 401
    assert "error" in response.json


def test_auth_preferences_update(client):
    register_response = client.post("/api/auth/register", json={
        "username": "bob",
        "email": "bob@example.com",
        "password": "password123"
    })
    token = register_response.json["token"]

    preferences_response = client.put("/api/auth/preferences", json={
        "theme_preference": "quiz-show"
    }, headers={
        "Authorization": f"Bearer {token}"
    })
    assert preferences_response.status_code == 200
    assert preferences_response.json["success"] is True


def test_quiz_history_round_trip(client):
    payload = {
        "user_id": "user_123",
        "subject": "Contracts",
        "subtopic": "Consideration",
        "correct": 3,
        "total": 5,
        "duration_seconds": 120,
        "questions": [{"idx": "q1", "subtopic": "Consideration"}],
        "answers": [0, 1, 2, 3, 0],
        "time_per_question": [20, 20, 20, 20, 40],
        "question_difficulties": ["normal"] * 5,
        "mode": "classic",
        "negative_time": False
    }

    post_response = client.post("/api/quiz-history", json=payload)
    assert post_response.status_code == 200

    get_response = client.get("/api/quiz-history", query_string={
        "user_id": "user_123",
        "limit": 5
    })
    assert get_response.status_code == 200
    assert len(get_response.json["history"]) == 1
    assert get_response.json["stats"]["total_quizzes"] == 1


def test_ai_explanations_fallback_when_unavailable(client):
    response = client.post("/api/explanations", json={
        "question_ids": ["q1"]
    })
    assert response.status_code == 500
    assert "error" in response.json

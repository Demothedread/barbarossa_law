#!/usr/bin/env python3
"""
Upload SQLite data to Supabase via REST API (PostgREST).
RLS must be disabled first (run via Supabase SQL editor or MCP tool):
  ALTER TABLE questions DISABLE ROW LEVEL SECURITY;
  ALTER TABLE question_explanations DISABLE ROW LEVEL SECURITY;
  ALTER TABLE essay_prompts DISABLE ROW LEVEL SECURITY;

After upload, re-enable RLS:
  ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
  ALTER TABLE question_explanations ENABLE ROW LEVEL SECURITY;
  ALTER TABLE essay_prompts ENABLE ROW LEVEL SECURITY;
"""

import json
import os
import sqlite3
import sys
import time
from pathlib import Path

try:
    import requests
except ImportError:
    print("Installing requests...")
    os.system(f"{sys.executable} -m pip install requests -q")
    import requests

SQLITE_PATH = Path(__file__).parent.parent / 'law_quiz.db'

# Load from environment or use defaults
SUPABASE_URL = os.environ.get('SUPABASE_URL', 'https://hrcepttoscyhbntaqema.supabase.co')
SUPABASE_KEY = os.environ.get('SUPABASE_KEY', 'sb_publishable_mYuEPYf3kgDZDmx2X3ZkgQ_B5RXkhUP')

HEADERS = {
    'apikey': SUPABASE_KEY,
    'Authorization': f'Bearer {SUPABASE_KEY}',
    'Content-Type': 'application/json',
    'Prefer': 'resolution=ignore-duplicates',  # ON CONFLICT DO NOTHING equivalent
}

def upload_batch(table_name, rows, batch_num, total_batches):
    """Upload a batch of rows to Supabase REST API."""
    url = f"{SUPABASE_URL}/rest/v1/{table_name}"
    
    resp = requests.post(url, headers=HEADERS, json=rows, timeout=60)
    
    if resp.status_code in (200, 201):
        print(f"  [{batch_num+1}/{total_batches}] {len(rows)} rows → OK")
        return True
    elif resp.status_code == 409:
        # Conflict - rows already exist, that's fine
        print(f"  [{batch_num+1}/{total_batches}] {len(rows)} rows → already exist (conflict)")
        return True
    else:
        print(f"  [{batch_num+1}/{total_batches}] FAILED: {resp.status_code} - {resp.text[:200]}")
        return False


def upload_questions(conn):
    """Upload questions table."""
    print("\n📚 Uploading questions...")
    cur = conn.execute("SELECT * FROM questions ORDER BY idx")
    cols = [desc[0] for desc in cur.description]
    rows = cur.fetchall()
    
    # Convert to list of dicts
    data = []
    for row in rows:
        d = dict(zip(cols, row))
        # Ensure generated is integer (not boolean) - PostgreSQL column is INTEGER
        if 'generated' in d and d['generated'] is not None:
            d['generated'] = int(d['generated'])
        data.append(d)
    
    # Upload in batches of 100
    batch_size = 100
    total_batches = (len(data) + batch_size - 1) // batch_size
    success = 0
    for i in range(0, len(data), batch_size):
        batch = data[i:i + batch_size]
        if upload_batch('questions', batch, i // batch_size, total_batches):
            success += len(batch)
        time.sleep(0.2)  # Rate limit protection
    
    print(f"  ✅ {success}/{len(data)} questions uploaded")
    return success


def upload_explanations(conn):
    """Upload question_explanations table."""
    print("\n📝 Uploading question explanations...")
    cur = conn.execute("SELECT * FROM question_explanations ORDER BY question_id")
    cols = [desc[0] for desc in cur.description]
    rows = cur.fetchall()
    
    data = [dict(zip(cols, row)) for row in rows]
    
    batch_size = 50
    total_batches = (len(data) + batch_size - 1) // batch_size
    success = 0
    for i in range(0, len(data), batch_size):
        batch = data[i:i + batch_size]
        if upload_batch('question_explanations', batch, i // batch_size, total_batches):
            success += len(batch)
        time.sleep(0.2)
    
    print(f"  ✅ {success}/{len(data)} explanations uploaded")
    return success


def upload_essays(conn):
    """Upload essay_prompts table."""
    print("\n📄 Uploading essay prompts...")
    cur = conn.execute("SELECT * FROM essay_prompts ORDER BY id")
    cols = [desc[0] for desc in cur.description]
    rows = cur.fetchall()
    
    data = [dict(zip(cols, row)) for row in rows]
    
    batch_size = 25
    total_batches = (len(data) + batch_size - 1) // batch_size
    success = 0
    for i in range(0, len(data), batch_size):
        batch = data[i:i + batch_size]
        if upload_batch('essay_prompts', batch, i // batch_size, total_batches):
            success += len(batch)
        time.sleep(0.2)
    
    print(f"  ✅ {success}/{len(data)} essay prompts uploaded")
    return success


def main():
    print("=" * 60)
    print("Upload SQLite → Supabase via REST API")
    print("=" * 60)
    
    if not SQLITE_PATH.exists():
        print(f"ERROR: SQLite database not found at {SQLITE_PATH}")
        sys.exit(1)
    
    print(f"Source: {SQLITE_PATH}")
    print(f"Target: {SUPABASE_URL}")
    
    # Quick connectivity test
    print("\nTesting REST API connectivity...")
    try:
        resp = requests.get(
            f"{SUPABASE_URL}/rest/v1/questions?select=idx&limit=1",
            headers={
                'apikey': SUPABASE_KEY,
                'Authorization': f'Bearer {SUPABASE_KEY}',
            },
            timeout=10
        )
        if resp.status_code == 200:
            count = len(resp.json())
            print(f"  Connected! Current questions: {count}")
        else:
            print(f"  Warning: API returned {resp.status_code}: {resp.text[:100]}")
            print("  Make sure RLS is disabled for import.")
    except Exception as e:
        print(f"  Connection failed: {e}")
        sys.exit(1)
    
    conn = sqlite3.connect(str(SQLITE_PATH))
    
    total = 0
    total += upload_questions(conn)
    total += upload_explanations(conn)
    total += upload_essays(conn)
    
    conn.close()
    
    print(f"\n{'=' * 60}")
    print(f"Upload complete! {total} total rows uploaded")
    print(f"{'=' * 60}")
    print("\n⚠️  Remember to re-enable RLS:")
    print("  ALTER TABLE questions ENABLE ROW LEVEL SECURITY;")
    print("  ALTER TABLE question_explanations ENABLE ROW LEVEL SECURITY;")
    print("  ALTER TABLE essay_prompts ENABLE ROW LEVEL SECURITY;")


if __name__ == '__main__':
    main()

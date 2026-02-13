#!/usr/bin/env python3
"""Test Supabase PostgreSQL connection."""
import os
import sys
from pathlib import Path

from dotenv import load_dotenv

# Load .env from project root
load_dotenv(Path(__file__).parent.parent / '.env')

url = os.environ.get('SUPABASE_DB_URL') or os.environ.get('DATABASE_URL')
if not url:
    print("ERROR: No SUPABASE_DB_URL or DATABASE_URL set")
    sys.exit(1)

# Mask password for display
import re

display = re.sub(r'://[^:]+:[^@]+@', '://***:***@', url)
print(f"Connecting to: {display}")

import psycopg2

conn = psycopg2.connect(url)
cur = conn.cursor()
cur.execute('SELECT count(*) FROM questions')
print(f"Questions: {cur.fetchone()[0]}")
cur.execute("SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public'")
print(f"Tables: {cur.fetchone()[0]}")
conn.close()
print("Connection OK!")

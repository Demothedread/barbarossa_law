#!/usr/bin/env python3
"""
Migrate data from Render PostgreSQL to Supabase PostgreSQL.

This script:
1. Connects to the source Render PostgreSQL database
2. Connects to the destination Supabase PostgreSQL database
3. Exports all data from Render tables
4. Imports all data into Supabase tables (with upsert/conflict handling)

Prerequisites:
  - Schema must already exist on Supabase (created via migrations)
  - Both DATABASE_URL (Render) and SUPABASE_DB_URL must be set

Usage:
  RENDER_DATABASE_URL="postgres://..." SUPABASE_DB_URL="postgresql://postgres.hrcepttoscyhbntaqema:password@aws-1-us-east-1.pooler.supabase.com:6543/postgres" python scripts/migrate_render_to_supabase.py
  
  Or set them in .env-local and run:
  python scripts/migrate_render_to_supabase.py
"""

import os
import sys
from pathlib import Path

# Load environment variables
try:
    from dotenv import load_dotenv
    load_dotenv(dotenv_path=Path(__file__).parent.parent / '.env-local')
    load_dotenv(dotenv_path=Path(__file__).parent.parent / '.env')
except ImportError:
    pass

try:
    import psycopg2
    from psycopg2.extras import RealDictCursor, execute_values
except ImportError:
    print("ERROR: psycopg2 not installed. Run: pip install psycopg2-binary")
    sys.exit(1)


# Connection strings
RENDER_DB_URL = os.environ.get('RENDER_DATABASE_URL') or os.environ.get('DATABASE_URL')
SUPABASE_DB_URL = os.environ.get('SUPABASE_DB_URL')

if not RENDER_DB_URL:
    print("ERROR: RENDER_DATABASE_URL (or DATABASE_URL) not set")
    print("Set it to your Render PostgreSQL connection string from the Render dashboard")
    print("Example: postgres://barbarossa_law_user:xxxxx@dpg-xxxxx.oregon-postgres.render.com/barbarossa_law")
    sys.exit(1)

if not SUPABASE_DB_URL:
    print("ERROR: SUPABASE_DB_URL not set")
    print("Get this from Supabase Dashboard > Project Settings > Database > Connection string (URI)")
    print("Example: postgresql://postgres.hrcepttoscyhbntaqema:PASSWORD@aws-1-us-east-1.pooler.supabase.com:6543/postgres")
    sys.exit(1)


# Tables to migrate in dependency order (parent tables first)
TABLES_CONFIG = [
    # Tranche 1: Questions
    {
        'name': 'questions',
        'pk': 'idx',
        'columns': [
            'idx', 'dataset', 'example_id', 'prompt_id', 'source', 'subject',
            'question_number', 'prompt', 'question', 'choice_a', 'choice_b',
            'choice_c', 'choice_d', 'answer', 'gold_passage', 'gold_idx',
            'generated', 'subtopic', 'created_at'
        ],
        'conflict_action': 'DO NOTHING',
    },
    {
        'name': 'question_explanations',
        'pk': 'question_id',
        'columns': [
            'question_id', 'correct_answer', 'choice_a_explanation',
            'choice_b_explanation', 'choice_c_explanation', 'choice_d_explanation',
            'subtopic', 'ai_explanation', 'created_at', 'updated_at'
        ],
        'conflict_action': 'DO NOTHING',
    },
    {
        'name': 'question_second_best',
        'pk': 'question_id',
        'columns': [
            'question_id', 'second_best_choice', 'analysis_text',
            'confidence_score', 'created_at'
        ],
        'conflict_action': 'DO NOTHING',
    },

    # Tranche 2: Users & Progress
    {
        'name': 'users',
        'pk': 'id',
        'columns': [
            'id', 'username', 'email', 'password_hash', 'created_at',
            'last_login', 'preferred_mode', 'preferences_json'
        ],
        'conflict_action': 'DO NOTHING',
        'has_serial': True,
    },
    {
        'name': 'user_preferences',
        'pk': 'user_id',
        'columns': [
            'user_id', 'audio_enabled', 'background_music_enabled',
            'volume_level', 'preferred_subjects', 'theme_preference'
        ],
        'conflict_action': 'DO NOTHING',
    },
    {
        'name': 'quiz_sessions',
        'pk': 'id',
        'columns': [
            'id', 'user_id', 'anonymous_id', 'subject', 'question_type',
            'question_count', 'mode', 'score', 'total', 'duration_seconds',
            'started_at', 'completed_at'
        ],
        'conflict_action': 'DO NOTHING',
        'has_serial': True,
    },
    {
        'name': 'quiz_answers',
        'pk': 'id',
        'columns': [
            'id', 'session_id', 'question_id', 'selected_choice',
            'correct', 'elapsed_seconds', 'answered_at'
        ],
        'conflict_action': 'DO NOTHING',
        'has_serial': True,
    },
    {
        'name': 'question_usage',
        'pk': 'id',
        'columns': [
            'id', 'user_id', 'anonymous_id', 'question_id',
            'times_seen', 'times_correct', 'last_seen_at'
        ],
        'conflict_action': 'DO NOTHING',
        'has_serial': True,
    },
    {
        'name': 'daily_progress',
        'pk': 'id',
        'columns': [
            'id', 'user_id', 'date', 'questions_answered', 'questions_reviewed',
            'question_ids_json', 'reviewed_ids_json', 'created_at', 'updated_at'
        ],
        'conflict_action': 'DO NOTHING',
        'has_serial': True,
    },
    {
        'name': 'quiz_history',
        'pk': 'id',
        'columns': [
            'id', 'user_id', 'subject', 'correct', 'total',
            'duration_seconds', 'questions_json', 'answers_json',
            'negative_time', 'created_at'
        ],
        'conflict_action': 'DO NOTHING',
        'has_serial': True,
    },
    {
        'name': 'quiz_attempt_logs',
        'pk': 'id',
        'columns': [
            'id', 'user_id', 'question_id', 'selected_answer',
            'correct_answer', 'is_correct', 'subject', 'subtopic',
            'mode', 'elapsed_seconds', 'payload_json', 'created_at'
        ],
        'conflict_action': 'DO NOTHING',
        'has_serial': True,
    },
    {
        'name': 'question_votes',
        'pk': 'id',
        'columns': [
            'id', 'question_id', 'user_id', 'anonymous_id', 'vote', 'created_at'
        ],
        'conflict_action': 'DO NOTHING',
        'has_serial': True,
    },
    {
        'name': 'explanation_feedback',
        'pk': 'id',
        'columns': [
            'id', 'question_id', 'user_id', 'thumbs_up', 'created_at'
        ],
        'conflict_action': 'DO NOTHING',
        'has_serial': True,
    },

    # Tranche 3: Essays & Study
    {
        'name': 'essay_cache',
        'pk': 'id',
        'columns': [
            'id', 'essay_prompt', 'rubric', 'model_answer',
            'grade_data', 'created_at', 'hash_key'
        ],
        'conflict_action': 'DO NOTHING',
        'has_serial': True,
    },
    {
        'name': 'essay_prompts',
        'pk': 'id',
        'columns': [
            'id', 'exam_id', 'exam_year', 'exam_month', 'question_number',
            'subject', 'prompt_text', 'model_answer', 'source_pdf', 'created_at'
        ],
        'conflict_action': 'DO NOTHING',
        'has_serial': True,
    },
    {
        'name': 'user_essays',
        'pk': 'id',
        'columns': [
            'id', 'user_id', 'anonymous_id', 'prompt_id',
            'essay_text', 'word_count', 'submitted_at'
        ],
        'conflict_action': 'DO NOTHING',
        'has_serial': True,
    },
    {
        'name': 'essay_grades',
        'pk': 'id',
        'columns': [
            'id', 'essay_id', 'score', 'max_score',
            'rubric_breakdown', 'overall_feedback', 'line_feedback',
            'grader_model', 'graded_at'
        ],
        'conflict_action': 'DO NOTHING',
        'has_serial': True,
    },
]


def table_exists_on_source(cursor, table_name):
    """Check if a table exists on the source database."""
    cursor.execute("""
        SELECT EXISTS (
            SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = %s
        )
    """, (table_name,))
    return cursor.fetchone()[0]


def get_source_columns(cursor, table_name):
    """Get columns that actually exist on the source table."""
    cursor.execute("""
        SELECT column_name FROM information_schema.columns 
        WHERE table_name = %s AND table_schema = 'public'
        ORDER BY ordinal_position
    """, (table_name,))
    return [row[0] for row in cursor.fetchall()]


def migrate_table(src_cursor, dst_conn, table_config):
    """Migrate a single table from source to destination."""
    table_name = table_config['name']
    pk = table_config['pk']
    
    # Check if source table exists
    if not table_exists_on_source(src_cursor, table_name):
        print(f"  SKIP: {table_name} - does not exist on source")
        return 0
    
    # Get actual columns from source
    source_columns = get_source_columns(src_cursor, table_name)
    
    # Use intersection of configured columns and source columns
    columns = [c for c in table_config['columns'] if c in source_columns]
    
    if not columns:
        print(f"  SKIP: {table_name} - no matching columns")
        return 0
    
    col_list = ', '.join(columns)
    
    # Read all rows from source
    src_cursor.execute(f"SELECT {col_list} FROM {table_name}")
    rows = src_cursor.fetchall()
    
    if not rows:
        print(f"  SKIP: {table_name} - no data")
        return 0
    
    # Convert rows to tuples
    data = [tuple(row[col] for col in columns) for row in rows]
    
    # Build upsert query
    placeholders = ', '.join(['%s'] * len(columns))
    conflict_action = table_config.get('conflict_action', 'DO NOTHING')
    
    insert_query = f"""
        INSERT INTO {table_name} ({col_list})
        VALUES %s
        ON CONFLICT ({pk}) {conflict_action}
    """
    
    dst_cursor = dst_conn.cursor()
    
    # Insert in batches
    batch_size = 500
    total = 0
    for i in range(0, len(data), batch_size):
        batch = data[i:i + batch_size]
        execute_values(dst_cursor, insert_query, batch)
        total += len(batch)
    
    # Reset serial sequences if needed
    if table_config.get('has_serial') and pk == 'id':
        dst_cursor.execute(f"""
            SELECT setval(pg_get_serial_sequence('{table_name}', 'id'),
                          COALESCE((SELECT MAX(id) FROM {table_name}), 1))
        """)
    
    dst_conn.commit()
    return total


def main():
    print("=" * 60)
    print("Barbarossa Law - Render → Supabase Data Migration")
    print("=" * 60)
    
    # Connect to source (Render)
    print(f"\nConnecting to source (Render)...")
    try:
        src_conn = psycopg2.connect(RENDER_DB_URL, cursor_factory=RealDictCursor)
        print("  ✓ Connected to Render PostgreSQL")
    except Exception as e:
        print(f"  ✗ Failed to connect to Render: {e}")
        sys.exit(1)
    
    # Connect to destination (Supabase)
    print(f"Connecting to destination (Supabase)...")
    try:
        dst_conn = psycopg2.connect(SUPABASE_DB_URL)
        print("  ✓ Connected to Supabase PostgreSQL")
    except Exception as e:
        print(f"  ✗ Failed to connect to Supabase: {e}")
        sys.exit(1)
    
    src_cursor = src_conn.cursor(cursor_factory=RealDictCursor)
    
    # Get source table counts
    print("\nSource (Render) table counts:")
    for tc in TABLES_CONFIG:
        if table_exists_on_source(src_cursor, tc['name']):
            src_cursor.execute(f"SELECT COUNT(*) as cnt FROM {tc['name']}")
            count = src_cursor.fetchone()['cnt']
            print(f"  {tc['name']}: {count} rows")
        else:
            print(f"  {tc['name']}: TABLE NOT FOUND")
    
    # Migrate each table
    print("\nMigrating data...")
    results = {}
    for tc in TABLES_CONFIG:
        try:
            count = migrate_table(src_cursor, dst_conn, tc)
            results[tc['name']] = count
            if count > 0:
                print(f"  ✓ {tc['name']}: {count} rows migrated")
            else:
                print(f"  - {tc['name']}: 0 rows (empty or skipped)")
        except Exception as e:
            results[tc['name']] = f"ERROR: {e}"
            print(f"  ✗ {tc['name']}: ERROR - {e}")
            dst_conn.rollback()
    
    # Verify destination counts
    print("\nDestination (Supabase) verification:")
    dst_cursor = dst_conn.cursor()
    for tc in TABLES_CONFIG:
        try:
            dst_cursor.execute(f"SELECT COUNT(*) FROM {tc['name']}")
            count = dst_cursor.fetchone()[0]
            print(f"  {tc['name']}: {count} rows")
        except Exception as e:
            print(f"  {tc['name']}: ERROR - {e}")
            dst_conn.rollback()
    
    src_conn.close()
    dst_conn.close()
    
    print("\n" + "=" * 60)
    print("Migration complete!")
    print("=" * 60)
    print("\nNext steps:")
    print("  1. Verify data on Supabase dashboard")
    print("  2. Update RENDER_DATABASE_URL → SUPABASE_DB_URL in Render env vars")
    print("  3. Redeploy the backend on Render")


if __name__ == '__main__':
    main()

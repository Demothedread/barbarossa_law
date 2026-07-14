#!/usr/bin/env python3
"""Quick test: connect to Supabase and verify schema."""
import psycopg2

# Try with explicit parameters (avoids URL encoding issues with special chars)
CONNECTION_CONFIGS = {
    "pooler_session_params": {
        "host": "aws-1-us-east-1.pooler.supabase.com",
        "port": 5432,
        "dbname": "postgres",
        "user": "postgres.hrcepttoscyhbntaqema",
        "password": "Barpreppers1!",
        "connect_timeout": 10,
        "sslmode": "require",
    },
    "pooler_transaction_params": {
        "host": "aws-1-us-east-1.pooler.supabase.com",
        "port": 6543,
        "dbname": "postgres",
        "user": "postgres.hrcepttoscyhbntaqema",
        "password": "Barpreppers1!",
        "connect_timeout": 10,
        "sslmode": "require",
    },
    "direct_ipv6": {
        "host": "db.hrcepttoscyhbntaqema.supabase.co",
        "port": 5432,
        "dbname": "postgres",
        "user": "postgres",
        "password": "Barpreppers1!",
        "connect_timeout": 10,
        "sslmode": "require",
    },
}

for name, params in CONNECTION_CONFIGS.items():
    print(f"\nTrying {name}...")
    print(f"  host={params['host']}, port={params['port']}, user={params['user']}")
    try:
        conn = psycopg2.connect(**params)
        cur = conn.cursor()
        cur.execute("SELECT tablename FROM pg_tables WHERE schemaname='public' ORDER BY tablename")
        tables = cur.fetchall()
        print(f"  Connected! Found {len(tables)} tables:")
        for t in tables:
            cur.execute(f"SELECT COUNT(*) FROM {t[0]}")
            count = cur.fetchone()[0]
            print(f"    {t[0]}: {count} rows")
        conn.close()
        
        # Build the URL for .env
        from urllib.parse import quote
        pw_encoded = quote(params['password'], safe='')
        url = f"postgresql://{params['user']}:{pw_encoded}@{params['host']}:{params['port']}/{params['dbname']}"
        print(f"\n  >>> {name} WORKS!")
        print(f"  Connection URL: {url}")
        break
    except Exception as e:
        print(f"  Failed: {e}")

#!/usr/bin/env python3
"""
Test script to verify the Law Quizzer backend setup
"""

import os
import sys
from pathlib import Path

# Add the project root to the Python path
project_root = Path(__file__).parent
sys.path.insert(0, str(project_root))
sys.path.insert(0, str(project_root / 'backend'))

def test_imports():
    """Test that all required modules can be imported"""
    print("Testing imports...")
    
    try:
        import flask
        print("✓ Flask imported successfully")
    except ImportError as e:
        print(f"✗ Flask import failed: {e}")
        return False
    
    try:
        import sqlite3
        print("✓ SQLite3 imported successfully")
    except ImportError as e:
        print(f"✗ SQLite3 import failed: {e}")
        return False
    
    try:
        from dotenv import load_dotenv
        print("✓ python-dotenv imported successfully")
    except ImportError as e:
        print(f"✗ python-dotenv import failed: {e}")
        return False
    
    return True

def test_database():
    """Test database connectivity"""
    print("\nTesting database...")
    
    import sqlite3
    db_path = project_root / 'law_quiz.db'
    
    if not db_path.exists():
        print(f"✗ Database file not found: {db_path}")
        return False
    
    try:
        conn = sqlite3.connect(str(db_path))
        cursor = conn.cursor()
        cursor.execute("SELECT COUNT(*) FROM questions")
        count = cursor.fetchone()[0]
        conn.close()
        print(f"✓ Database connected successfully. {count} questions found.")
        return True
    except Exception as e:
        print(f"✗ Database connection failed: {e}")
        return False

def test_environment():
    """Test environment configuration"""
    print("\nTesting environment...")
    
    from dotenv import load_dotenv
    load_dotenv(dotenv_path=project_root / '.env-local')
    
    api_key = os.environ.get('OPENAI_API_KEY')
    if api_key:
        print("✓ OpenAI API key configured")
    else:
        print("⚠ OpenAI API key not configured (optional for basic functionality)")
    
    vector_store_id = os.environ.get('VECTOR_STORE_ID')
    if vector_store_id:
        print(f"✓ Vector store ID configured: {vector_store_id}")
    else:
        print("⚠ Vector store ID not configured (will use default)")
    
    return True

def test_server_module():
    """Test that the server module can be imported"""
    print("\nTesting server module...")
    
    try:
        import server
        print("✓ Server module imported successfully")
        
        # Check if Flask app is created
        if hasattr(server, 'app'):
            print("✓ Flask app created successfully")
        else:
            print("✗ Flask app not found in server module")
            return False
        
        return True
    except Exception as e:
        print(f"✗ Server module import failed: {e}")
        return False

def main():
    """Run all tests"""
    print("Law Quizzer Backend Test Suite")
    print("=" * 40)
    
    tests = [
        test_imports,
        test_environment,
        test_database,
        test_server_module
    ]
    
    passed = 0
    for test in tests:
        if test():
            passed += 1
    
    print(f"\n{passed}/{len(tests)} tests passed")
    
    if passed == len(tests):
        print("\n🎉 All tests passed! Your setup is ready.")
        print("\nTo start the server:")
        print("  cd backend && python server.py")
        print("\nTo start the frontend:")
        print("  python dev-server.py")
    else:
        print("\n❌ Some tests failed. Please check the issues above.")

if __name__ == '__main__':
    main()

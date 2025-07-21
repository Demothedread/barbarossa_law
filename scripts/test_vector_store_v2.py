#!/usr/bin/env python3
"""
Test script for vector store integration v2
Run this to test the vector store question generation functionality
"""

import asyncio
import sys
from pathlib import Path

# Add parent directory to path to import modules
sys.path.append(str(Path(__file__).parent.parent))

from backend.vector_store_service_v2 import extract_questions_from_vector_store_v2
from dotenv import load_dotenv

# Load environment variables
load_dotenv(dotenv_path=Path(__file__).parent.parent / '.env-local')

async def test_vector_store_v2():
    """Test the vector store integration v2"""
    print("Testing Vector Store Integration V2")
    print("=" * 50)
    
    # Path to database
    db_path = Path(__file__).parent.parent / 'law_quiz.db'
    
    if not db_path.exists():
        print(f"Error: Database not found at {db_path}")
        print("Please run 'python scripts/initialize_db.py' first")
        return
    
    try:
        # Test generation of 3 questions
        print("Generating 3 questions using vector store assistant...")
        results = await extract_questions_from_vector_store_v2(db_path, num_questions=3)
        
        print("\nResults:")
        print(f"Content sources processed: {results['content_sources_processed']}")
        print(f"Questions extracted: {results['questions_extracted']}")
        print(f"Questions saved: {results['questions_saved']}")
        
        if results['errors']:
            print(f"\nErrors encountered:")
            for error in results['errors']:
                print(f"  - {error}")
        
        if results['questions_saved'] > 0:
            print(f"\n✅ Successfully generated and added {results['questions_saved']} new questions to the database!")
        else:
            print("\n❌ No questions were added to the database.")
            
    except Exception as e:
        print(f"Error during testing: {e}")

def main():
    """Main function"""
    # Run the async test
    asyncio.run(test_vector_store_v2())

if __name__ == "__main__":
    main()
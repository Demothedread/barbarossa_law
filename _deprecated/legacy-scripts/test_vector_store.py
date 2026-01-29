#!/usr/bin/env python3
"""
Test script for vector store integration
Run this to test the vector store question extraction functionality
"""

import asyncio
import sys
from pathlib import Path

# Add parent directory to path to import modules
sys.path.append(str(Path(__file__).parent.parent))

from backend.vector_store_service import extract_questions_from_vector_store
from dotenv import load_dotenv

# Load environment variables
load_dotenv(dotenv_path=Path(__file__).parent.parent / '.env-local')

async def test_vector_store():
    """Test the vector store integration"""
    print("Testing Vector Store Integration")
    print("=" * 50)
    
    # Path to database
    db_path = Path(__file__).parent.parent / 'law_quiz.db'
    
    if not db_path.exists():
        print(f"Error: Database not found at {db_path}")
        print("Please run 'python scripts/initialize_db.py' first")
        return
    
    try:
        # Test extraction of 5 questions
        print("Extracting 5 questions from vector store...")
        results = await extract_questions_from_vector_store(db_path, num_questions=5)
        
        print("\nResults:")
        print(f"Content sources processed: {results['content_sources_processed']}")
        print(f"Questions extracted: {results['questions_extracted']}")
        print(f"Questions saved: {results['questions_saved']}")
        
        if results['errors']:
            print(f"\nErrors encountered:")
            for error in results['errors']:
                print(f"  - {error}")
        
        if results['questions_saved'] > 0:
            print(f"\n✅ Successfully added {results['questions_saved']} new questions to the database!")
        else:
            print("\n❌ No questions were added to the database.")
            
    except Exception as e:
        print(f"Error during testing: {e}")

def main():
    """Main function"""
    # Run the async test
    asyncio.run(test_vector_store())

if __name__ == "__main__":
    main()
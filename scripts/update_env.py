#!/usr/bin/env python3
"""
Update server.py to use environment variables
"""

import os
from pathlib import Path

from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

def main():
    """Update server.py to load environment variables"""
    backend_dir = Path(__file__).parent / 'backend'
    server_path = backend_dir / 'server.py'
    
    if not server_path.exists():
        print(f"Error: {server_path} not found")
        return False
    
    with open(server_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    if 'from dotenv import load_dotenv' not in content:
        updated_content = content.replace(
            'import os',
            'import os\nfrom dotenv import load_dotenv\n\n# Load environment variables from .env file\nload_dotenv()'
        )
        
        with open(server_path, 'w', encoding='utf-8') as f:
            f.write(updated_content)
        
        print(f"Updated {server_path} to use environment variables")
        return True
    else:
        print(f"{server_path} already uses environment variables")
        return True

if __name__ == "__main__":
    main()

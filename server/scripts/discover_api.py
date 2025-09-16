#!/Users/adammach/divine-ai-app/venv-gradio/bin/python
"""
Discover the correct API endpoints for HuggingFace TTS spaces
"""

from gradio_client import Client

def discover_endpoints():
    spaces = [
        "innoai/Edge-TTS-Text-to-Speech",
        "k2-fsa/text-to-speech"
    ]
    
    for space in spaces:
        try:
            print(f"\n{'='*60}")
            print(f"Discovering endpoints for: {space}")
            print('='*60)
            
            client = Client(space)
            print(client.view_api())
            
        except Exception as e:
            print(f"Failed to connect to {space}: {e}")

if __name__ == "__main__":
    discover_endpoints()
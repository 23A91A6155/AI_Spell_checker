import os
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(os.path.dirname(__file__)), '.env'))


class Config:
    XAI_API_KEY = os.getenv('XAI_API_KEY', '')
    XAI_BASE_URL = os.getenv('XAI_BASE_URL', 'https://api.groq.com/openai/v1')
    GROK_MODEL = os.getenv('GROK_MODEL', 'qwen/qwen3.8-27b')
    FLASK_PORT = int(os.getenv('FLASK_PORT', 5000))
    DEBUG = os.getenv('FLASK_DEBUG', 'True').lower() == 'true'
    DJANGO_API_URL = os.getenv('DJANGO_API_URL', 'http://localhost:8000/api')


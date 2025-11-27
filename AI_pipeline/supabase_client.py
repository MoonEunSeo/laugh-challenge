# AI_pipeline/supabase_client.py
import os
from supabase import create_client
from dotenv import load_dotenv

load_dotenv(dotenv_path="/workspace/AI_emotion_browser/AI_pipeline/.env")

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

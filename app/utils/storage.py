import os
from supabase import create_client, Client
from dotenv import load_dotenv
import uuid

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
BUCKET_NAME = "car-images"

def get_supabase() -> Client:
    return create_client(SUPABASE_URL, SUPABASE_KEY)

def upload_image(file_data, filename: str) -> str:
    """Uploads a file to Supabase Storage and returns the public URL."""
    try:
        supabase = get_supabase()
        
        # Create a unique filename to avoid overwrites
        ext = filename.split(".")[-1]
        unique_name = f"{uuid.uuid4()}.{ext}"
        
        # Upload file
        res = supabase.storage.from_(BUCKET_NAME).upload(
            path=unique_name,
            file=file_data,
            file_options={"content-type": f"image/{ext}"}
        )
        
        # Get public URL
        url = supabase.storage.from_(BUCKET_NAME).get_public_url(unique_name)
        return url
    except Exception as e:
        print(f"Error uploading to Supabase: {e}")
        return None

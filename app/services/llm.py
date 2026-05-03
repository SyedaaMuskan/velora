import os
import json
import requests
from dotenv import load_dotenv

load_dotenv()
API_KEY = os.getenv("OPENROUTER_API_KEY")

def safe_openrouter_response(response):

    # 1. HTTP error check
    if response.status_code != 200:
        return f"HTTP Error: {response.status_code} | {response.text}"

    # 2. JSON parsing safely
    try:
        data = response.json()
    except:
        return "Invalid JSON response"

    # 3. Extract possible formats safely
    try:
        return (
            data.get("choices", [{}])[0]
                .get("message", {})
                .get("content")
            or data.get("response")
            or data.get("output")
            or str(data)
        )
    except:
        return str(data)


def llm_extract(message: str):

    response = requests.post(
        "https://openrouter.ai/api/v1/chat/completions",
        headers={
            "Authorization": f"Bearer {API_KEY}",
            "Content-Type": "application/json",
        },
        json={
            "model": "openai/gpt-4o-mini",
            "messages": [
                {
                    "role": "system",
                    "content": """
Extract car data as JSON.

Keys:
year, km_driven, fuel, transmission,
car_name, brand, engine, city, owner, seller_type

Rules:
- return null if missing
- normalize values
"""
                },
                {"role": "user", "content": message}
            ],
            "temperature": 0
        }
    ) 
    content_str = safe_openrouter_response(response)
    if not isinstance(content_str, str):
        return {}
        
    content_str = content_str.strip()
    if content_str.startswith("```json"):
        content_str = content_str[7:]
    elif content_str.startswith("```"):
        content_str = content_str[3:]
    if content_str.endswith("```"):
        content_str = content_str[:-3]
        
    try:
        data = json.loads(content_str.strip())
        return data if isinstance(data, dict) else {}
    except Exception as e:
        print("LLM JSON parsing error:", e)
        return {}







       
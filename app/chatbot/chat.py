import requests
import os
from dotenv import load_dotenv

from app.services.extractor import extract_features
from app.utils.loader import get_price_from_chat
from app.services.search import search_listings, extract_budget
from sqlalchemy.orm import Session

def get_api_key():
    load_dotenv()
    return os.getenv("OPENROUTER_API_KEY")


def is_price_query(message: str):
    keywords = ["price", "cost", "worth", "value"]
    return any(word in message for word in keywords)

def is_listing_query(message: str):
    keywords = ["find", "show", "search", "available", "buy", "have", "cars"]
    return any(word in message for word in keywords)


def get_llm_response(message: str):
    api_key = get_api_key()
    try:
        response = requests.post(
            "https://openrouter.ai/api/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
            },
            json={
                "model": "openai/gpt-4o-mini",
                "messages": [
                    {
                        "role": "system",
                        "content": "You are Velora's AI Assistant for the Pakistani car market. You help users buy and sell cars in Pakistan. Always assume prices are in PKR and locations are in Pakistan. Be professional, friendly, and expert-level."
                    },
                    {"role": "user", "content": message}
                ]
            },
            timeout=10
        )
        
        if response.status_code != 200:
            print(f"OpenRouter Error: {response.status_code} - {response.text}")
            return f"I'm having trouble connecting to my brain right now (Error {response.status_code}). Please check if the API key is valid."
            
        data = response.json()
        return data["choices"][0]["message"]["content"]
    except Exception as e:
        print(f"Chatbot Exception: {str(e)}")
        return f"Sorry, I encountered an error: {str(e)}"


def generate_human_response(features, price):
    api_key = get_api_key()
    response = requests.post(
        "https://openrouter.ai/api/v1/chat/completions",
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        },
        json={
            "model": "openai/gpt-4o-mini",
            "messages": [
                {
                    "role": "system",
                    "content": "You are a friendly car expert who explains price predictions simply."
                },
                {
                    "role": "user",
                    "content": f"""
Car details: {features}
Predicted price: {price}

Explain this naturally.
"""
                }
            ]
        }
    )

    data = response.json()
    return data["choices"][0]["message"]["content"]


def generate_recommendation_response(listings):
    api_key = get_api_key()
    if not listings:
        return "I couldn't find any cars matching your criteria in our database right now. Would you like me to predict the price for a specific car instead?"
    
    listing_data = [
        f"{l.year} {l.brand} {l.model} - {l.price:,} PKR (Location: {l.location})"
        for l in listings
    ]
    
    response = requests.post(
        "https://openrouter.ai/api/v1/chat/completions",
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        },
        json={
            "model": "openai/gpt-4o-mini",
            "messages": [
                {
                    "role": "system",
                    "content": "You are a friendly car sales assistant. Recommend these cars naturally and briefly."
                },
                {
                    "role": "user",
                    "content": f"Available cars: {listing_data}. Summarize this for the user."
                }
            ]
        }
    )
    data = response.json()
    return data["choices"][0]["message"]["content"]


def get_chat_response(message: str, db: Session = None):
    message_lower = message.lower()

    # 1. Check for price prediction query
    if is_price_query(message_lower):
        features = extract_features(message_lower)
        if "year" not in features or "km_driven" not in features:
            return "I need a bit more info 😊 Please tell me the car year and kilometers driven."
        price = get_price_from_chat(features)
        return generate_human_response(features, price)

    # 2. Check for listing search query (RAG-lite)
    if is_listing_query(message_lower) and db:
        features = extract_features(message_lower)
        budget = extract_budget(message_lower)
        if budget:
            features["budget"] = budget
            
        listings = search_listings(db, features)
        return generate_recommendation_response(listings)

    # 3. Default AI Response with Context (Full RAG)
    if db:
        from app.db.models import CarListing
        recent_listings = db.query(CarListing).order_by(CarListing.id.desc()).limit(5).all()
        platform_context = "Currently available on Velora: " + ", ".join([f"{l.brand} {l.model} ({l.year}) for {l.price:,} PKR" for l in recent_listings])
        
        api_key = get_api_key()
        try:
            response = requests.post(
                "https://openrouter.ai/api/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {api_key}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": "openai/gpt-4o-mini",
                    "messages": [
                        {
                            "role": "system",
                            "content": f"You are Velora's AI Assistant for Pakistan. Use this platform data if relevant: {platform_context}. Answer briefly."
                        },
                        {"role": "user", "content": message}
                    ]
                },
                timeout=10
            )
            data = response.json()
            return data["choices"][0]["message"]["content"]
        except:
            pass

    return get_llm_response(message)
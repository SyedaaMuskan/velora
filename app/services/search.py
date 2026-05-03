from sqlalchemy.orm import Session
from app.db.models import CarListing
import re

def search_listings(db: Session, filters: dict):
    """
    Search database for car listings based on extracted features.
    """
    query = db.query(CarListing)

    # 1. Filter by Brand/Make
    brand = filters.get("brand")
    if brand:
        query = query.filter(CarListing.brand.ilike(f"%{brand}%"))

    # 2. Filter by Model/Car Name
    model = filters.get("car_name")
    if model:
        query = query.filter(CarListing.model.ilike(f"%{model}%"))

    # 3. Filter by Price (if mentioned in chat, we might need a regex to extract it)
    # For now we use the suggested_price if it's a price query, 
    # but for search we look for explicit budget mentioned.
    
    # 4. Filter by Year
    year = filters.get("year")
    if year:
        query = query.filter(CarListing.year >= year)

    # 5. Filter by City
    city = filters.get("city")
    if city:
        query = query.filter(CarListing.location.ilike(f"%{city}%"))

    return query.limit(5).all()

def extract_budget(message: str):
    """Simple regex to extract budget mentioned in text like 'under 20 lac' or 'within 1500000'."""
    # Handle 'lac' or 'lakh'
    lac_match = re.search(r"(\d+)\s?(lac|lakh)", message.lower())
    if lac_match:
        return float(lac_match.group(1)) * 100000
    
    # Handle raw numbers
    raw_match = re.search(r"(\d{6,8})", message)
    if raw_match:
        return float(raw_match.group(1))
        
    return None

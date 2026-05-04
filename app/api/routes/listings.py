from typing import List, Optional
from fastapi import APIRouter, UploadFile, File, Form, Depends, HTTPException, Security
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.core.security import get_current_user
import os, json
from fastapi import Request
from sqlalchemy.orm import Session
from app.db.session import SessionLocal
from app.db.crud import create_listing, add_car_image
from app.ml.pipeline import predict_price, get_price_insights
from app.db.models import CarListing, CarImage, SearchHistory, Notification, User
from app.vision.service import analyze_car_image
from app.api.routes.websockets import broadcast_new_listing_alert, broadcast_price_drop
import asyncio

router = APIRouter()

# Dependency to get DB session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/create-listing")
async def create_car_listing(
    image1: UploadFile = File(...),
    image2: Optional[UploadFile] = File(None),
    image3: Optional[UploadFile] = File(None),
    image4: Optional[UploadFile] = File(None),
    image5: Optional[UploadFile] = File(None),
    make: str = Form(...),
    model: str = Form(...),
    year: int = Form(...),
    mileage_km: int = Form(...),
    fuel_type: str = Form(...),
    condition: str = Form(...),
    registration_city: str = Form(...),
    city: str = Form(...),
    transmission: str = Form(...),
    color: str = Form(...),
    num_owners: int = Form(...),
    registered: str = Form(...),
    engine_cc: int = Form(...),
    price: Optional[float] = Form(None),
    credentials: HTTPAuthorizationCredentials = Security(HTTPBearer()),
    db: Session = Depends(get_db)
):
    user_id = get_current_user(credentials.credentials)
    
    
    # 🧠 1. AI Price Prediction & Insights
    features = {
        "make": make, "model": model, "year": year, "mileage_km": mileage_km,
        "engine_cc": engine_cc, "fuel_type": fuel_type, "condition": condition,
        "transmission": transmission, "registered": registered, "color": color,
        "registration_city": registration_city, "city": city, "num_owners": num_owners
    }
    
    insights = get_price_insights(features, price)
    final_price = price if price is not None else insights["suggested_price"]

    # 🛡️ 1.5 Fraud Detection (Rule-Based)
    fraud_score = 0.0
    user = db.query(User).filter(User.id == user_id).first()
    
    # Rule 1: Price too low compared to AI prediction
    if price and price < (insights["suggested_price"] * 0.4):
        fraud_score += 40.0 # High risk
        
    # Rule 2: Unverified user listing high-value car
    if not user.is_verified and final_price > 5000000:
        fraud_score += 20.0
        
    is_fraud = fraud_score >= 40.0
    
    # 📁 2. Save Images to Supabase Cloud Storage
    from app.utils.storage import upload_image
    image_paths = []
    all_images = [image1, image2, image3, image4, image5]
    for img_file in all_images:
        if img_file and img_file.filename:
            content = await img_file.read()
            url = upload_image(content, img_file.filename)
            if url:
                image_paths.append(url)
            else:
                # Local fallback if Supabase is not configured
                if not os.path.exists("uploads"): os.makedirs("uploads")
                local_path = f"uploads/{img_file.filename}"
                with open(local_path, "wb") as f:
                    f.write(content)
                image_paths.append(local_path)

    # 💾 3. Prepare Data for CarListing
    car_data = {
        "brand": make,
        "model": model,
        "year": year,
        "mileage": mileage_km,
        "fuel_type": fuel_type,
        "condition": condition,
        "location": city,
        "transmission": transmission,
        "color": color,
        "num_owners": num_owners,
        "registered": registered,
        "engine_cc": engine_cc,        
        "price": final_price,
        "ai_price": insights["suggested_price"],
        "owner_id": user_id,
        "fraud_score": fraud_score,
        "is_fraudulent": is_fraud
    }

    # 💾 4. Save CarListing to DB
    new_car = create_listing(db, car_data)

    # 🧠 4.5 Image Intelligence Analysis
    vision_report = {"condition": "None", "damage_status": "None", "confidence": 0.0}
    if image_paths:
        vision_report = analyze_car_image(image_paths[0])
        new_car.detected_condition = vision_report["condition"]
        new_car.damage_report = json.dumps(vision_report)
        new_car.vision_confidence = vision_report["confidence"]
        db.commit()

    # 🔔 Notify users with matching search history
    potential_buyers = db.query(User).join(SearchHistory).filter(
        SearchHistory.query.ilike(f"%{make}%") | SearchHistory.query.ilike(f"%{model}%")
    ).all()
    
    interested_user_ids = []
    for buyer in potential_buyers:
        if buyer.id != user_id:
            db.add(Notification(
                user_id=buyer.id,
                title="Car Match Found!",
                message=f"A new {make} {model} ({year}) has been listed in {city}.",
                type="match",
                link=f"/listing/{new_car.id}"
            ))
            interested_user_ids.append(buyer.id)

    # 📡 Broadcast New Listing via WebSockets
    if interested_user_ids:
        await broadcast_new_listing_alert({
            "id": new_car.id,
            "make": new_car.brand,
            "model": new_car.model,
            "price": new_car.price
        }, interested_user_ids)

    # 💾 5. Save Image paths to CarImage table
    for path in image_paths:
        add_car_image(db, new_car.id, path)

    return {
        "message": "Car listing created successfully",
        "ai_assistant": {
            "suggested_price": insights["suggested_price"],
            "market_position": insights["market_position"],
            "confidence_score": insights["confidence_score"],
            "price_difference": f"{insights['difference_percentage']}%" if price else "N/A",
            "reasons": insights["explanations"]
        },
        "data": {
            "id": new_car.id,
            "make": new_car.brand,
            "model": new_car.model,
            "year": new_car.year,
            "price": new_car.price,
            "ai_price": new_car.ai_price,
            "images": image_paths
        }
    }


@router.post("/price-analysis")
def analyze_car_price(
    make: str = Form(...),
    model: str = Form(...),
    year: int = Form(...),
    mileage_km: int = Form(...),
    fuel_type: str = Form(...),
    condition: str = Form(...),
    registration_city: str = Form(...),
    city: str = Form(...),
    transmission: str = Form(...),
    color: str = Form(...),
    num_owners: int = Form(...),
    registered: str = Form(...),
    engine_cc: int = Form(...),
    price: Optional[float] = Form(None)
):
    """Provides AI insights for a potential car listing without saving it."""
    features = {
        "make": make, "model": model, "year": year, "mileage_km": mileage_km,
        "engine_cc": engine_cc, "fuel_type": fuel_type, "condition": condition,
        "transmission": transmission, "registered": registered, "color": color,
        "registration_city": registration_city, "city": city, "num_owners": num_owners
    }
    
    insights = get_price_insights(features, price)
    return {
        "status": "success",
        "analysis": insights,
        "reasons": insights["explanations"],
        "tip": f"Setting your price at {insights['suggested_price']:,} PKR would be competitive."
    }


@router.get("/listings")
def get_all_listings(request: Request, db: Session = Depends(get_db)):
    base_url = str(request.base_url).rstrip('/')
    if "hf.space" in base_url:
        base_url = base_url.replace("http://", "https://")
    listings = db.query(CarListing).order_by(CarListing.id.desc()).all()
    # Add image_url to each listing
    for car in listings:
        if car.images:
            img_path = car.images[0].image_path
            if img_path.startswith("http"):
                car.image_url = img_path
            else:
                car.image_url = f"{base_url}/{img_path}"
        else:
            car.image_url = "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=800&q=80"
    return listings

@router.get("/listing/{id}")
def get_single_listing(id: int, request: Request, db: Session = Depends(get_db)):
    base_url = str(request.base_url).rstrip('/')
    car = db.query(CarListing).filter(CarListing.id == id).first()
    if not car:
        raise HTTPException(status_code=404, detail="Listing not found")
    
    # Increment view count
    car.views += 1
    db.commit()
    db.refresh(car)
    
    # Add image_url and all images
    if car.images:
        primary = car.images[0].image_path
        car.image_url = primary if primary.startswith("http") else f"{base_url}/{primary}"
        car.all_images = [img.image_path if img.image_path.startswith("http") else f"{base_url}/{img.image_path}" for img in car.images]
    else:
        car.image_url = "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=800&q=80"
        car.all_images = [car.image_url]
    car.owner_name = car.owner.name if car.owner else "Velora User"
    return car

@router.post("/listing/{id}/click")
def track_click(id: int, db: Session = Depends(get_db)):
    car = db.query(CarListing).filter(CarListing.id == id).first()
    if not car:
        raise HTTPException(status_code=404, detail="Listing not found")
    
    car.clicks += 1
    db.commit()
    return {"status": "success", "clicks": car.clicks}

@router.get("/filter")
def filter_cars(
    min_price: float = None,
    max_price: float = None,
    location: str = None,
    request: Request = None,
    credentials: Optional[HTTPAuthorizationCredentials] = Security(HTTPBearer(auto_error=False)),
    db: Session = Depends(get_db)
):
    base_url = str(request.base_url).rstrip('/') if request else "http://localhost:8000"
    if credentials:
        user_id = get_current_user(credentials.credentials)
        filters = json.dumps({"min_price": min_price, "max_price": max_price, "location": location})
        new_search = SearchHistory(user_id=user_id, query="Filter", filters=filters)
        db.add(new_search)
        db.commit()

    query = db.query(CarListing)
    if min_price:
        query = query.filter(CarListing.price >= min_price)
    if max_price:
        query = query.filter(CarListing.price <= max_price)
    if location:
        query = query.filter(CarListing.location.ilike(f"%{location}%"))
        
    listings = query.order_by(CarListing.id.desc()).all()
    for car in listings:
        if car.images:
            car.image_url = f"{base_url}/{car.images[0].image_path}"
        else:
            car.image_url = None
    return listings

@router.get("/search")
def search_cars(
    query: str, 
    request: Request,
    credentials: Optional[HTTPAuthorizationCredentials] = Security(HTTPBearer(auto_error=False)),
    db: Session = Depends(get_db)
):
    base_url = str(request.base_url).rstrip('/')
    if credentials:
        user_id = get_current_user(credentials.credentials)
        new_search = SearchHistory(user_id=user_id, query=query, filters="{}")
        db.add(new_search)
        db.commit()
        
    # Smart Search: Split query into keywords to handle "Toyota Corolla" or "Corolla Toyota" or mistakes
    keywords = query.lower().split()
    base_query = db.query(CarListing)
    
    for kw in keywords:
        # Search across multiple fields for each keyword
        base_query = base_query.filter(
            CarListing.brand.ilike(f"%{kw}%") | 
            CarListing.model.ilike(f"%{kw}%") |
            CarListing.location.ilike(f"%{kw}%") |
            CarListing.color.ilike(f"%{kw}%")
        )
        
    listings = base_query.order_by(CarListing.id.desc()).all()

    for car in listings:
        if car.images:
            car.image_url = f"{base_url}/{car.images[0].image_path}"
        else:
            car.image_url = None
            
    return listings

@router.put("/listing/{id}")
async def update_listing(
    id: int,
    price: float,
    db: Session = Depends(get_db)
):
    car = db.query(CarListing).filter(CarListing.id == id).first()
    if not car:
        raise HTTPException(status_code=404, detail="Listing not found")
    
    old_price = car.price
    car.price = price
    
    # 🔔 Price Drop Notification
    if price < old_price:
        interested_user_ids = []
        for watcher in car.saved_by:
            db.add(Notification(
                user_id=watcher.id,
                title="Price Drop Alert!",
                message=f"The price of {car.brand} {car.model} you saved just dropped from {old_price:,} to {price:,} PKR!",
                type="price_drop",
                link=f"/listing/{car.id}"
            ))
            interested_user_ids.append(watcher.id)
            
        # 📡 Broadcast Price Drop via WebSockets
        if interested_user_ids:
            await broadcast_price_drop(car.id, price, interested_user_ids)

    db.commit()
    db.refresh(car)
    return car

@router.delete("/listing/{id}")
def delete_listing(id: int, db: Session = Depends(get_db)):
    car = db.query(CarListing).filter(CarListing.id == id).first()
    if not car:
        raise HTTPException(status_code=404, detail="Listing not found")
    db.delete(car)
    db.commit()
    return {"message": "Deleted successfully"}
    
@router.post("/detect-car-condition")
async def detect_condition(image: UploadFile = File(...)):
    """Standalone endpoint for AI image analysis."""
    if not os.path.exists("uploads"):
        os.makedirs("uploads")
        
    file_path = f"uploads/temp_{image.filename}"
    with open(file_path, "wb") as f:
        f.write(await image.read())
    
    report = analyze_car_image(file_path)
    if os.path.exists(file_path):
        os.remove(file_path) # Cleanup
    return report
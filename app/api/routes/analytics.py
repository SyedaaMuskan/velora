from fastapi import APIRouter, Depends, HTTPException, Security
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.db.session import SessionLocal
from app.db.models import User, CarListing
from app.core.security import get_current_user
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

security = HTTPBearer()
router = APIRouter(prefix="/analytics", tags=["SaaS Analytics"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def get_auth_user(credentials: HTTPAuthorizationCredentials = Security(security)):
    token = credentials.credentials
    user_id = get_current_user(token)
    return user_id

@router.get("/user-dashboard")
def get_user_analytics(user_id: int = Depends(get_auth_user), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    listings = db.query(CarListing).filter(CarListing.owner_id == user_id).all()
    
    total_views = sum(l.views for l in listings)
    total_clicks = sum(l.clicks for l in listings)
    
    # Calculate price competitiveness
    # Score 0-100, where 100 is price <= ai_price
    comp_scores = []
    for l in listings:
        if l.ai_price and l.price:
            diff = (l.price - l.ai_price) / l.ai_price
            score = max(0, 100 - (diff * 100)) if diff > 0 else 100
            comp_scores.append(score)
    
    avg_comp_score = sum(comp_scores) / len(comp_scores) if comp_scores else 0

    # Add image_url to each listing
    for car in listings:
        if car.images:
            car.image_url = f"http://localhost:8000/{car.images[0].image_path}"
        else:
            car.image_url = None

    return {
        "total_views": total_views,
        "total_clicks": total_clicks,
        "price_competitiveness": round(avg_comp_score, 1),
        "listing_count": len(listings),
        "performance_summary": f"Your listings have been seen {total_views} times with {total_clicks} engagements.",
        "listings": listings,
        "saved_listings": [{
            "id": l.id,
            "brand": l.brand,
            "model": l.model,
            "price": l.price,
            "image_url": f"http://localhost:8000/{l.images[0].image_path}" if l.images else None
        } for l in user.saved]
    }

@router.get("/admin-dashboard")
def get_admin_analytics(user_id: int = Depends(get_auth_user), db: Session = Depends(get_db)):
    # Basic admin check (could be refined)
    user = db.query(User).filter(User.id == user_id).first()
    if user.user_type != "Admin":
         raise HTTPException(status_code=403, detail="Admin access required")

    total_listings = db.query(CarListing).count()
    total_users = db.query(User).count()
    
    most_viewed = db.query(CarListing).order_by(CarListing.views.desc()).limit(5).all()
    most_clicked = db.query(CarListing).order_by(CarListing.clicks.desc()).limit(5).all()

    return {
        "platform_stats": {
            "total_listings": total_listings,
            "total_users": total_users,
            "active_listings": db.query(CarListing).filter(CarListing.price > 0).count()
        },
        "top_performers": {
            "most_viewed": [{"id": l.id, "brand": l.brand, "views": l.views} for l in most_viewed],
            "most_clicked": [{"id": l.id, "brand": l.brand, "clicks": l.clicks} for l in most_clicked]
        }
    }

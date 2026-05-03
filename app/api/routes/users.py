from fastapi import APIRouter, Depends, HTTPException, Security
from sqlalchemy.orm import Session
from app.db.session import SessionLocal
from app.db.models import User, CarListing, SearchHistory, CarPrediction
from app.core.security import get_current_user
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

security = HTTPBearer()
router = APIRouter(prefix="/user", tags=["User Profile"])

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

@router.get("/profile")
def get_profile(user_id: int = Depends(get_auth_user), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # 🧠 Logic for Separate User Segments on UI
    listings_count = len(user.listings)
    saved_count = len(user.saved)
    trust_score = user.trust_score

    # Determine segment
    if listings_count >= 5:
        segment = "Pro Dealer"
        badge = "🏢 Top Rated Dealer"
    elif listings_count >= 1:
        segment = "Private Seller"
        badge = "🚗 Active Seller"
    elif saved_count >= 5:
        segment = "Serious Buyer"
        badge = "⭐ Market Watcher"
    else:
        segment = "Newcomer"
        badge = "👋 Just Started"

    # Additional Verification Badge
    if trust_score >= 80:
        badge += " | ✅ Verified"

    return {
        "name": user.name,
        "email": user.email,
        "trust_score": trust_score,
        "user_segment": segment,
        "ui_badge": badge,
        "member_since": user.created_at,
        "stats": {
            "listings_count": listings_count,
            "saved_count": saved_count,
            "predictions_count": len(user.predictions)
        }
    }

@router.get("/listings")
def get_user_listings(user_id: int = Depends(get_auth_user), db: Session = Depends(get_db)):
    listings = db.query(CarListing).filter(CarListing.owner_id == user_id).all()
    return listings

@router.get("/saved")
def get_saved_listings(user_id: int = Depends(get_auth_user), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    return user.saved

@router.post("/save/{listing_id}")
def save_listing(listing_id: int, user_id: int = Depends(get_auth_user), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    listing = db.query(CarListing).filter(CarListing.id == listing_id).first()
    
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")
    
    if listing in user.saved:
        user.saved.remove(listing)
        db.commit()
        return {"message": "Listing removed from saved"}
    
    user.saved.append(listing)
    db.commit()
    return {"message": "Listing saved successfully"}

@router.get("/search-history")
def get_search_history(user_id: int = Depends(get_auth_user), db: Session = Depends(get_db)):
    history = db.query(SearchHistory).filter(SearchHistory.user_id == user_id).order_by(SearchHistory.created_at.desc()).all()
    return history

@router.get("/prediction-history")
def get_prediction_history(user_id: int = Depends(get_auth_user), db: Session = Depends(get_db)):
    history = db.query(CarPrediction).filter(CarPrediction.user_id == user_id).order_by(CarPrediction.created_at.desc()).all()
    return history

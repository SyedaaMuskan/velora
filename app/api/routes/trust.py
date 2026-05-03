from fastapi import APIRouter, Depends, HTTPException, Security
from sqlalchemy.orm import Session
from app.db.session import SessionLocal
from app.db.models import User, CarListing, Report
from app.core.security import get_current_user
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

security = HTTPBearer()
router = APIRouter(prefix="/trust", tags=["Trust & Verification"])

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

@router.post("/verify-phone")
def verify_phone(phone: str, user_id: int = Depends(get_auth_user), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    user.phone_number = phone
    user.is_phone_verified = True
    
    # If both email and phone are verified, set main verified badge
    if user.is_email_verified:
        user.is_verified = True
        user.trust_score += 20.0
        
    db.commit()
    return {"message": "Phone verified successfully", "is_verified": user.is_verified}

@router.post("/report/listing/{id}")
def report_listing(id: int, reason: str, details: str, user_id: int = Depends(get_auth_user), db: Session = Depends(get_db)):
    car = db.query(CarListing).filter(CarListing.id == id).first()
    if not car:
        raise HTTPException(status_code=404, detail="Listing not found")
    
    new_report = Report(
        reporter_id=user_id,
        listing_id=id,
        reason=reason,
        details=details
    )
    db.add(new_report)
    
    # Increment report count on listing
    car.report_count += 1
    if car.report_count >= 5:
        car.is_fraudulent = True # Auto-flag after 5 reports
        
    db.commit()
    return {"message": "Listing reported. Our team will review it."}

@router.get("/seller/{id}/trust")
def get_seller_trust(id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Seller not found")
    
    return {
        "name": user.name,
        "is_verified": user.is_verified,
        "trust_score": user.trust_score,
        "verification_status": {
            "email": user.is_email_verified,
            "phone": user.is_phone_verified
        },
        "badges": ["Verified Seller"] if user.is_verified else []
    }

from fastapi import APIRouter, Depends, HTTPException, Security
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_
from app.db.session import SessionLocal
from app.db.models import User, CarListing, ChatMessage, Notification
from app.core.security import get_current_user
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from datetime import datetime

security = HTTPBearer()
router = APIRouter(prefix="/chat", tags=["Real-time Chat"])

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

@router.get("/templates")
def get_chat_templates():
    return {
        "templates": [
            "Is this car still available?",
            "What is your final price?",
            "Can I come to see the car today?",
            "Is the registration document original?",
            "Is there any major accident history?"
        ],
        "negotiation_templates": [
            "My final offer is {amount} PKR.",
            "Would you consider {amount} PKR for a quick deal?"
        ]
    }

@router.post("/send")
def send_message(
    receiver_id: int,
    listing_id: int,
    message: str,
    is_offer: bool = False,
    offer_amount: float = None,
    user_id: int = Depends(get_auth_user),
    db: Session = Depends(get_db)
):
    # Check if listing exists
    listing = db.query(CarListing).filter(CarListing.id == listing_id).first()
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")
    
    new_message = ChatMessage(
        sender_id=user_id,
        receiver_id=receiver_id,
        listing_id=listing_id,
        message=message,
        is_offer=is_offer,
        offer_amount=offer_amount
    )
    
    db.add(new_message)
    
    # Create notification for receiver
    sender = db.query(User).filter(User.id == user_id).first()
    new_notif = Notification(
        user_id=receiver_id,
        title="New Message",
        message=f"{sender.name} sent you a message about {listing.brand} {listing.model}",
        type="message",
        link=f"/chat/history/{listing_id}/{user_id}"
    )
    db.add(new_notif)
    
    db.commit()
    db.refresh(new_message)
    
    return {"status": "Message sent", "id": new_message.id}

@router.get("/inbox")
def get_inbox(user_id: int = Depends(get_auth_user), db: Session = Depends(get_db)):
    # Find unique conversations for the user
    # This is a simplified inbox logic
    sent = db.query(ChatMessage).filter(ChatMessage.sender_id == user_id).all()
    received = db.query(ChatMessage).filter(ChatMessage.receiver_id == user_id).all()
    
    messages = sent + received
    # Sort by time
    messages.sort(key=lambda x: x.created_at, reverse=True)
    
    # Enrich with names and listing info
    enriched = []
    for msg in messages:
        enriched.append({
            "id": msg.id,
            "sender_id": msg.sender_id,
            "receiver_id": msg.receiver_id,
            "sender_name": msg.sender.name,
            "receiver_name": msg.receiver.name,
            "listing_id": msg.listing_id,
            "listing_title": f"{msg.listing.brand} {msg.listing.model}",
            "message": msg.message,
            "created_at": msg.created_at,
            "is_offer": msg.is_offer,
            "offer_amount": msg.offer_amount
        })
    
    return enriched

@router.get("/history/{listing_id}/{other_user_id}")
def get_chat_history(
    listing_id: int,
    other_user_id: int,
    user_id: int = Depends(get_auth_user),
    db: Session = Depends(get_db)
):
    history = db.query(ChatMessage).filter(
        and_(
            ChatMessage.listing_id == listing_id,
            or_(
                and_(ChatMessage.sender_id == user_id, ChatMessage.receiver_id == other_user_id),
                and_(ChatMessage.sender_id == other_user_id, ChatMessage.receiver_id == user_id)
            )
        )
    ).order_by(ChatMessage.created_at.asc()).all()
    
    return [{
        "id": m.id,
        "sender_id": m.sender_id,
        "receiver_id": m.receiver_id,
        "sender_name": m.sender.name,
        "message": m.message,
        "created_at": m.created_at,
        "is_offer": m.is_offer,
        "offer_amount": m.offer_amount
    } for m in history]
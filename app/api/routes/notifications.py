from fastapi import APIRouter, Depends, HTTPException, Security
from sqlalchemy.orm import Session
from app.db.session import SessionLocal
from app.db.models import Notification
from app.core.security import get_current_user
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

security = HTTPBearer()
router = APIRouter(prefix="/notifications", tags=["Notifications System"])

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

@router.get("/")
def get_notifications(unread_only: bool = False, user_id: int = Depends(get_auth_user), db: Session = Depends(get_db)):
    query = db.query(Notification).filter(Notification.user_id == user_id)
    if unread_only:
        query = query.filter(Notification.is_read == False)
    
    return query.order_by(Notification.created_at.desc()).all()

@router.post("/{id}/read")
def mark_as_read(id: int, user_id: int = Depends(get_auth_user), db: Session = Depends(get_db)):
    notif = db.query(Notification).filter(Notification.id == id, Notification.user_id == user_id).first()
    if not notif:
        raise HTTPException(status_code=404, detail="Notification not found")
    
    notif.is_read = True
    db.commit()
    return {"status": "success"}

@router.post("/read-all")
def mark_all_as_read(user_id: int = Depends(get_auth_user), db: Session = Depends(get_db)):
    db.query(Notification).filter(Notification.user_id == user_id).update({"is_read": True})
    db.commit()
    return {"status": "success"}

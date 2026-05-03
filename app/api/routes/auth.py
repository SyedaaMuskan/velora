from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.session import SessionLocal
from app.db import crud
from app.core.security import hash_password, verify_password, create_access_token

router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.post("/signup")
def signup(name: str, email: str, password: str, db: Session = Depends(get_db)):

    existing = crud.get_user_by_email(db, email)
    if existing:
        return {"error": "Email already exists"}

    hashed = hash_password(password)
    user = crud.create_user(db, name, email, hashed)

    return {"message": "User created successfully"}

@router.post("/login")
def login(email: str, password: str, db: Session = Depends(get_db)):

    user = crud.get_user_by_email(db, email)

    if not user or not verify_password(password, user.password):
        return {"error": "Invalid credentials"}

    token = create_access_token({"user_id": user.id})

    return {
        "access_token": token,
        "user_type": user.user_type,
        "email": user.email,
        "name": user.name
    }
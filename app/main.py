from fastapi import FastAPI, Depends
from sqlalchemy.orm import Session
from app.api.routes import predict, auth, listings, users, chat, analytics, notifications, trust, websockets
from app.db.session import engine, Base, SessionLocal
from app.db import models # This ensures models are registered

# Create database tables
Base.metadata.create_all(bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

from pydantic import BaseModel
from app.chatbot.chat import get_chat_response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os

app = FastAPI()

# Mount uploads directory to serve images
if not os.path.exists("uploads"):
    os.makedirs("uploads")
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(predict.router)
app.include_router(auth.router)
app.include_router(listings.router)
app.include_router(users.router)
app.include_router(chat.router)
app.include_router(analytics.router)
app.include_router(notifications.router)
app.include_router(trust.router)
app.include_router(websockets.router)

@app.get("/")
def read_root():
    return {"message": "Welcome to the Car Price Prediction API!"}

@app.get("/db-check")
def db_check(db: Session = Depends(get_db)):
    from app.db.session import DATABASE_URL
    from app.db.models import CarListing, CarPrediction, User
    
    db_type = "Unknown"
    if "supabase" in DATABASE_URL.lower():
        db_type = "Supabase"
    elif "localhost" in DATABASE_URL.lower():
        db_type = "Localhost (Error if on HF)"
    elif "sqlite" in DATABASE_URL.lower():
        db_type = "SQLite (Ephemeral)"
    
    try:
        listings_count = db.query(CarListing).count()
        predictions_count = db.query(CarPrediction).count()
        users_count = db.query(User).count()
    except Exception as e:
        return {"error": str(e), "db": db_type}

    return {
        "database_connected": db_type,
        "counts": {
            "listings": listings_count,
            "predictions": predictions_count,
            "users": users_count
        },
        "url_detected": DATABASE_URL.split("@")[-1] if "@" in DATABASE_URL else "No credentials shown"
    }


class ChatRequest(BaseModel):
    message: str

@app.post("/chatbot")
def chat(request: ChatRequest, db: Session = Depends(get_db)):
    print(f"Chatbot received message: {request.message}") # Debug log
    reply = get_chat_response(request.message, db)
    return {"response": reply}

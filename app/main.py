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


class ChatRequest(BaseModel):
    message: str

@app.post("/chatbot")
def chat(request: ChatRequest, db: Session = Depends(get_db)):
    print(f"Chatbot received message: {request.message}") # Debug log
    reply = get_chat_response(request.message, db)
    return {"response": reply}

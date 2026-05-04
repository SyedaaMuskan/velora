from fastapi import APIRouter, Depends, Header, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

# Schemas
from app.api.schema.car_schema import CarInput

# Database
from app.db.session import SessionLocal
from app.db import crud

# Utilities and ML
from app.services.extractor import extract_features
from app.ml.pipeline import predict_price
from app.core.security import get_current_user
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi import Security
security = HTTPBearer()

router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

class CarRequest(BaseModel):
    message: str

@router.post("/extract")
def extract(req: CarRequest):
    features = extract_features(req.message)
    return {
        "status": "success",
        "features": features
    }

@router.get("/predictions")
def list_predictions(db: Session = Depends(get_db)):
    predictions = crud.get_all_predictions(db)
    return [
        {
            "id": p.id,
            "year": p.year,
            "fuel_type": p.fuel_type,
            "mileage_km": p.mileage_km,
            "engine_cc": p.engine_cc,
            "condition": p.condition,
            "transmission": p.transmission,
            "city": p.city,
            "predicted_price": p.predicted_price
        }
        for p in predictions
    ]

@router.post("/predict")
def predict_car(
    car: CarInput, 
    
    credentials: Optional[HTTPAuthorizationCredentials] = Security(security, auto_error=False),
    db: Session = Depends(get_db)
):
    user_id = None
    if credentials:
        token = credentials.credentials
        try:
            user_id = get_current_user(token)
        except:
            user_id = None

    # Convert validated Pydantic model to a dictionary
    data = car.dict()
    
    # Run ML Prediction
    predicted_price = predict_price(data)
    
    # Attach results for database saving
    data["predicted_price"] = predicted_price
    data["user_id"] = user_id
    
    saved = crud.save_prediction(db, data)
    
    return {
        "prediction": predicted_price,
        "user_id": user_id,
        "saved_id": saved.id,
        "message": "Prediction saved successfully"
    }

@router.get("/history")
def get_history(
    credentials: HTTPAuthorizationCredentials = Security(security),
    db: Session = Depends(get_db)
):

        
    token = credentials.credentials
    user_id = get_current_user(token)

    data = crud.get_user_predictions(db, user_id)
    return data
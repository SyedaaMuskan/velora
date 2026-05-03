import pytest
from app.db import crud

def test_create_and_get_user(db_session):
    user = crud.create_user(db_session, "CRUD User", "crud@example.com", "pass")
    assert user.id is not None
    
    fetched = crud.get_user_by_email(db_session, "crud@example.com")
    assert fetched.id == user.id
    assert fetched.name == "CRUD User"

def test_save_and_get_prediction(db_session):
    data = {
        "make": "Toyota",
        "year": 2020,
        "fuel_type": "Petrol",
        "mileage_km": 10000,
        "engine_cc": 1500,
        "num_owners": 1,
        "registered": "Lahore",
        "condition": "New",
        "transmission": "Automatic",
        "color": "Silver",
        "city": "Lahore",
        "registration_city": "Lahore",
        "predicted_price": 4000000.0,
        "user_id": 1
    }
    prediction = crud.save_prediction(db_session, data)
    assert prediction.id is not None
    
    all_preds = crud.get_all_predictions(db_session)
    assert len(all_preds) >= 1
    
    user_preds = crud.get_user_predictions(db_session, 1)
    assert len(user_preds) == 1
    assert user_preds[0].predicted_price == 4000000.0

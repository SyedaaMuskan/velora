import pytest
from unittest.mock import patch

CAR_DATA = {
    "year": 2018,
    "engine_cc": 1000,
    "mileage_km": 50000.0,
    "num_owners": 1,
    "registered": "Karachi",
    "condition": "Excellent",
    "make": "Suzuki",
    "model": "Cultus",
    "fuel_type": "Petrol",
    "transmission": "Manual",
    "color": "White",
    "city": "Karachi",
    "registration_city": "Karachi"
}

@patch("app.api.routes.predict.get_current_user")
@patch("app.api.routes.predict.predict_price")
def test_input_validation_missing_fields(mock_predict, mock_user, client):
    mock_user.return_value = 1
    incomplete_data = {"mileage_km": 50000}
    response = client.post("/predict", json=incomplete_data, headers={"Authorization": "Bearer token"})
    assert response.status_code == 422

@patch("app.api.routes.predict.get_current_user")
@patch("app.api.routes.predict.predict_price")
def test_database_persistence(mock_predict, mock_user, client, db_session):
    mock_user.return_value = 1
    mock_predict.return_value = 1200000.0
    
    response = client.post("/predict", json=CAR_DATA, headers={"Authorization": "Bearer token"})
    assert response.status_code == 200
    assert response.json()["prediction"] == 1200000.0
    # Verify in DB
    from app.db.models import CarPrediction
    prediction = db_session.query(CarPrediction).filter(
        CarPrediction.user_id == 1,
        CarPrediction.predicted_price == 1200000.0
    ).first()
    assert prediction is not None

@patch("app.api.routes.predict.get_current_user")
@patch("app.api.routes.predict.predict_price")
def test_user_isolation(mock_predict, mock_user, client):
    mock_predict.return_value = 1000000.0
    
    # User 1 makes a prediction
    mock_user.return_value = 1
    client.post("/predict", json=CAR_DATA, headers={"Authorization": "Bearer token1"})
    
    # User 2 checks history
    mock_user.return_value = 2
    response = client.get("/history", headers={"Authorization": "Bearer token2"})
    assert response.status_code == 200
    assert len(response.json()) == 0

def test_predict_protected_no_token(client):
    response = client.post("/predict", json=CAR_DATA)
    assert response.status_code == 401

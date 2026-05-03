from unittest.mock import patch
import pytest
from app.db.models import CarListing

@pytest.fixture
def sample_listing(db_session):
    listing = CarListing(
        brand="Honda",
        model="Civic",
        year=2020,
        price=3500000.0,
        location="Karachi",
        condition="Good",
        transmission="Automatic",
        fuel_type="Petrol",
        mileage=20000
    )
    db_session.add(listing)
    db_session.commit()
    return listing

@patch("app.chatbot.chat.requests.post")
@patch("app.chatbot.chat.extract_features")
def test_chat_rag_search_success(mock_extract, mock_post, client, sample_listing):
    # Mock extraction
    mock_extract.return_value = {"brand": "Honda", "car_name": "Civic"}
    
    # Mock the LLM recommendation response
    mock_post.return_value.json.return_value = {
        "choices": [
            {
                "message": {
                    "content": "I found a great 2020 Honda Civic for 3.5 million PKR!"
                }
            }
        ]
    }
    mock_post.return_value.status_code = 200

    response = client.post("/chat", json={"message": "Show me any Honda Civic"})
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data["response"], str)
    assert "Honda Civic" in data["response"]
    assert "3.5 million" in data["response"]

@patch("app.chatbot.chat.extract_features")
def test_chat_rag_no_results(mock_extract, client):
    # Mock extraction
    mock_extract.return_value = {"brand": "Ferrari"}
    
    # Search for something that doesn't exist
    response = client.post("/chat", json={"message": "Find me a Ferrari"})
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data["response"], str)
    assert "couldn't find" in data["response"].lower()

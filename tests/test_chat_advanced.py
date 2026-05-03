from unittest.mock import patch
import pytest

@patch("app.chatbot.chat.requests.post")
def test_chat_empty_message(mock_post, client):
    response = client.post("/chat", json={"message": ""})
    assert response.status_code in [200, 422]

@patch("app.chatbot.chat.requests.post")
def test_chat_unrelated_query(mock_post, client):
    mock_post.return_value.json.return_value = {
        "choices": [{"message": {"content": "The capital of France is Paris."}}]
    }
    mock_post.return_value.status_code = 200
    
    response = client.post("/chat", json={"message": "What is the capital of France?"})
    assert response.status_code == 200
    assert "Paris" in response.json()["response"]

@patch("app.chatbot.chat.requests.post")
def test_chat_external_api_error(mock_post, client):
    mock_post.return_value.status_code = 500
    mock_post.return_value.text = "Internal Server Error"
    
    response = client.post("/chat", json={"message": "Help"})
    assert response.status_code == 200
    assert "trouble" in response.json()["response"]

import pytest

def test_signup_success(client):
    response = client.post("/signup", params={
        "name": "Test User",
        "email": "test@example.com",
        "password": "securepassword"
    })
    assert response.status_code == 200
    assert response.json()["message"] == "User created successfully"

def test_signup_duplicate_email(client):
    # First signup
    client.post("/signup", params={
        "name": "User 1",
        "email": "dup@example.com",
        "password": "password"
    })
    # Second signup with same email
    response = client.post("/signup", params={
        "name": "User 2",
        "email": "dup@example.com",
        "password": "password"
    })
    assert response.status_code == 200 # Current implementation returns 200 with error msg
    assert "error" in response.json()
    assert response.json()["error"] == "Email already exists"

def test_login_success(client):
    # Setup: Create user
    client.post("/signup", params={
        "name": "Login User",
        "email": "login@example.com",
        "password": "correctpassword"
    })
    
    # Test login
    response = client.post("/login", params={
        "email": "login@example.com",
        "password": "correctpassword"
    })
    assert response.status_code == 200
    assert "access_token" in response.json()

def test_login_invalid_credentials(client):
    response = client.post("/login", params={
        "email": "wrong@example.com",
        "password": "wrongpassword"
    })
    assert response.status_code == 200
    assert "error" in response.json()
    assert response.json()["error"] == "Invalid credentials"

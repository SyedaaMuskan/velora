def test_404_not_found(client):
    response = client.get("/non-existent-route")
    assert response.status_code == 404
    assert response.json()["detail"] == "Not Found"

def test_405_method_not_allowed(client):
    response = client.get("/chat")
    assert response.status_code == 405

def test_unauthorized_access(client):
    response = client.get("/user/profile")
    assert response.status_code == 401

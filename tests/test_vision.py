import pytest
import os
from PIL import Image
import io
from app.vision.service import analyze_car_image

@pytest.fixture
def sample_image_path(tmp_path):
    # Create a simple synthetic image for testing
    img_path = tmp_path / "test_car.jpg"
    img = Image.new('RGB', (300, 300), color=(180, 180, 180)) # Light gray -> Excellent/Good
    img.save(img_path)
    return str(img_path)

def test_analyze_car_image_excellent(sample_image_path):
    # Testing service directly with a bright image
    report = analyze_car_image(sample_image_path)
    assert report["condition"] in ["Excellent", "Good"]
    assert "confidence" in report
    assert report["confidence"] > 0.8

def test_analyze_car_image_poor(tmp_path):
    # Testing with a dark image
    img_path = tmp_path / "dark_car.jpg"
    img = Image.new('RGB', (300, 300), color=(20, 20, 20)) # Very dark -> Poor
    img.save(img_path)
    
    report = analyze_car_image(str(img_path))
    assert report["condition"] == "Poor"
    assert "damage_status" in report
    assert "Major damage" in report["damage_status"]

def test_detect_condition_endpoint(client):
    # Test the API endpoint
    # Create an in-memory image
    img = Image.new('RGB', (100, 100), color='white')
    img_byte_arr = io.BytesIO()
    img.save(img_byte_arr, format='JPEG')
    img_byte_arr.seek(0)
    
    response = client.post(
        "/detect-car-condition",
        files={"image": ("test.jpg", img_byte_arr, "image/jpeg")}
    )
    
    assert response.status_code == 200
    data = response.json()
    assert "condition" in data
    assert "confidence" in data

def test_vision_error_handling():
    # Test with non-existent file
    report = analyze_car_image("non_existent.jpg")
    assert report["condition"] == "Unknown"
    assert report["confidence"] == 0.0

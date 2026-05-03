import pytest
from app.ml.pipeline import predict_price, get_price_insights
from unittest.mock import patch

@patch("app.ml.pipeline.get_final_price")
def test_predict_price_basic(mock_get_price):
    mock_get_price.return_value = 1200000.0
    features = {"year": 2020, "mileage_km": 30000}
    price = predict_price(features)
    assert price == 1200000.0
    assert isinstance(price, float)

@patch("app.ml.pipeline.get_final_price")
def test_price_insights_logic(mock_get_price):
    mock_get_price.return_value = 1000000.0
    features = {"year": 2018, "mileage_km": 50000, "engine_cc": 1300}
    
    # Case: Competitive price
    insights = get_price_insights(features, user_price=1050000.0)
    assert insights["market_position"] == "Competitive"
    assert insights["difference_percentage"] == 5.0
    
    # Case: High price (> 10% diff)
    insights = get_price_insights(features, user_price=1200000.0)
    assert insights["market_position"] == "High"
    
    # Case: Low price (< -10% diff)
    insights = get_price_insights(features, user_price=800000.0)
    assert insights["market_position"] == "Low"

def test_price_explanation_content():
    # This tests the logic in get_price_explanation without full model dependency
    with patch("app.ml.pipeline.get_final_price") as mock_get_price:
        # Mocking values to simulate year/mileage impact
        def side_effect(f):
            if f["year"] == 2020: return 1500000
            if f["year"] == 2019: return 1400000
            if f.get("mileage_km", 0) == 40000: return 1450000 # 10k more km
            return 1500000
            
        mock_get_price.side_effect = side_effect
        features = {"year": 2020, "mileage_km": 30000, "engine_cc": 1500}
        insights = get_price_insights(features)
        
        assert len(insights["explanations"]) > 0
        assert any("year" in exp.lower() for exp in insights["explanations"])
        assert any("engine" in exp.lower() for exp in insights["explanations"])

import pytest
import pandas as pd
import numpy as np
from app.utils.loader import preprocess_input, get_price_from_chat
from unittest.mock import patch

def test_preprocess_input_logic():
    data = {
        "year": 2020,
        "mileage_km": 30000,
        "engine_cc": 1000
    }
    df = pd.DataFrame([data])
    processed_df = preprocess_input(df)
    
    # Check feature engineering
    assert "vehicle_age_years_log" in processed_df.columns
    assert "log_mileage" in processed_df.columns
    assert "mileage_per_year" in processed_df.columns
    assert processed_df["mileage_per_year"].iloc[0] == 30000 / 6 # 2026 - 2020 = 6

def test_get_price_from_chat_mapping():
    # Test how messy features from LLM are mapped to standard dict
    chat_features = {
        "brand": "Honda",
        "car_name": "City",
        "year": "2018",
        "km_driven": "45000",
        "engine": "1500cc",
        "owner": "Second Owner"
    }
    
    with patch("app.utils.loader.get_final_price") as mock_get_price:
        mock_get_price.return_value = 2500000.0
        price = get_price_from_chat(chat_features)
        
        # Verify the call to get_final_price used mapped features
        args, _ = mock_get_price.call_args
        mapped = args[0]
        assert mapped["make"] == "Honda"
        assert mapped["model"] == "City"
        assert mapped["year"] == 2018
        assert mapped["num_owners"] == 2
        assert mapped["engine_cc"] == 1500
        assert price == 2500000.0

def test_get_price_from_chat_defaults():
    # Test defaults when some info is missing
    chat_features = {"year": 2022}
    with patch("app.utils.loader.get_final_price") as mock_get_price:
        get_price_from_chat(chat_features)
        args, _ = mock_get_price.call_args
        mapped = args[0]
        assert mapped["make"] == "Suzuki" # Default
        assert mapped["engine_cc"] == 1300 # Default

from pathlib import Path
import joblib
import pandas as pd
import numpy as np

def load_model():
    app_dir = Path(__file__).resolve().parent.parent
    model_path = app_dir.parent / "model" / "artifacts" / "car_price_pipeline.pkl"
    return joblib.load(model_path)



def preprocess_input(df):
    current_year = 2026

    df['year_of_listing'] = current_year
    df['vehicle_age_years'] = current_year - df['year']
    df['vehicle_age_years_log'] = np.log1p(df['vehicle_age_years'])
    df['log_mileage'] = np.log1p(df['mileage_km'])
    df['mileage_per_year'] = df['mileage_km'] / np.maximum(df['vehicle_age_years'], 1)
    df['log_engine_cc'] = np.log1p(df['engine_cc'])
    df['listing_month'] = 1
    df['source'] = "OLX"
    df.drop(columns=['vehicle_age_years'], inplace=True, errors='ignore')

    return df

_model_cache = None

def get_final_price(car_dict: dict) -> float:
    """Predicts price from standard API dictionary format."""
    global _model_cache
    if _model_cache is None:
        _model_cache = load_model()
    df_in = pd.DataFrame([car_dict])
    df_processed = preprocess_input(df_in)
    pred_log = _model_cache.predict(df_processed)[0]
    return float(np.expm1(pred_log))

def get_price_from_chat(features: dict) -> float:
    """Safely maps messy llm chat features to standard dictionary, then predicts."""
    owner_str = features.get("owner", "First Owner")
    num_owners = 1
    if "second" in owner_str.lower() or "2" in owner_str:
        num_owners = 2
    elif "third" in owner_str.lower() or "3" in owner_str:
        num_owners = 3
        
    engine_val = features.get("engine")
    if engine_val is None:
        engine_val = 1300
    else:
        import re
        nums = re.findall(r'\d+', str(engine_val))
        engine_val = int(nums[0]) if nums else 1300
        
    mapped_features = {
        "make": features.get("brand", "Suzuki") or "Suzuki",
        "model": features.get("car_name", "Cultus") or "Cultus",
        "year": int(features.get("year", 2015) or 2015),
        "mileage_km": float(features.get("km_driven", 50000) or 50000),
        "fuel_type": features.get("fuel", "Petrol") or "Petrol",
        "transmission": features.get("transmission", "Manual") or "Manual",
        "engine_cc": engine_val,
        "city": features.get("city", "Karachi") or "Karachi",
        "num_owners": num_owners,
        "registered": features.get("city", "Karachi") or "Karachi",
        "condition": "Good",
        "color": "White",
        "registration_city": features.get("city", "Karachi") or "Karachi"
    }
    
    return get_final_price(mapped_features)
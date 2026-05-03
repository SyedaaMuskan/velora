# predict_input.py
import pandas as pd
import numpy as np
from datetime import datetime
import joblib

pipeline = joblib.load("car_price_pipeline.pkl")
current_year = datetime.now().year

def predict_price(new_listing: dict):
    df_new = pd.DataFrame([new_listing])

    # Feature engineering
    df_new['year_of_listing'] = pd.to_datetime(df_new['listing_date']).dt.year
    df_new['listing_month'] = pd.to_datetime(df_new['listing_date']).dt.month
    df_new['vehicle_age_years'] = current_year - df_new['year']
    df_new['vehicle_age_years_log'] = np.log1p(df_new['vehicle_age_years'])
    df_new['log_mileage'] = np.log1p(df_new['mileage_km'])
    df_new['mileage_per_year'] = df_new['mileage_km'] / np.maximum(df_new['vehicle_age_years'], 1)
    df_new['log_engine_cc'] = np.log1p(df_new['engine_cc'])

    # Drop unused columns
    df_new = df_new.drop(columns=['listing_date'])

    # Predict log-price
    log_price_pred = pipeline.predict(df_new)[0]
    price_pred = np.expm1(log_price_pred)
    return round(price_pred, 0)

def get_user_input():
    car = {}
    car['year'] = int(input("Enter car manufacture year (e.g., 2018): "))
    car['engine_cc'] = int(input("Enter engine cc (e.g., 1500): "))
    car['mileage_km'] = float(input("Enter mileage in km (e.g., 35000): "))
    car['num_owners'] = int(input("Enter number of previous owners: "))
    car['condition'] = input("Enter condition (Needs Work/Fair/Good/Excellent): ")
    car['make'] = input("Enter make (e.g., Toyota): ")
    car['model'] = input("Enter model (e.g., Corolla): ")
    car['fuel_type'] = input("Enter fuel type (Petrol/Diesel/CNG): ")
    car['transmission'] = input("Enter transmission (Automatic/Manual): ")
    car['color'] = input("Enter color: ")
    car['registered'] = input("Is car registered? (Yes/No): ")
    car['city'] = input("Enter city: ")
    #car['source'] = input("Enter source (OLX/Pakwheels): ")
    car['registration_city'] = input("Enter registration city: ")
    #car['listing_date'] = input("Enter listing date (YYYY-MM-DD): ")
    return car


if __name__ == "__main__":
    new_car = get_user_input()
    price = predict_price(new_car)
    print(f"\nPredicted Price: ₨{price:,}")
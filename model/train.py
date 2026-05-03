from xgboost import XGBRegressor
import pandas as pd
import numpy as np
from sklearn.preprocessing import OneHotEncoder, StandardScaler, OrdinalEncoder
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_squared_error
import os

print("Starting training script...")
print("Loading data...")
df = pd.read_csv('data/pakistan_vehicle_listings.csv')
from datetime import datetime
import joblib


current_year = datetime.now().year  # e.g., 2026

# Average annual price increase (10% example)
annual_increase = 0.10



# Compute years passed
print("Performing feature engineering...")
df['year_of_listing'] = pd.to_datetime(df['listing_date']).dt.year
df['years_passed'] = current_year - df['year_of_listing']

# Update price dynamically
df['price_updated'] = df['price_pkr'] * (1 + annual_increase) ** df['years_passed']

# Update vehicle age
df['vehicle_age_years'] = current_year - df['year']
df['vehicle_age_years_log'] = np.log1p(df['vehicle_age_years'])

df.drop(columns=['years_passed'], inplace=True)
df['listing_month'] = pd.to_datetime(df['listing_date']).dt.month
df['log_mileage'] = np.log1p(df['mileage_km'])
df['mileage_per_year'] = df['mileage_km'] / np.maximum(df['vehicle_age_years'], 1)

df['log_engine_cc'] = np.log1p(df['engine_cc'])
df['log_price'] = np.log1p(df['price_updated'])

# Drop useless columns
df = df.drop(columns=['listing_id', 'listing_date', 'price_updated', 'vehicle_age_years'])
X = df.drop(columns=['log_price'])
y = df['log_price']
NUM_COLS = [
    "year", "vehicle_age_years_log", "log_engine_cc","year_of_listing",
    "mileage_km", "log_mileage", "num_owners",
    "listing_month",'mileage_per_year'
]
ORD_COLS = ["condition"]
CAT_COLS = [
    "make", "model", "fuel_type", "transmission",
    "color", "registered", "city", "source", "registration_city"
]






preprocessor = ColumnTransformer(transformers=[

    # Numerical scaling
    ("num", StandardScaler(), NUM_COLS),

    # Ordinal encoding (ONLY for condition)
    ("ord", OrdinalEncoder(categories=[['Needs Work','Fair','Good','Excellent']]), ORD_COLS),

    # One-hot encoding (for nominal)
    ("cat", OneHotEncoder(handle_unknown="ignore"), CAT_COLS)

])




pipeline = Pipeline(steps=[
    ("preprocessor", preprocessor),
    ('model', XGBRegressor(
        n_estimators=400,
        learning_rate=0.05,
        max_depth=6,
        subsample=0.8,
        colsample_bytree=0.8,
        random_state=42

    )


    )
])
from sklearn.model_selection import train_test_split

X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)
print("Training the XGBoost model (this might take a few moments)...")
pipeline.fit(X_train, y_train)


y_pred = pipeline.predict(X_test)

rmse = np.sqrt(mean_squared_error(y_test, y_pred))
print("RMSE:", rmse)
train_pred = pipeline.predict(X_train)

train_rmse = np.sqrt(mean_squared_error(y_train, train_pred))
test_rmse = np.sqrt(mean_squared_error(y_test, y_pred))

print("Train:", train_rmse)
print("Test:", test_rmse)

# Ensure artifacts directory exists
artifacts_dir = os.path.join("model", "artifacts")
os.makedirs(artifacts_dir, exist_ok=True)
model_save_path = os.path.join(artifacts_dir, "car_price_pipeline.pkl")

print(f"Saving model to {model_save_path}...")
joblib.dump(pipeline, model_save_path)
print(f"Pipeline saved successfully!")
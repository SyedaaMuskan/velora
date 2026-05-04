import os
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL")

if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

engine = create_engine(DATABASE_URL)

tables = ["users", "car_listings", "car_images", "car_predictions", "search_history", "chat_messages", "notifications"]

print("Resetting database sequences in Supabase...")

with engine.connect() as conn:
    for table in tables:
        try:
            # This SQL command finds the max ID and sets the next value to max+1
            query = f"SELECT setval(pg_get_serial_sequence('{table}', 'id'), COALESCE(max(id), 1) + 1, false) FROM {table};"
            conn.execute(text(query))
            conn.commit()
            print(f"DONE: Reset sequence for {table}")
        except Exception as e:
            print(f"FAILED: Could not reset {table}: {e}")

print("\nALL SEQUENCES RESET! New entries will now work perfectly.")

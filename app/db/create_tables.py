from app.db.session import engine, Base
from app.db import models

# Create all tables
Base.metadata.create_all(bind=engine)

print("Tables created successfully!")
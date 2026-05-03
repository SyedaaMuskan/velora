from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Get database URL from .env
DATABASE_URL = os.getenv("DATABASE_URL")

# Fix for SQLAlchemy 1.4+ (Standard driver)
if DATABASE_URL:
    if DATABASE_URL.startswith("postgres://"):
        DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)
    
    # Ensure SSL for production
    if "sslmode" not in DATABASE_URL and "localhost" not in DATABASE_URL:
        if "?" in DATABASE_URL:
            DATABASE_URL += "&sslmode=require"
        else:
            DATABASE_URL += "?sslmode=require"

# Create engine
if not DATABASE_URL:
    DATABASE_URL = "sqlite:///./test.db"

engine = create_engine(DATABASE_URL)

# Create session factory
SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

# Base class for models
Base = declarative_base()
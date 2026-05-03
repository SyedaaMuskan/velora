from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Table, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime
from .session import Base

# Association table for saved cars (bookmarks)
saved_listings = Table(
    "saved_listings",
    Base.metadata,
    Column("user_id", Integer, ForeignKey("users.id"), primary_key=True),
    Column("listing_id", Integer, ForeignKey("car_listings.id"), primary_key=True),
    Column("created_at", DateTime, default=datetime.utcnow)
)

class CarPrediction(Base):
    __tablename__ = "car_predictions"

    id = Column(Integer, primary_key=True, index=True)
    make = Column(String, nullable=False)
    year = Column(Integer, nullable=False)
    fuel_type = Column(String, nullable=False)
    mileage_km  = Column(Integer, nullable=False)
    engine_cc= Column(Integer, nullable=False)
    num_owners= Column(Integer, nullable=False)
    registered= Column(String, nullable=False)
    condition= Column(String, nullable=False)
    transmission= Column(String, nullable=False)
    color= Column(String, nullable=False)
    city= Column(String, nullable=False)
    registration_city= Column(String, nullable=False)
    predicted_price = Column(Float, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    user_id = Column(Integer, ForeignKey("users.id"))

    owner = relationship("User", back_populates="predictions")

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, nullable=False)
    password = Column(String, nullable=False)
    user_type = Column(String, default="Standard") 
    trust_score = Column(Float, default=50.0) 
    
    # Verification details
    is_verified = Column(Boolean, default=False)
    is_email_verified = Column(Boolean, default=False)
    is_phone_verified = Column(Boolean, default=False)
    phone_number = Column(String, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)        

    # Relationships
    listings = relationship("CarListing", back_populates="owner")
    predictions = relationship("CarPrediction", back_populates="owner")
    saved = relationship("CarListing", secondary=saved_listings, back_populates="saved_by")
    searches = relationship("SearchHistory", back_populates="user")
    notifications = relationship("Notification", back_populates="user")
    reports_made = relationship("Report", foreign_keys="[Report.reporter_id]", back_populates="reporter")
    
    sent_messages = relationship("ChatMessage", foreign_keys="[ChatMessage.sender_id]", back_populates="sender")
    received_messages = relationship("ChatMessage", foreign_keys="[ChatMessage.receiver_id]", back_populates="receiver")

class CarListing(Base):
    __tablename__ = "car_listings"

    id = Column(Integer, primary_key=True, index=True)
    brand = Column(String)
    model = Column(String)
    year = Column(Integer)
    mileage = Column(Integer)
    fuel_type = Column(String)
    condition = Column(String)
    location = Column(String)
    transmission = Column(String)
    color = Column(String)
    num_owners = Column(Integer)
    registered = Column(String)
    engine_cc = Column(Integer)
    price = Column(Float)
    ai_price = Column(Float)
    views = Column(Integer, default=0)
    clicks = Column(Integer, default=0)
    
    # Vision Intelligence
    detected_condition = Column(String, nullable=True) # Excellent, Good, Fair, Poor
    damage_report = Column(String, nullable=True) # JSON string
    vision_confidence = Column(Float, default=0.0)
    
    # Fraud & Trust flags
    is_fraudulent = Column(Boolean, default=False)
    fraud_score = Column(Float, default=0.0) # 0-100 probability
    report_count = Column(Integer, default=0)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    
    owner_id = Column(Integer, ForeignKey("users.id"))
    
    # Relationships
    owner = relationship("User", back_populates="listings")
    images = relationship("CarImage", back_populates="listing", cascade="all, delete-orphan")
    saved_by = relationship("User", secondary=saved_listings, back_populates="saved")
    chats = relationship("ChatMessage", back_populates="listing")
    reports = relationship("Report", back_populates="listing")

class CarImage(Base):
    __tablename__ = "car_images"

    id = Column(Integer, primary_key=True, index=True)
    listing_id = Column(Integer, ForeignKey("car_listings.id"))
    image_path = Column(String)

    listing = relationship("CarListing", back_populates="images")

class SearchHistory(Base):
    __tablename__ = "search_history"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    query = Column(String)
    filters = Column(String) 
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="searches")

class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id = Column(Integer, primary_key=True, index=True)
    sender_id = Column(Integer, ForeignKey("users.id"))
    receiver_id = Column(Integer, ForeignKey("users.id"))
    listing_id = Column(Integer, ForeignKey("car_listings.id"))
    message = Column(String, nullable=False)
    is_offer = Column(Boolean, default=False)
    offer_amount = Column(Float, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    sender = relationship("User", foreign_keys=[sender_id], back_populates="sent_messages")
    receiver = relationship("User", foreign_keys=[receiver_id], back_populates="received_messages")
    listing = relationship("CarListing", back_populates="chats")

class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    title = Column(String)
    message = Column(String)
    type = Column(String) # 'message', 'price_drop', 'match'
    is_read = Column(Boolean, default=False)
    link = Column(String, nullable=True) # e.g. /listing/123
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="notifications")

class Report(Base):
    __tablename__ = "reports"

    id = Column(Integer, primary_key=True, index=True)
    reporter_id = Column(Integer, ForeignKey("users.id"))
    listing_id = Column(Integer, ForeignKey("car_listings.id"))
    reason = Column(String)
    details = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)

    reporter = relationship("User", back_populates="reports_made")
    listing = relationship("CarListing", back_populates="reports")
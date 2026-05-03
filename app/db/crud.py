from sqlalchemy.orm import Session
from .models import CarPrediction, User, CarListing, CarImage

def save_prediction(db: Session, data: dict):
    new_entry = CarPrediction(
        make=data["make"],
        year=data["year"],
        fuel_type=data["fuel_type"],
        mileage_km=int(data["mileage_km"]),
        engine_cc=data["engine_cc"],
        num_owners=data["num_owners"],
        registered=data["registered"],
        condition=data["condition"],
        transmission=data["transmission"],
        color=data["color"],
        city=data["city"],
        registration_city=data["registration_city"],
        predicted_price=data["predicted_price"],
        user_id=data.get("user_id")
    )

    db.add(new_entry)
    db.commit()
    db.refresh(new_entry)

    return new_entry

def get_all_predictions(db: Session):
    return db.query(CarPrediction.id,
    CarPrediction.year,
    CarPrediction.fuel_type,
    CarPrediction.mileage_km,
    CarPrediction.engine_cc,
    CarPrediction.condition,
    CarPrediction.transmission,
    CarPrediction.city,
    CarPrediction.predicted_price,
    ).all()

def create_user(db: Session, name, email, password):
    user = User(name=name, email=email, password=password)
    db.add(user)
    db.commit()
    db.refresh(user)
    return user

def get_user_by_email(db: Session, email):
    return db.query(User).filter(User.email == email).first()

def get_user_predictions(db: Session, user_id):
    return db.query(CarPrediction)\
        .filter(CarPrediction.user_id == user_id)\
        .all()    

def create_listing(db: Session, data: dict):
    car = CarListing(**data)
    db.add(car)
    db.commit()
    db.refresh(car)
    return car        

def add_car_image(db: Session, listing_id: int, image_path: str):
    new_image = CarImage(listing_id=listing_id, image_path=image_path)
    db.add(new_image)
    db.commit()
    db.refresh(new_image)
    return new_image
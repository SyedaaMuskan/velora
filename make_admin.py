import sys
from app.db.session import SessionLocal
from app.db.models import User

def make_admin(email):
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.email == email).first()
        if not user:
            print(f"Error: User with email '{email}' not found.")
            return

        user.user_type = 'Admin'
        db.commit()
        print(f"Success! {email} is now an Admin.")
        print("Please log out and log back in on the website to see the Admin Dashboard.")
    except Exception as e:
        print(f"An error occurred: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python make_admin.py <email>")
    else:
        target_email = sys.argv[1]
        make_admin(target_email)

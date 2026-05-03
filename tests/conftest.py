import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.main import app
from app.db.session import Base
from app.api.routes import analytics, users, trust, predict, notifications, listings, chat, auth
import os

# Use a local SQLite database for testing
SQLALCHEMY_DATABASE_URL = "sqlite:///./test.db"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@pytest.fixture(scope="session", autouse=True)
def setup_db():
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)
    engine.dispose()
    if os.path.exists("./test.db"):
        try:
            os.remove("./test.db")
        except PermissionError:
            pass

@pytest.fixture
def db_session():
    """Returns a direct database session for setup/verification."""
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()

@pytest.fixture
def override_get_db():
    def _override_get_db():
        db = TestingSessionLocal()
        try:
            yield db
        finally:
            db.close()
    return _override_get_db

@pytest.fixture
def client(override_get_db):
    # Apply DB overrides to all routers and the main app
    from app import main
    routers = [analytics, users, trust, predict, notifications, listings, chat, auth, main]
    for r in routers:
        app.dependency_overrides[r.get_db] = override_get_db
    
    with TestClient(app) as c:
        yield c
    
    app.dependency_overrides.clear()

@pytest.fixture
def auth_client(client):
    """Returns a client where get_auth_user always returns user_id 1."""
    def mock_get_auth_user():
        return 1
    
    # Override the dependency in users router
    app.dependency_overrides[users.get_auth_user] = mock_get_auth_user
    
    # For predict.py which calls get_current_user inside, we might need a different strategy 
    # but for now we'll mock it in specific tests or refactor it.
    
    yield client
    
    # Restore original dependency
    if users.get_auth_user in app.dependency_overrides:
        del app.dependency_overrides[users.get_auth_user]

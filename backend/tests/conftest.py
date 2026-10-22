import pytest
from datetime import date, datetime, timedelta
from app import create_app
from config import TestConfig
from app.extensions import db
from app.models.user import User
from app.models.expense import Expense
from app.models.budget import Budget
from app.models.token import EmailVerificationToken, PasswordResetToken
from app.utils.security import generate_jwt_token, hash_token, generate_secure_token

@pytest.fixture
def app():
    flask_app = create_app(TestConfig)
    with flask_app.app_context():
        db.create_all()
        yield flask_app
        db.session.remove()
        db.drop_all()


@pytest.fixture
def client(app):
    return app.test_client()

@pytest.fixture
def verified_user(app):
    with app.app_context():
        user = User(
            full_name="Alice Green",
            email="alice@example.com",
            is_verified=True
        )
        user.set_password("SecurePass123")
        db.session.add(user)
        db.session.commit()
        return db.session.get(User, user.id)

@pytest.fixture
def unverified_user(app):
    with app.app_context():
        user = User(
            full_name="Bob Blue",
            email="bob@example.com",
            is_verified=False
        )
        user.set_password("SecurePass123")
        db.session.add(user)
        db.session.commit()
        return db.session.get(User, user.id)

@pytest.fixture
def second_verified_user(app):
    with app.app_context():
        user = User(
            full_name="Charlie Red",
            email="charlie@example.com",
            is_verified=True
        )
        user.set_password("SecurePass123")
        db.session.add(user)
        db.session.commit()
        return db.session.get(User, user.id)


@pytest.fixture
def auth_headers(app, verified_user):
    with app.app_context():
        token = generate_jwt_token(verified_user.id)
        return {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        }

@pytest.fixture
def second_user_auth_headers(app, second_verified_user):
    with app.app_context():
        token = generate_jwt_token(second_verified_user.id)
        return {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        }

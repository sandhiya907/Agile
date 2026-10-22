from datetime import datetime, timedelta
from app.extensions import db
from app.models.user import User
from app.models.expense import Expense
from app.models.budget import Budget
from app.models.token import PasswordResetToken, EmailVerificationToken
from app.utils.security import hash_token, generate_jwt_token
from app.services.email_service import get_dev_email_inbox, clear_dev_email_inbox

def test_register_without_otp(client):
    clear_dev_email_inbox()
    res = client.post("/api/auth/register", json={
        "full_name": "Test User",
        "email": "test@example.com",
        "password": "Password123",
        "confirm_password": "Password123",
        "terms_accepted": True
    })
    assert res.status_code == 201
    data = res.get_json()
    assert data["success"] is True
    assert data["email"] == "test@example.com"
    # OTP is no longer sent or returned
    assert "otp" not in data

    # Check user in DB: immediately verified and ready to use
    user = User.query.filter_by(email="test@example.com").first()
    assert user is not None
    assert user.is_verified is True
    assert user.password_hash != "Password123"

def test_register_duplicate_email(client, verified_user):
    res = client.post("/api/auth/register", json={
        "full_name": "Duplicate User",
        "email": verified_user.email,
        "password": "Password123",
        "confirm_password": "Password123",
        "terms_accepted": True
    })
    assert res.status_code == 409
    assert res.get_json()["success"] is False

def test_password_hashing(verified_user):
    assert verified_user.check_password("SecurePass123") is True
    assert verified_user.check_password("WrongPassword") is False

def test_login_without_otp(client, verified_user):
    res = client.post("/api/auth/login", json={
        "email": verified_user.email,
        "password": "SecurePass123"
    })
    assert res.status_code == 200
    data = res.get_json()
    assert data["success"] is True
    assert "user" in data
    assert "access_token" in res.headers.get("Set-Cookie", "")

def test_unverified_user_can_login(client, unverified_user):
    # Existing user awaiting email verification should be able to log in without OTP
    assert unverified_user.is_verified is False
    res = client.post("/api/auth/login", json={
        "email": unverified_user.email,
        "password": "SecurePass123"
    })
    assert res.status_code == 200
    data = res.get_json()
    assert data["success"] is True
    assert "user" in data
    # User status safely upgraded to verified
    refreshed_user = db.session.get(User, unverified_user.id)
    assert refreshed_user.is_verified is True

def test_login_invalid_credentials(client, verified_user):
    res = client.post("/api/auth/login", json={
        "email": verified_user.email,
        "password": "WrongPassword999"
    })
    assert res.status_code == 401
    assert res.get_json()["success"] is False

def test_logout(client):
    res = client.post("/api/auth/logout")
    assert res.status_code == 200
    set_cookie = res.headers.get("Set-Cookie", "")
    assert "access_token=;" in set_cookie or "Expires=" in set_cookie or "Max-Age=0" in set_cookie

def test_password_reset_flow(client, verified_user):
    clear_dev_email_inbox()
    res_forgot = client.post("/api/auth/forgot-password", json={"email": verified_user.email})
    assert res_forgot.status_code == 200

    raw_token = "test_reset_token_67890"
    t_hash = hash_token(raw_token)
    known_reset = PasswordResetToken(
        user_id=verified_user.id,
        token_hash=t_hash,
        expires_at=datetime.utcnow() + timedelta(hours=2)
    )
    db.session.add(known_reset)
    db.session.commit()

    res_reset = client.post("/api/auth/reset-password", json={
        "token": raw_token,
        "password": "BrandNewPassword123",
        "confirm_password": "BrandNewPassword123"
    })
    assert res_reset.status_code == 200

    res_login = client.post("/api/auth/login", json={
        "email": verified_user.email,
        "password": "BrandNewPassword123"
    })
    assert res_login.status_code == 200

def test_delete_account_success(client, verified_user, auth_headers):
    # Add an expense and budget for verified_user
    exp = Expense(
        user_id=verified_user.id,
        title="Dinner Out",
        amount=1200.0,
        category="Food",
        expense_date=datetime.utcnow().date()
    )
    bgt = Budget(
        user_id=verified_user.id,
        month=10,
        year=2026,
        limit_amount=15000.0
    )
    db.session.add_all([exp, bgt])
    db.session.commit()

    user_id = verified_user.id
    # Ensure records exist before deletion
    assert Expense.query.filter_by(user_id=user_id).count() == 1
    assert Budget.query.filter_by(user_id=user_id).count() == 1

    # Perform account deletion with correct password and "DELETE" confirmation
    res = client.delete("/api/profile/account", json={
        "password": "SecurePass123",
        "confirmation": "DELETE"
    }, headers=auth_headers)

    assert res.status_code == 200
    data = res.get_json()
    assert data["success"] is True
    # Verify session cookie invalidation
    set_cookie = res.headers.get("Set-Cookie", "")
    assert "access_token=;" in set_cookie or "Expires=" in set_cookie or "Max-Age=0" in set_cookie

    # Ensure user and associated data are completely wiped
    assert db.session.get(User, user_id) is None
    assert Expense.query.filter_by(user_id=user_id).count() == 0
    assert Budget.query.filter_by(user_id=user_id).count() == 0

def test_delete_account_incorrect_password(client, verified_user, auth_headers):
    res = client.delete("/api/profile/account", json={
        "password": "WrongPassword999",
        "confirmation": "DELETE"
    }, headers=auth_headers)

    assert res.status_code == 401
    assert "Incorrect password" in res.get_json()["error"]
    # User remains intact
    assert db.session.get(User, verified_user.id) is not None

def test_delete_account_invalid_confirmation(client, verified_user, auth_headers):
    res = client.delete("/api/profile/account", json={
        "password": "SecurePass123",
        "confirmation": "delete"  # lowercase instead of DELETE
    }, headers=auth_headers)

    assert res.status_code == 400
    assert "mismatch" in res.get_json()["error"].lower()
    # User remains intact
    assert db.session.get(User, verified_user.id) is not None

def test_delete_account_data_isolation(client, verified_user, second_verified_user, auth_headers):
    # Create records for user 2
    exp2 = Expense(
        user_id=second_verified_user.id,
        title="Laptop Stand",
        amount=2500.0,
        category="Shopping",
        expense_date=datetime.utcnow().date()
    )
    bgt2 = Budget(
        user_id=second_verified_user.id,
        month=10,
        year=2026,
        limit_amount=20000.0
    )
    db.session.add_all([exp2, bgt2])
    db.session.commit()

    # User 1 deletes their account
    res = client.delete("/api/profile/account", json={
        "password": "SecurePass123",
        "confirmation": "DELETE"
    }, headers=auth_headers)
    assert res.status_code == 200

    # User 1 is deleted
    assert db.session.get(User, verified_user.id) is None

    # User 2 and their data MUST remain completely intact
    user2 = db.session.get(User, second_verified_user.id)
    assert user2 is not None
    assert Expense.query.filter_by(user_id=second_verified_user.id).count() == 1
    assert Budget.query.filter_by(user_id=second_verified_user.id).count() == 1

def test_delete_account_unauthenticated(client):
    res = client.delete("/api/profile/account", json={
        "password": "Password123",
        "confirmation": "DELETE"
    })
    assert res.status_code == 401

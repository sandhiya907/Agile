from datetime import datetime, timedelta
from flask import Blueprint, request, jsonify, make_response, current_app, g
from app.extensions import db
from app.models.user import User
from app.models.token import PasswordResetToken
from app.utils.security import (
    generate_secure_token,
    hash_token,
    generate_jwt_token,
)
from app.utils.validators import validate_email, validate_password
from app.services.email_service import (
    send_password_reset_email,
    is_smtp_configured
)
from app.middleware.auth_middleware import login_required

auth_bp = Blueprint("auth", __name__, url_prefix="/api/auth")

@auth_bp.route("/register", methods=["POST"])
def register():
    data = request.get_json(silent=True) or {}
    full_name = data.get("full_name", "").strip()
    email = data.get("email", "").strip().lower()
    password = data.get("password", "")
    confirm_password = data.get("confirm_password", "")
    terms = data.get("terms_accepted", False)

    # 1. Field Validations
    if not full_name:
        return jsonify({"success": False, "error": "Full name is required."}), 400

    is_valid_email, email_err = validate_email(email)
    if not is_valid_email:
        return jsonify({"success": False, "error": email_err}), 400

    is_valid_pw, pw_err = validate_password(password)
    if not is_valid_pw:
        return jsonify({"success": False, "error": pw_err}), 400

    if password != confirm_password:
        return jsonify({"success": False, "error": "Passwords do not match."}), 400

    if not terms:
        return jsonify({"success": False, "error": "You must accept the Terms and Conditions."}), 400

    # 2. Check for duplicate email
    existing_user = User.query.filter_by(email=email).first()
    if existing_user:
        return jsonify({"success": False, "error": "An account with this email address already exists."}), 409

    # 3. Create user in verified state (email OTP verification removed)
    user = User(
        full_name=full_name,
        email=email,
        is_verified=True
    )
    user.set_password(password)
    db.session.add(user)
    db.session.commit()

    return jsonify({
        "success": True,
        "message": "Registration successful! You can now log in with your email and password.",
        "email": user.email,
        "user": user.to_dict()
    }), 201


@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json(silent=True) or {}
    email = data.get("email", "").strip().lower()
    password = data.get("password", "")
    remember_me = data.get("remember_me", False)

    if not email or not password:
        return jsonify({"success": False, "error": "Email and password are required."}), 400

    user = User.query.filter_by(email=email).first()
    if not user or not user.check_password(password):
        return jsonify({"success": False, "error": "Invalid email or password."}), 401

    # Safely handle existing previously unverified users: auto-verify upon valid password
    if not user.is_verified:
        user.is_verified = True
        db.session.commit()

    # Generate token
    expires_delta = timedelta(days=7) if remember_me else timedelta(hours=24)
    jwt_token = generate_jwt_token(user.id, expires_delta=expires_delta)

    response = make_response(jsonify({
        "success": True,
        "message": "Login successful.",
        "user": user.to_dict(),
        "token": jwt_token
    }))

    # Secure HttpOnly cookie
    max_age = int(expires_delta.total_seconds())
    cookie_secure = current_app.config.get("COOKIE_SECURE", False)
    response.set_cookie(
        "access_token",
        jwt_token,
        max_age=max_age,
        httponly=True,
        samesite="Lax",
        secure=cookie_secure,
        path="/"
    )

    return response, 200


@auth_bp.route("/logout", methods=["POST"])
def logout():
    response = make_response(jsonify({
        "success": True,
        "message": "Logged out successfully."
    }))
    response.delete_cookie("access_token", path="/", samesite="Lax")
    return response, 200


@auth_bp.route("/me", methods=["GET"])
@login_required
def get_me():
    return jsonify({
        "success": True,
        "user": g.current_user.to_dict()
    }), 200


@auth_bp.route("/forgot-password", methods=["POST"])
def forgot_password():
    data = request.get_json(silent=True) or {}
    email = data.get("email", "").strip().lower()

    if not email:
        return jsonify({"success": False, "error": "Email address is required."}), 400

    user = User.query.filter_by(email=email).first()
    generic_msg = "If an account with that email exists, we have sent a password reset link."

    if not user:
        return jsonify({"success": True, "message": generic_msg}), 200

    # Rate limiting on password reset
    cooldown = 60
    cutoff = datetime.utcnow() - timedelta(seconds=cooldown)
    recent_token = PasswordResetToken.query.filter(
        PasswordResetToken.user_id == user.id,
        PasswordResetToken.created_at > cutoff
    ).first()

    if recent_token:
        return jsonify({
            "success": False,
            "error": f"Please wait {cooldown} seconds before requesting another password reset."
        }), 429

    raw_token = generate_secure_token(32)
    token_hash = hash_token(raw_token)
    expires_at = datetime.utcnow() + timedelta(hours=current_app.config.get("RESET_TOKEN_EXPIRATION_HOURS", 2))

    reset_token_rec = PasswordResetToken(
        user_id=user.id,
        token_hash=token_hash,
        expires_at=expires_at
    )
    db.session.add(reset_token_rec)
    db.session.commit()

    send_password_reset_email(user.email, user.full_name, raw_token)

    return jsonify({"success": True, "message": generic_msg}), 200


@auth_bp.route("/reset-password", methods=["POST"])
def reset_password():
    data = request.get_json(silent=True) or {}
    token = data.get("token", "").strip()
    password = data.get("password", "")
    confirm_password = data.get("confirm_password", "")

    if not token:
        return jsonify({"success": False, "error": "Reset token is required."}), 400

    is_valid_pw, pw_err = validate_password(password)
    if not is_valid_pw:
        return jsonify({"success": False, "error": pw_err}), 400

    if password != confirm_password:
        return jsonify({"success": False, "error": "Passwords do not match."}), 400

    token_hash = hash_token(token)
    token_rec = PasswordResetToken.query.filter_by(token_hash=token_hash).first()

    if not token_rec:
        return jsonify({"success": False, "error": "Invalid or expired password reset link."}), 400

    if token_rec.is_used:
        return jsonify({"success": False, "error": "This reset token has already been used."}), 400

    if token_rec.is_expired:
        return jsonify({"success": False, "error": "This reset token has expired. Please request a new one."}), 400

    user = db.session.get(User, token_rec.user_id)
    if not user:
        return jsonify({"success": False, "error": "User account not found."}), 404

    user.set_password(password)
    token_rec.mark_used()
    db.session.commit()

    return jsonify({
        "success": True,
        "message": "Password reset successfully! You can now log in with your new password."
    }), 200

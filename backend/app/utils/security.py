import secrets
import hashlib
from datetime import datetime, timedelta
import jwt
from flask import current_app

def generate_secure_token(nbytes: int = 32) -> str:
    """Generate a cryptographically secure URL-safe random string."""
    return secrets.token_urlsafe(nbytes)

def hash_token(token: str) -> str:
    """Compute SHA-256 hash of a plain token string."""
    return hashlib.sha256(token.encode("utf-8")).hexdigest()

def generate_jwt_token(user_id: int, expires_delta: timedelta = None) -> str:
    """Generate a JWT token for the authenticated user."""
    secret = current_app.config.get("JWT_SECRET_KEY")
    if not expires_delta:
        expires_delta = current_app.config.get("JWT_ACCESS_TOKEN_EXPIRES", timedelta(hours=24))
    
    payload = {
        "sub": str(user_id),
        "iat": datetime.utcnow(),
        "exp": datetime.utcnow() + expires_delta,
    }
    return jwt.encode(payload, secret, algorithm="HS256")


def decode_jwt_token(token: str) -> dict:
    """Decode and validate a JWT token."""
    secret = current_app.config.get("JWT_SECRET_KEY")
    try:
        payload = jwt.decode(token, secret, algorithms=["HS256"])
        return payload
    except jwt.ExpiredSignatureError:
        raise ValueError("Token has expired")
    except Exception as err:
        raise ValueError(f"Invalid token: {err}")


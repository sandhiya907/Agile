from functools import wraps
from flask import request, jsonify, g
from app.utils.security import decode_jwt_token
from app.models.user import User

from app.extensions import db

def get_current_user_from_request():
    """Extracts and verifies JWT from cookie or Authorization header."""
    token = request.cookies.get("access_token")
    if not token:
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            token = auth_header.split(" ", 1)[1].strip()

    if not token:
        return None

    try:
        payload = decode_jwt_token(token)
        sub_val = payload.get("sub")
        if not sub_val:
            return None
        user_id = int(sub_val)
        user = db.session.get(User, user_id)
        return user
    except Exception:
        return None




def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        user = get_current_user_from_request()
        if not user:
            return jsonify({
                "success": False,
                "error": "Authentication required. Please log in.",
                "code": "UNAUTHORIZED"
            }), 401

        if not user.is_verified:
            user.is_verified = True
            db.session.commit()

        # CSRF Protection check for state-changing requests when using cookies
        if request.method in ["POST", "PUT", "DELETE", "PATCH"]:
            # Check CSRF token or requested-with header if authenticated via cookie
            if request.cookies.get("access_token"):
                csrf_header = request.headers.get("X-Requested-With") or request.headers.get("X-CSRF-Token")
                # Browsers sending fetch with credentials can pass custom header
                if not csrf_header and request.headers.get("Sec-Fetch-Site") == "cross-site":
                    return jsonify({
                        "success": False,
                        "error": "CSRF validation failed.",
                        "code": "CSRF_FAILED"
                    }), 403

        g.current_user = user
        return f(*args, **kwargs)
    return decorated_function

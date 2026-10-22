from flask import Blueprint, request, jsonify, make_response, g
from app.extensions import db
from app.models.expense import Expense
from app.models.budget import Budget
from app.models.token import EmailVerificationToken, PasswordResetToken
from app.middleware.auth_middleware import login_required
from app.utils.validators import validate_password

profile_bp = Blueprint("profile", __name__, url_prefix="/api/profile")

@profile_bp.route("", methods=["GET"])
@login_required
def get_profile():
    user = g.current_user
    expense_count = Expense.query.filter_by(user_id=user.id).count()
    budget_count = Budget.query.filter_by(user_id=user.id).count()

    profile_data = user.to_dict()
    profile_data["expense_count"] = expense_count
    profile_data["budget_count"] = budget_count

    return jsonify({
        "success": True,
        "profile": profile_data
    }), 200


@profile_bp.route("", methods=["PUT"])
@login_required
def update_profile():
    user = g.current_user
    data = request.get_json(silent=True) or {}
    full_name = data.get("full_name", "").strip()

    if not full_name:
        return jsonify({"success": False, "error": "Full name cannot be blank."}), 400

    if len(full_name) > 120:
        return jsonify({"success": False, "error": "Full name cannot exceed 120 characters."}), 400

    user.full_name = full_name
    db.session.commit()

    return jsonify({
        "success": True,
        "message": "Profile updated successfully.",
        "profile": user.to_dict()
    }), 200


@profile_bp.route("/change-password", methods=["POST"])
@login_required
def change_password():
    user = g.current_user
    data = request.get_json(silent=True) or {}
    current_password = data.get("current_password", "")
    new_password = data.get("new_password", "")
    confirm_password = data.get("confirm_password", "")

    if not current_password:
        return jsonify({"success": False, "error": "Current password is required."}), 400

    if not user.check_password(current_password):
        return jsonify({"success": False, "error": "Current password is incorrect."}), 401

    is_valid_pw, pw_err = validate_password(new_password)
    if not is_valid_pw:
        return jsonify({"success": False, "error": pw_err}), 400

    if new_password != confirm_password:
        return jsonify({"success": False, "error": "New passwords do not match."}), 400

    if current_password == new_password:
        return jsonify({"success": False, "error": "New password cannot be the same as current password."}), 400

    user.set_password(new_password)
    db.session.commit()

    return jsonify({
        "success": True,
        "message": "Password changed successfully."
    }), 200


@profile_bp.route("/account", methods=["DELETE"])
@profile_bp.route("", methods=["DELETE"])
@login_required
def delete_account():
    user = g.current_user
    data = request.get_json(silent=True) or {}
    password = data.get("password") or data.get("current_password") or ""
    confirmation = str(data.get("confirmation", "")).strip()

    if confirmation != "DELETE":
        return jsonify({
            "success": False,
            "error": "Confirmation keyword mismatch. Please type DELETE to confirm."
        }), 400

    if not password:
        return jsonify({
            "success": False,
            "error": "Current password is required to delete your account."
        }), 400

    if not user.check_password(password):
        return jsonify({
            "success": False,
            "error": "Incorrect password. Account deletion aborted."
        }), 401

    try:
        # Explicit cascade deletion of user's own records to guarantee atomic removal across all DB engines
        Expense.query.filter_by(user_id=user.id).delete()
        Budget.query.filter_by(user_id=user.id).delete()
        EmailVerificationToken.query.filter_by(user_id=user.id).delete()
        PasswordResetToken.query.filter_by(user_id=user.id).delete()
        db.session.delete(user)
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        return jsonify({
            "success": False,
            "error": f"Failed to delete account safely: {str(e)}"
        }), 500

    # Invalidate session and HttpOnly cookie
    response = make_response(jsonify({
        "success": True,
        "message": "Your account and all associated data have been permanently deleted."
    }))
    response.delete_cookie("access_token", path="/", samesite="Lax")
    return response, 200

from datetime import date
from decimal import Decimal
from flask import Blueprint, request, jsonify, g
from sqlalchemy import func
from app.extensions import db
from app.models.budget import Budget
from app.models.expense import Expense
from app.middleware.auth_middleware import login_required
from app.utils.validators import validate_budget_data

budgets_bp = Blueprint("budgets", __name__, url_prefix="/api/budgets")

def calculate_budget_details(budget: Budget, user_id: int) -> dict:
    month = budget.month
    year = budget.year
    limit_amount = float(budget.limit_amount)

    start_date = date(year, month, 1)
    if month == 12:
        end_date = date(year + 1, 1, 1)
    else:
        end_date = date(year, month + 1, 1)

    # Calculate total spent for this user in the specified month
    total_spent_query = db.session.query(func.coalesce(func.sum(Expense.amount), 0))\
        .filter(
            Expense.user_id == user_id,
            Expense.expense_date >= start_date,
            Expense.expense_date < end_date
        ).scalar()
    
    total_spent = float(total_spent_query) if total_spent_query else 0.0
    remaining_amount = round(limit_amount - total_spent, 2)
    
    percentage_used = round((total_spent / limit_amount * 100), 1) if limit_amount > 0 else 0.0

    if percentage_used >= 100.0:
        status = "danger"
        over_by = round(total_spent - limit_amount, 2)
        alert_message = f"Budget exceeded! You have exceeded your monthly limit by ₹{over_by:,.2f}."
    elif percentage_used >= 75.0:
        status = "warning"
        alert_message = f"Warning: You have used {percentage_used}% of your budget for this month."
    else:
        status = "normal"
        alert_message = f"You are on track. ₹{remaining_amount:,.2f} remaining."

    return {
        "id": budget.id,
        "month": month,
        "year": year,
        "limit_amount": limit_amount,
        "total_spent": total_spent,
        "remaining_amount": remaining_amount,
        "percentage_used": percentage_used,
        "status": status,
        "alert_message": alert_message,
        "created_at": budget.created_at.isoformat() if budget.created_at else None,
        "updated_at": budget.updated_at.isoformat() if budget.updated_at else None,
    }

@budgets_bp.route("", methods=["GET"])
@login_required
def get_budgets():
    user_id = g.current_user.id
    month = request.args.get("month", type=int)
    year = request.args.get("year", type=int)

    query = Budget.query.filter(Budget.user_id == user_id)
    if month and year:
        budget = query.filter(Budget.month == month, Budget.year == year).first()
        if not budget:
            return jsonify({
                "success": True,
                "budget": None,
                "message": f"No budget set for {month}/{year}."
            }), 200
        return jsonify({
            "success": True,
            "budget": calculate_budget_details(budget, user_id)
        }), 200

    budgets = query.order_by(Budget.year.desc(), Budget.month.desc()).all()
    results = [calculate_budget_details(b, user_id) for b in budgets]

    return jsonify({
        "success": True,
        "budgets": results
    }), 200


@budgets_bp.route("", methods=["POST"])
@login_required
def set_budget():
    user_id = g.current_user.id
    data = request.get_json(silent=True) or {}
    is_valid, err_msg, clean_data = validate_budget_data(data)
    if not is_valid:
        return jsonify({"success": False, "error": err_msg}), 400

    month = clean_data["month"]
    year = clean_data["year"]
    limit_amount = clean_data["limit_amount"]

    # Check if budget already exists for this month/year
    existing = Budget.query.filter_by(user_id=user_id, month=month, year=year).first()
    if existing:
        # Update existing budget limit
        existing.limit_amount = limit_amount
        db.session.commit()
        return jsonify({
            "success": True,
            "message": f"Budget for {month}/{year} updated successfully.",
            "budget": calculate_budget_details(existing, user_id)
        }), 200

    new_budget = Budget(
        user_id=user_id,
        month=month,
        year=year,
        limit_amount=limit_amount
    )
    db.session.add(new_budget)
    db.session.commit()

    return jsonify({
        "success": True,
        "message": f"Budget for {month}/{year} created successfully.",
        "budget": calculate_budget_details(new_budget, user_id)
    }), 201


@budgets_bp.route("/<int:budget_id>", methods=["PUT"])
@login_required
def update_budget(budget_id):
    user_id = g.current_user.id
    budget = db.session.get(Budget, budget_id)

    if not budget or budget.user_id != user_id:
        return jsonify({"success": False, "error": "Budget record not found."}), 404

    data = request.get_json(silent=True) or {}
    amount_raw = data.get("limit_amount")
    if amount_raw is None:
        return jsonify({"success": False, "error": "Limit amount is required."}), 400
    try:
        limit_amount = Decimal(str(amount_raw))
        if limit_amount <= 0:
            return jsonify({"success": False, "error": "Limit amount must be greater than 0."}), 400
        budget.limit_amount = round(limit_amount, 2)
    except Exception:
        return jsonify({"success": False, "error": "Invalid limit amount."}), 400

    db.session.commit()

    return jsonify({
        "success": True,
        "message": "Budget updated successfully.",
        "budget": calculate_budget_details(budget, user_id)
    }), 200

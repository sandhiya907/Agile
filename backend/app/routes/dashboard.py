from datetime import date, datetime
from flask import Blueprint, request, jsonify, g
from sqlalchemy import func
from app.extensions import db
from app.models.expense import Expense
from app.models.budget import Budget
from app.middleware.auth_middleware import login_required

dashboard_bp = Blueprint("dashboard", __name__, url_prefix="/api/dashboard")

@dashboard_bp.route("/summary", methods=["GET"])
@login_required
def get_summary():
    user_id = g.current_user.id
    today = date.today()

    month = request.args.get("month", today.month, type=int)
    year = request.args.get("year", today.year, type=int)

    start_date = date(year, month, 1)
    if month == 12:
        end_date = date(year + 1, 1, 1)
    else:
        end_date = date(year, month + 1, 1)

    # Total expenses this month
    total_spent_val = db.session.query(func.coalesce(func.sum(Expense.amount), 0))\
        .filter(
            Expense.user_id == user_id,
            Expense.expense_date >= start_date,
            Expense.expense_date < end_date
        ).scalar()
    total_expenses = float(total_spent_val) if total_spent_val else 0.0

    # Monthly budget
    budget_record = Budget.query.filter_by(user_id=user_id, month=month, year=year).first()
    if budget_record:
        monthly_budget = float(budget_record.limit_amount)
        remaining_budget = round(monthly_budget - total_expenses, 2)
        budget_used_percentage = round((total_expenses / monthly_budget * 100), 1) if monthly_budget > 0 else 0.0
        if budget_used_percentage >= 100.0:
            budget_status = "danger"
        elif budget_used_percentage >= 75.0:
            budget_status = "warning"
        else:
            budget_status = "normal"
    else:
        monthly_budget = None
        remaining_budget = None
        budget_used_percentage = 0.0
        budget_status = "no_budget"

    # Recent expenses (last 5 transactions)
    recent_records = Expense.query.filter_by(user_id=user_id)\
        .order_by(Expense.expense_date.desc(), Expense.id.desc())\
        .limit(5)\
        .all()
    recent_expenses = [exp.to_dict() for exp in recent_records]

    # Category breakdown for this month
    category_rows = db.session.query(
        Expense.category,
        func.sum(Expense.amount).label("cat_total"),
        func.count(Expense.id).label("cat_count")
    ).filter(
        Expense.user_id == user_id,
        Expense.expense_date >= start_date,
        Expense.expense_date < end_date
    ).group_by(Expense.category)\
     .order_by(func.sum(Expense.amount).desc())\
     .all()

    category_summary = [
        {
            "category": row[0],
            "total": float(row[1]),
            "count": int(row[2]),
            "percentage": round((float(row[1]) / total_expenses * 100), 1) if total_expenses > 0 else 0.0
        }
        for row in category_rows
    ]

    return jsonify({
        "success": True,
        "month": month,
        "year": year,
        "total_expenses_month": total_expenses,
        "monthly_budget": monthly_budget,
        "remaining_budget": remaining_budget,
        "budget_used_percentage": budget_used_percentage,
        "budget_status": budget_status,
        "recent_expenses": recent_expenses,
        "category_summary": category_summary
    }), 200

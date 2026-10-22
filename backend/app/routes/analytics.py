from datetime import date, datetime
from flask import Blueprint, request, jsonify, g
from sqlalchemy import func, extract
from app.extensions import db
from app.models.expense import Expense
from app.middleware.auth_middleware import login_required

analytics_bp = Blueprint("analytics", __name__, url_prefix="/api/analytics")

@analytics_bp.route("/categories", methods=["GET"])
@login_required
def get_category_analytics():
    user_id = g.current_user.id
    month = request.args.get("month", type=int)
    year = request.args.get("year", type=int)

    query = db.session.query(
        Expense.category,
        func.sum(Expense.amount).label("total_amount"),
        func.count(Expense.id).label("count")
    ).filter(Expense.user_id == user_id)

    if month and year:
        start_date = date(year, month, 1)
        if month == 12:
            end_date = date(year + 1, 1, 1)
        else:
            end_date = date(year, month + 1, 1)
        query = query.filter(Expense.expense_date >= start_date, Expense.expense_date < end_date)
    elif year:
        query = query.filter(extract("year", Expense.expense_date) == year)

    rows = query.group_by(Expense.category).order_by(func.sum(Expense.amount).desc()).all()

    total_sum = sum(float(r[1]) for r in rows) if rows else 0.0

    categories = []
    highest_category = None
    for r in rows:
        cat_total = float(r[1])
        percentage = round((cat_total / total_sum * 100), 1) if total_sum > 0 else 0.0
        cat_data = {
            "category": r[0],
            "total": cat_total,
            "count": int(r[2]),
            "percentage": percentage
        }
        categories.append(cat_data)
        if highest_category is None:
            highest_category = cat_data

    return jsonify({
        "success": True,
        "total_amount": total_sum,
        "highest_category": highest_category,
        "categories": categories
    }), 200


@analytics_bp.route("/monthly-trends", methods=["GET"])
@login_required
def get_monthly_trends():
    user_id = g.current_user.id
    today = date.today()
    year = request.args.get("year", today.year, type=int)

    # Query all expenses for user in this year
    monthly_rows = db.session.query(
        extract("month", Expense.expense_date).label("month_num"),
        func.sum(Expense.amount).label("month_total"),
        func.count(Expense.id).label("month_count")
    ).filter(
        Expense.user_id == user_id,
        extract("year", Expense.expense_date) == year
    ).group_by(extract("month", Expense.expense_date)).all()

    month_names = [
        "Jan", "Feb", "Mar", "Apr", "May", "Jun",
        "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
    ]

    totals_by_month = {int(r[0]): (float(r[1]), int(r[2])) for r in monthly_rows}

    trends = []
    for m in range(1, 13):
        spent, count = totals_by_month.get(m, (0.0, 0))
        trends.append({
            "month_number": m,
            "month": month_names[m - 1],
            "spending": spent,
            "transaction_count": count
        })

    # Compare current month with previous month
    curr_month = today.month
    prev_month = 12 if curr_month == 1 else curr_month - 1
    prev_year = year - 1 if curr_month == 1 else year

    curr_spent = totals_by_month.get(curr_month, (0.0, 0))[0]

    if prev_year == year:
        prev_spent = totals_by_month.get(prev_month, (0.0, 0))[0]
    else:
        # Fetch previous month spent from previous year
        prev_val = db.session.query(func.coalesce(func.sum(Expense.amount), 0))\
            .filter(
                Expense.user_id == user_id,
                extract("year", Expense.expense_date) == prev_year,
                extract("month", Expense.expense_date) == prev_month
            ).scalar()
        prev_spent = float(prev_val) if prev_val else 0.0

    difference = round(curr_spent - prev_spent, 2)
    if prev_spent > 0:
        percent_change = round(((curr_spent - prev_spent) / prev_spent * 100), 1)
    else:
        percent_change = 100.0 if curr_spent > 0 else 0.0

    comparison = {
        "current_month_spending": curr_spent,
        "previous_month_spending": prev_spent,
        "difference": difference,
        "percent_change": percent_change,
        "increased": difference > 0,
    }

    return jsonify({
        "success": True,
        "year": year,
        "trends": trends,
        "comparison": comparison
    }), 200

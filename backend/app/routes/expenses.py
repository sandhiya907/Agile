from datetime import datetime, date
from decimal import Decimal
from flask import Blueprint, request, jsonify, g
from sqlalchemy import func
from app.extensions import db
from app.models.expense import Expense, VALID_CATEGORIES
from app.middleware.auth_middleware import login_required
from app.utils.validators import validate_expense_data

expenses_bp = Blueprint("expenses", __name__, url_prefix="/api/expenses")

@expenses_bp.route("", methods=["GET"])
@login_required
def get_expenses():
    user_id = g.current_user.id
    query = Expense.query.filter(Expense.user_id == user_id)

    # Search filter
    search = request.args.get("search", "").strip()
    if search:
        query = query.filter(
            (Expense.title.ilike(f"%{search}%")) | 
            (Expense.notes.ilike(f"%{search}%"))
        )

    # Category filter
    category = request.args.get("category", "").strip()
    if category and category in VALID_CATEGORIES:
        query = query.filter(Expense.category == category)

    # Month and Year filter
    month = request.args.get("month", type=int)
    year = request.args.get("year", type=int)
    if month and year:
        # Filter expenses in this specific month & year
        start_date = date(year, month, 1)
        if month == 12:
            end_date = date(year + 1, 1, 1)
        else:
            end_date = date(year, month + 1, 1)
        query = query.filter(Expense.expense_date >= start_date, Expense.expense_date < end_date)
    elif year:
        query = query.filter(Expense.expense_date >= date(year, 1, 1), Expense.expense_date <= date(year, 12, 31))

    # Explicit Date range filter
    start_date_str = request.args.get("start_date")
    end_date_str = request.args.get("end_date")
    if start_date_str:
        try:
            s_date = datetime.strptime(start_date_str, "%Y-%m-%d").date()
            query = query.filter(Expense.expense_date >= s_date)
        except ValueError:
            pass

    if end_date_str:
        try:
            e_date = datetime.strptime(end_date_str, "%Y-%m-%d").date()
            query = query.filter(Expense.expense_date <= e_date)
        except ValueError:
            pass

    # Calculate filtered total amount
    total_amount = db.session.query(func.coalesce(func.sum(Expense.amount), 0))\
        .filter(Expense.id.in_(query.with_entities(Expense.id))).scalar()
    total_amount_float = float(total_amount) if total_amount else 0.0

    # Sorting
    sort_by = request.args.get("sort_by", "date").lower()
    order = request.args.get("order", "desc").lower()

    if sort_by == "amount":
        sort_column = Expense.amount
    else:
        sort_column = Expense.expense_date

    if order == "asc":
        query = query.order_by(sort_column.asc(), Expense.id.asc())
    else:
        query = query.order_by(sort_column.desc(), Expense.id.desc())

    # Pagination
    page = request.args.get("page", 1, type=int)
    per_page = request.args.get("per_page", 20, type=int)
    if page < 1:
        page = 1
    if per_page < 1 or per_page > 100:
        per_page = 20

    paginated = query.paginate(page=page, per_page=per_page, error_out=False)

    return jsonify({
        "success": True,
        "expenses": [exp.to_dict() for exp in paginated.items],
        "total_count": paginated.total,
        "total_amount": total_amount_float,
        "page": paginated.page,
        "per_page": paginated.per_page,
        "total_pages": paginated.pages or 1,
        "has_next": paginated.has_next,
        "has_prev": paginated.has_prev
    }), 200


@expenses_bp.route("", methods=["POST"])
@login_required
def create_expense():
    data = request.get_json(silent=True) or {}
    is_valid, err_msg, clean_data = validate_expense_data(data)
    if not is_valid:
        return jsonify({"success": False, "error": err_msg}), 400

    expense = Expense(
        user_id=g.current_user.id,
        title=clean_data["title"],
        amount=clean_data["amount"],
        category=clean_data["category"],
        expense_date=clean_data["expense_date"],
        notes=clean_data["notes"]
    )
    db.session.add(expense)
    db.session.commit()

    return jsonify({
        "success": True,
        "message": "Expense added successfully.",
        "expense": expense.to_dict()
    }), 201


@expenses_bp.route("/<int:expense_id>", methods=["GET"])
@login_required
def get_expense(expense_id):
    expense = db.session.get(Expense, expense_id)
    if not expense or expense.user_id != g.current_user.id:
        return jsonify({"success": False, "error": "Expense record not found."}), 404

    return jsonify({
        "success": True,
        "expense": expense.to_dict()
    }), 200


@expenses_bp.route("/<int:expense_id>", methods=["PUT"])
@login_required
def update_expense(expense_id):
    expense = db.session.get(Expense, expense_id)
    if not expense or expense.user_id != g.current_user.id:
        return jsonify({"success": False, "error": "Expense record not found."}), 404

    data = request.get_json(silent=True) or {}
    is_valid, err_msg, clean_data = validate_expense_data(data)
    if not is_valid:
        return jsonify({"success": False, "error": err_msg}), 400

    expense.title = clean_data["title"]
    expense.amount = clean_data["amount"]
    expense.category = clean_data["category"]
    expense.expense_date = clean_data["expense_date"]
    expense.notes = clean_data["notes"]
    db.session.commit()

    return jsonify({
        "success": True,
        "message": "Expense updated successfully.",
        "expense": expense.to_dict()
    }), 200


@expenses_bp.route("/<int:expense_id>", methods=["DELETE"])
@login_required
def delete_expense(expense_id):
    expense = db.session.get(Expense, expense_id)
    if not expense or expense.user_id != g.current_user.id:
        return jsonify({"success": False, "error": "Expense record not found."}), 404

    db.session.delete(expense)
    db.session.commit()

    return jsonify({
        "success": True,
        "message": "Expense deleted successfully."
    }), 200
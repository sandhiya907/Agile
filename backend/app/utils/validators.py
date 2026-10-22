import re
from datetime import datetime, date
from decimal import Decimal, InvalidOperation
from app.models.expense import VALID_CATEGORIES

EMAIL_REGEX = re.compile(r"^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$")

def validate_email(email: str) -> tuple[bool, str]:
    if not email or not isinstance(email, str):
        return False, "Email address is required."
    email = email.strip()
    if len(email) > 255:
        return False, "Email address is too long."
    if not EMAIL_REGEX.match(email):
        return False, "Please provide a valid email address."
    return True, ""

def validate_password(password: str) -> tuple[bool, str]:
    if not password or not isinstance(password, str):
        return False, "Password is required."
    if len(password) < 8:
        return False, "Password must be at least 8 characters long."
    if not re.search(r"[A-Za-z]", password):
        return False, "Password must contain at least one letter."
    if not re.search(r"\d", password):
        return False, "Password must contain at least one number."
    return True, ""

def validate_expense_data(data: dict) -> tuple[bool, str, dict]:
    if not isinstance(data, dict):
        return False, "Invalid request payload.", {}
    
    title = data.get("title", "")
    if not isinstance(title, str) or not title.strip():
        return False, "Expense title is required.", {}
    title = title.strip()
    if len(title) > 150:
        return False, "Expense title cannot exceed 150 characters.", {}

    amount_raw = data.get("amount")
    if amount_raw is None:
        return False, "Expense amount is required.", {}
    try:
        amount = Decimal(str(amount_raw))
        if amount <= 0:
            return False, "Amount must be a positive number greater than 0.", {}
        # Round to 2 decimal places
        amount = round(amount, 2)
    except (InvalidOperation, ValueError, TypeError):
        return False, "Amount must be a valid numeric value.", {}

    category = data.get("category", "")
    if not isinstance(category, str) or category.strip() not in VALID_CATEGORIES:
        return False, f"Category must be one of: {', '.join(VALID_CATEGORIES)}", {}
    category = category.strip()

    date_raw = data.get("expense_date")
    if not date_raw:
        return False, "Expense date is required.", {}
    try:
        if isinstance(date_raw, str):
            expense_date = datetime.strptime(date_raw, "%Y-%m-%d").date()
        elif isinstance(date_raw, (date, datetime)):
            expense_date = date_raw if isinstance(date_raw, date) else date_raw.date()
        else:
            return False, "Invalid date format. Expected YYYY-MM-DD.", {}
    except ValueError:
        return False, "Invalid date format. Expected YYYY-MM-DD.", {}

    notes = data.get("notes", "")
    if notes and isinstance(notes, str):
        notes = notes.strip()
    else:
        notes = ""

    return True, "", {
        "title": title,
        "amount": amount,
        "category": category,
        "expense_date": expense_date,
        "notes": notes,
    }

def validate_budget_data(data: dict) -> tuple[bool, str, dict]:
    if not isinstance(data, dict):
        return False, "Invalid request payload.", {}

    try:
        month = int(data.get("month", 0))
        if month < 1 or month > 12:
            return False, "Month must be an integer between 1 and 12.", {}
    except (ValueError, TypeError):
        return False, "Month must be an integer between 1 and 12.", {}

    try:
        year = int(data.get("year", 0))
        if year < 2000 or year > 2100:
            return False, "Year must be between 2000 and 2100.", {}
    except (ValueError, TypeError):
        return False, "Year must be between 2000 and 2100.", {}

    amount_raw = data.get("limit_amount")
    if amount_raw is None:
        return False, "Budget limit amount is required.", {}
    try:
        limit_amount = Decimal(str(amount_raw))
        if limit_amount <= 0:
            return False, "Budget limit must be greater than 0.", {}
        limit_amount = round(limit_amount, 2)
    except (InvalidOperation, ValueError, TypeError):
        return False, "Limit amount must be a valid numeric value.", {}

    return True, "", {
        "month": month,
        "year": year,
        "limit_amount": limit_amount,
    }

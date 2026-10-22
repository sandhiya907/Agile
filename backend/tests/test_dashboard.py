from datetime import date
from app.extensions import db
from app.models.expense import Expense
from app.models.budget import Budget

def test_dashboard_summary(client, auth_headers, verified_user):
    # Set budget
    budget = Budget(user_id=verified_user.id, month=10, year=2026, limit_amount=5000.0)
    # Add expenses
    exp1 = Expense(user_id=verified_user.id, title="Dinner", amount=1200.0, category="Food", expense_date=date(2026, 10, 10))
    exp2 = Expense(user_id=verified_user.id, title="Metro", amount=300.0, category="Transport", expense_date=date(2026, 10, 12))
    db.session.add_all([budget, exp1, exp2])
    db.session.commit()

    res = client.get("/api/dashboard/summary?month=10&year=2026", headers=auth_headers)
    assert res.status_code == 200
    data = res.get_json()
    assert data["total_expenses_month"] == 1500.0
    assert data["monthly_budget"] == 5000.0
    assert data["remaining_budget"] == 3500.0
    assert data["budget_used_percentage"] == 30.0
    assert len(data["recent_expenses"]) == 2
    assert len(data["category_summary"]) == 2

def test_empty_dashboard(client, auth_headers):
    res = client.get("/api/dashboard/summary?month=10&year=2026", headers=auth_headers)
    assert res.status_code == 200
    data = res.get_json()
    assert data["total_expenses_month"] == 0.0
    assert data["monthly_budget"] is None
    assert len(data["recent_expenses"]) == 0

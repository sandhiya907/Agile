from datetime import date
from app.extensions import db
from app.models.budget import Budget
from app.models.expense import Expense

def test_set_and_get_budget(client, auth_headers, verified_user):
    res = client.post("/api/budgets", json={
        "month": 10,
        "year": 2026,
        "limit_amount": 10000.00
    }, headers=auth_headers)
    assert res.status_code == 201
    data = res.get_json()
    assert data["success"] is True
    assert data["budget"]["limit_amount"] == 10000.0
    assert data["budget"]["month"] == 10
    assert data["budget"]["year"] == 2026

    # Get budget
    res_get = client.get("/api/budgets?month=10&year=2026", headers=auth_headers)
    assert res_get.status_code == 200
    assert res_get.get_json()["budget"]["limit_amount"] == 10000.0

def test_budget_calculations_and_alerts(client, auth_headers, verified_user):
    # Set budget of 1000 for month 10, 2026
    client.post("/api/budgets", json={
        "month": 10,
        "year": 2026,
        "limit_amount": 1000.00
    }, headers=auth_headers)

    # 1. Normal state: add expense of 500 (50% used)
    exp1 = Expense(user_id=verified_user.id, title="Item 1", amount=500.0, category="Bills", expense_date=date(2026, 10, 5))
    db.session.add(exp1)
    db.session.commit()

    res1 = client.get("/api/budgets?month=10&year=2026", headers=auth_headers)
    b1 = res1.get_json()["budget"]
    assert b1["total_spent"] == 500.0
    assert b1["remaining_amount"] == 500.0
    assert b1["percentage_used"] == 50.0
    assert b1["status"] == "normal"

    # 2. Warning state: add expense of 300 (total 800 -> 80% used >= 75%)
    exp2 = Expense(user_id=verified_user.id, title="Item 2", amount=300.0, category="Bills", expense_date=date(2026, 10, 6))
    db.session.add(exp2)
    db.session.commit()

    res2 = client.get("/api/budgets?month=10&year=2026", headers=auth_headers)
    b2 = res2.get_json()["budget"]
    assert b2["total_spent"] == 800.0
    assert b2["remaining_amount"] == 200.0
    assert b2["percentage_used"] == 80.0
    assert b2["status"] == "warning"

    # 3. Danger / Exceeded state: add expense of 300 (total 1100 -> 110% used >= 100%)
    exp3 = Expense(user_id=verified_user.id, title="Item 3", amount=300.0, category="Bills", expense_date=date(2026, 10, 7))
    db.session.add(exp3)
    db.session.commit()

    res3 = client.get("/api/budgets?month=10&year=2026", headers=auth_headers)
    b3 = res3.get_json()["budget"]
    assert b3["total_spent"] == 1100.0
    assert b3["remaining_amount"] == -100.0
    assert b3["percentage_used"] == 110.0
    assert b3["status"] == "danger"
    assert "exceeded" in b3["alert_message"].lower()

def test_prevent_duplicate_budget_updates_existing(client, auth_headers, verified_user):
    # First post creates
    client.post("/api/budgets", json={"month": 5, "year": 2026, "limit_amount": 5000.0}, headers=auth_headers)
    # Second post updates existing instead of creating duplicate
    res = client.post("/api/budgets", json={"month": 5, "year": 2026, "limit_amount": 8000.0}, headers=auth_headers)
    assert res.status_code == 200
    assert res.get_json()["budget"]["limit_amount"] == 8000.0

    # Ensure only 1 record exists
    count = Budget.query.filter_by(user_id=verified_user.id, month=5, year=2026).count()
    assert count == 1

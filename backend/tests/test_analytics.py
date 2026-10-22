from datetime import date
from app.extensions import db
from app.models.expense import Expense

def test_category_analytics(client, auth_headers, verified_user):
    exp1 = Expense(user_id=verified_user.id, title="Dinner", amount=1000.0, category="Food", expense_date=date(2026, 10, 10))
    exp2 = Expense(user_id=verified_user.id, title="Groceries", amount=500.0, category="Food", expense_date=date(2026, 10, 12))
    exp3 = Expense(user_id=verified_user.id, title="Train", amount=500.0, category="Transport", expense_date=date(2026, 10, 14))
    db.session.add_all([exp1, exp2, exp3])
    db.session.commit()

    res = client.get("/api/analytics/categories?month=10&year=2026", headers=auth_headers)
    assert res.status_code == 200
    data = res.get_json()
    assert data["total_amount"] == 2000.0
    assert data["highest_category"]["category"] == "Food"
    assert data["highest_category"]["total"] == 1500.0
    assert len(data["categories"]) == 2

def test_monthly_trends_analytics(client, auth_headers, verified_user):
    exp1 = Expense(user_id=verified_user.id, title="Sept Bill", amount=1500.0, category="Bills", expense_date=date(2026, 9, 10))
    exp2 = Expense(user_id=verified_user.id, title="Oct Bill", amount=2500.0, category="Bills", expense_date=date(2026, 10, 10))
    db.session.add_all([exp1, exp2])
    db.session.commit()

    res = client.get("/api/analytics/monthly-trends?year=2026", headers=auth_headers)
    assert res.status_code == 200
    data = res.get_json()
    assert len(data["trends"]) == 12
    # September is month 9
    assert data["trends"][8]["spending"] == 1500.0
    # October is month 10
    assert data["trends"][9]["spending"] == 2500.0

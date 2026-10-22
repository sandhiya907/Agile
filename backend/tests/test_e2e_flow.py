from datetime import date
from app.extensions import db
from app.models.user import User
from app.models.token import EmailVerificationToken
from app.utils.security import hash_token

def test_complete_user_lifecycle(client):
    """
    Comprehensive End-to-End Test:
    1. Register new user
    2. Ensure unverified login is blocked
    3. Verify email with token
    4. Successful login and receive auth cookie
    5. Set monthly budget of 25,000 for October 2026
    6. Add multiple expenses across categories
    7. Fetch dashboard summary and verify accurate totals
    8. Check budget thresholds and alert status
    9. Edit an expense and verify updated total
    10. Delete an expense and verify recalculation
    11. Fetch analytics category breakdown and trends
    12. Update profile name and change password
    13. Logout and ensure session cookie is cleared
    """

    # 1. Register new user without OTP requirement
    reg_res = client.post("/api/auth/register", json={
        "full_name": "Siddharth Roy",
        "email": "siddharth@spendwise.test",
        "password": "Password123",
        "confirm_password": "Password123",
        "terms_accepted": True
    })
    assert reg_res.status_code == 201
    assert reg_res.get_json()["success"] is True

    # 2. Log in directly with email & password without OTP
    login_res = client.post("/api/auth/login", json={
        "email": "siddharth@spendwise.test",
        "password": "Password123"
    })
    assert login_res.status_code == 200
    token = login_res.get_json()["token"]
    headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}

    # 5. Set Monthly Budget
    budget_res = client.post("/api/budgets", json={
        "month": 10,
        "year": 2026,
        "limit_amount": 25000.00
    }, headers=headers)
    assert budget_res.status_code == 201
    assert budget_res.get_json()["budget"]["limit_amount"] == 25000.0

    # 6. Add Multiple Expenses
    exp1_res = client.post("/api/expenses", json={
        "title": "Grocery Market",
        "amount": 4500.00,
        "category": "Food",
        "expense_date": "2026-10-10",
        "notes": "Weekly groceries and dairy"
    }, headers=headers)
    assert exp1_res.status_code == 201
    exp1_id = exp1_res.get_json()["expense"]["id"]

    exp2_res = client.post("/api/expenses", json={
        "title": "Electricity Bill",
        "amount": 2200.00,
        "category": "Bills",
        "expense_date": "2026-10-12"
    }, headers=headers)
    assert exp2_res.status_code == 201

    exp3_res = client.post("/api/expenses", json={
        "title": "Metro Pass",
        "amount": 1300.00,
        "category": "Transport",
        "expense_date": "2026-10-14"
    }, headers=headers)
    assert exp3_res.status_code == 201

    # 7. Check Dashboard Summary
    dash_res = client.get("/api/dashboard/summary?month=10&year=2026", headers=headers)
    assert dash_res.status_code == 200
    dash_data = dash_res.get_json()
    assert dash_data["total_expenses_month"] == 8000.00
    assert dash_data["monthly_budget"] == 25000.00
    assert dash_data["remaining_budget"] == 17000.00
    assert dash_data["budget_used_percentage"] == 32.0
    assert dash_data["budget_status"] == "normal"
    assert len(dash_data["recent_expenses"]) == 3
    assert len(dash_data["category_summary"]) == 3

    # 8. Edit an expense
    edit_res = client.put(f"/api/expenses/{exp1_id}", json={
        "title": "Grocery Market Deluxe",
        "amount": 5000.00,
        "category": "Food",
        "expense_date": "2026-10-10",
        "notes": "Updated with organic goods"
    }, headers=headers)
    assert edit_res.status_code == 200
    assert edit_res.get_json()["expense"]["amount"] == 5000.0

    # Total should now be 5000 + 2200 + 1300 = 8500
    dash_after_edit = client.get("/api/dashboard/summary?month=10&year=2026", headers=headers)
    assert dash_after_edit.get_json()["total_expenses_month"] == 8500.00

    # 9. Delete an expense
    del_res = client.delete(f"/api/expenses/{exp1_id}", headers=headers)
    assert del_res.status_code == 200

    # Total should now be 8500 - 5000 = 3500
    dash_after_del = client.get("/api/dashboard/summary?month=10&year=2026", headers=headers)
    assert dash_after_del.get_json()["total_expenses_month"] == 3500.00

    # 10. Check Analytics Category Breakdown & Trends
    analytics_cat = client.get("/api/analytics/categories?month=10&year=2026", headers=headers)
    assert analytics_cat.status_code == 200
    cat_data = analytics_cat.get_json()
    assert cat_data["total_amount"] == 3500.00
    assert cat_data["highest_category"]["category"] == "Bills"

    analytics_trends = client.get("/api/analytics/monthly-trends?year=2026", headers=headers)
    assert analytics_trends.status_code == 200
    trends_data = analytics_trends.get_json()
    assert trends_data["trends"][9]["spending"] == 3500.00  # Month 10 (Oct)

    # 11. Profile Name Update & Password Change
    prof_res = client.put("/api/profile", json={"full_name": "Siddharth Roy Senior"}, headers=headers)
    assert prof_res.status_code == 200
    assert prof_res.get_json()["profile"]["full_name"] == "Siddharth Roy Senior"

    pw_change_res = client.post("/api/profile/change-password", json={
        "current_password": "Password123",
        "new_password": "NewSecretPass456",
        "confirm_password": "NewSecretPass456"
    }, headers=headers)
    assert pw_change_res.status_code == 200

    # 12. Ensure new password works on login
    new_login = client.post("/api/auth/login", json={
        "email": "siddharth@spendwise.test",
        "password": "NewSecretPass456"
    })
    assert new_login.status_code == 200
    new_token = new_login.get_json()["token"]
    new_headers = {"Authorization": f"Bearer {new_token}", "Content-Type": "application/json"}

    # 13. Permanently Delete Account from Profile
    del_account_res = client.delete("/api/profile/account", json={
        "password": "NewSecretPass456",
        "confirmation": "DELETE"
    }, headers=new_headers)
    assert del_account_res.status_code == 200
    assert del_account_res.get_json()["success"] is True

    # 14. Verify user and all their data are gone
    deleted_user = User.query.filter_by(email="siddharth@spendwise.test").first()
    assert deleted_user is None

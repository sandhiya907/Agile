from datetime import date
from app.extensions import db
from app.models.expense import Expense

def test_create_expense(client, auth_headers):
    res = client.post("/api/expenses", json={
        "title": "Grocery Shopping",
        "amount": 1500.50,
        "category": "Food",
        "expense_date": "2026-10-15",
        "notes": "Fruits, vegetables and milk"
    }, headers=auth_headers)
    assert res.status_code == 201
    data = res.get_json()
    assert data["success"] is True
    assert data["expense"]["title"] == "Grocery Shopping"
    assert data["expense"]["amount"] == 1500.50
    assert data["expense"]["category"] == "Food"

def test_create_expense_validation(client, auth_headers):
    # Invalid amount (negative)
    res = client.post("/api/expenses", json={
        "title": "Invalid Negative",
        "amount": -50,
        "category": "Food",
        "expense_date": "2026-10-15"
    }, headers=auth_headers)
    assert res.status_code == 400

    # Invalid category
    res_cat = client.post("/api/expenses", json={
        "title": "Invalid Category",
        "amount": 100,
        "category": "NotACategory",
        "expense_date": "2026-10-15"
    }, headers=auth_headers)
    assert res_cat.status_code == 400

def test_get_expenses_list(client, auth_headers, verified_user):
    # Add two expenses
    exp1 = Expense(user_id=verified_user.id, title="Coffee", amount=120.0, category="Food", expense_date=date(2026, 10, 10))
    exp2 = Expense(user_id=verified_user.id, title="Bus Fare", amount=50.0, category="Transport", expense_date=date(2026, 10, 11))
    db.session.add_all([exp1, exp2])
    db.session.commit()

    res = client.get("/api/expenses", headers=auth_headers)
    assert res.status_code == 200
    data = res.get_json()
    assert data["total_count"] == 2
    assert data["total_amount"] == 170.0
    assert len(data["expenses"]) == 2

def test_filter_and_search_expenses(client, auth_headers, verified_user):
    exp1 = Expense(user_id=verified_user.id, title="Pizza Party", amount=500.0, category="Food", expense_date=date(2026, 10, 10))
    exp2 = Expense(user_id=verified_user.id, title="Taxi Ride", amount=250.0, category="Transport", expense_date=date(2026, 10, 11))
    db.session.add_all([exp1, exp2])
    db.session.commit()

    # Filter by category Food
    res_food = client.get("/api/expenses?category=Food", headers=auth_headers)
    assert res_food.status_code == 200
    assert res_food.get_json()["total_count"] == 1
    assert res_food.get_json()["expenses"][0]["title"] == "Pizza Party"

    # Search by text Taxi
    res_taxi = client.get("/api/expenses?search=Taxi", headers=auth_headers)
    assert res_taxi.status_code == 200
    assert res_taxi.get_json()["total_count"] == 1
    assert res_taxi.get_json()["expenses"][0]["title"] == "Taxi Ride"

def test_edit_expense(client, auth_headers, verified_user):
    exp = Expense(user_id=verified_user.id, title="Book", amount=300.0, category="Education", expense_date=date(2026, 10, 5))
    db.session.add(exp)
    db.session.commit()

    res = client.put(f"/api/expenses/{exp.id}", json={
        "title": "Advanced Python Book",
        "amount": 450.0,
        "category": "Education",
        "expense_date": "2026-10-06",
        "notes": "Updated edition"
    }, headers=auth_headers)
    assert res.status_code == 200
    data = res.get_json()
    assert data["expense"]["title"] == "Advanced Python Book"
    assert data["expense"]["amount"] == 450.0

def test_delete_expense(client, auth_headers, verified_user):
    exp = Expense(user_id=verified_user.id, title="Movie Ticket", amount=200.0, category="Entertainment", expense_date=date(2026, 10, 8))
    db.session.add(exp)
    db.session.commit()

    res = client.delete(f"/api/expenses/{exp.id}", headers=auth_headers)
    assert res.status_code == 200

    # Ensure deleted
    check = Expense.query.get(exp.id)
    assert check is None

def test_cross_user_isolation(client, auth_headers, second_user_auth_headers, verified_user):
    # Expense belongs to verified_user
    exp = Expense(user_id=verified_user.id, title="Secret Expense", amount=999.0, category="Others", expense_date=date(2026, 10, 1))
    db.session.add(exp)
    db.session.commit()

    # Second user tries to GET it
    res_get = client.get(f"/api/expenses/{exp.id}", headers=second_user_auth_headers)
    assert res_get.status_code == 404

    # Second user tries to PUT it
    res_put = client.put(f"/api/expenses/{exp.id}", json={
        "title": "Hacked",
        "amount": 1.0,
        "category": "Others",
        "expense_date": "2026-10-01"
    }, headers=second_user_auth_headers)
    assert res_put.status_code == 404

    # Second user tries to DELETE it
    res_del = client.delete(f"/api/expenses/{exp.id}", headers=second_user_auth_headers)
    assert res_del.status_code == 404

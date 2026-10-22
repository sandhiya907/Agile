from app.routes.auth import auth_bp
from app.routes.expenses import expenses_bp
from app.routes.budgets import budgets_bp
from app.routes.dashboard import dashboard_bp
from app.routes.analytics import analytics_bp
from app.routes.profile import profile_bp

__all__ = [
    "auth_bp",
    "expenses_bp",
    "budgets_bp",
    "dashboard_bp",
    "analytics_bp",
    "profile_bp"
]

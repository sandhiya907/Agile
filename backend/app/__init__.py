import os
import logging
from flask import Flask, jsonify
from sqlalchemy import create_engine, text
from config import Config
from app.extensions import db, migrate, cors

def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)

    # Configure logging
    logging.basicConfig(
        level=logging.INFO,
        format="[%(asctime)s] %(levelname)s in %(module)s: %(message)s"
    )
    logger = app.logger

    # Database connection test & graceful fallback
    db_uri = app.config.get("SQLALCHEMY_DATABASE_URI", "")
    if db_uri.startswith("mysql") or db_uri.startswith("postgresql"):
        try:
            # Test database connection with 10s timeout
            connect_args = {"connect_timeout": 10} if db_uri.startswith("mysql") else {}
            test_engine = create_engine(db_uri, connect_args=connect_args)
            with test_engine.connect() as conn:
                conn.execute(text("SELECT 1;"))
            logger.info("Successfully connected to database.")
        except Exception as e:
            if os.getenv("FLASK_ENV") == "production":
                logger.error(f"Critical: Failed to connect to production database: {e}")
                raise
            logger.warning(
                f"\n{'='*70}\n"
                f"[SPENDWISE NOTICE] Could not connect to MySQL server with DATABASE_URL:\n"
                f"  {db_uri}\n"
                f"  Reason: {e}\n"
                f"--> Falling back to local SQLite database: 'sqlite:///spendwise.db'\n"
                f"--> To use MySQL, verify your credentials in backend/.env.\n"
                f"{'='*70}\n"
            )
            app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///spendwise.db"

    # Initialize extensions
    db.init_app(app)
    migrate.init_app(app, db)
    
    # Configure CORS for frontend access with credentials
    raw_frontend = app.config.get("FRONTEND_URL", "http://localhost:5173")
    origins = [u.strip().rstrip("/") for u in str(raw_frontend).split(",") if u.strip()]
    for fallback_origin in ["http://localhost:5173", "http://127.0.0.1:5173"]:
        if fallback_origin not in origins:
            origins.append(fallback_origin)

    cors.init_app(
        app,
        origins=origins,
        supports_credentials=True,
        allow_headers=["Content-Type", "Authorization", "X-Requested-With", "X-CSRF-Token"],
        methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"]
    )

    # Register blueprints
    from app.routes.auth import auth_bp
    from app.routes.expenses import expenses_bp
    from app.routes.budgets import budgets_bp
    from app.routes.dashboard import dashboard_bp
    from app.routes.analytics import analytics_bp
    from app.routes.profile import profile_bp

    app.register_blueprint(auth_bp)
    app.register_blueprint(expenses_bp)
    app.register_blueprint(budgets_bp)
    app.register_blueprint(dashboard_bp)
    app.register_blueprint(analytics_bp)
    app.register_blueprint(profile_bp)

    # Health check route
    @app.route("/api/health", methods=["GET"])
    def health_check():
        db_type = "mysql" if "mysql" in app.config.get("SQLALCHEMY_DATABASE_URI", "") else "sqlite"
        return jsonify({
            "status": "healthy",
            "app": "SpendWise",
            "version": "1.0.0",
            "database": db_type
        }), 200

    # Global JSON Error Handlers
    @app.errorhandler(400)
    def bad_request(error):
        return jsonify({"success": False, "error": "Bad request.", "details": str(error)}), 400

    @app.errorhandler(404)
    def not_found(error):
        return jsonify({"success": False, "error": "Resource not found."}), 404

    @app.errorhandler(405)
    def method_not_allowed(error):
        return jsonify({"success": False, "error": "Method not allowed."}), 405

    @app.errorhandler(500)
    def internal_error(error):
        logger.error(f"Internal server error: {error}")
        return jsonify({"success": False, "error": "Internal server error. Please try again later."}), 500

    # Ensure tables are created when running in development
    with app.app_context():
        from app.models import User, Expense, Budget, EmailVerificationToken, PasswordResetToken  # noqa: F401
        db.create_all()

    return app


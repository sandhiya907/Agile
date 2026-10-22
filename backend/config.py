import os
from datetime import timedelta
from dotenv import load_dotenv

load_dotenv()

class Config:
    SECRET_KEY = os.getenv("SECRET_KEY", "spendwise-dev-super-secret-key-default-2026")
    JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "spendwise-jwt-secret-key-default-2026")
    
    # JWT expiration: default 1440 minutes (24 hours)
    JWT_EXPIRES_MINUTES = int(os.getenv("JWT_ACCESS_TOKEN_EXPIRES_MINUTES", "1440"))
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(minutes=JWT_EXPIRES_MINUTES)
    
    # Database
    DATABASE_URL = os.getenv("DATABASE_URL", "mysql+pymysql://root:password@localhost:3306/spendwise")
    if DATABASE_URL.startswith("postgres://"):
        DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql+psycopg2://", 1)
    elif DATABASE_URL.startswith("postgresql://") and not DATABASE_URL.startswith("postgresql+"):
        DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+psycopg2://", 1)
    SQLALCHEMY_DATABASE_URI = DATABASE_URL
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_ENGINE_OPTIONS = {
        "pool_recycle": 280,
        "pool_pre_ping": True,
    }

    # Frontend
    FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")

    # Mail / SMTP Configuration
    # Supports both SMTP_* (recommended) and MAIL_* (legacy) variable names
    SMTP_HOST = os.getenv("SMTP_HOST") or os.getenv("MAIL_SERVER", "")
    SMTP_PORT = int(os.getenv("SMTP_PORT") or os.getenv("MAIL_PORT", "587"))
    SMTP_USE_TLS = (os.getenv("SMTP_USE_TLS") or os.getenv("MAIL_USE_TLS", "True")).lower() in ("true", "1", "yes")
    SMTP_USERNAME = os.getenv("SMTP_USERNAME") or os.getenv("MAIL_USERNAME", "")
    SMTP_PASSWORD = os.getenv("SMTP_PASSWORD") or os.getenv("MAIL_PASSWORD", "")
    SMTP_FROM_EMAIL = os.getenv("SMTP_FROM_EMAIL") or os.getenv("MAIL_DEFAULT_SENDER", "SpendWise <no-reply@spendwise.app>")

    # Aliases for backward compatibility
    MAIL_SERVER = SMTP_HOST
    MAIL_PORT = SMTP_PORT
    MAIL_USE_TLS = SMTP_USE_TLS
    MAIL_USERNAME = SMTP_USERNAME
    MAIL_PASSWORD = SMTP_PASSWORD
    MAIL_DEFAULT_SENDER = SMTP_FROM_EMAIL

    # Security & Token Configuration
    RESET_TOKEN_EXPIRATION_HOURS = 2

    # Cookie Security
    COOKIE_SECURE = os.getenv("FLASK_ENV") == "production" or os.getenv("COOKIE_SECURE", "false").lower() in ("true", "1")
    COOKIE_SAMESITE = os.getenv("COOKIE_SAMESITE", "None" if COOKIE_SECURE else "Lax")
    COOKIE_HTTPONLY = True

from sqlalchemy.pool import StaticPool

class TestConfig(Config):
    TESTING = True
    SQLALCHEMY_DATABASE_URI = "sqlite:///:memory:"
    SQLALCHEMY_ENGINE_OPTIONS = {
        "connect_args": {"check_same_thread": False},
        "poolclass": StaticPool,
    }
    WTF_CSRF_ENABLED = False
    SECRET_KEY = "test-secret-key-that-is-at-least-32-bytes-long-for-security"
    JWT_SECRET_KEY = "test-jwt-secret-key-that-is-at-least-32-bytes-long-for-security"


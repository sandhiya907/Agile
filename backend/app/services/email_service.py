import os
import logging
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from flask import current_app

logger = logging.getLogger("spendwise.email")

# In-memory storage for test assertions in automated test runs (TESTING=True)
_dev_email_inbox = []

def get_dev_email_inbox():
    """Returns stored email records during automated testing."""
    return list(_dev_email_inbox)

def clear_dev_email_inbox():
    """Clears testing email records."""
    _dev_email_inbox.clear()

def is_smtp_configured() -> bool:
    """
    Checks if SMTP server host, username, and password are fully configured in the environment.
    """
    host = current_app.config.get("SMTP_HOST") or current_app.config.get("MAIL_SERVER")
    user = current_app.config.get("SMTP_USERNAME") or current_app.config.get("MAIL_USERNAME")
    pw = current_app.config.get("SMTP_PASSWORD") or current_app.config.get("MAIL_PASSWORD")
    return bool(host and user and pw and str(host).strip() and str(user).strip() and str(pw).strip())

def _dispatch_smtp_message(recipient_email: str, subject: str, html_content: str, plain_text: str) -> dict:
    """Dispatches a real email via smtplib using configured SMTP settings."""
    host = current_app.config.get("SMTP_HOST") or current_app.config.get("MAIL_SERVER")
    port = int(current_app.config.get("SMTP_PORT") or current_app.config.get("MAIL_PORT", 587))
    user = current_app.config.get("SMTP_USERNAME") or current_app.config.get("MAIL_USERNAME")
    pw = current_app.config.get("SMTP_PASSWORD") or current_app.config.get("MAIL_PASSWORD")
    sender = current_app.config.get("SMTP_FROM_EMAIL") or current_app.config.get("MAIL_DEFAULT_SENDER", "SpendWise <no-reply@spendwise.app>")
    use_tls = current_app.config.get("SMTP_USE_TLS", True)

    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = sender
        msg["To"] = recipient_email
        msg.attach(MIMEText(plain_text, "plain"))
        msg.attach(MIMEText(html_content, "html"))

        with smtplib.SMTP(host, port, timeout=12) as server:
            if use_tls:
                server.starttls()
            server.login(user, pw)
            server.sendmail(sender, [recipient_email], msg.as_string())

        logger.info("Real SMTP email successfully dispatched to %s", recipient_email)
        return {"sent": True, "mode": "smtp"}
    except Exception as e:
        logger.error("SMTP delivery failure to %s: %s", recipient_email, str(e))
        return {
            "sent": False,
            "mode": "error",
            "error": "SMTP_DELIVERY_FAILED",
            "message": f"SMTP delivery failed: {str(e)}"
        }

def send_password_reset_email(recipient_email: str, recipient_name: str, raw_token: str) -> dict:
    """Sends a password reset link via real SMTP or records in test inbox."""
    frontend_url = current_app.config.get("FRONTEND_URL", "http://localhost:5173").rstrip("/")
    reset_link = f"{frontend_url}/reset-password?token={raw_token}"

    if current_app.config.get("TESTING"):
        _dev_email_inbox.append({
            "to": recipient_email,
            "type": "password_reset",
            "link": reset_link,
            "token": raw_token
        })
        return {"sent": True, "mode": "testing"}

    if not is_smtp_configured():
        return {
            "sent": False,
            "mode": "unconfigured",
            "error": "SMTP_NOT_CONFIGURED",
            "message": "SMTP email service is not configured. Please set SMTP_HOST, SMTP_PORT, SMTP_USERNAME, and SMTP_PASSWORD in backend/.env to send password reset emails."
        }

    subject = "Reset your SpendWise Password"
    display_name = recipient_name or "SpendWise User"

    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body {{ font-family: 'Segoe UI', Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px 12px; }}
        .card {{ max-width: 520px; margin: 0 auto; background: #ffffff; border-radius: 20px; padding: 36px 32px; border: 1px solid #e2e8f0; }}
        .header {{ text-align: center; margin-bottom: 24px; }}
        .brand {{ font-size: 28px; font-weight: bold; color: #111827; }}
        .brand span {{ color: #2F8F24; }}
        .btn {{ display: inline-block; background-color: #2F8F24; color: #ffffff !important; padding: 14px 28px; border-radius: 12px; text-decoration: none; font-weight: 600; font-size: 15px; margin: 24px 0; }}
        .footer {{ font-size: 12px; color: #94a3b8; text-align: center; margin-top: 32px; border-top: 1px solid #f1f5f9; padding-top: 16px; }}
      </style>
    </head>
    <body>
      <div class="card">
        <div class="header">
          <div class="brand">Spend<span>Wise</span></div>
          <p style="color: #64748b; font-size: 13px; margin-top: 4px;">Password Reset Request</p>
        </div>
        <h2 style="color: #1e293b; font-size: 18px;">Hello, {display_name}</h2>
        <p style="color: #475569; line-height: 1.6; font-size: 14px;">We received a request to reset your password. Click the button below to choose a new password:</p>
        <div style="text-align: center;">
          <a href="{reset_link}" class="btn" target="_blank">Reset Password</a>
        </div>
        <p style="color: #64748b; font-size: 12px; line-height: 1.5;">This link will expire in 2 hours and can only be used once. If you did not request a password reset, you can safely ignore this message.</p>
        <div class="footer">
          SpendWise Expense Tracker &copy; 2026. All rights reserved.
        </div>
      </div>
    </body>
    </html>
    """

    plain_text = f"Hello {display_name},\n\nYou requested a password reset for SpendWise. Use the link below to set a new password:\n{reset_link}\n\nThis link will expire in 2 hours."

    return _dispatch_smtp_message(
        recipient_email=recipient_email,
        subject=subject,
        html_content=html_content,
        plain_text=plain_text
    )

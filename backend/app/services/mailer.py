import logging
import smtplib
import ssl
from email.message import EmailMessage

from app.core.config import settings

log = logging.getLogger(__name__)


def smtp_enabled() -> bool:
    return bool(settings.SMTP_HOST and settings.SMTP_FROM)


def send_email(to: list[str], subject: str, text: str, reply_to: str | None = None) -> bool:
    """Send a plain-text email. Never raises: failures are logged so a form submit can't break."""
    if not smtp_enabled() or not to:
        log.info("SMTP not configured; skipped email %r", subject)
        return False

    msg = EmailMessage()
    msg["From"] = settings.SMTP_FROM
    msg["To"] = ", ".join(to)
    msg["Subject"] = subject
    if reply_to:
        msg["Reply-To"] = reply_to
    msg.set_content(text)

    try:
        context = ssl.create_default_context()
        if settings.SMTP_SSL:
            with smtplib.SMTP_SSL(settings.SMTP_HOST, settings.SMTP_PORT, context=context, timeout=20) as smtp:
                _login_and_send(smtp, msg)
        else:
            with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=20) as smtp:
                smtp.starttls(context=context)
                _login_and_send(smtp, msg)
        return True
    except Exception:
        log.exception("Failed to send email %r", subject)
        return False


def _login_and_send(smtp: smtplib.SMTP, msg: EmailMessage) -> None:
    if settings.SMTP_USER:
        smtp.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
    smtp.send_message(msg)


def notify_recipients() -> list[str]:
    return [a.strip() for a in settings.ENQUIRY_NOTIFY_TO.split(",") if a.strip()]

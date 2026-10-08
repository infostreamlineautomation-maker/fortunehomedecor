from slowapi import Limiter
from starlette.requests import Request

from app.services.audit import client_ip


def _key(request: Request) -> str:
    # Behind Nginx the real client is in X-Forwarded-For
    return client_ip(request) or "unknown"


limiter = Limiter(key_func=_key)

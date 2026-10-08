"""CMS / admin API (port 8001). Every router except auth requires a logged-in admin."""
from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

from app.core.config import settings
from app.core.limiter import limiter
from app.deps import get_current_admin
from app.routers import health
from app.routers.admin import (
    audit_logs,
    auth,
    categories,
    dashboard,
    enquiries,
    faqs,
    media,
    pages,
    products,
    users,
)
from app.routers.admin import settings as settings_router

app = FastAPI(
    title=f"{settings.APP_NAME} Admin API",
    docs_url=None if settings.is_production else "/docs",
    redoc_url=None,
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.admin_cors_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE"],
    allow_headers=["Content-Type", "Authorization"],
)

settings.upload_path.mkdir(parents=True, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=settings.upload_path), name="uploads")

app.include_router(health.router)
app.include_router(auth.router)

protected = [Depends(get_current_admin)]
for module in (dashboard, categories, products, faqs, pages, settings_router, media, enquiries, users, audit_logs):
    app.include_router(module.router, dependencies=protected)


@app.get("/")
def root():
    return {"service": "admin-api", "app": settings.APP_NAME}

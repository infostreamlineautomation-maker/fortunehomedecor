"""Public website API (port 8000). Read-only content + enquiry submission."""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

from app.core.config import settings
from app.core.limiter import limiter
from app.routers import health
from app.routers.public import content, enquiries

app = FastAPI(
    title=f"{settings.APP_NAME} API",
    docs_url=None if settings.is_production else "/docs",
    redoc_url=None,
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=False,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type"],
)

settings.upload_path.mkdir(parents=True, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=settings.upload_path), name="uploads")

app.include_router(health.router)
app.include_router(content.router)
app.include_router(enquiries.router)


@app.get("/")
def root():
    return {"service": "public-api", "app": settings.APP_NAME}

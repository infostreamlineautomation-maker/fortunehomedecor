from functools import lru_cache
from pathlib import Path

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

BACKEND_DIR = Path(__file__).resolve().parents[2]


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=BACKEND_DIR / ".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    APP_NAME: str = "Fortune Decor"
    APP_ENV: str = "development"  # development | production

    DATABASE_URL: str = "postgresql+psycopg://postgres:postgres@localhost:5432/fortune_decor"

    @field_validator("DATABASE_URL", mode="before")
    @classmethod
    def normalize_database_url(cls, v: str) -> str:
        if isinstance(v, str):
            if v.startswith("postgres://"):
                return v.replace("postgres://", "postgresql+psycopg://", 1)
            if v.startswith("postgresql://") and not v.startswith("postgresql+"):
                return v.replace("postgresql://", "postgresql+psycopg://", 1)
        return v

    SECRET_KEY: str = "change-me"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 1 day

    # Comma-separated origins
    CORS_ORIGINS: str = "http://localhost:3000,http://127.0.0.1:3000"
    ADMIN_CORS_ORIGINS: str = "http://localhost:3001,http://127.0.0.1:3001"

    UPLOAD_DIR: str = "uploads"
    MAX_UPLOAD_MB: int = 100

    # Public website: used in email links, and to refresh its cache after CMS edits
    SITE_URL: str = "http://localhost:3000"
    CMS_URL: str = "http://localhost:3001"
    REVALIDATE_URL: str = "http://127.0.0.1:3000/api/revalidate"
    REVALIDATE_SECRET: str = ""

    SMTP_HOST: str = ""
    SMTP_PORT: int = 465
    SMTP_SSL: bool = True
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    SMTP_FROM: str = ""
    ENQUIRY_NOTIFY_TO: str = ""

    # Cloudinary storage for UAT / production
    CLOUDINARY_CLOUD_NAME: str = ""
    CLOUDINARY_API_KEY: str = ""
    CLOUDINARY_API_SECRET: str = ""
    CLOUDINARY_FOLDER: str = "fortune_decor"

    @property
    def use_cloudinary(self) -> bool:
        return bool(self.CLOUDINARY_CLOUD_NAME and self.CLOUDINARY_API_KEY and self.CLOUDINARY_API_SECRET)

    @property
    def is_production(self) -> bool:
        return self.APP_ENV.lower() == "production"

    @property
    def cors_origins(self) -> list[str]:
        return _split_origins(self.CORS_ORIGINS)

    @property
    def admin_cors_origins(self) -> list[str]:
        return _split_origins(self.ADMIN_CORS_ORIGINS)

    @property
    def upload_path(self) -> Path:
        path = Path(self.UPLOAD_DIR)
        return path if path.is_absolute() else BACKEND_DIR / path


def _split_origins(value: str) -> list[str]:
    return [o.strip().rstrip("/") for o in value.split(",") if o.strip()]


@lru_cache
def get_settings() -> Settings:
    s = Settings()
    # Refuse to boot production with a weak JWT key: anyone could forge CMS sessions
    if s.is_production and (s.SECRET_KEY in ("", "change-me") or len(s.SECRET_KEY) < 32):
        raise RuntimeError("SECRET_KEY must be set to a random value of at least 32 characters in production")
    return s


settings = get_settings()

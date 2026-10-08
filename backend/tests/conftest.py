"""Test setup: a separate `<db>_test` database migrated with Alembic, wiped between tests.

Environment overrides must happen before `app` is imported, because settings load at import.
"""
import os
import shutil
import tempfile
from pathlib import Path

import psycopg
import pytest
from dotenv import dotenv_values
from sqlalchemy.engine import make_url

BACKEND = Path(__file__).resolve().parents[1]
_env = dotenv_values(BACKEND / ".env")
_base_url = make_url(os.environ.get("DATABASE_URL") or _env.get("DATABASE_URL") or "postgresql+psycopg://postgres:postgres@localhost:5432/fortune_decor")
TEST_DB = f"{_base_url.database}_test"
TEST_URL = _base_url.set(database=TEST_DB)

UPLOAD_DIR = Path(tempfile.mkdtemp(prefix="fd-uploads-"))
os.environ.update(
    DATABASE_URL=TEST_URL.render_as_string(hide_password=False),
    UPLOAD_DIR=str(UPLOAD_DIR),
    APP_ENV="development",
    SECRET_KEY="test-secret-key-that-is-at-least-32-bytes-long",
    SMTP_HOST="",
    REVALIDATE_SECRET="",
)


def _create_test_database() -> None:
    admin_dsn = _base_url.set(drivername="postgresql", database="postgres").render_as_string(hide_password=False)
    with psycopg.connect(admin_dsn, autocommit=True) as conn:
        conn.execute(f'DROP DATABASE IF EXISTS "{TEST_DB}" WITH (FORCE)')
        conn.execute(f'CREATE DATABASE "{TEST_DB}"')


@pytest.fixture(scope="session", autouse=True)
def database():
    _create_test_database()
    from alembic import command
    from alembic.config import Config

    cfg = Config(str(BACKEND / "alembic.ini"))
    cfg.set_main_option("script_location", str(BACKEND / "alembic"))
    command.upgrade(cfg, "head")
    yield
    from app.core.database import engine

    engine.dispose()
    shutil.rmtree(UPLOAD_DIR, ignore_errors=True)


@pytest.fixture(autouse=True)
def clean_tables(database):
    from sqlalchemy import text

    from app.core.database import engine
    from app.core.limiter import limiter
    from app.models import Base

    tables = ", ".join(f'"{t.name}"' for t in Base.metadata.sorted_tables)
    with engine.begin() as conn:
        conn.execute(text(f"TRUNCATE {tables} RESTART IDENTITY CASCADE"))
    limiter.reset()
    limiter.enabled = False  # tests that check rate limits turn it back on
    yield


@pytest.fixture
def db():
    from app.core.database import SessionLocal

    with SessionLocal() as session:
        yield session


@pytest.fixture
def public_client():
    from fastapi.testclient import TestClient

    from app.main import app

    with TestClient(app) as client:
        yield client


def _make_admin(email: str, password: str, role: str = "superadmin"):
    from app.core.database import SessionLocal
    from app.core.security import hash_password
    from app.models import AdminUser

    with SessionLocal() as s:
        user = AdminUser(email=email, full_name=email.split("@")[0], password_hash=hash_password(password), role=role)
        s.add(user)
        s.commit()
        return user.id


@pytest.fixture
def make_admin():
    return _make_admin


@pytest.fixture
def admin_client():
    """Admin API client logged in as a superadmin (session cookie kept by the client)."""
    from fastapi.testclient import TestClient

    from app.admin_main import app

    _make_admin("super@example.com", "super-secret-1")
    with TestClient(app) as client:
        res = client.post("/auth/login", json={"email": "super@example.com", "password": "super-secret-1"})
        assert res.status_code == 200, res.text
        yield client


@pytest.fixture
def seeded():
    from app.seed import run

    return run()


def png_bytes(size=(40, 30), color=(158, 21, 21)) -> bytes:
    import io

    from PIL import Image

    buf = io.BytesIO()
    Image.new("RGB", size, color).save(buf, "PNG")
    return buf.getvalue()

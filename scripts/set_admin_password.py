#!/usr/bin/env python3
"""Quick script to set or reset CMS Admin credentials directly on local DB or Supabase.

Usage:
    python scripts/set_admin_password.py <DATABASE_URL> <EMAIL> <PASSWORD>
"""
import sys
from pathlib import Path

# Add backend to path
sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "backend"))

from sqlalchemy import create_engine, select
from sqlalchemy.orm import Session
from app.models import AdminUser
from app.core.security import hash_password


def main():
    if len(sys.argv) < 4:
        print("Usage: python scripts/set_admin_password.py <DATABASE_URL> <EMAIL> <PASSWORD>")
        sys.exit(1)

    db_url = sys.argv[1].strip()
    if db_url.startswith("postgres://"):
        db_url = db_url.replace("postgres://", "postgresql+psycopg://", 1)
    if db_url.startswith("postgresql://") and not db_url.startswith("postgresql+"):
        db_url = db_url.replace("postgresql://", "postgresql+psycopg://", 1)

    email = sys.argv[2].strip().lower()
    password = sys.argv[3].strip()

    engine = create_engine(db_url, pool_pre_ping=True, connect_args={"prepare_threshold": None})
    with Session(engine) as db:
        user = db.scalar(select(AdminUser).where(AdminUser.email == email))
        if user:
            user.password_hash = hash_password(password)
            user.is_active = True
            print(f"[OK] Updated existing admin user: {email}")
        else:
            db.add(
                AdminUser(
                    email=email,
                    full_name="Administrator",
                    role="superadmin",
                    password_hash=hash_password(password),
                    is_active=True,
                )
            )
            print(f"[OK] Created new superadmin user: {email}")
        db.commit()

    print(f"\n[SUCCESS] You can now log into CMS with:\nEmail:    {email}\nPassword: {password}\n")


if __name__ == "__main__":
    main()

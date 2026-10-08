"""Management commands.

    python -m app.cli create-admin --email admin@example.com --password secret --name "Admin"
"""
import argparse
import getpass
import sys

from sqlalchemy import select

from app.core.database import SessionLocal
from app.core.security import hash_password
from app.models import AdminUser


def create_admin(email: str, password: str, name: str) -> None:
    email = email.lower()
    with SessionLocal() as db:
        admin = db.scalar(select(AdminUser).where(AdminUser.email == email))
        if admin:
            admin.password_hash = hash_password(password)
            admin.is_active = True
            print(f"Updated password for existing admin {email}")
        else:
            db.add(AdminUser(email=email, full_name=name, password_hash=hash_password(password), role="superadmin"))
            print(f"Created superadmin {email}")
        db.commit()


def main() -> None:
    parser = argparse.ArgumentParser(prog="python -m app.cli")
    sub = parser.add_subparsers(dest="command", required=True)

    p = sub.add_parser("create-admin", help="Create or reset a superadmin user")
    p.add_argument("--email", required=True)
    p.add_argument("--password", help="Prompted if omitted")
    p.add_argument("--name", default="Administrator")

    args = parser.parse_args()
    if args.command == "create-admin":
        password = args.password or getpass.getpass("Password: ")
        if len(password) < 8:
            sys.exit("Password must be at least 8 characters")
        create_admin(args.email, password, args.name)


if __name__ == "__main__":
    main()

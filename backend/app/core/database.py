from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.core.config import settings

# prepare_threshold=None disables server-side prepared statements in psycopg 3,
# which prevents DuplicatePreparedStatement errors with Supabase / PgBouncer pooler
engine = create_engine(
    settings.DATABASE_URL,
    pool_pre_ping=True,
    connect_args={"prepare_threshold": None},
)
SessionLocal = sessionmaker(bind=engine, autocommit=False, autoflush=False)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# Default: SQLite for local dev. Set DATABASE_URL env var for PostgreSQL:
# postgresql://user:password@localhost:5432/confersafe
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./confersafe.db")

# SQLite needs check_same_thread=False; PostgreSQL ignores this kwarg
connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}

engine = create_engine(DATABASE_URL, connect_args=connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

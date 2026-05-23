"""Compatibilité — préférez app.db.database."""

from app.db.database import (  # noqa: F401
    Base,
    DATABASE_URL,
    SessionLocal,
    engine,
    get_db,
    init_db,
    test_connection,
)

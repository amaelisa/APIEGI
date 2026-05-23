"""Tente de lire la config auth / clés depuis la base Supabase (schéma auth)."""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from sqlalchemy import text

from app.db.database import engine

QUERIES = [
    ("schemas", "SELECT schema_name FROM information_schema.schemata WHERE schema_name IN ('auth', 'vault', 'extensions')"),
    ("auth_tables", "SELECT tablename FROM pg_tables WHERE schemaname = 'auth' ORDER BY 1 LIMIT 20"),
]


def main() -> None:
    with engine.connect() as conn:
        for label, sql in QUERIES:
            try:
                rows = conn.execute(text(sql)).fetchall()
                print(f"{label}:", rows)
            except Exception as e:
                print(f"{label}: ERREUR {e}")


if __name__ == "__main__":
    main()

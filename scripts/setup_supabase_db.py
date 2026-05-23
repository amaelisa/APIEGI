"""Applique la migration auth et vérifie la base Supabase."""
from pathlib import Path

from sqlalchemy import text

from app.db.database import engine

MIGRATION = Path(__file__).resolve().parents[1] / "supabase/migrations/002_utilisateurs_supabase_auth.sql"


def main() -> None:
    sql = MIGRATION.read_text(encoding="utf-8")
    statements = [s.strip() for s in sql.split(";") if s.strip() and not s.strip().startswith("--")]

    with engine.begin() as conn:
        for stmt in statements:
            conn.execute(text(stmt))
        count = conn.execute(text("SELECT COUNT(*) FROM matieres")).scalar()
        cols = conn.execute(
            text(
                "SELECT column_name FROM information_schema.columns "
                "WHERE table_schema='public' AND table_name='utilisateurs' ORDER BY 1"
            )
        ).fetchall()
    print(f"Migration OK. Matieres: {count}")
    print("Colonnes utilisateurs:", [c[0] for c in cols])


if __name__ == "__main__":
    main()

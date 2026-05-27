"""
Connexion PostgreSQL (Supabase) via SQLAlchemy + psycopg2.
"""

import os

from dotenv import load_dotenv
from sqlalchemy import create_engine, text
from sqlalchemy.orm import declarative_base, sessionmaker

from app.core.paths import PROJECT_ROOT

load_dotenv(PROJECT_ROOT / ".env", override=True)


def _normalize_database_url(url: str) -> str:
    """Convertit l'URL Supabase (postgres://) en URL SQLAlchemy."""
    from urllib.parse import quote_plus

    url = url.strip().strip('"').strip("'")

    # Mot de passe avec @ : plusieurs @ cassent le parsing → on garde le dernier @ avant l'hôte
    if url.count("@") > 1:
        scheme_sep = url.find("://")
        if scheme_sep != -1:
            rest = url[scheme_sep + 3 :]
            last_at = rest.rfind("@")
            userinfo = rest[:last_at]
            hostpart = rest[last_at + 1 :]
            colon = userinfo.find(":")
            if colon != -1:
                user = userinfo[:colon]
                password = userinfo[colon + 1 :]
                password = quote_plus(password, safe="")
                url = f"{url[: scheme_sep + 3]}{user}:{password}@{hostpart}"

    if url.startswith("postgres://"):
        url = url.replace("postgres://", "postgresql+psycopg2://", 1)
    elif url.startswith("postgresql://") and "+psycopg2" not in url:
        url = url.replace("postgresql://", "postgresql+psycopg2://", 1)
    return url


DATABASE_URL = _normalize_database_url(os.getenv("DATABASE_URL", "").strip())

if not DATABASE_URL:
    raise RuntimeError(
        "DATABASE_URL manquante dans .env — copiez l'URL Session pooler depuis Supabase → Connect."
    )

engine = create_engine(
    DATABASE_URL,
    echo=False,
    pool_pre_ping=True,
    connect_args={"sslmode": "require"},
)
Base = declarative_base()
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db() -> None:
    """Vérifie la connexion ; peuple les matières seulement si la table est vide."""
    import app.models  # noqa: F401

    from app.db.seed import seed_matieres
    from app.models.matiere import Matiere

    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    try:
        count = db.query(Matiere).count()
        if count == 0:
            seed_matieres(reset=False)
            print("Seed matieres : table vide, insertion effectuee.")
        else:
            print(f"Base Supabase OK : {count} matiere(s) deja presentes.")
    finally:
        db.close()


def test_connection() -> bool:
    try:
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))
        print("Connexion Supabase (PostgreSQL) reussie.")
        return True
    except Exception as e:
        print(f"Erreur de connexion Supabase : {e}")
        return False

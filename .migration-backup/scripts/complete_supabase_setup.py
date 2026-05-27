"""
Configuration automatique Supabase (base + fichiers .env).

Usage (depuis la racine du projet) :
  .\\venv\\Scripts\\python.exe scripts/complete_supabase_setup.py

Optionnel — pour récupérer anon + JWT via Management API :
  Définir SUPABASE_ACCESS_TOKEN (https://supabase.com/dashboard/account/tokens)
"""
from __future__ import annotations

import json
import os
import re
import sys
import urllib.error
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from sqlalchemy import text  # noqa: E402

from app.db.database import engine  # noqa: E402

PROJECT_REF_RE = re.compile(r"postgres\.([a-z0-9]+):")
MIGRATION = ROOT / "supabase/migrations/002_utilisateurs_supabase_auth.sql"
RLS_SQL = ROOT / "scripts/configure_rls.sql"
ENV_FILE = ROOT / ".env"
FRONTEND_ENV = ROOT / "frontend/.env"


def extract_project_ref(database_url: str) -> str | None:
    m = PROJECT_REF_RE.search(database_url)
    return m.group(1) if m else None


def run_sql_file(path: Path) -> None:
    raw = path.read_text(encoding="utf-8")
    lines = [ln for ln in raw.splitlines() if not ln.strip().startswith("--")]
    sql = "\n".join(lines)
    statements = [s.strip() for s in sql.split(";") if s.strip()]
    with engine.begin() as conn:
        for stmt in statements:
            conn.execute(text(stmt))


def fetch_api_keys_via_management(project_ref: str, token: str) -> dict[str, str]:
    url = f"https://api.supabase.com/v1/projects/{project_ref}/api-keys"
    req = urllib.request.Request(
        url,
        headers={"Authorization": f"Bearer {token}", "Accept": "application/json"},
    )
    with urllib.request.urlopen(req, timeout=30) as resp:
        data = json.loads(resp.read().decode())
    keys: dict[str, str] = {}
    for item in data:
        name = (item.get("name") or "").lower()
        if name in ("anon", "service_role"):
            keys[name] = item.get("api_key") or ""
    return keys


def fetch_jwt_secret_via_management(project_ref: str, token: str) -> str:
    url = f"https://api.supabase.com/v1/projects/{project_ref}/config/auth"
    req = urllib.request.Request(
        url,
        headers={"Authorization": f"Bearer {token}", "Accept": "application/json"},
    )
    with urllib.request.urlopen(req, timeout=30) as resp:
        data = json.loads(resp.read().decode())
    return data.get("jwt_secret") or ""


def patch_auth_via_management(project_ref: str, token: str) -> None:
    """Active la confirmation email (désactive autoconfirm)."""
    url = f"https://api.supabase.com/v1/projects/{project_ref}/config/auth"
    body = json.dumps(
        {
            "mailer_autoconfirm": False,
            "external_email_enabled": True,
        }
    ).encode()
    req = urllib.request.Request(
        url,
        data=body,
        method="PATCH",
        headers={
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json",
            "Accept": "application/json",
        },
    )
    with urllib.request.urlopen(req, timeout=30) as resp:
        resp.read()


def update_env_file(
    project_ref: str,
    anon_key: str = "",
    jwt_secret: str = "",
) -> None:
    supabase_url = f"https://{project_ref}.supabase.co"
    lines: list[str] = []
    if ENV_FILE.exists():
        lines = ENV_FILE.read_text(encoding="utf-8").splitlines()

    def set_var(name: str, value: str) -> None:
        nonlocal lines
        found = False
        for i, line in enumerate(lines):
            if line.startswith(f"{name}="):
                lines[i] = f"{name}={value}"
                found = True
                break
        if not found:
            lines.append(f"{name}={value}")

    set_var("SUPABASE_URL", supabase_url)
    if anon_key:
        set_var("SUPABASE_ANON_KEY", anon_key)
    if jwt_secret:
        set_var("SUPABASE_JWT_SECRET", jwt_secret)

    ENV_FILE.write_text("\n".join(lines) + "\n", encoding="utf-8")

    fe_lines = [
        "# Généré par scripts/complete_supabase_setup.py",
        "VITE_API_URL=",
    ]
    FRONTEND_ENV.write_text("\n".join(fe_lines) + "\n", encoding="utf-8")


def main() -> None:
    from dotenv import load_dotenv

    load_dotenv(ROOT / ".env")
    db_url = os.getenv("DATABASE_URL", "")
    ref = extract_project_ref(db_url)
    if not ref:
        print("ERREUR: impossible de lire le project ref dans DATABASE_URL")
        sys.exit(1)

    print(f"Projet Supabase : {ref}")
    print("1/4 Migration utilisateurs (supabase_id)...")
    run_sql_file(MIGRATION)

    print("2/4 Politiques RLS matieres...")
    run_sql_file(RLS_SQL)

    with engine.connect() as conn:
        n = conn.execute(text("SELECT COUNT(*) FROM matieres")).scalar()
    print(f"    -> {n} matieres en base")

    token = os.getenv("SUPABASE_ACCESS_TOKEN", "").strip()
    anon_key = os.getenv("SUPABASE_ANON_KEY", "").strip()
    jwt_secret = os.getenv("SUPABASE_JWT_SECRET", "").strip()

    if token:
        print("3/4 Recuperation des cles via Management API...")
        try:
            keys = fetch_api_keys_via_management(ref, token)
            anon_key = anon_key or keys.get("anon", "")
            jwt_secret = jwt_secret or fetch_jwt_secret_via_management(ref, token)
            print("4/4 Configuration Auth (confirmation email)...")
            patch_auth_via_management(ref, token)
            print("    -> Confirm email active (mailer_autoconfirm=false)")
        except urllib.error.HTTPError as e:
            print(f"    AVERTISSEMENT Management API : {e.read().decode()[:200]}")
    else:
        print("3/4 SUPABASE_ACCESS_TOKEN absent — cles API non recuperees automatiquement")
        print("    Ajoutez un token : https://supabase.com/dashboard/account/tokens")
        print("    Puis relancez ce script.")

    print("4/4 Mise a jour des fichiers .env...")
    update_env_file(ref, anon_key=anon_key, jwt_secret=jwt_secret)

    print("\nTermine.")
    print(f"  SUPABASE_URL -> https://{ref}.supabase.co")
    if anon_key:
        print("  SUPABASE_ANON_KEY enregistre dans .env (auth via API backend)")
    else:
        print("  MANQUE : SUPABASE_ANON_KEY dans .env")
        print(f"  Dashboard : https://supabase.com/dashboard/project/{ref}/settings/api")
        print("  Collez la cle 'anon public' puis relancez ce script.")
    print("  Validation JWT backend : JWKS public (JWT secret optionnel)")


if __name__ == "__main__":
    main()

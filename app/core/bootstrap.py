"""Charge .env depuis la racine du projet et garantit les clés Supabase Auth."""
from __future__ import annotations

import json
import os
import re
from functools import lru_cache
from urllib.request import Request, urlopen

from dotenv import load_dotenv

from app.core.paths import PROJECT_ROOT

PROJECT_REF_RE = re.compile(r"postgres\.([a-z0-9]+):")


def _read_env_file() -> dict[str, str]:
    """Lit .env directement (évite les problèmes de répertoire de travail)."""
    env_path = PROJECT_ROOT / ".env"
    if not env_path.exists():
        return {}
    result: dict[str, str] = {}
    for line in env_path.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, _, value = line.partition("=")
        result[key.strip()] = value.strip().strip('"').strip("'")
    return result


def load_project_env() -> None:
    load_dotenv(PROJECT_ROOT / ".env", override=True)
    for key, value in _read_env_file().items():
        if value and not os.getenv(key):
            os.environ[key] = value


@lru_cache(maxsize=1)
def _fetch_keys_from_management() -> tuple[str, str]:
    token = os.getenv("SUPABASE_ACCESS_TOKEN", "").strip()
    if not token:
        return "", ""

    db_url = os.getenv("DATABASE_URL", "")
    ref_match = PROJECT_REF_RE.search(db_url)
    ref = ref_match.group(1) if ref_match else ""
    if not ref:
        url_base = os.getenv("SUPABASE_URL", "")
        if "supabase.co" in url_base:
            ref = url_base.split("//")[1].split(".")[0]

    if not ref:
        return "", ""

    req = Request(
        f"https://api.supabase.com/v1/projects/{ref}/api-keys",
        headers={
            "Authorization": f"Bearer {token}",
            "Accept": "application/json",
            "User-Agent": "Assistant-Pedagogique/1.0",
        },
    )
    with urlopen(req, timeout=30) as resp:
        data = json.loads(resp.read().decode())

    anon = ""
    service = ""
    for item in data:
        name = (item.get("name") or "").lower()
        key = item.get("api_key") or ""
        if name == "anon":
            anon = key
        elif name == "service_role":
            service = key
    return anon, service


def ensure_supabase_keys() -> None:
    """Charge .env et récupère anon/service si manquants (via token Management API)."""
    load_project_env()
    file_env = _read_env_file()

    anon = (
        os.getenv("SUPABASE_ANON_KEY", "").strip()
        or file_env.get("SUPABASE_ANON_KEY", "").strip()
    )
    service = (
        os.getenv("SUPABASE_SERVICE_ROLE_KEY", "").strip()
        or file_env.get("SUPABASE_SERVICE_ROLE_KEY", "").strip()
    )
    if anon:
        os.environ["SUPABASE_ANON_KEY"] = anon
    if service:
        os.environ["SUPABASE_SERVICE_ROLE_KEY"] = service

    if not anon or not service:
        fetched_anon, fetched_service = _fetch_keys_from_management()
        if not anon and fetched_anon:
            os.environ["SUPABASE_ANON_KEY"] = fetched_anon
            anon = fetched_anon
        if not service and fetched_service:
            os.environ["SUPABASE_SERVICE_ROLE_KEY"] = fetched_service

    if not os.getenv("SUPABASE_URL", "").strip():
        db_url = os.getenv("DATABASE_URL", "")
        m = PROJECT_REF_RE.search(db_url)
        if m:
            os.environ["SUPABASE_URL"] = f"https://{m.group(1)}.supabase.co"


def get_supabase_anon_key() -> str:
    ensure_supabase_keys()
    return (
        os.getenv("SUPABASE_ANON_KEY", "").strip()
        or os.getenv("SUPABASE_SERVICE_ROLE_KEY", "").strip()
    )

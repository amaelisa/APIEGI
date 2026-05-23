"""Validation des JWT Supabase Auth via JWKS public (sans copier le JWT secret)."""
from functools import lru_cache
from typing import Any, Optional

import httpx
from jose import JWTError, jwt

from app.core.config import settings


@lru_cache(maxsize=1)
def _jwks_url() -> str:
    base = settings.SUPABASE_URL.rstrip("/")
    if not base:
        return ""
    return f"{base}/auth/v1/.well-known/jwks.json"


@lru_cache(maxsize=1)
def _load_jwks() -> dict[str, Any]:
    url = _jwks_url()
    if not url:
        return {"keys": []}
    with httpx.Client(timeout=10.0) as client:
        resp = client.get(url)
        resp.raise_for_status()
        return resp.json()


def decode_supabase_token(token: str) -> Optional[dict[str, Any]]:
    if not settings.SUPABASE_URL:
        return None
    try:
        header = jwt.get_unverified_header(token)
        alg = header.get("alg", "")
        # Ancien JWT local (HS256) : laisser decode_access_token gérer
        if alg.startswith("HS") and not header.get("kid"):
            return None
        kid = header.get("kid")
        jwks = _load_jwks()
        key = None
        for k in jwks.get("keys", []):
            if k.get("kid") == kid:
                key = k
                break
        if not key and jwks.get("keys"):
            key = jwks["keys"][0]
        if not key:
            return None
        return jwt.decode(
            token,
            key,
            algorithms=[header.get("alg", "ES256")],
            audience="authenticated",
        )
    except Exception:
        return None

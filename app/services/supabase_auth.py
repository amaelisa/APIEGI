"""Appels Supabase Auth (inscription, OTP, connexion) côté serveur."""
from typing import Any

import httpx

from app.core.bootstrap import ensure_supabase_keys, get_supabase_anon_key
from app.core.config import settings

SITE_URL = "http://127.0.0.1:5173"


class SupabaseAuthError(Exception):
    def __init__(self, message: str, status_code: int = 400):
        super().__init__(message)
        self.status_code = status_code


def _friendly_error(raw: str, status_code: int = 400) -> str:
    msg = raw.lower()
    if "rate limit" in msg or status_code == 429:
        return (
            "Limite d'emails atteinte (plan gratuit Supabase : environ 4 emails par heure). "
            "Attendez 1 heure avant de réessayer, ou testez avec une autre adresse email."
        )
    if "invalid" in msg and "email" in msg:
        return "Adresse email refusée par Supabase. Vérifiez l'orthographe."
    if "already registered" in msg or "already exists" in msg:
        return "Cet email est déjà inscrit. Connectez-vous ou utilisez « Renvoyer le code »."
    return raw


def _base_url() -> str:
    ensure_supabase_keys()
    base = (settings.SUPABASE_URL or "").strip() or __import__("os").getenv("SUPABASE_URL", "")
    if not base:
        raise SupabaseAuthError("SUPABASE_URL manquant dans .env", 500)
    return base.rstrip("/")


def _headers(api_key: str) -> dict[str, str]:
    return {
        "apikey": api_key,
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
    }


def _api_key() -> str:
    key = get_supabase_anon_key()
    if not key:
        raise SupabaseAuthError(
            "Configuration Supabase incomplète. Relancez le backend depuis le dossier du projet.",
            500,
        )
    return key


def _parse_error(resp: httpx.Response) -> str:
    try:
        data = resp.json()
        raw = data.get("msg") or data.get("message") or data.get("error_description") or resp.text
    except Exception:
        raw = resp.text or "Erreur Supabase Auth"
    return _friendly_error(raw, resp.status_code)


async def sign_up(email: str, password: str, nom: str) -> dict[str, Any]:
    url = f"{_base_url()}/auth/v1/signup"
    payload = {
        "email": email.strip().lower(),
        "password": password,
        "data": {"nom": nom.strip()},
        "options": {
            "email_redirect_to": f"{SITE_URL}/register",
        },
    }
    async with httpx.AsyncClient(timeout=30.0) as client:
        resp = await client.post(url, headers=_headers(_api_key()), json=payload)
    if resp.status_code >= 400:
        raise SupabaseAuthError(_parse_error(resp), resp.status_code)
    return resp.json()


async def verify_otp(email: str, token: str) -> dict[str, Any]:
    url = f"{_base_url()}/auth/v1/verify"
    last_error = "Code invalide ou expiré."
    for otp_type in ("signup", "email"):
        payload = {
            "email": email.strip().lower(),
            "token": token.strip(),
            "type": otp_type,
        }
        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.post(url, headers=_headers(_api_key()), json=payload)
        if resp.status_code < 400:
            return resp.json()
        last_error = _parse_error(resp)
    raise SupabaseAuthError(last_error, 400)


async def resend_signup(email: str) -> None:
    url = f"{_base_url()}/auth/v1/resend"
    payload = {"email": email.strip().lower(), "type": "signup"}
    async with httpx.AsyncClient(timeout=30.0) as client:
        resp = await client.post(url, headers=_headers(_api_key()), json=payload)
    if resp.status_code >= 400:
        raise SupabaseAuthError(_parse_error(resp), resp.status_code)


async def sign_in(email: str, password: str) -> dict[str, Any]:
    url = f"{_base_url()}/auth/v1/token?grant_type=password"
    payload = {"email": email.strip().lower(), "password": password}
    async with httpx.AsyncClient(timeout=30.0) as client:
        resp = await client.post(url, headers=_headers(_api_key()), json=payload)
    if resp.status_code >= 400:
        msg = _parse_error(resp)
        if "confirm" in msg.lower() or "verified" in msg.lower() or "not confirmed" in msg.lower():
            raise SupabaseAuthError(
                "Email non confirmé. Saisissez le code à 6 chiffres reçu par email sur l'écran d'inscription.",
                401,
            )
        raise SupabaseAuthError(msg, resp.status_code)
    return resp.json()

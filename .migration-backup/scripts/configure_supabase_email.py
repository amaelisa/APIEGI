"""Configure Supabase Auth : OTP par email + bonnes URLs (plan gratuit)."""
import json
import os
import re
import sys
from pathlib import Path
from urllib.request import Request, urlopen

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from dotenv import load_dotenv

load_dotenv(ROOT / ".env")

REF = "gncrhhwiysqianavmpha"
TOKEN = os.getenv("SUPABASE_ACCESS_TOKEN", "").strip()
SITE = "http://127.0.0.1:5173"
REDIRECTS = f"{SITE}/register,{SITE}/login,{SITE}/auth/callback"

CONFIRM_TEMPLATE = f"""<h2>Assistant Pédagogique GI</h2>
<p>Votre code de confirmation (6 chiffres) :</p>
<p style="font-size:28px;font-weight:bold;letter-spacing:4px">{{{{ .Token }}}}</p>
<p>Ouvrez l'application sur votre PC : <strong>{SITE}/register</strong></p>
<p>Collez ce code sur l'ecran Confirmation.</p>
<p><small>Lien (PC uniquement) : <a href="{{{{ .ConfirmationURL }}}}">Confirmer</a></small></p>
"""


def patch_auth(body: dict) -> None:
    url = f"https://api.supabase.com/v1/projects/{REF}/config/auth"
    data = json.dumps(body).encode()
    req = Request(
        url,
        data=data,
        method="PATCH",
        headers={
            "Authorization": f"Bearer {TOKEN}",
            "Content-Type": "application/json",
        },
    )
    with urlopen(req, timeout=60) as resp:
        print("PATCH auth OK:", resp.status)


def main() -> None:
    if not TOKEN:
        print("SUPABASE_ACCESS_TOKEN manquant dans .env")
        sys.exit(1)

    patch_auth(
        {
            "site_url": SITE,
            "uri_allow_list": REDIRECTS,
            "mailer_autoconfirm": False,
            "external_email_enabled": True,
            "mailer_subjects_confirmation": "Votre code Assistant GI",
            "mailer_templates_confirmation_content": CONFIRM_TEMPLATE,
        }
    )
    print("Configuration email terminee.")
    print(f"  Site URL : {SITE}")
    print(f"  Redirects : {REDIRECTS}")


if __name__ == "__main__":
    main()

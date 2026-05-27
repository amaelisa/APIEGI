"""Ajoute ou met à jour SUPABASE_ANON_KEY dans .env (argument ou stdin)."""
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
ENV = ROOT / ".env"
key = (sys.argv[1] if len(sys.argv) > 1 else "").strip()
if not key:
    print("Usage: python scripts/set_anon_key.py VOTRE_CLE_ANON")
    sys.exit(1)

lines = ENV.read_text(encoding="utf-8").splitlines() if ENV.exists() else []
found = False
out = []
for line in lines:
    if line.startswith("SUPABASE_ANON_KEY="):
        out.append(f"SUPABASE_ANON_KEY={key}")
        found = True
    else:
        out.append(line)
if not found:
    out.append(f"SUPABASE_ANON_KEY={key}")
ENV.write_text("\n".join(out) + "\n", encoding="utf-8")
print("SUPABASE_ANON_KEY enregistre dans .env")

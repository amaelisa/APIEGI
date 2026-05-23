import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from sqlalchemy import text
from app.db.database import engine

with engine.connect() as c:
    for q in [
        "SELECT id, name, description FROM vault.secrets",
        "SELECT name FROM vault.secrets",
    ]:
        try:
            print(q, "->", c.execute(text(q)).fetchall())
        except Exception as e:
            print("err", e)

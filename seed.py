"""
Peuplement manuel — réinitialise et insère les 68 matières officielles :
  python seed.py
"""

import app.models  # noqa: F401
from app.db.database import Base, engine
from app.db.seed import seed_matieres

if __name__ == "__main__":
    Base.metadata.create_all(bind=engine)
    seed_matieres(reset=True)

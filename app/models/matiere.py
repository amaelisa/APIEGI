from sqlalchemy import CheckConstraint, Column, Integer, String

from app.db.database import Base


class Matiere(Base):
    __tablename__ = "matieres"
    __table_args__ = (
        CheckConstraint("niveau IN ('L1', 'L2', 'L3')", name="chk_matiere_niveau"),
    )

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    nom_matiere = Column(String(255), nullable=False, unique=True)
    niveau = Column(String(2), nullable=False)

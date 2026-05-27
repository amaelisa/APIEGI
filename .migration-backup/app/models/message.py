from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import relationship

from app.db.database import Base


class Message(Base):
    __tablename__ = "messages"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    utilisateur_id = Column(Integer, ForeignKey("utilisateurs.id"), nullable=False, index=True)
    matiere_id = Column(Integer, ForeignKey("matieres.id"), nullable=False, index=True)
    role = Column(String(20), nullable=False)  # user | assistant
    contenu = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    utilisateur = relationship("User", backref="messages")
    matiere = relationship("Matiere", backref="messages")

    def __repr__(self) -> str:
        return f"<Message(id={self.id}, role='{self.role}')>"

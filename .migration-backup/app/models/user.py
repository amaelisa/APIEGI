import uuid

from sqlalchemy import Column, DateTime, Integer, String, func
from sqlalchemy.dialects.postgresql import UUID

from app.db.database import Base


class User(Base):
    __tablename__ = "utilisateurs"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    supabase_id = Column(UUID(as_uuid=True), unique=True, index=True, nullable=True)
    nom = Column(String(120), nullable=False)
    email = Column(String(255), nullable=False, unique=True, index=True)
    mot_de_passe_hash = Column(String(255), nullable=True)
    niveau = Column(String(2), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    def __repr__(self) -> str:
        return f"<User(id={self.id}, email='{self.email}')>"

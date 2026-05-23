from datetime import datetime
from pydantic import BaseModel, Field


class ChatRequest(BaseModel):
    matiere_id: int = Field(..., description="ID de la matière sélectionnée")
    message: str = Field(..., min_length=1, max_length=4000)


class ChatResponse(BaseModel):
    reply: str
    matiere_id: int
    matiere_nom: str
    niveau: str
    autorise: bool = True


class MessageResponse(BaseModel):
    id: int
    role: str
    contenu: str
    created_at: datetime

    model_config = {"from_attributes": True}


class MessageListResponse(BaseModel):
    messages: list[MessageResponse]


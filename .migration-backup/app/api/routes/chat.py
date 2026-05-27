from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, File, Form, UploadFile
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.database import get_db
from app.models.matiere import Matiere
from app.models.message import Message
from app.models.user import User
from app.schemas.chat import ChatRequest, ChatResponse, MessageListResponse
from app.services.gemini_service import gemini_service

router = APIRouter(prefix="/chat", tags=["Chat"])


@router.get("/history/{matiere_id}", response_model=MessageListResponse)
def get_chat_history(
    matiere_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Récupère l'historique des messages pour une matière et un utilisateur spécifiques."""
    messages = (
        db.query(Message)
        .filter(
            Message.utilisateur_id == current_user.id,
            Message.matiere_id == matiere_id,
        )
        .order_by(Message.created_at.asc())
        .all()
    )
    return MessageListResponse(messages=messages)


@router.post("", response_model=ChatResponse)
async def chat(
    matiere_id: int = Form(...),
    message: str = Form(...),
    file: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    matiere = db.query(Matiere).filter(Matiere.id == matiere_id).first()
    if not matiere:
        raise HTTPException(status_code=404, detail="Matière introuvable.")

    question = message.strip()
    pdf_text = None

    if file:
        # Valider l'extension du fichier
        if not file.filename.lower().endswith(".pdf"):
            raise HTTPException(status_code=400, detail="Seuls les fichiers PDF sont acceptés.")
        
        try:
            import io
            from pypdf import PdfReader
            
            file_bytes = await file.read()
            reader = PdfReader(io.BytesIO(file_bytes))
            extracted_pages = []
            for page in reader.pages:
                page_text = page.extract_text()
                if page_text:
                    extracted_pages.append(page_text)
            pdf_text = "\n".join(extracted_pages).strip()
            
            if not pdf_text:
                pdf_text = "[Document PDF vide ou contenant uniquement des images]"
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Erreur lors de la lecture du fichier PDF : {e}")

    reply, autorise = await gemini_service.generate_response(
        question=question,
        matiere=matiere,
        pdf_text=pdf_text,
    )

    # Sauvegarder la question dans la BDD, avec mention du fichier joint le cas échéant
    db.add(
        Message(
            utilisateur_id=current_user.id,
            matiere_id=matiere.id,
            role="user",
            contenu=f"[Fichier joint : {file.filename}]\n\n{question}" if file else question,
        )
    )
    db.add(
        Message(
            utilisateur_id=current_user.id,
            matiere_id=matiere.id,
            role="assistant",
            contenu=reply,
        )
    )
    db.commit()

    return ChatResponse(
        reply=reply,
        matiere_id=matiere.id,
        matiere_nom=matiere.nom_matiere,
        niveau=matiere.niveau,
        autorise=autorise,
    )

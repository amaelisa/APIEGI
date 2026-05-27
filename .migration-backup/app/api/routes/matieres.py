from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.database import get_db
from app.models.matiere import Matiere
from app.models.user import User
from app.schemas.matiere import MatiereGroupedResponse, MatiereListResponse, MatiereResponse

router = APIRouter(prefix="/matieres", tags=["Matières"])


def _query_matieres(db: Session, niveau: Optional[str] = None):
    q = db.query(Matiere)
    if niveau:
        q = q.filter(Matiere.niveau == niveau)
    return q.order_by(Matiere.niveau, Matiere.nom_matiere).all()


@router.get("", response_model=MatiereListResponse)
def list_matieres(
    niveau: Optional[str] = Query(None, pattern="^(L1|L2|L3)$"),
    db: Session = Depends(get_db),
    _current_user: User = Depends(get_current_user),
):
    """Liste les matières (filtrées par onglet L1/L2/L3 si demandé). Tous les étudiants voient tout."""
    rows = _query_matieres(db, niveau)
    return MatiereListResponse(
        total=len(rows),
        matieres=[MatiereResponse.model_validate(m) for m in rows],
    )


@router.get("/grouped", response_model=MatiereGroupedResponse)
def list_matieres_grouped(
    db: Session = Depends(get_db),
    _current_user: User = Depends(get_current_user),
):
    """Retourne les 68 matières classées par niveau L1, L2, L3."""
    rows = _query_matieres(db)
    grouped: dict[str, list[MatiereResponse]] = {"L1": [], "L2": [], "L3": []}
    for m in rows:
        grouped[m.niveau].append(MatiereResponse.model_validate(m))
    return MatiereGroupedResponse(
        total=len(rows),
        L1=grouped["L1"],
        L2=grouped["L2"],
        L3=grouped["L3"],
    )

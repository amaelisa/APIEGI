from pydantic import BaseModel, Field


class MatiereResponse(BaseModel):
    id: int
    nom_matiere: str
    niveau: str

    model_config = {"from_attributes": True}


class MatiereListResponse(BaseModel):
    total: int
    matieres: list[MatiereResponse]


class MatiereGroupedResponse(BaseModel):
    total: int
    L1: list[MatiereResponse]
    L2: list[MatiereResponse]
    L3: list[MatiereResponse]

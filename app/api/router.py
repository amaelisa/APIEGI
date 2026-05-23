from fastapi import APIRouter

from app.api.routes import auth, chat, matieres

api_router = APIRouter(prefix="/api")
api_router.include_router(auth.router)
api_router.include_router(matieres.router)
api_router.include_router(chat.router)

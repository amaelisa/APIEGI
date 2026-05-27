"""
Point d'entrée FastAPI — Assistant Pédagogique IA-GI
Lancer depuis la racine : uvicorn app.main:app --reload
"""

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.router import api_router
from app.core.bootstrap import ensure_supabase_keys, get_supabase_anon_key
from app.db.database import init_db, test_connection


@asynccontextmanager
async def lifespan(app: FastAPI):
    ensure_supabase_keys()
    if get_supabase_anon_key():
        print("Supabase Auth : cle API chargee.")
    else:
        print("ATTENTION : Supabase Auth non configure (inscription impossible).")
    test_connection()
    init_db()
    yield


app = FastAPI(
    title="Assistant Pédagogique Intelligent - IA-GI",
    description="API REST — Génie Informatique (auth JWT + IA Gemini)",
    version="2.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "*",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router)


@app.get("/health")
async def health_check():
    from app.core.bootstrap import get_supabase_anon_key

    return {
        "status": "ok",
        "message": "API IA-GI opérationnelle",
        "supabase_auth": bool(get_supabase_anon_key()),
    }


@app.get("/")
async def root():
    return {
        "service": "Assistant Pédagogique Intelligent",
        "version": "2.0.0",
        "status": "actif",
        "docs": "/docs",
        "api": "/api",
    }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)

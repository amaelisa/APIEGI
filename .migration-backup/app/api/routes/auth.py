import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.security import decode_supabase_token
from app.db.database import get_db
from app.models.user import User
from app.schemas.auth import (
    RegisterPendingResponse,
    ResendCodeRequest,
    TokenResponse,
    UserLogin,
    UserRegister,
    UserResponse,
    UserSync,
    VerifyEmailRequest,
)
from app.services.supabase_auth import SupabaseAuthError, resend_signup, sign_in, sign_up, verify_otp

router = APIRouter(prefix="/auth", tags=["Authentification"])
bearer = HTTPBearer()


def _sync_user_from_token(db: Session, token: str, nom: str) -> User:
    sb_payload = decode_supabase_token(token)
    if not sb_payload:
        raise HTTPException(status_code=401, detail="Token Supabase invalide.")

    sub = sb_payload.get("sub")
    email = (sb_payload.get("email") or "").lower().strip()
    if not email:
        raise HTTPException(status_code=400, detail="Email absent du token.")

    supabase_uuid = uuid.UUID(str(sub)) if sub else None
    user = None
    if supabase_uuid:
        user = db.query(User).filter(User.supabase_id == supabase_uuid).first()
    if not user:
        user = db.query(User).filter(User.email == email).first()

    if user:
        user.nom = nom.strip()
        if supabase_uuid and not user.supabase_id:
            user.supabase_id = supabase_uuid
    else:
        user = User(
            nom=nom.strip(),
            email=email,
            supabase_id=supabase_uuid,
            mot_de_passe_hash=None,
            niveau=None,
        )
        db.add(user)

    db.commit()
    db.refresh(user)
    return user


@router.post("/register", response_model=RegisterPendingResponse, status_code=status.HTTP_201_CREATED)
async def register(payload: UserRegister, db: Session = Depends(get_db)):
    """Inscription : Supabase envoie un code / email de confirmation."""
    existing = db.query(User).filter(User.email == payload.email.lower()).first()
    if existing and existing.supabase_id:
        raise HTTPException(400, detail="Un compte existe déjà avec cet email.")

    try:
        data = await sign_up(payload.email, payload.mot_de_passe, payload.nom)
    except SupabaseAuthError as e:
        raise HTTPException(e.status_code, detail=str(e)) from e

    session = data.get("session")
    if session and session.get("access_token"):
        user = _sync_user_from_token(db, session["access_token"], payload.nom)
        return RegisterPendingResponse(
            message=f"Compte créé pour {user.email}. Vous pouvez vous connecter.",
            email=user.email,
            needs_confirmation=False,
        )

    return RegisterPendingResponse(
        message="Un code de confirmation a été envoyé à votre adresse email.",
        email=payload.email.lower(),
        needs_confirmation=True,
    )


@router.post("/verify-email", response_model=TokenResponse)
async def verify_email(payload: VerifyEmailRequest, db: Session = Depends(get_db)):
    try:
        data = await verify_otp(payload.email, payload.code)
    except SupabaseAuthError as e:
        raise HTTPException(e.status_code, detail=str(e)) from e

    access_token = (data.get("session") or {}).get("access_token") or data.get("access_token")
    if not access_token:
        raise HTTPException(400, detail="Code accepté mais session absente. Réessayez de vous connecter.")

    user = _sync_user_from_token(db, access_token, payload.nom)
    return TokenResponse(
        access_token=access_token,
        user=UserResponse(id=user.id, nom=user.nom, email=user.email),
    )


@router.post("/resend-code")
async def resend_code(payload: ResendCodeRequest):
    try:
        await resend_signup(payload.email)
    except SupabaseAuthError as e:
        raise HTTPException(e.status_code, detail=str(e)) from e
    return {"message": "Un nouveau code a été envoyé."}


@router.post("/login", response_model=TokenResponse)
async def login(payload: UserLogin, db: Session = Depends(get_db)):
    try:
        data = await sign_in(payload.email, payload.mot_de_passe)
    except SupabaseAuthError as e:
        raise HTTPException(e.status_code, detail=str(e)) from e

    access_token = data.get("access_token")
    if not access_token:
        raise HTTPException(401, detail="Connexion impossible.")

    user_row = db.query(User).filter(User.email == payload.email.lower()).first()
    nom = user_row.nom if user_row else (data.get("user", {}).get("user_metadata") or {}).get("nom", "Étudiant")
    user = _sync_user_from_token(db, access_token, nom)
    return TokenResponse(
        access_token=access_token,
        user=UserResponse(id=user.id, nom=user.nom, email=user.email),
    )


@router.post("/sync", response_model=UserResponse)
def sync_profile(
    payload: UserSync,
    credentials: HTTPAuthorizationCredentials = Depends(bearer),
    db: Session = Depends(get_db),
):
    user = _sync_user_from_token(db, credentials.credentials, payload.nom)
    return UserResponse(id=user.id, nom=user.nom, email=user.email)


@router.get("/me", response_model=UserResponse)
def me(current_user: User = Depends(get_current_user)):
    return UserResponse(id=current_user.id, nom=current_user.nom, email=current_user.email)

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.core.security import decode_access_token, decode_supabase_token
from app.db.database import get_db
from app.models.user import User

security_scheme = HTTPBearer()


def _user_from_supabase_payload(db: Session, payload: dict) -> User | None:
    sub = payload.get("sub")
    email = (payload.get("email") or "").lower().strip()

    if sub:
        try:
            import uuid

            uid = uuid.UUID(str(sub))
            user = db.query(User).filter(User.supabase_id == uid).first()
            if user:
                return user
        except ValueError:
            pass

    if email:
        return db.query(User).filter(User.email == email).first()
    return None


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security_scheme),
    db: Session = Depends(get_db),
) -> User:
    token = credentials.credentials

    sb_payload = decode_supabase_token(token)
    if sb_payload:
        user = _user_from_supabase_payload(db, sb_payload)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Profil non synchronisé. Reconnectez-vous après confirmation email.",
                headers={"WWW-Authenticate": "Bearer"},
            )
        return user

    payload = decode_access_token(token)
    if payload and "sub" in payload:
        user = db.query(User).filter(User.id == int(payload["sub"])).first()
        if user:
            return user

    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Token invalide ou expiré.",
        headers={"WWW-Authenticate": "Bearer"},
    )

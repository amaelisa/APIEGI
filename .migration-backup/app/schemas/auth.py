from pydantic import BaseModel, EmailStr, Field


class UserRegister(BaseModel):
    nom: str = Field(..., min_length=2, max_length=120)
    email: EmailStr
    mot_de_passe: str = Field(..., min_length=6, max_length=128)


class VerifyEmailRequest(BaseModel):
    email: EmailStr
    code: str = Field(..., min_length=6, max_length=8)
    nom: str = Field(..., min_length=2, max_length=120)


class ResendCodeRequest(BaseModel):
    email: EmailStr


class UserLogin(BaseModel):
    email: EmailStr
    mot_de_passe: str = Field(..., min_length=1)


class UserSync(BaseModel):
    nom: str = Field(..., min_length=2, max_length=120)


class UserResponse(BaseModel):
    id: int
    nom: str
    email: str
    email_confirmed: bool = True

    model_config = {"from_attributes": True}


class RegisterPendingResponse(BaseModel):
    message: str
    email: str
    needs_confirmation: bool = True


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

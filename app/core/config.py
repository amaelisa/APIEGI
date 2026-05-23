from pydantic_settings import BaseSettings, SettingsConfigDict

from app.core.paths import PROJECT_ROOT


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=str(PROJECT_ROOT / ".env"),
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
    )

    DATABASE_URL: str = ""

    SUPABASE_URL: str = ""
    SUPABASE_ANON_KEY: str = ""
    SUPABASE_SERVICE_ROLE_KEY: str = ""
    SUPABASE_JWT_SECRET: str = ""
    SUPABASE_ACCESS_TOKEN: str = ""

    JWT_SECRET_KEY: str = "changez-moi-en-production-cle-secrete-longue"
    JWT_ALGORITHM: str = "HS256"
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7

    GEMINI_API_KEY: str = ""

    APP_NAME: str = "Assistant Pédagogique IA-GI"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = True


settings = Settings()

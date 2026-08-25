from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    # App
    app_name: str = "LifeOS AI"
    debug: bool = True

    # Database
    database_url: str = "sqlite+aiosqlite:///./lifeos.db"

    # JWT
    jwt_secret: str = "dev-secret-change-in-production"
    jwt_algorithm: str = "HS256"
    jwt_expire_minutes: int = 60 * 24 * 7  # 7 days

    # OpenAI (optional)
    openai_api_key: str = ""

    # CORS
    cors_origins: str = "http://localhost:5173,http://localhost:3000,https://brilliant-kleicha-6387ac.netlify.app,*"

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}


@lru_cache()
def get_settings() -> Settings:
    return Settings()

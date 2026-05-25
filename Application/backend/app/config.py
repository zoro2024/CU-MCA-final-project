from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    database_url: str = "postgresql+psycopg://loglens:loglens@localhost:5432/loglens"
    redis_url: str = "redis://localhost:6379/0"

    # Gemini via OpenAI-compatible endpoint (free tier at https://aistudio.google.com/apikey)
    gemini_api_key: str = ""
    gemini_base_url: str = "https://generativelanguage.googleapis.com/v1beta/openai/"
    gemini_model: str = "gemini-2.0-flash"

    cache_ttl_seconds: int = 3600

    class Config:
        env_file = ".env"
        case_sensitive = False

settings = Settings()

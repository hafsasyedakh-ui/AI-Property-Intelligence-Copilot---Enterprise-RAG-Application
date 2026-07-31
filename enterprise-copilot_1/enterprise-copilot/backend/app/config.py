from pydantic_settings import BaseSettings
from pathlib import Path


class Settings(BaseSettings):
    openai_api_key: str = ""
    database_url: str = "sqlite:///./copilot.db"
    upload_dir: str = "./uploads"
    embedding_model: str = "text-embedding-3-small"
    chat_model: str = "gpt-4o-mini"
    chunk_size_tokens: int = 500
    chunk_overlap_tokens: int = 100
    secret_key: str = "dev-secret-change-me"

    class Config:
        env_file = ".env"


settings = Settings()
Path(settings.upload_dir).mkdir(parents=True, exist_ok=True)

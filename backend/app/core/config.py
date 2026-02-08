from pydantic_settings import BaseSettings
from functools import lru_cache
import os


class Settings(BaseSettings):
    app_env: str = "development"
    app_port: int = 8000

    database_url: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/job_search_assistant"

    openai_api_key: str = ""
    embedding_model: str = "text-embedding-3-small"
    embedding_dimensions: int = 1536
    llm_model: str = "gpt-4o"

    cors_origins: str = "http://localhost:5173"

    chunk_size: int = 500
    chunk_overlap: int = 50

    class Config:
        env_file = os.path.join(os.path.dirname(__file__), "..", "..", ".env")


@lru_cache()
def get_settings() -> Settings:
    return Settings()
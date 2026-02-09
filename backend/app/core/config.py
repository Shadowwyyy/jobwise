from pydantic_settings import BaseSettings
from pydantic import Field
from functools import lru_cache
import os


class Settings(BaseSettings):
    app_env: str = "development"
    app_port: int = 8000

    db_url: str = Field(
        default="postgresql+asyncpg://postgres:postgres@localhost:5432/job_search_assistant", alias="DATABASE_URL")

    openai_key: str = Field(default="", alias="OPENAI_API_KEY")
    embed_model: str = "text-embedding-3-small"
    embed_dims: int = 1536
    llm: str = "gpt-4o"

    cors_origins: str = "http://localhost:5173"

    chunk_sz: int = 500
    chunk_overlap: int = 50

    class Config:
        env_file = os.path.join(os.path.dirname(__file__), "..", "..", ".env")
        populate_by_name = True


@lru_cache()
def get_settings() -> Settings:
    return Settings()

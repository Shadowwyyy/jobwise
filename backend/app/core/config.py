from pydantic_settings import BaseSettings
from pydantic import Field
from functools import lru_cache
import os


class Settings(BaseSettings):
    app_env: str = "development"
    app_port: int = 8000

    db_url: str = Field(
        default="postgresql+asyncpg://postgres:postgres@localhost:5432/job_search_assistant", alias="DATABASE_URL")

    # provider: "openai" or "gemini"
    ai_provider: str = "gemini"

    openai_key: str = Field(default="", alias="OPENAI_API_KEY")
    gemini_key: str = Field(default="", alias="GEMINI_API_KEY")

    # openai settings
    openai_embed_model: str = "text-embedding-3-small"
    openai_embed_dims: int = 1536
    openai_llm: str = "gpt-4o"

    # gemini settings
    gemini_embed_model: str = "gemini-embedding-001"
    gemini_embed_dims: int = 3072
    gemini_llm: str = "gemini-2.0-flash"

    cors_origins: str = "http://localhost:5173"

    chunk_sz: int = 500
    chunk_overlap: int = 50

    @property
    def embed_dims(self) -> int:
        if self.ai_provider == "openai":
            return self.openai_embed_dims
        return self.gemini_embed_dims

    class Config:
        env_file = os.path.join(os.path.dirname(__file__), "..", "..", ".env")
        populate_by_name = True


@lru_cache()
def get_settings() -> Settings:
    return Settings()

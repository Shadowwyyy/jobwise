from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import DeclarativeBase
from app.core.config import get_settings

cfg = get_settings()

engine = create_async_engine(cfg.db_url, echo=cfg.app_env == "development")
session_factory = async_sessionmaker(
    engine, class_=AsyncSession, expire_on_commit=False)


class Base(DeclarativeBase):
    pass


async def get_db() -> AsyncSession:
    async with session_factory() as sesh:
        try:
            yield sesh
        finally:
            await sesh.close()


async def init_db():
    async with engine.begin() as conn:
        # pgvector needs this extension
        await conn.execute(
            __import__("sqlalchemy").text(
                "CREATE EXTENSION IF NOT EXISTS vector")
        )
        await conn.run_sync(Base.metadata.create_all)

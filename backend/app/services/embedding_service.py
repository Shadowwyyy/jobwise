from openai import AsyncOpenAI
from app.core.config import get_settings

cfg = get_settings()
client = AsyncOpenAI(api_key=cfg.openai_key)


async def embed_batch(texts: list[str]) -> list[list[float]]:
    """embed multiple texts at once"""
    resp = await client.embeddings.create(
        model=cfg.embed_model,
        input=texts,
    )
    return [item.embedding for item in resp.data]


async def embed_one(text: str) -> list[float]:
    """single text shortcut"""
    result = await embed_batch([text])
    return result[0]

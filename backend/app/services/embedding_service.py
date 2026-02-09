import google.generativeai as genai
from openai import AsyncOpenAI
from app.core.config import get_settings

cfg = get_settings()

# setup clients
if cfg.ai_provider == "openai":
    openai_client = AsyncOpenAI(api_key=cfg.openai_key)

if cfg.ai_provider == "gemini":
    genai.configure(api_key=cfg.gemini_key)


async def embed_batch(texts: list[str]) -> list[list[float]]:
    """embed multiple texts using whichever provider is configured"""
    if cfg.ai_provider == "openai":
        resp = await openai_client.embeddings.create(
            model=cfg.openai_embed_model,
            input=texts,
        )
        return [item.embedding for item in resp.data]

    # gemini - sync api, but fast enough
    result = genai.embed_content(
        model=cfg.gemini_embed_model,
        content=texts,
        task_type="retrieval_document",
    )
    return result["embedding"]


async def embed_one(text: str) -> list[float]:
    """single text shortcut"""
    if cfg.ai_provider == "openai":
        result = await embed_batch([text])
        return result[0]

    result = genai.embed_content(
        model=cfg.gemini_embed_model,
        content=text,
        task_type="retrieval_query",
    )
    return result["embedding"]

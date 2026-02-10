from google import genai
from openai import AsyncOpenAI
from app.core.config import get_settings

cfg = get_settings()

if cfg.ai_provider == "openai":
    openai_client = AsyncOpenAI(api_key=cfg.openai_key)

if cfg.ai_provider == "gemini":
    gemini_client = genai.Client(api_key=cfg.gemini_key)


async def embed_batch(texts: list[str]) -> list[list[float]]:
    if cfg.ai_provider == "openai":
        resp = await openai_client.embeddings.create(
            model=cfg.openai_embed_model,
            input=texts,
        )
        return [item.embedding for item in resp.data]

    # gemini new sdk
    results = []
    for t in texts:
        resp = gemini_client.models.embed_content(
            model=cfg.gemini_embed_model,
            contents=t,
        )
        results.append(resp.embeddings[0].values)
    return results


async def embed_one(text: str) -> list[float]:
    if cfg.ai_provider == "openai":
        result = await embed_batch([text])
        return result[0]

    resp = gemini_client.models.embed_content(
        model=cfg.gemini_embed_model,
        contents=text,
    )
    return resp.embeddings[0].values

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models import ResumeChunk
from app.services.embedding_service import embed_one


async def find_relevant_chunks(db: AsyncSession, rid: str, query: str, top_k: int = 5) -> list[dict]:
    """vector similarity search against resume chunks"""

    qvec = await embed_one(query)

    # Use SQLAlchemy ORM with pgvector's built-in distance method
    stmt = (
        select(
            ResumeChunk.id,
            ResumeChunk.content,
            ResumeChunk.section,
            ResumeChunk.idx,
            (1 - ResumeChunk.embedding.cosine_distance(qvec)).label('sim')
        )
        .where(ResumeChunk.resume_id == rid)
        .order_by(ResumeChunk.embedding.cosine_distance(qvec))
        .limit(top_k)
    )

    result = await db.execute(stmt)
    rows = result.fetchall()

    return [
        {
            "id": r.id,
            "content": r.content,
            "section": r.section,
            "index": r.idx,
            "similarity": round(float(r.sim), 4),
        }
        for r in rows
    ]


def build_context(chunks: list[dict]) -> str:
    """stitch chunks into a context string for the llm"""
    parts = []
    for ch in chunks:
        label = ch.get("section", "general").upper()
        parts.append(f"[{label}] {ch['content']}")
    return "\n\n---\n\n".join(parts)

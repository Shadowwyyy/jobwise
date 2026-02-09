from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from app.services.embedding_service import embed_one


async def find_relevant_chunks(db: AsyncSession, rid: str, query: str, top_k: int = 5) -> list[dict]:
    """vector similarity search against resume chunks"""

    qvec = await embed_one(query)

    rows = await db.execute(
        text("""
            SELECT id, content, section, idx,
                   1 - (embedding <=> :qvec::vector) as sim
            FROM resume_chunks
            WHERE resume_id = :rid
            ORDER BY embedding <=> :qvec::vector
            LIMIT :k
        """),
        {"qvec": str(qvec), "rid": rid, "k": top_k},
    )

    return [
        {
            "id": r.id,
            "content": r.content,
            "section": r.section,
            "index": r.idx,
            "similarity": round(float(r.sim), 4),
        }
        for r in rows.fetchall()
    ]


def build_context(chunks: list[dict]) -> str:
    """stitch chunks into a context string for the llm"""
    parts = []
    for ch in chunks:
        label = ch.get("section", "general").upper()
        parts.append(f"[{label}] {ch['content']}")
    return "\n\n---\n\n".join(parts)

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models import JobDescription, JDChunk
from app.utils.chunker import chunk_text
from app.services.embedding_service import embed_batch


async def process_jd(db: AsyncSession, title: str, raw_text: str, company: str = None, url: str = None) -> JobDescription:
    """store and embed a job description"""

    jd = JobDescription(title=title, company=company,
                        url=url, raw_text=raw_text)
    db.add(jd)
    await db.flush()

    chunks = chunk_text(raw_text)
    if chunks:
        embeds = await embed_batch(chunks)
        for i, (content, emb) in enumerate(zip(chunks, embeds)):
            ch = JDChunk(jd_id=jd.id, content=content, idx=i, embedding=emb)
            db.add(ch)

    await db.commit()
    await db.refresh(jd)
    return jd


async def get_jd(db: AsyncSession, jid: str) -> JobDescription | None:
    result = await db.execute(
        select(JobDescription).where(JobDescription.id == jid)
    )
    return result.scalar_one_or_none()


async def get_all_jds(db: AsyncSession) -> list[JobDescription]:
    result = await db.execute(
        select(JobDescription).order_by(JobDescription.created_at.desc())
    )
    return result.scalars().all()

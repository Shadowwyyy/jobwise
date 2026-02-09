from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models import Resume, ResumeChunk
from app.utils.pdf_parser import extract_text, split_into_sections
from app.utils.chunker import chunk_by_section, chunk_text
from app.services.embedding_service import embed_batch


async def process_resume(db: AsyncSession, fname: str, raw_bytes: bytes) -> Resume:
    """parse pdf, chunk it, embed chunks, save to db"""

    txt = extract_text(raw_bytes)
    sections = split_into_sections(txt)

    res = Resume(filename=fname, raw_text=txt, parsed_data=sections)
    db.add(res)
    await db.flush()

    # chunk by section if we found multiple, otherwise just chunk the whole thing
    if sections and len(sections) > 1:
        chunks = chunk_by_section(sections)
    else:
        raw = chunk_text(txt)
        chunks = [
            {"content": c, "section": "general", "index": i}
            for i, c in enumerate(raw)
        ]

    if not chunks:
        await db.commit()
        return res

    texts = [c["content"] for c in chunks]
    embeds = await embed_batch(texts)

    for info, emb in zip(chunks, embeds):
        ch = ResumeChunk(
            resume_id=res.id,
            content=info["content"],
            idx=info["index"],
            section=info["section"],
            embedding=emb,
        )
        db.add(ch)

    await db.commit()
    await db.refresh(res)
    return res


async def get_resume(db: AsyncSession, rid: str) -> Resume | None:
    result = await db.execute(select(Resume).where(Resume.id == rid))
    return result.scalar_one_or_none()


async def get_all(db: AsyncSession) -> list[Resume]:
    result = await db.execute(select(Resume).order_by(Resume.created_at.desc()))
    return result.scalars().all()


async def get_chunks(db: AsyncSession, rid: str) -> list[ResumeChunk]:
    result = await db.execute(
        select(ResumeChunk)
        .where(ResumeChunk.resume_id == rid)
        .order_by(ResumeChunk.idx)
    )
    return result.scalars().all()

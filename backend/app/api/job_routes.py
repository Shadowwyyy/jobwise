from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.services.jd_service import process_jd, get_all_jds, get_jd

router = APIRouter()


class JDCreate(BaseModel):
    title: str
    raw_text: str
    company: str | None = None
    url: str | None = None


@router.post("/")
async def create(payload: JDCreate, db: AsyncSession = Depends(get_db)):
    jd = await process_jd(
        db,
        title=payload.title,
        raw_text=payload.raw_text,
        company=payload.company,
        url=payload.url,
    )
    return {
        "id": jd.id,
        "title": jd.title,
        "company": jd.company,
        "created_at": jd.created_at.isoformat(),
    }


@router.get("/")
async def list_all(db: AsyncSession = Depends(get_db)):
    jobs = await get_all_jds(db)
    return [
        {
            "id": j.id,
            "title": j.title,
            "company": j.company,
            "created_at": j.created_at.isoformat(),
        }
        for j in jobs
    ]


@router.get("/{jid}")
async def detail(jid: str, db: AsyncSession = Depends(get_db)):
    jd = await get_jd(db, jid)
    if not jd:
        raise HTTPException(
            status_code=404, detail="Job description not found")
    return {
        "id": jd.id,
        "title": jd.title,
        "company": jd.company,
        "raw_text": jd.raw_text,
        "extracted_skills": jd.extracted_skills,
        "created_at": jd.created_at.isoformat(),
    }


@router.delete("/{jid}")
async def delete_job(jid: str, db: AsyncSession = Depends(get_db)):
    jd = await get_jd(db, jid)
    if not jd:
        raise HTTPException(status_code=404, detail="Job not found")

    await db.delete(jd)
    await db.commit()
    return {"deleted": True}

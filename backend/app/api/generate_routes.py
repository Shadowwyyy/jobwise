from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.services.generation_service import analyze_match, write_cover_letter, prep_interview
from app.services.resume_service import get_resume
from app.services.jd_service import get_jd

router = APIRouter(prefix="/generate", tags=["generate"])


class MatchReq(BaseModel):
    resume_id: str
    jd_id: str | None = None
    job_text: str | None = None


class CoverReq(BaseModel):
    resume_id: str
    jd_id: str | None = None
    job_text: str | None = None
    company_name: str = ""
    job_title: str = ""
    tone: str = "professional"


class InterviewReq(BaseModel):
    resume_id: str
    jd_id: str | None = None
    job_text: str | None = None
    company_name: str = ""
    num_questions: int = 8


async def resolve_jd_text(db: AsyncSession, jd_id: str | None, job_text: str | None) -> str:
    """grab job text from either id or raw input"""
    if job_text:
        return job_text
    if jd_id:
        jd = await get_jd(db, jd_id)
        if jd:
            return jd.raw_text
    raise HTTPException(
        status_code=400, detail="Need either jd_id or job_text")


@router.post("/match")
async def match(payload: MatchReq, db: AsyncSession = Depends(get_db)):
    res = await get_resume(db, payload.resume_id)
    if not res:
        raise HTTPException(status_code=404, detail="Resume not found")

    txt = await resolve_jd_text(db, payload.jd_id, payload.job_text)
    result = await analyze_match(db, payload.resume_id, txt)
    return result


@router.post("/cover-letter")
async def cover_letter(payload: CoverReq, db: AsyncSession = Depends(get_db)):
    res = await get_resume(db, payload.resume_id)
    if not res:
        raise HTTPException(status_code=404, detail="Resume not found")

    txt = await resolve_jd_text(db, payload.jd_id, payload.job_text)
    letter = await write_cover_letter(
        db,
        rid=payload.resume_id,
        job_text=txt,
        company=payload.company_name,
        role=payload.job_title,
        tone=payload.tone,
    )
    return {"cover_letter": letter}


@router.post("/interview-prep")
async def interview(payload: InterviewReq, db: AsyncSession = Depends(get_db)):
    res = await get_resume(db, payload.resume_id)
    if not res:
        raise HTTPException(status_code=404, detail="Resume not found")

    txt = await resolve_jd_text(db, payload.jd_id, payload.job_text)
    questions = await prep_interview(
        db,
        rid=payload.resume_id,
        job_text=txt,
        company=payload.company_name,
        num_q=payload.num_questions,
    )
    return {"questions": questions}

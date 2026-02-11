from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.models import GeneratedContent
from app.services.generation_service import analyze_match, write_cover_letter, prep_interview
from app.services.resume_service import get_resume
from app.services.jd_service import get_jd

router = APIRouter()


class MatchRequest(BaseModel):
    resume_id: str
    jd_id: str


class CoverRequest(BaseModel):
    resume_id: str
    jd_id: str
    company_name: str = ""
    job_title: str = ""


class InterviewRequest(BaseModel):
    resume_id: str
    jd_id: str
    company_name: str = ""


@router.post("/match")
async def match(payload: MatchRequest, db: AsyncSession = Depends(get_db)):
    resume = await get_resume(db, payload.resume_id)
    jd = await get_jd(db, payload.jd_id)

    result = await analyze_match(db, payload.resume_id, jd.raw_text)

    # Save to database
    content = GeneratedContent(
        resume_id=payload.resume_id,
        jd_id=payload.jd_id,
        kind="match",
        body=str(result),
        meta=result
    )
    db.add(content)
    await db.commit()

    return result


@router.post("/cover-letter")
async def cover_letter(payload: CoverRequest, db: AsyncSession = Depends(get_db)):
    jd = await get_jd(db, payload.jd_id)

    letter = await write_cover_letter(
        db,
        payload.resume_id,
        jd.raw_text,
        payload.company_name,
        payload.job_title
    )

    # Save to database
    content = GeneratedContent(
        resume_id=payload.resume_id,
        jd_id=payload.jd_id,
        kind="cover_letter",
        body=letter,
        meta={"company": payload.company_name, "title": payload.job_title}
    )
    db.add(content)
    await db.commit()

    return {"cover_letter": letter}


@router.post("/interview-prep")
async def interview(payload: InterviewRequest, db: AsyncSession = Depends(get_db)):
    jd = await get_jd(db, payload.jd_id)

    questions = await prep_interview(
        db,
        payload.resume_id,
        jd.raw_text,
        payload.company_name
    )

    # Save to database
    content = GeneratedContent(
        resume_id=payload.resume_id,
        jd_id=payload.jd_id,
        kind="interview",
        body=str(questions),
        meta={"questions": questions}
    )
    db.add(content)
    await db.commit()

    return {"questions": questions}

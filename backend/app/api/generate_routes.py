from fastapi import APIRouter, Depends, HTTPException
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


async def _get_resume_and_jd(db: AsyncSession, resume_id: str, jd_id: str):
    """Shared helper to fetch and validate resume + JD"""
    resume = await get_resume(db, resume_id)
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")

    jd = await get_jd(db, jd_id)
    if not jd:
        raise HTTPException(
            status_code=404, detail="Job description not found")

    if not jd.raw_text or not jd.raw_text.strip():
        raise HTTPException(
            status_code=422, detail="Job description has no content")

    if not resume.raw_text or not resume.raw_text.strip():
        raise HTTPException(
            status_code=422, detail="Resume has no readable content")

    return resume, jd


@router.post("/match")
async def match(payload: MatchRequest, db: AsyncSession = Depends(get_db)):
    resume, jd = await _get_resume_and_jd(db, payload.resume_id, payload.jd_id)

    try:
        result = await analyze_match(db, payload.resume_id, jd.raw_text)
    except Exception as e:
        print(f"Match analysis failed: {e}")
        raise HTTPException(
            status_code=503,
            detail="AI analysis failed. This may be a quota issue — please try again shortly."
        )

    if not result:
        raise HTTPException(
            status_code=500, detail="Match analysis returned no result")

    try:
        content = GeneratedContent(
            resume_id=payload.resume_id,
            jd_id=payload.jd_id,
            kind="match",
            body=str(result),
            meta=result
        )
        db.add(content)
        await db.commit()
    except Exception as e:
        print(f"Failed to save match result: {e}")
        # Don't fail the request just because saving failed

    return result


@router.post("/cover-letter")
async def cover_letter(payload: CoverRequest, db: AsyncSession = Depends(get_db)):
    resume, jd = await _get_resume_and_jd(db, payload.resume_id, payload.jd_id)

    try:
        letter = await write_cover_letter(
            db,
            payload.resume_id,
            jd.raw_text,
            payload.company_name,
            payload.job_title
        )
    except Exception as e:
        print(f"Cover letter generation failed: {e}")
        raise HTTPException(
            status_code=503,
            detail="AI generation failed. This may be a quota issue — please try again shortly."
        )

    if not letter or not letter.strip():
        raise HTTPException(
            status_code=500, detail="Cover letter generation returned empty content")

    try:
        content = GeneratedContent(
            resume_id=payload.resume_id,
            jd_id=payload.jd_id,
            kind="cover_letter",
            body=letter,
            meta={"company": payload.company_name, "title": payload.job_title}
        )
        db.add(content)
        await db.commit()
    except Exception as e:
        print(f"Failed to save cover letter: {e}")

    return {"cover_letter": letter}


@router.post("/interview-prep")
async def interview(payload: InterviewRequest, db: AsyncSession = Depends(get_db)):
    resume, jd = await _get_resume_and_jd(db, payload.resume_id, payload.jd_id)

    try:
        questions = await prep_interview(
            db,
            payload.resume_id,
            jd.raw_text,
            payload.company_name
        )
    except Exception as e:
        print(f"Interview prep failed: {e}")
        raise HTTPException(
            status_code=503,
            detail="AI generation failed. This may be a quota issue — please try again shortly."
        )

    if not questions:
        raise HTTPException(
            status_code=500, detail="Interview prep returned no questions")

    try:
        content = GeneratedContent(
            resume_id=payload.resume_id,
            jd_id=payload.jd_id,
            kind="interview",
            body=str(questions),
            meta={"questions": questions}
        )
        db.add(content)
        await db.commit()
    except Exception as e:
        print(f"Failed to save interview prep: {e}")

    return {"questions": questions}

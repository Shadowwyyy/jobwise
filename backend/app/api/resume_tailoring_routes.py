from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.services.resume_tailoring_service import generate_resume_suggestions, build_tailored_resume
from app.services.resume_service import get_resume
from app.services.jd_service import get_jd
from fastapi.responses import Response
from app.utils.pdf_generator import generate_resume_pdf

router = APIRouter()


class TailorRequest(BaseModel):
    resume_id: str
    jd_id: str


class FinalizeRequest(BaseModel):
    resume_id: str
    jd_id: str
    # {"header": "improved text", "skills": "improved text", ...}
    approved_sections: dict
    first_name: str
    last_name: str


@router.post("/suggest")
async def suggest_improvements(payload: TailorRequest, db: AsyncSession = Depends(get_db)):
    """Generate tailoring suggestions for resume"""

    try:
        suggestions = await generate_resume_suggestions(
            db,
            payload.resume_id,
            payload.jd_id
        )
        return suggestions
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/finalize")
async def finalize_resume(payload: FinalizeRequest, db: AsyncSession = Depends(get_db)):
    """Build final tailored resume from approved sections"""

    resume = await get_resume(db, payload.resume_id)
    jd = await get_jd(db, payload.jd_id)

    if not resume or not jd:
        raise HTTPException(status_code=404, detail="Resume or JD not found")

    resume_text, filename = build_tailored_resume(
        resume.parsed_data,
        payload.approved_sections,
        payload.first_name,
        payload.last_name,
        jd.company or "Company"
    )

    return {
        "resume_text": resume_text,
        "filename": filename
    }


@router.post("/finalize")
async def finalize_resume(payload: FinalizeRequest, db: AsyncSession = Depends(get_db)):
    """Build final tailored resume from approved sections"""

    resume = await get_resume(db, payload.resume_id)
    jd = await get_jd(db, payload.jd_id)

    if not resume or not jd:
        raise HTTPException(status_code=404, detail="Resume or JD not found")

    resume_text, filename = build_tailored_resume(
        resume.parsed_data,
        payload.approved_sections,
        payload.first_name,
        payload.last_name,
        jd.company or "Company"
    )

    # Generate PDF
    pdf_bytes = generate_resume_pdf(resume_text, filename)

    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f"attachment; filename={filename}"
        }
    )

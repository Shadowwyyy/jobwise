from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from datetime import datetime
from app.core.database import get_db
from app.models import Application, Resume, JobDescription

router = APIRouter()


class ApplicationCreate(BaseModel):
    resume_id: str
    jd_id: str
    status: str = "saved"
    notes: str = None


class ApplicationUpdate(BaseModel):
    status: str = None
    applied_date: str = None
    interview_date: str = None
    follow_up_date: str = None
    notes: str = None
    contact_info: dict = None


def parse_dt(value: str) -> datetime:
    """Parse ISO datetime string and strip timezone info to match DB naive timestamps"""
    return datetime.fromisoformat(value.replace('Z', '+00:00')).replace(tzinfo=None)


@router.post("/")
async def create_application(payload: ApplicationCreate, db: AsyncSession = Depends(get_db)):
    """Create a new application tracker"""

    app = Application(
        resume_id=payload.resume_id,
        jd_id=payload.jd_id,
        status=payload.status,
        notes=payload.notes
    )
    db.add(app)
    await db.commit()
    await db.refresh(app)

    return {"id": app.id, "status": app.status, "created_at": app.created_at.isoformat()}


@router.get("/")
async def get_all_applications(db: AsyncSession = Depends(get_db)):
    """Get all applications with resume and job info"""

    result = await db.execute(
        select(
            Application,
            Resume.filename,
            JobDescription.title,
            JobDescription.company
        )
        .join(Resume, Resume.id == Application.resume_id)
        .join(JobDescription, JobDescription.id == Application.jd_id)
        .order_by(desc(Application.updated_at))
    )

    apps = []
    for row in result.fetchall():
        apps.append({
            "id": row.Application.id,
            "status": row.Application.status,
            "resume": {"id": row.Application.resume_id, "filename": row.filename},
            "job": {
                "id": row.Application.jd_id,
                "title": row.title,
                "company": row.company
            },
            "applied_date": row.Application.applied_date.isoformat() if row.Application.applied_date else None,
            "interview_date": row.Application.interview_date.isoformat() if row.Application.interview_date else None,
            "follow_up_date": row.Application.follow_up_date.isoformat() if row.Application.follow_up_date else None,
            "notes": row.Application.notes,
            "contact_info": row.Application.contact_info,
            "created_at": row.Application.created_at.isoformat(),
            "updated_at": row.Application.updated_at.isoformat()
        })

    return {"applications": apps}


@router.get("/{app_id}")
async def get_application(app_id: str, db: AsyncSession = Depends(get_db)):
    """Get single application details"""

    app = await db.get(Application, app_id)
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")

    return {
        "id": app.id,
        "resume_id": app.resume_id,
        "jd_id": app.jd_id,
        "status": app.status,
        "applied_date": app.applied_date.isoformat() if app.applied_date else None,
        "interview_date": app.interview_date.isoformat() if app.interview_date else None,
        "follow_up_date": app.follow_up_date.isoformat() if app.follow_up_date else None,
        "notes": app.notes,
        "contact_info": app.contact_info,
        "created_at": app.created_at.isoformat(),
        "updated_at": app.updated_at.isoformat()
    }


@router.patch("/{app_id}")
async def update_application(app_id: str, payload: ApplicationUpdate, db: AsyncSession = Depends(get_db)):
    """Update application status and details"""

    app = await db.get(Application, app_id)
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")

    if payload.status:
        app.status = payload.status
    if payload.notes is not None:
        app.notes = payload.notes
    if payload.contact_info is not None:
        app.contact_info = payload.contact_info
    if payload.applied_date:
        app.applied_date = parse_dt(payload.applied_date)
    if payload.interview_date:
        app.interview_date = parse_dt(payload.interview_date)
    if payload.follow_up_date:
        app.follow_up_date = parse_dt(payload.follow_up_date)

    app.updated_at = datetime.utcnow()

    await db.commit()
    await db.refresh(app)

    return {"id": app.id, "status": app.status, "updated_at": app.updated_at.isoformat()}


@router.delete("/{app_id}")
async def delete_application(app_id: str, db: AsyncSession = Depends(get_db)):
    """Delete an application"""

    app = await db.get(Application, app_id)
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")

    await db.delete(app)
    await db.commit()

    return {"deleted": True}

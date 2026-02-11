from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from app.core.database import get_db
from app.models import GeneratedContent, Resume, JobDescription

router = APIRouter()


@router.get("/")
async def get_all_history(
    content_type: str = None,
    limit: int = 50,
    db: AsyncSession = Depends(get_db)
):
    """Get history of all generated content"""

    query = select(
        GeneratedContent,
        Resume.filename.label('resume_name'),
        JobDescription.title.label('job_title'),
        JobDescription.company
    ).join(
        Resume, Resume.id == GeneratedContent.resume_id
    ).join(
        JobDescription, JobDescription.id == GeneratedContent.jd_id
    ).order_by(desc(GeneratedContent.created_at))

    if content_type:
        query = query.where(GeneratedContent.kind == content_type)

    query = query.limit(limit)

    result = await db.execute(query)
    rows = result.fetchall()

    return {
        "items": [
            {
                "id": row.GeneratedContent.id,
                "type": row.GeneratedContent.kind,
                "content": row.GeneratedContent.body,
                "metadata": row.GeneratedContent.meta,
                "resume": {
                    "id": row.GeneratedContent.resume_id,
                    "filename": row.resume_name
                },
                "job": {
                    "id": row.GeneratedContent.jd_id,
                    "title": row.job_title,
                    "company": row.company
                },
                "created_at": row.GeneratedContent.created_at.isoformat()
            }
            for row in rows
        ]
    }


@router.get("/{content_id}")
async def get_content_by_id(content_id: str, db: AsyncSession = Depends(get_db)):
    """Get specific generated content by ID"""

    result = await db.execute(
        select(
            GeneratedContent,
            Resume.filename.label('resume_name'),
            JobDescription.title.label('job_title'),
            JobDescription.company
        )
        .join(Resume, Resume.id == GeneratedContent.resume_id)
        .join(JobDescription, JobDescription.id == GeneratedContent.jd_id)
        .where(GeneratedContent.id == content_id)
    )

    row = result.fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Content not found")

    return {
        "id": row.GeneratedContent.id,
        "type": row.GeneratedContent.kind,
        "content": row.GeneratedContent.body,
        "metadata": row.GeneratedContent.meta,
        "resume": {
            "id": row.GeneratedContent.resume_id,
            "filename": row.resume_name
        },
        "job": {
            "id": row.GeneratedContent.jd_id,
            "title": row.job_title,
            "company": row.company
        },
        "created_at": row.GeneratedContent.created_at.isoformat()
    }


@router.delete("/{content_id}")
async def delete_content(content_id: str, db: AsyncSession = Depends(get_db)):
    """Delete generated content"""

    content = await db.get(GeneratedContent, content_id)
    if not content:
        raise HTTPException(status_code=404, detail="Content not found")

    await db.delete(content)
    await db.commit()

    return {"deleted": True, "id": content_id}

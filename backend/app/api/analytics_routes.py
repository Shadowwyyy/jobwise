from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc
from datetime import datetime, timedelta
from app.core.database import get_db
from app.models import ActivityLog, Resume, JobDescription, GeneratedContent

router = APIRouter()


@router.get("/stats")
async def get_stats(db: AsyncSession = Depends(get_db)):
    """Get overall analytics stats"""
    try:
        total_resumes = await db.scalar(select(func.count(Resume.id)))
        total_jds = await db.scalar(select(func.count(JobDescription.id)))
        total_content = await db.scalar(select(func.count(GeneratedContent.id)))
    except Exception as e:
        print(f"Failed to fetch stats totals: {e}")
        raise HTTPException(
            status_code=500, detail="Failed to retrieve analytics stats")

    try:
        content_by_type = await db.execute(
            select(
                GeneratedContent.kind,
                func.count(GeneratedContent.id).label('cnt')
            ).group_by(GeneratedContent.kind)
        )
        type_counts = {row.kind: row.cnt for row in content_by_type.fetchall()}
    except Exception as e:
        print(f"Failed to fetch content breakdown: {e}")
        type_counts = {}

    try:
        week_ago = datetime.utcnow() - timedelta(days=7)
        recent_activity = await db.execute(
            select(
                func.date(ActivityLog.created_at).label('day'),
                ActivityLog.action_type,
                func.count(ActivityLog.id).label('cnt')
            )
            .where(ActivityLog.created_at >= week_ago)
            .group_by(func.date(ActivityLog.created_at), ActivityLog.action_type)
            .order_by(desc(func.date(ActivityLog.created_at)))
        )
        activity_data = [
            {"date": str(row.day), "action": row.action_type, "count": row.cnt}
            for row in recent_activity.fetchall()
        ]
    except Exception as e:
        print(f"Failed to fetch recent activity: {e}")
        activity_data = []

    return {
        "totals": {
            "resumes": total_resumes or 0,
            "job_descriptions": total_jds or 0,
            "generated_content": total_content or 0
        },
        "by_type": {
            "cover_letters": type_counts.get("cover_letter", 0),
            "matches": type_counts.get("match", 0),
            "interview_preps": type_counts.get("interview", 0)
        },
        "recent_activity": activity_data
    }


@router.get("/history")
async def get_history(
    limit: int = 20,
    db: AsyncSession = Depends(get_db)
):
    """Get recent activity history"""
    if limit < 1 or limit > 100:
        raise HTTPException(
            status_code=400, detail="Limit must be between 1 and 100")

    try:
        logs = await db.execute(
            select(ActivityLog)
            .order_by(desc(ActivityLog.created_at))
            .limit(limit)
        )
    except Exception as e:
        print(f"Failed to fetch history: {e}")
        raise HTTPException(
            status_code=500, detail="Failed to retrieve history")

    results = []
    for log in logs.scalars().all():
        results.append({
            "id": log.id,
            "action": log.action_type,
            "resume_id": log.resume_id,
            "jd_id": log.jd_id,
            "metadata": log.metadata_json,
            "timestamp": log.created_at.isoformat()
        })

    return {"history": results}

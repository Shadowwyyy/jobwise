from sqlalchemy.ext.asyncio import AsyncSession
from app.models import ActivityLog


async def log_activity(
    db: AsyncSession,
    action_type: str,
    resume_id: str = None,
    jd_id: str = None,
    metadata: dict = None
):
    """Log user activity for analytics"""
    log = ActivityLog(
        action_type=action_type,
        resume_id=resume_id,
        jd_id=jd_id,
        metadata_json=metadata
    )
    db.add(log)
    await db.commit()

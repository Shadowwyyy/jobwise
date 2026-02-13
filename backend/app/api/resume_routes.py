from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.services.resume_service import process_resume, get_resume, get_all

router = APIRouter()


@router.post("/upload")
async def upload(file: UploadFile = File(...), db: AsyncSession = Depends(get_db)):
    if not file.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDFs allowed")

    raw = await file.read()
    if len(raw) > 10 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File too big, 10MB max")

    res = await process_resume(db, file.filename, raw)

    return {
        "id": res.id,
        "filename": res.filename,
        "sections": list(res.parsed_data.keys()) if res.parsed_data else [],
        "text_preview": res.raw_text[:500],
        "created_at": res.created_at.isoformat(),
    }


@router.get("/")
async def list_all(db: AsyncSession = Depends(get_db)):
    resumes = await get_all(db)
    return [
        {
            "id": r.id,
            "filename": r.filename,
            "sections": list(r.parsed_data.keys()) if r.parsed_data else [],
            "created_at": r.created_at.isoformat(),
        }
        for r in resumes
    ]


@router.get("/{rid}")
async def detail(rid: str, db: AsyncSession = Depends(get_db)):
    res = await get_resume(db, rid)
    if not res:
        raise HTTPException(status_code=404, detail="Resume not found")
    return {
        "id": res.id,
        "filename": res.filename,
        "raw_text": res.raw_text,
        "parsed_data": res.parsed_data,
        "created_at": res.created_at.isoformat(),
    }


@router.delete("/{rid}")
async def delete_resume(rid: str, db: AsyncSession = Depends(get_db)):
    """Delete a resume and all associated chunks"""
    res = await get_resume(db, rid)
    if not res:
        raise HTTPException(status_code=404, detail="Resume not found")

    await db.delete(res)
    await db.commit()

    return {"deleted": True, "id": rid}


@router.delete("/{rid}")
async def delete_resume(rid: str, db: AsyncSession = Depends(get_db)):
    res = await get_resume(db, rid)
    if not res:
        raise HTTPException(status_code=404, detail="Resume not found")

    await db.delete(res)
    await db.commit()
    return {"deleted": True}

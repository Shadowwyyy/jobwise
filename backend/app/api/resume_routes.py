from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.services.resume_service import process_resume, get_resume, get_all

router = APIRouter()


@router.post("/upload")
async def upload(file: UploadFile = File(...), db: AsyncSession = Depends(get_db)):
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file provided")

    if not file.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDFs allowed")

    try:
        raw = await file.read()
    except Exception:
        raise HTTPException(
            status_code=400, detail="Failed to read uploaded file")

    if len(raw) == 0:
        raise HTTPException(status_code=400, detail="Uploaded file is empty")

    if len(raw) > 10 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File too large, 10MB max")

    try:
        res = await process_resume(db, file.filename, raw)
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except Exception as e:
        print(f"Resume processing failed: {e}")
        raise HTTPException(
            status_code=500, detail="Failed to process resume. Make sure the PDF contains readable text.")

    if not res:
        raise HTTPException(
            status_code=500, detail="Resume processing returned no result")

    return {
        "id": res.id,
        "filename": res.filename,
        "sections": list(res.parsed_data.keys()) if res.parsed_data else [],
        "text_preview": res.raw_text[:500] if res.raw_text else "",
        "created_at": res.created_at.isoformat(),
    }


@router.get("/")
async def list_all(db: AsyncSession = Depends(get_db)):
    try:
        resumes = await get_all(db)
    except Exception as e:
        print(f"Failed to fetch resumes: {e}")
        raise HTTPException(
            status_code=500, detail="Failed to retrieve resumes")

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
    if not rid or not rid.strip():
        raise HTTPException(status_code=400, detail="Invalid resume ID")

    try:
        res = await get_resume(db, rid)
    except Exception as e:
        print(f"Failed to fetch resume {rid}: {e}")
        raise HTTPException(
            status_code=500, detail="Failed to retrieve resume")

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
    if not rid or not rid.strip():
        raise HTTPException(status_code=400, detail="Invalid resume ID")

    try:
        res = await get_resume(db, rid)
    except Exception as e:
        print(f"Failed to fetch resume {rid} for deletion: {e}")
        raise HTTPException(
            status_code=500, detail="Failed to retrieve resume")

    if not res:
        raise HTTPException(status_code=404, detail="Resume not found")

    try:
        await db.delete(res)
        await db.commit()
    except Exception as e:
        await db.rollback()
        print(f"Failed to delete resume {rid}: {e}")
        raise HTTPException(status_code=500, detail="Failed to delete resume")

    return {"deleted": True, "id": rid}

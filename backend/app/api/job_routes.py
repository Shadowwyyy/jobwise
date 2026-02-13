import json
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from google import genai
from app.core.database import get_db
from app.core.config import get_settings
from app.services.jd_service import process_jd, get_jd, get_all_jds

cfg = get_settings()
gemini_client = genai.Client(api_key=cfg.gemini_key)

router = APIRouter()


class JDRequest(BaseModel):
    title: str
    raw_text: str
    company: str = None
    url: str = None


@router.post("/")
async def create(payload: JDRequest, db: AsyncSession = Depends(get_db)):
    jd = await process_jd(
        db,
        payload.title,
        payload.raw_text,
        payload.company,
        payload.url
    )
    return {
        "id": jd.id,
        "title": jd.title,
        "company": jd.company,
        "url": jd.url,
        "created_at": jd.created_at.isoformat(),
    }


@router.get("/")
async def list_all(db: AsyncSession = Depends(get_db)):
    jds = await get_all_jds(db)
    return [
        {
            "id": j.id,
            "title": j.title,
            "company": j.company,
            "url": j.url,
            "created_at": j.created_at.isoformat(),
        }
        for j in jds
    ]


@router.get("/{jid}")
async def detail(jid: str, db: AsyncSession = Depends(get_db)):
    jd = await get_jd(db, jid)
    if not jd:
        raise HTTPException(
            status_code=404, detail="Job description not found")
    return {
        "id": jd.id,
        "title": jd.title,
        "company": jd.company,
        "url": jd.url,
        "raw_text": jd.raw_text,
        "created_at": jd.created_at.isoformat(),
    }


@router.delete("/{jid}")
async def delete_job(jid: str, db: AsyncSession = Depends(get_db)):
    jd = await get_jd(db, jid)
    if not jd:
        raise HTTPException(status_code=404, detail="Job not found")

    await db.delete(jd)
    await db.commit()
    return {"deleted": True}


@router.post("/extract")
async def extract_job_info(payload: dict):
    """Use Gemini to extract job title, company, and URL from raw text"""
    raw_text = payload.get("raw_text", "")

    if not raw_text:
        return {"title": "", "company": "", "url": ""}

    prompt = f"""You are extracting structured job information from a job posting.

JOB POSTING TEXT:
{raw_text[:2000]}

Extract these 3 fields:
1. title: The actual job position/role (e.g., "Software Engineer I", "Backend Developer", "Data Scientist")
   - NOT "About the job" or other generic headers
   - Should be the specific role they're hiring for
2. company: The company name (e.g., "WHOOP", "Google", "Amazon")
   - Just the company name, nothing else
3. url: Any job posting URL found in the text (LinkedIn, company careers page, etc.)
   - Must be a complete https:// URL
   - Empty string if no URL found

CRITICAL: Return ONLY this exact JSON format, no markdown, no explanation:
{{"title": "exact job title here", "company": "company name here", "url": "url here or empty string"}}"""

    try:
        resp = gemini_client.models.generate_content(
            model="gemini-2.0-flash-exp",
            contents=prompt,
            config={"temperature": 0},
        )
        result = resp.text.strip()

        # Clean markdown fences
        cleaned = result.replace("```json", "").replace("```", "").strip()
        data = json.loads(cleaned)

        return {
            "title": data.get("title", ""),
            "company": data.get("company", ""),
            "url": data.get("url", "")
        }

    except Exception as e:
        print(f"Extraction failed: {e}")
        # Fallback to basic parsing
        import re
        lines = [l.strip() for l in raw_text.split('\n') if l.strip()]
        first_line = lines[0] if lines else ""

        # Simple URL extraction
        url_match = re.search(r'(https?://[^\s]+)', raw_text)

        return {
            "title": first_line[:100] if len(first_line) < 100 else "",
            "company": "",
            "url": url_match.group(1) if url_match else ""
        }

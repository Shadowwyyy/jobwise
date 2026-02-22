import json
import re
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

    # --- Layer 1: Regex pre-extraction (fast, no API call needed for URLs) ---
    url_match = re.search(r'(https?://[^\s<>"]+)', raw_text)
    extracted_url = url_match.group(1).rstrip(".,)") if url_match else ""

    # Common patterns: "at CompanyName", "About CompanyName", "Company: Foo"
    company_patterns = [
        # "About Acme Corp"
        r'(?:^|\n)\s*About\s+([A-Z][^\n]{2,40}?)(?:\s*\n)',
        # "Company: Acme"
        r'Company(?:\s+Name)?[:\-]\s*([A-Z][^\n]{1,40})',
        # "joining Acme as"
        r'(?:joining|join)\s+([A-Z][A-Za-z0-9\s&,\.]{2,35}?)(?:\s+team|\s+as\b|[,\n])',
        # "at Acme, we"
        r'(?:at|@)\s+([A-Z][A-Za-z0-9\s&\.]{2,30}?)(?:\s+is|\s+are|\s+we|\s+you|[,\n\.])',
        # "Acme is hiring"
        r'(?:^|\n)\s*([A-Z][A-Za-z0-9\s&\.]{2,30}?)\s+is (?:hiring|looking|seeking)',
    ]

    regex_company = ""
    for pattern in company_patterns:
        m = re.search(pattern, raw_text[:3000], re.MULTILINE)
        if m:
            candidate = m.group(1).strip()
            # Filter out false positives (generic phrases)
            generic = {"the", "a", "an", "our", "we",
                       "you", "this", "that", "us", "team"}
            if candidate.lower().split()[0] not in generic and len(candidate) > 1:
                regex_company = candidate
                break

    # Layer 2: Gemini extraction with improved prompt
    prompt = f"""Extract structured information from this job posting. Be precise.

JOB POSTING:
{raw_text[:3000]}

Return ONLY valid JSON with these exact keys:
{{
  "title": "The specific job role/position being hired for. Not 'About the job' or section headers. E.g. 'Senior Backend Engineer', 'Data Scientist II'",
  "company": "The hiring company's name only. Look for it near 'About [Company]', 'at [Company]', '[Company] is hiring', or at the very top of the posting. E.g. 'Stripe', 'OpenGov', 'Disney'. Empty string if truly not found.",
  "confidence": "high or low — how confident you are in the company name"
}}

No markdown. No explanation. Raw JSON only."""

    try:
        resp = gemini_client.models.generate_content(
            model="gemini-2.0-flash-exp",
            contents=prompt,
            config={"temperature": 0},
        )
        result = resp.text.strip()
        cleaned = result.replace("```json", "").replace("```", "").strip()
        data = json.loads(cleaned)

        gemini_title = data.get("title", "").strip()
        gemini_company = data.get("company", "").strip()
        gemini_confidence = data.get("confidence", "low")

        # Layer 3: Merge — prefer Gemini when confident, regex as fallback
        final_company = gemini_company
        if not final_company or gemini_confidence == "low":
            final_company = regex_company or gemini_company

        return {
            "title": gemini_title,
            "company": final_company,
            "url": extracted_url
        }

    except Exception as e:
        print(f"Extraction failed: {e}")
        # Full fallback: regex only
        lines = [l.strip() for l in raw_text.split('\n') if l.strip()]
        first_meaningful = next(
            (l for l in lines if len(l) > 5 and not l.lower().startswith("http")), ""
        )
        return {
            "title": first_meaningful[:100],
            "company": regex_company,
            "url": extracted_url
        }

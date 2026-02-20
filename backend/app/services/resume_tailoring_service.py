import json
from google import genai
from openai import AsyncOpenAI
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.config import get_settings
from app.services.retrieval_service import find_relevant_chunks, build_context
from app.services.resume_service import get_resume
from app.services.jd_service import get_jd

cfg = get_settings()

if cfg.ai_provider == "openai":
    openai_client = AsyncOpenAI(api_key=cfg.openai_key)
if cfg.ai_provider == "gemini":
    gemini_client = genai.Client(api_key=cfg.gemini_key)


async def _ask_ai(prompt: str, temp: float = 0.3) -> str:
    """Helper to call AI provider"""
    if cfg.ai_provider == "openai":
        resp = await openai_client.chat.completions.create(
            model=cfg.openai_llm,
            messages=[{"role": "user", "content": prompt}],
            temperature=temp,
        )
        return resp.choices[0].message.content.strip()

    resp = gemini_client.models.generate_content(
        model=cfg.gemini_llm,
        contents=prompt,
        config={"temperature": temp},
    )
    return resp.text.strip()


async def generate_resume_suggestions(
    db: AsyncSession,
    resume_id: str,
    jd_id: str
) -> dict:
    """Generate section-by-section resume improvement suggestions"""

    resume = await get_resume(db, resume_id)
    jd = await get_jd(db, jd_id)

    if not resume or not jd:
        raise ValueError("Resume or JD not found")

    parsed = resume.parsed_data or {}
    sections = ['header', 'education', 'skills', 'experience', 'projects']

    suggestions = {}

    for section in sections:
        if section not in parsed:
            continue

        original = parsed[section]

        prompt = f"""You are an expert resume writer and ATS optimization specialist.

JOB DESCRIPTION:
{jd.raw_text[:1500]}

CURRENT RESUME SECTION ({section.upper()}):
{original}

Task: Suggest improvements to this resume section to better match the job description.

Guidelines:
- Keep the same facts, just reword for impact and relevance
- Use keywords from the JD naturally
- Quantify achievements where possible
- Make it ATS-friendly
- Keep the same structure/format
- DO NOT fabricate experience

Return ONLY valid JSON:
{{
    "original": "{section} section as-is",
    "improved": "improved version",
    "changes": ["change 1", "change 2"],
    "reasoning": "why these changes help for this specific role"
}}"""

        try:
            raw = await _ask_ai(prompt, temp=0.3)
            cleaned = raw.replace("```json", "").replace("```", "").strip()
            data = json.loads(cleaned)

            suggestions[section] = {
                "original": original,
                "improved": data.get("improved", original),
                "changes": data.get("changes", []),
                "reasoning": data.get("reasoning", ""),
                "approved": False  # Default not approved
            }
        except Exception as e:
            print(f"Failed to generate suggestion for {section}: {e}")
            suggestions[section] = {
                "original": original,
                "improved": original,
                "changes": [],
                "reasoning": "Could not generate suggestions",
                "approved": False
            }

    return {
        "resume_id": resume_id,
        "jd_id": jd_id,
        "job_title": jd.title,
        "company": jd.company,
        "suggestions": suggestions
    }


def build_tailored_resume(original_data: dict, approved_sections: dict, first_name: str, last_name: str, company: str) -> str:
    """Build final resume text from approved sections"""

    final_sections = []

    for section in ['header', 'education', 'skills', 'experience', 'projects']:
        if section in approved_sections and approved_sections[section]:
            # Use improved version
            final_sections.append(approved_sections[section])
        elif section in original_data:
            # Use original
            final_sections.append(original_data[section])

    resume_text = "\n\n".join(final_sections)
    filename = f"{first_name}_{last_name}_{company}_Resume.pdf"

    return resume_text, filename

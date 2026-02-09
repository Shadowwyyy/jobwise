import json
from openai import AsyncOpenAI
from app.core.config import get_settings
from app.services.retrieval_service import find_relevant_chunks, build_context
from sqlalchemy.ext.asyncio import AsyncSession

cfg = get_settings()
client = AsyncOpenAI(api_key=cfg.openai_key)


def _clean_json(raw: str) -> str:
    """strip markdown fences if the model wraps its json"""
    if raw.startswith("```"):
        raw = raw.split("\n", 1)[1].rsplit("```", 1)[0]
    return raw.strip()


async def analyze_match(db: AsyncSession, rid: str, job_text: str) -> dict:
    """compare resume against jd, return scores and skill breakdown"""

    chunks = await find_relevant_chunks(db, rid, job_text, top_k=8)
    ctx = build_context(chunks)

    prompt = f"""You are an expert career advisor and resume analyst.

Given the candidate's resume excerpts and a job description, provide a detailed match analysis.

RESUME EXCERPTS:
{ctx}

JOB DESCRIPTION:
{job_text}

Respond in this exact JSON format:
{{
    "match_score": <number 0-100>,
    "matching_skills": ["skill1", "skill2", ...],
    "missing_skills": ["skill1", "skill2", ...],
    "strengths": ["strength1", "strength2", ...],
    "gaps": ["gap1", "gap2", ...],
    "summary": "2-3 sentence overall assessment"
}}

Be specific and reference actual content from the resume. Only return valid JSON, no markdown."""

    resp = await client.chat.completions.create(
        model=cfg.llm,
        messages=[{"role": "user", "content": prompt}],
        temperature=0.3,
    )

    return json.loads(_clean_json(resp.choices[0].message.content))


async def write_cover_letter(
    db: AsyncSession,
    rid: str,
    job_text: str,
    company: str = "",
    role: str = "",
    tone: str = "professional",
) -> str:
    """generate a tailored cover letter using rag"""

    chunks = await find_relevant_chunks(db, rid, job_text, top_k=8)
    ctx = build_context(chunks)

    at_company = f" at {company}" if company else ""
    for_role = f" for the {role} role" if role else ""

    prompt = f"""You are an expert cover letter writer.

Write a compelling, tailored cover letter{for_role}{at_company} using the candidate's actual experience.

CANDIDATE'S RELEVANT EXPERIENCE:
{ctx}

JOB DESCRIPTION:
{job_text}

GUIDELINES:
- Tone: {tone}
- Open with a strong hook, not "I am writing to apply..."
- Reference specific accomplishments from the resume that align with the JD
- Show genuine interest in the company/role
- Keep it under 400 words
- Be authentic, not generic
- Do NOT fabricate any experience or skills not present in the resume

Write just the cover letter body (no headers/addresses)."""

    resp = await client.chat.completions.create(
        model=cfg.llm,
        messages=[{"role": "user", "content": prompt}],
        temperature=0.7,
    )

    return resp.choices[0].message.content.strip()


async def prep_interview(
    db: AsyncSession,
    rid: str,
    job_text: str,
    company: str = "",
    num_q: int = 8,
) -> list[dict]:
    """generate interview questions with suggested answers from resume"""

    chunks = await find_relevant_chunks(db, rid, job_text, top_k=8)
    ctx = build_context(chunks)

    at_co = f" at {company}" if company else ""

    prompt = f"""You are a senior technical interviewer{at_co}.

Based on the job description and the candidate's background, generate {num_q} likely interview questions with suggested answer frameworks.

CANDIDATE'S BACKGROUND:
{ctx}

JOB DESCRIPTION:
{job_text}

For each question, provide:
1. The question
2. Why they'd ask this (what they're testing)
3. A suggested answer outline using the candidate's ACTUAL experience
4. Category (technical, behavioral, situational, or system design)

Return as a JSON array:
[
    {{
        "question": "...",
        "why_asked": "...",
        "suggested_answer": "...",
        "category": "..."
    }}
]

Only return valid JSON, no markdown."""

    resp = await client.chat.completions.create(
        model=cfg.llm,
        messages=[{"role": "user", "content": prompt}],
        temperature=0.5,
    )

    return json.loads(_clean_json(resp.choices[0].message.content))

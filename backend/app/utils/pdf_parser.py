import pdfplumber
from io import BytesIO


def extract_text(raw_bytes: bytes) -> str:
    parts = []
    with pdfplumber.open(BytesIO(raw_bytes)) as pdf:
        for pg in pdf.pages:
            txt = pg.extract_text()
            if txt:
                parts.append(txt)
    return "\n\n".join(parts)


def split_into_sections(raw_text: str) -> dict:
    """try to break resume into sections based on common headers"""
    headers = [
        "experience", "work experience", "professional experience",
        "education", "skills", "technical skills",
        "projects", "certifications", "summary",
        "objective", "awards", "publications",
        "volunteer", "interests", "languages",
    ]

    lines = raw_text.split("\n")
    sections = {}
    current = "header"
    block = []

    for ln in lines:
        clean = ln.strip().lower()
        hit = False
        for h in headers:
            if clean == h or clean.startswith(h + " ") or clean.endswith(" " + h):
                if block:
                    sections[current] = "\n".join(block).strip()
                current = h.split()[0]
                block = []
                hit = True
                break
        if not hit:
            block.append(ln)

    if block:
        sections[current] = "\n".join(block).strip()

    return sections

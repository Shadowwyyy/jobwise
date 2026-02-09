from langchain.text_splitter import RecursiveCharacterTextSplitter
from app.core.config import get_settings

cfg = get_settings()


def chunk_text(txt: str, sz: int = None, overlap: int = None) -> list[str]:
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=sz or cfg.chunk_sz,
        chunk_overlap=overlap or cfg.chunk_overlap,
        separators=["\n\n", "\n", ". ", " ", ""],
        length_function=len,
    )
    return splitter.split_text(txt)


def chunk_by_section(sections: dict) -> list[dict]:
    """chunk each section on its own so we keep the label"""
    out = []
    i = 0
    for name, text in sections.items():
        if not text.strip():
            continue
        for c in chunk_text(text):
            out.append({"content": c, "section": name, "index": i})
            i += 1
    return out

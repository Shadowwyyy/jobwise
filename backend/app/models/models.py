import uuid
from datetime import datetime
from sqlalchemy import String, Text, DateTime, Float, ForeignKey, Integer, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from pgvector.sqlalchemy import Vector
from app.core.database import Base
from app.core.config import get_settings

cfg = get_settings()


class Resume(Base):
    __tablename__ = "resumes"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    filename: Mapped[str] = mapped_column(String(255))
    raw_text: Mapped[str] = mapped_column(Text)
    parsed_data: Mapped[dict] = mapped_column(JSON, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow)

    chunks: Mapped[list["ResumeChunk"]] = relationship(
        back_populates="resume", cascade="all, delete-orphan"
    )


class ResumeChunk(Base):
    __tablename__ = "resume_chunks"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    resume_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("resumes.id", ondelete="CASCADE")
    )
    content: Mapped[str] = mapped_column(Text)
    idx: Mapped[int] = mapped_column(Integer)
    section: Mapped[str] = mapped_column(String(100), nullable=True)
    embedding = mapped_column(Vector(cfg.embed_dims))

    resume: Mapped["Resume"] = relationship(back_populates="chunks")


class JobDescription(Base):
    __tablename__ = "job_descriptions"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    title: Mapped[str] = mapped_column(String(255))
    company: Mapped[str] = mapped_column(String(255), nullable=True)
    url: Mapped[str] = mapped_column(String(500), nullable=True)
    raw_text: Mapped[str] = mapped_column(Text)
    extracted_skills: Mapped[dict] = mapped_column(JSON, nullable=True)
    extracted_reqs: Mapped[dict] = mapped_column(JSON, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow)

    chunks: Mapped[list["JDChunk"]] = relationship(
        back_populates="jd", cascade="all, delete-orphan"
    )
    analyses: Mapped[list["MatchAnalysis"]] = relationship(
        back_populates="jd", cascade="all, delete-orphan"
    )


class JDChunk(Base):
    __tablename__ = "jd_chunks"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    jd_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("job_descriptions.id", ondelete="CASCADE")
    )
    content: Mapped[str] = mapped_column(Text)
    idx: Mapped[int] = mapped_column(Integer)
    embedding = mapped_column(Vector(cfg.embed_dims))

    jd: Mapped["JobDescription"] = relationship(back_populates="chunks")


class MatchAnalysis(Base):
    __tablename__ = "match_analyses"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    resume_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("resumes.id", ondelete="CASCADE")
    )
    jd_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("job_descriptions.id", ondelete="CASCADE")
    )
    score: Mapped[float] = mapped_column(Float, nullable=True)
    matched: Mapped[dict] = mapped_column(JSON, nullable=True)
    missing: Mapped[dict] = mapped_column(JSON, nullable=True)
    notes: Mapped[str] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow)

    jd: Mapped["JobDescription"] = relationship(back_populates="analyses")


class GeneratedContent(Base):
    __tablename__ = "generated_content"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    resume_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("resumes.id", ondelete="CASCADE")
    )
    jd_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("job_descriptions.id", ondelete="CASCADE")
    )
    kind: Mapped[str] = mapped_column(String(50))
    body: Mapped[str] = mapped_column(Text)
    meta: Mapped[dict] = mapped_column(JSON, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow)


class ActivityLog(Base):
    __tablename__ = "activity_logs"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    # resume_upload, jd_added, match_generated, etc.
    action_type: Mapped[str] = mapped_column(String(50))
    resume_id: Mapped[str] = mapped_column(String(36), nullable=True)
    jd_id: Mapped[str] = mapped_column(String(36), nullable=True)
    metadata_json: Mapped[dict] = mapped_column(JSON, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow)

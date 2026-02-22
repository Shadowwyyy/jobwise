# Jobwise

> RAG-powered job search assistant — tailor your resume, generate cover letters, prep for interviews, and track applications.

![Python](https://img.shields.io/badge/Python-3.11+-blue?style=flat-square)
![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-green?style=flat-square)
![React](https://img.shields.io/badge/React-18+-61DAFB?style=flat-square)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL+pgvector-blue?style=flat-square)

---

## What it does

Jobwise takes your resume and a job description and uses retrieval-augmented generation to:

- **Match your skills** against job requirements with semantic similarity search
- **Tailor your resume** section by section with before/after suggestions you can approve or reject
- **Generate cover letters** grounded in your actual experience
- **Prep you for interviews** with role-specific questions and suggested answers from your background
- **Track your applications** with a Kanban-style board across Saved → Applied → Interviewing → Offer → Rejected

---

## Tech Stack

| Layer | Tech |
|---|---|
| Backend | Python 3.11+, FastAPI, SQLAlchemy (async) |
| Database | PostgreSQL + pgvector |
| AI | Google Gemini (generation + embeddings), OpenAI (fallback) |
| Frontend | React 18, Vite, Tailwind CSS |
| Parsing | pdfplumber |
| Infrastructure | Docker, Docker Compose |

---

## Getting Started

### Prerequisites

- Python 3.11+
- Node.js 18+
- Docker
- Gemini API key (or OpenAI API key)

### 1. Clone & configure

```bash
git clone https://github.com/Shadowwyyy/jobwise
cd jobwise
cp .env.example .env
# Fill in your API keys in .env
```

### 2. Start the database

```bash
docker-compose up -d
```

### 3. Start the backend

```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload
```

### 4. Start the frontend

```bash
cd frontend
npm install
npm run dev
```

App runs at `http://localhost:5173` — backend API at `http://localhost:8000`.

---

## Project Structure

```
jobwise/
├── backend/
│   ├── app/
│   │   ├── api/                  # Route handlers
│   │   ├── models/               # SQLAlchemy models
│   │   ├── services/             # Business logic & AI calls
│   │   ├── utils/                # PDF generation
│   │   └── core/                 # Config, DB, errors
│   └── main.py
├── frontend/
│   └── src/
│       ├── components/           # React components
│       ├── App.jsx
│       └── index.css
└── docker-compose.yml
```

---

## Environment Variables

```env
GEMINI_API_KEY=your_gemini_key
OPENAI_API_KEY=your_openai_key        # optional fallback
DATABASE_URL=postgresql+asyncpg://...
EMBED_DIMS=3072
```

---

## Features In Depth

**Resume Tailoring** — Upload your resume, paste a job description, and get section-by-section improvement suggestions with reasoning. Approve or reject each change individually, then download the tailored resume as a PDF.

**Skill Match** — pgvector semantic search compares your resume chunks against job requirements and surfaces matched and missing skills with a similarity score.

**Cover Letter Generation** — RAG pipeline retrieves the most relevant parts of your resume and generates a cover letter grounded in your actual experience, not generic filler.

**Interview Prep** — Generates role-specific questions with suggested answers drawn from your background, organized by category.

**Application Tracker** — Kanban board to track every application with status, dates, and notes. Automatically logs the applied date when you move a card.

**Analytics** — Dashboard showing activity over the past 7 days, content breakdown by type, and full history of generated content.

# Jobwise

An AI-powered job search tool that uses RAG (Retrieval-Augmented Generation) to help you tailor cover letters, prep for interviews, and match your skills to job descriptions.

## Tech Stack

- **Backend:** Python 3.11+ / FastAPI
- **Database:** PostgreSQL + pgvector
- **AI/ML:** OpenAI API (embeddings + generation), LangChain
- **Frontend:** React 18+ (Vite)
- **Document Parsing:** pdfplumber

## Setup

### Prerequisites

- Python 3.11+
- Node.js 18+
- Docker (for PostgreSQL + pgvector)
- OpenAI API key

### Database

docker-compose up -d

### Backend

cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp ../.env.example ../.env
uvicorn main:app --reload

### Frontend

cd frontend
npm install
npm run dev

## Features

1. **Resume Parsing** — Upload PDF resume, extract and embed content
2. **Job Description Analysis** — Paste JD, extract requirements, match against resume
3. **Cover Letter Generation** — RAG-powered tailored cover letters
4. **Interview Prep** — Role-specific questions with suggested answers from your experience
5. **Skill Gap Analysis** — Visual breakdown of matching and missing skills

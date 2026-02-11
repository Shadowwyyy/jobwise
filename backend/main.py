from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.database import init_db
from app.core.config import get_settings
from app.api.resume_routes import router as resume_router
from app.api.job_routes import router as job_router
from app.api.generate_routes import router as generate_router
from app.api.analytics_routes import router as analytics_router
from app.api.history_routes import router as history_router

cfg = get_settings()
app = FastAPI(title="Jobwise API")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=cfg.cors_origins.split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routes
app.include_router(resume_router, prefix="/api/resumes", tags=["resumes"])
app.include_router(job_router, prefix="/api/jobs", tags=["jobs"])
app.include_router(generate_router, prefix="/api/generate", tags=["generate"])
app.include_router(
    analytics_router, prefix="/api/analytics", tags=["analytics"])
app.include_router(history_router, prefix="/api/history", tags=["history"])


@app.on_event("startup")
async def startup():
    await init_db()


@app.get("/")
def root():
    return {"status": "ok", "app": "Jobwise API"}

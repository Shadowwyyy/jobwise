from fastapi import HTTPException, Request
from fastapi.responses import JSONResponse
from sqlalchemy.exc import SQLAlchemyError
from google.genai.errors import ClientError as GeminiError
from openai import APIError as OpenAIError


class JobwiseException(Exception):
    """Base exception for Jobwise"""

    def __init__(self, message: str, status_code: int = 500):
        self.message = message
        self.status_code = status_code
        super().__init__(self.message)


class ResumeNotFoundError(JobwiseException):
    def __init__(self):
        super().__init__("Resume not found", 404)


class JobDescriptionNotFoundError(JobwiseException):
    def __init__(self):
        super().__init__("Job description not found", 404)


class EmbeddingError(JobwiseException):
    def __init__(self, provider: str):
        super().__init__(
            f"Failed to generate embeddings using {provider}", 500)


class GenerationError(JobwiseException):
    def __init__(self, provider: str):
        super().__init__(f"Failed to generate content using {provider}", 500)


async def jobwise_exception_handler(request: Request, exc: JobwiseException):
    return JSONResponse(
        status_code=exc.status_code,
        content={"error": exc.message, "type": exc.__class__.__name__}
    )


async def sqlalchemy_exception_handler(request: Request, exc: SQLAlchemyError):
    return JSONResponse(
        status_code=500,
        content={"error": "Database error occurred", "type": "DatabaseError"}
    )


async def ai_api_exception_handler(request: Request, exc: Exception):
    """Handle OpenAI and Gemini API errors"""
    error_msg = "AI service error"

    if isinstance(exc, (GeminiError, OpenAIError)):
        if "quota" in str(exc).lower() or "429" in str(exc):
            error_msg = "API quota exceeded. Please try again later or check your API key."
        elif "401" in str(exc) or "invalid" in str(exc).lower():
            error_msg = "Invalid API key. Please check your configuration."
        elif "rate limit" in str(exc).lower():
            error_msg = "Rate limit exceeded. Please wait a moment and try again."
        else:
            error_msg = f"AI service error: {str(exc)[:100]}"

    return JSONResponse(
        status_code=500,
        content={"error": error_msg, "type": "AIServiceError"}
    )


async def generic_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content={"error": "An unexpected error occurred",
                 "type": "InternalError", "details": str(exc)[:200]}
    )

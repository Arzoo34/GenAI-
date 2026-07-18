import os
import json
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from routes.listing import router as listing_router
from routes.evaluation import router as evaluation_router
from routes.qna import router as qna_router
from routes.health_brief import router as health_brief_router
from routes.assistant import router as assistant_router

# Load environment variables from .env file
load_dotenv()

app = FastAPI(
    title="Shuruaat AI Listing Agent Backend",
    version="1.0.0",
    description="Backend API for the Shuruaat AI Listing Agent with Gemini and Sarvam AI integrations."
)

app.include_router(listing_router)
app.include_router(evaluation_router)
app.include_router(qna_router)
app.include_router(health_brief_router)
app.include_router(assistant_router)

# Parse CORS Origins from env
cors_origins_str = os.getenv("CORS_ORIGINS", '["*"]')
try:
    origins = json.loads(cors_origins_str)
    if not isinstance(origins, list):
        origins = [origins]
except (json.JSONDecodeError, ValueError):
    # Fallback: assume comma-separated values if JSON decoding fails
    origins = [origin.strip() for origin in cors_origins_str.split(",") if origin.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "app": "Shuruaat AI Listing Agent Backend",
        "version": "1.0.0"
    }

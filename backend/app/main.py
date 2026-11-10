from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Load environment variables from backend/.env
BASE_DIR = Path(__file__).resolve().parents[1]
ENV_FILE = BASE_DIR / ".env"
load_dotenv(ENV_FILE)

# Import API routers
from backend.app.api.routes.products import router as products_router
from backend.app.api.routes.recommendations import router as recommendations_router
from backend.app.api.routes.payments import router as payments_router
from backend.app.api.routes.ai_chat import router as ai_chat_router
from backend.app.api.routes.auth import router as auth_router
from backend.app.api.routes.admin import router as admin_router
from backend.app.api.routes.admin import router as admin_router

from backend.app.db.mongodb import check_mongodb_connection


# Initialize FastAPI
app = FastAPI(
    title="Skillora AI Learning Marketplace API",
    description="API for the Skillora AI Smart Learning Marketplace",
    version="1.0.0",
)


# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Home endpoint
@app.get("/")
async def home():
    return {
        "message": "Welcome to Skillora AI Learning Marketplace API",
        "docs": "/docs",
        "health": "/api/health",
    }


# General health check
@app.get("/api/health")
async def health_check():
    return {
        "status": "healthy",
        "service": "Skillora AI Learning Marketplace API",
    }


# MongoDB health check
@app.get("/api/health/mongodb")
async def mongodb_health_check():
    try:
        result = check_mongodb_connection()
        return {
            "status": "connected" if result else "disconnected",
            "mongodb": bool(result),
        }
    except Exception as exc:
        return {
            "status": "error",
            "mongodb": False,
            "detail": str(exc),
        }


# Register API routers
app.include_router(products_router)
app.include_router(recommendations_router)
app.include_router(payments_router)
app.include_router(ai_chat_router)
app.include_router(auth_router)
app.include_router(admin_router)
app.include_router(admin_router)
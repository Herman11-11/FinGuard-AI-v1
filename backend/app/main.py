import sys
import os
from pathlib import Path

# Add backend directory to path
backend_dir = Path(__file__).parent
sys.path.append(str(backend_dir))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

from api.stats import router as stats_router
from api.documents import router as documents_router
from api.auth import router as auth_router

app = FastAPI(title="FinGuard-AI", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(stats_router)
app.include_router(documents_router)
app.include_router(auth_router)

@app.get("/")
def home():
    return {"message": "FinGuard-AI is running securely 🇹🇿"}

@app.get("/health")
def health():
    return {"status": "healthy"}

@app.get("/api/health")
def api_health():
    return {"status": "healthy"}

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    )

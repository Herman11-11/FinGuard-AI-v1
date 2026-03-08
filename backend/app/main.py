from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

# Create the FastAPI app
app = FastAPI(
    title="FinGuard-AI",
    description="Digital fingerprint system for Tanzania land documents",
    version="1.0.0"
)

# Allow frontend to connect (we'll add this later)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Simple home page
@app.get("/")
def home():
    return {
        "message": "Welcome to FinGuard-AI",
        "status": "running",
        "for": "Ministry of Lands, Tanzania 🇹🇿"
    }

# Test endpoint to check if API works
@app.get("/health")
def health():
    return {"status": "healthy"}

# Run the server
if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
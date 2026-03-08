from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import sys
from pathlib import Path
sys.path.append(str(Path(__file__).parent.parent))

# Import our hashing service
from hashing import HashingService

app = FastAPI(title="FinGuard-AI", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def home():
    return {"message": "FinGuard-AI is running 🇹🇿"}

@app.get("/health")
def health():
    return {"status": "healthy"}

# NEW: Generate fingerprint from document data
@app.get("/fingerprint")
def create_fingerprint(owner: str, plot: str, location: str, area: int):
    # Create document data from URL parameters
    doc_data = {
        "owner": owner,
        "plot_number": plot,
        "location": location,
        "area": area
    }
    
    # Generate fingerprint
    fingerprint = HashingService.generate_fingerprint(doc_data)
    
    return {
        "document": doc_data,
        "fingerprint": fingerprint,
        "length": len(fingerprint)
    }

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
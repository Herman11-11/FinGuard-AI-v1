from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from datetime import datetime, date

from models.database import get_db, Document

router = APIRouter()

@router.get("/api/stats")
async def get_stats(db: Session = Depends(get_db)):
    total_documents = db.query(Document).count()
    
    today_start = datetime.combine(date.today(), datetime.min.time())
    verified_today = db.query(Document).filter(
        Document.created_at >= today_start
    ).count()
    
    # Mock data for now
    pending_auth = 12
    fraudulent_detected = 3
    
    return {
        "totalDocuments": total_documents,
        "verifiedToday": verified_today,
        "pendingAuth": pending_auth,
        "fraudulentDetected": fraudulent_detected,
        "systemHealth": {
            "apiResponse": 124,
            "databaseLoad": 34,
            "storageUsed": 156,
            "storageTotal": 500
        }
    }
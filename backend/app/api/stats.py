from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from datetime import datetime, date

from models.database import get_db, Document, AccessLog

router = APIRouter()

@router.get("/api/stats")
async def get_stats(db: Session = Depends(get_db)):
    total_documents = db.query(Document).count()
    
    today_start = datetime.combine(date.today(), datetime.min.time())
    verified_today = db.query(Document).filter(
        Document.created_at >= today_start
    ).count()
    
    pending_auth = db.query(AccessLog).filter(AccessLog.status == "pending").count()
    fraudulent_detected = db.query(AccessLog).filter(AccessLog.status == "fraudulent").count()

    recent_docs = db.query(Document).order_by(Document.created_at.desc()).limit(5).all()
    recent_activity = [
        {
            "time": doc.created_at.strftime("%H:%M") if doc.created_at else "",
            "action": f"Document {doc.record_id} registered",
            "user": "System"
        }
        for doc in recent_docs
    ]

    return {
        "totalDocuments": total_documents,
        "verifiedToday": verified_today,
        "pendingAuth": pending_auth,
        "fraudulentDetected": fraudulent_detected,
        "recentActivity": recent_activity,
        "lastLogin": datetime.now().isoformat(),
        "systemHealth": {
            "apiResponse": None,
            "databaseLoad": None,
            "storageUsed": None,
            "storageTotal": None
        }
    }

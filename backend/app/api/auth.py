from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime
import hashlib
import uuid

from models.database import get_db, AccessLog, Document, Officer

router = APIRouter()


def _hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()


@router.get("/api/auth/officers")
async def list_officers(db: Session = Depends(get_db)):
    officers = db.query(Officer).filter(Officer.is_active == True).all()
    return [
        {
            "id": officer.id,
            "name": officer.name,
            "role": officer.role
        }
        for officer in officers
    ]


@router.post("/api/auth/request")
async def request_access(payload: dict, db: Session = Depends(get_db)):
    document_id = payload.get("document_id")
    reason = payload.get("reason")

    if not document_id or not reason:
        raise HTTPException(status_code=400, detail="document_id and reason are required")

    doc = db.query(Document).filter(
        (Document.record_id == document_id) | (Document.plot_number == document_id)
    ).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    request_id = f"REQ-{str(uuid.uuid4()).upper()[:8]}"
    log = AccessLog(
        document_id=doc.record_id,
        request_id=request_id,
        requester="system",
        reason=reason,
        approvals=[],
        status="pending",
        created_at=datetime.now()
    )
    db.add(log)
    db.commit()

    officers = db.query(Officer).filter(Officer.is_active == True).all()
    return {
        "request_id": request_id,
        "officers": [
            {"id": officer.id, "name": officer.name, "role": officer.role}
            for officer in officers
        ]
    }


@router.post("/api/auth/approve")
async def approve_access(payload: dict, db: Session = Depends(get_db)):
    request_id = payload.get("request_id")
    officer_id = payload.get("officer_id")
    password = payload.get("password")

    if not request_id or not officer_id or not password:
        raise HTTPException(status_code=400, detail="request_id, officer_id, and password are required")

    log = db.query(AccessLog).filter(AccessLog.request_id == request_id).first()
    if not log:
        raise HTTPException(status_code=404, detail="Request not found")

    officer = db.query(Officer).filter(Officer.id == officer_id, Officer.is_active == True).first()
    if not officer:
        raise HTTPException(status_code=404, detail="Officer not found")

    if officer.password_hash and officer.password_hash != _hash_password(password):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    approvals = log.approvals or []
    if officer_id not in approvals:
        approvals.append(officer_id)

    log.approvals = approvals
    log.status = "approved" if len(approvals) >= 3 else "pending"
    db.commit()

    response = {
        "request_id": request_id,
        "approved_officers": approvals
    }

    if log.status == "approved":
        response.update({
            "access_code": f"ACC-{str(uuid.uuid4()).upper()[:8]}",
            "fingerprint": doc.document_hash if (doc := db.query(Document).filter(Document.record_id == log.document_id).first()) else None
        })

    return response

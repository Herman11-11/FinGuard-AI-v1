from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session
from datetime import datetime
import hashlib
import uuid

from models.database import get_db, AccessLog, Document, Officer, User
from Services.auth_token import sign, verify
from Services.firebase_admin import verify_id_token

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

    doc = None
    if document_id != "ADMIN-DB":
        doc = db.query(Document).filter(
            (Document.record_id == document_id) | (Document.plot_number == document_id)
        ).first()
        if not doc:
            raise HTTPException(status_code=404, detail="Document not found")

    request_id = f"REQ-{str(uuid.uuid4()).upper()[:8]}"
    log = AccessLog(
        document_id=doc.record_id if doc else "ADMIN-DB",
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

    try:
        officer_id = int(officer_id)
    except (TypeError, ValueError):
        raise HTTPException(status_code=400, detail="Invalid officer_id")

    officer = db.query(Officer).filter(Officer.id == officer_id, Officer.is_active == True).first()
    if not officer:
        raise HTTPException(status_code=404, detail="Officer not found")

    if officer.password_hash and officer.password_hash != _hash_password(password):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    approvals = [int(approved_id) for approved_id in (log.approvals or [])]
    if officer_id not in approvals:
        approvals = approvals + [officer_id]

    log.approvals = approvals
    log.status = "approved" if len(approvals) >= 3 else "pending"
    db.commit()
    db.refresh(log)

    response = {
        "request_id": request_id,
        "approved_officers": [int(approved_id) for approved_id in (log.approvals or [])]
    }

    if log.status == "approved":
        response.update({
            "access_code": f"ACC-{str(uuid.uuid4()).upper()[:8]}",
            "fingerprint": doc.document_hash if (doc := db.query(Document).filter(Document.record_id == log.document_id).first()) else None
        })

    return response


def _get_current_user(authorization: str | None, db: Session) -> User:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing token")
    token = authorization.split(" ", 1)[1]
    payload = verify(token)
    if not payload or not payload.get("sub"):
        raise HTTPException(status_code=401, detail="Invalid token")
    user = db.query(User).filter(User.id == payload["sub"], User.is_active == True).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user


@router.post("/api/auth/login")
async def login(payload: dict, db: Session = Depends(get_db)):
    email = payload.get("email")
    password = payload.get("password")
    if not email or not password:
        raise HTTPException(status_code=400, detail="email and password required")
    user = db.query(User).filter(User.email == email, User.is_active == True).first()
    if not user or user.password_hash != _hash_password(password):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    token = sign({"sub": user.id, "role": user.role}, ttl_seconds=3600)
    return {"token": token, "role": user.role, "email": user.email}


@router.get("/api/auth/me")
async def me(authorization: str | None = Header(default=None), db: Session = Depends(get_db)):
    user = _get_current_user(authorization, db)
    return {"id": user.id, "email": user.email, "role": user.role}


def require_admin(authorization: str | None, db: Session) -> User:
    user = _get_current_user(authorization, db)
    if user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return user


def require_firebase_admin(authorization: str | None) -> dict:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing token")
    token = authorization.split(" ", 1)[1]
    try:
        decoded = verify_id_token(token)
    except Exception as exc:
        raise HTTPException(status_code=401, detail=f"Invalid Firebase token: {str(exc)}")
    if not decoded.get("admin"):
        raise HTTPException(status_code=403, detail="Admin access required")
    return decoded


@router.get("/api/auth/firebase-me")
async def firebase_me(authorization: str | None = Header(default=None)):
    decoded = require_firebase_admin(authorization)
    return {"uid": decoded.get("uid"), "email": decoded.get("email"), "admin": decoded.get("admin", False)}

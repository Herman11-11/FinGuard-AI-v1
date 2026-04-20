from fastapi import APIRouter, File, UploadFile, Form, HTTPException, Depends, Header
from sqlalchemy.orm import Session
from datetime import datetime
import hashlib
import json
import uuid
from typing import Optional
from services.pdf_service import PDFService
from services.pdf_render_service import PDFRenderService
from fastapi.responses import Response
import os

from services.qr_service import QRService
from models.database import get_db, Document, AccessLog
from api.auth import require_firebase_admin
from crud.documents import DocumentCRUD
from services.steganography import SteganographyService
from services.ai_fingerprint_service import AIFingerprintService

router = APIRouter()


def log_verification_event(
    db: Session,
    *,
    document_id: str,
    reason: str,
    status: str,
):
    event = AccessLog(
        document_id=document_id,
        request_id=f"VER-{str(uuid.uuid4()).upper()[:8]}",
        requester="system",
        reason=reason,
        approvals=[],
        status=status,
        created_at=datetime.now(),
    )
    db.add(event)
    db.commit()


def build_ai_input(content: bytes, content_type: str | None) -> bytes | None:
    if content_type and content_type.startswith("image/"):
        return content
    if content_type == "application/pdf":
        return PDFRenderService.render_first_page(content)
    return None


def build_pdf_signature(content: bytes, content_type: str | None) -> dict | None:
    if content_type != "application/pdf":
        return None
    return PDFRenderService.build_text_signature(content)


def find_document_by_pdf_signature(db: Session, pdf_signature: dict | None) -> Document | None:
    if not pdf_signature:
        return None

    target_signature = pdf_signature.get("signature")
    if not target_signature:
        return None

    for candidate_doc in db.query(Document).all():
        metadata = candidate_doc.metadata_json if isinstance(candidate_doc.metadata_json, dict) else {}
        stored_pdf = metadata.get("pdf_signature") if isinstance(metadata, dict) else None
        if isinstance(stored_pdf, dict) and stored_pdf.get("signature") == target_signature:
            return candidate_doc

    return None


def pdf_signature_matches_document(doc: Document | None, pdf_signature: dict | None) -> bool:
    if not doc or not pdf_signature:
        return False
    metadata = doc.metadata_json if isinstance(doc.metadata_json, dict) else {}
    stored_pdf = metadata.get("pdf_signature") if isinstance(metadata, dict) else None
    return isinstance(stored_pdf, dict) and stored_pdf.get("signature") == pdf_signature.get("signature")


def build_failed_verification_reason(
    *,
    content_type: str | None,
    stego_data: dict | None,
    ai_verification: dict,
) -> str:
    file_label = "pdf" if content_type == "application/pdf" else "image" if content_type and content_type.startswith("image/") else (content_type or "unknown")
    parts = [f"Verification failed for {file_label} upload"]

    if stego_data:
        parts.append(f"stego_record={stego_data.get('record_id')}")
    else:
        parts.append("stego=none")

    if ai_verification.get("available"):
        similarity = ai_verification.get("similarity")
        parts.append(f"ai_similarity={similarity}")
        parts.append(f"ai_match={ai_verification.get('match')}")
    else:
        parts.append(f"ai={ai_verification.get('reason', 'unavailable')}")

    return " | ".join(parts)

@router.post("/api/documents/register")
async def register_document(
    file: UploadFile = File(...),
    owner: str = Form(...),
    plot_number: str = Form(...),
    location: str = Form(...),
    area: str = Form(...),
    region: str = Form(...),
    district: Optional[str] = Form(None),
    db: Session = Depends(get_db)
):
    try:
        content = await file.read()
        
        doc_data = {
            "owner": owner,
            "plot_number": plot_number,
            "location": location,
            "area": area,
            "region": region,
            "district": district,
            "timestamp": datetime.now().isoformat()
        }
        
        json_string = json.dumps(doc_data, sort_keys=True)
        data_hash = hashlib.sha256(json_string.encode()).hexdigest()
        file_hash = hashlib.sha256(content).hexdigest()
        combined = data_hash + file_hash
        ultimate_fingerprint = hashlib.sha256(combined.encode()).hexdigest()
        
        record_id = str(uuid.uuid4()).upper()[:8]
        doc_data['record_id'] = f"LAND-{record_id}"
        doc_data["metadata_hash"] = data_hash

        ai_fingerprint = None
        pdf_signature = None
        ai_input = None
        try:
            ai_input = build_ai_input(content, file.content_type)
        except Exception as e:
            print(f"⚠️ Failed to prepare file for AI fingerprinting: {e}")

        try:
            pdf_signature = build_pdf_signature(content, file.content_type)
            if pdf_signature:
                doc_data["pdf_signature"] = pdf_signature
        except Exception as e:
            print(f"⚠️ Failed to build PDF signature: {e}")

        if ai_input is not None:
            try:
                ai_fingerprint = AIFingerprintService.generate_fingerprint(ai_input)
                doc_data["ai_fingerprint"] = ai_fingerprint
            except Exception as e:
                print(f"⚠️ AI fingerprint generation failed: {e}")
        
        saved_doc = DocumentCRUD.create_document(
            db=db,
            document_data=doc_data,
            file_hash=file_hash,
            fingerprint=ultimate_fingerprint
        )

        # Generate QR codes
        qr_code = QRService.generate_document_qr(doc_data, ultimate_fingerprint)
        mini_qr = QRService.generate_mini_qr(f"LAND-{record_id}")

        # ===========================================
        # STEGANOGRAPHY - HIDE FINGERPRINT IN IMAGE
        # ===========================================
        stego_available = False
        try:
            # Only apply steganography to image files
            if file.content_type and file.content_type.startswith('image/'):
                # Embed fingerprint in image
                stego_image = SteganographyService.embed_fingerprint(
                    content, 
                    {
                        "record_id": f"LAND-{record_id}",
                        "fingerprint": ultimate_fingerprint,
                        "full_document_hash": ultimate_fingerprint,
                        "file_hash": file_hash,
                        "metadata_hash": data_hash,
                        "ai_signature": ai_fingerprint.get("signature") if ai_fingerprint else None,
                        "payload_type": "document_trust_bundle",
                        "owner": owner,
                        "plot": plot_number,
                        "location": location,
                        "timestamp": datetime.now().isoformat()
                    }
                )
                
                # Create stego_images folder if it doesn't exist
                os.makedirs("stego_images", exist_ok=True)
                
                # Save the stego image
                stego_filename = f"stego_{record_id}.png"
                with open(f"stego_images/{stego_filename}", "wb") as f:
                    f.write(stego_image)
                
                stego_available = True
                print(f"✅ Steganography applied: {stego_filename}")
            else:
                print(f"⚠️ Skipping steganography for non-image file: {file.content_type}")
        except Exception as e:
            print(f"⚠️ Steganography failed: {e}")
            # Continue even if steganography fails
        # ===========================================

        return {
            "success": True,
            "record_id": f"LAND-{record_id}",
            "fingerprint": ultimate_fingerprint,
            "ai_signature": ai_fingerprint.get("signature") if ai_fingerprint else None,
            "ai_algorithm": ai_fingerprint.get("algorithm") if ai_fingerprint else None,
            "ai_embedding_dim": ai_fingerprint.get("embedding_dim") if ai_fingerprint else None,
            "qr_code": qr_code,
            "mini_qr": mini_qr,
            "stego_available": stego_available,
            "ai_fingerprint_available": ai_fingerprint is not None,
            "filename": file.filename,
            "size": len(content),
            "message": "Document registered successfully" + (" with invisible fingerprint" if stego_available else "")
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/api/documents/search/{plot_number}")
async def search_document(plot_number: str, db: Session = Depends(get_db)):
    doc = DocumentCRUD.get_document_by_plot(db, plot_number)
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    
    return {
        "record_id": doc.record_id,
        "owner": doc.owner_name,
        "plot": doc.plot_number,
        "location": doc.location,
        "area": doc.area,
        "region": doc.region,
        "created_at": doc.created_at,
        "fingerprint": doc.document_hash
    }

@router.get("/api/documents/all")
async def get_all_documents(
    skip: int = 0, 
    limit: int = 100, 
    db: Session = Depends(get_db)
):
    docs = DocumentCRUD.get_all_documents(db, skip, limit)
    return [
        {
            "record_id": doc.record_id,
            "owner": doc.owner_name,
            "plot": doc.plot_number,
            "location": doc.location,
            "created_at": doc.created_at
        }
        for doc in docs
    ]

@router.post("/api/documents/verify")
async def verify_document(
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    try:
        content = await file.read()
        file_hash = hashlib.sha256(content).hexdigest()
        pdf_signature = None
        ai_verification = {
            "available": False,
            "match": False,
            "similarity": None,
            "reason": "not evaluated",
        }

        # First check by file hash
        doc = DocumentCRUD.get_document_by_file_hash(db, file_hash)
        
        # If not found by hash, try steganography extraction
        stego_data = None
        if not doc and file.content_type and file.content_type.startswith('image/'):
            try:
                stego_data = SteganographyService.extract_fingerprint(content)
                if stego_data and stego_data.get("record_id"):
                    # Try to find document by record ID from stego data
                    doc = DocumentCRUD.get_document_by_record_id(db, stego_data.get("record_id"))
            except Exception as e:
                print(f"Steganography extraction failed: {e}")

        try:
            pdf_signature = build_pdf_signature(content, file.content_type)
            if not doc:
                doc = find_document_by_pdf_signature(db, pdf_signature)
        except Exception as e:
            print(f"PDF signature generation failed: {e}")

        if not doc:
            failure_reason = build_failed_verification_reason(
                content_type=file.content_type,
                stego_data=stego_data,
                ai_verification=ai_verification,
            )
            log_verification_event(
                db,
                document_id=stego_data.get("record_id") if stego_data else ("UNMATCHED-PDF" if file.content_type == "application/pdf" else "UNMATCHED"),
                reason=failure_reason,
                status="fraudulent",
            )
            return {
                "is_authentic": False,
                "confidence": 0.2,
                "has_steganography": stego_data is not None,
                "stego_data": stego_data,
                "ai_verification": ai_verification,
                "pdf_signature": pdf_signature,
                "details": {
                    "hash_match": False,
                    "tamper_detected": True,
                    "issue_date": None,
                    "owner": stego_data.get("owner") if stego_data else None,
                    "plot": stego_data.get("plot") if stego_data else None,
                    "location": None,
                    "issuer": None,
                    "verified_by": None,
                    "timestamp": datetime.now().isoformat()
                }
            }

        ai_input = None
        try:
            ai_input = build_ai_input(content, file.content_type)
        except Exception as e:
            print(f"AI fingerprint input preparation failed: {e}")

        if ai_input is not None and isinstance(doc.metadata_json, dict) and doc.metadata_json.get("ai_fingerprint"):
            try:
                ai_candidate = AIFingerprintService.generate_fingerprint(ai_input)
                ai_verification = AIFingerprintService.compare_fingerprints(
                    doc.metadata_json.get("ai_fingerprint"),
                    ai_candidate,
                )
            except Exception as e:
                print(f"AI fingerprint verification failed: {e}")

        hash_match = doc.file_hash == file_hash
        pdf_match = pdf_signature_matches_document(doc, pdf_signature)
        ai_match = ai_verification.get("match", False)
        if hash_match:
            confidence = 0.98
        elif pdf_match:
            confidence = 0.94
        elif stego_data:
            confidence = 0.9 if ai_match else 0.82
        else:
            confidence = 0.76 if ai_match else 0.58

        return {
            "is_authentic": bool(hash_match or pdf_match or stego_data),
            "confidence": confidence,
            "has_steganography": stego_data is not None,
            "stego_data": stego_data,
            "ai_verification": ai_verification,
            "pdf_signature": pdf_signature,
            "details": {
                "hash_match": hash_match,
                "pdf_signature_match": pdf_match,
                "tamper_detected": not hash_match and not pdf_match and not stego_data and not ai_match,
                "verification_basis": (
                    "hash"
                    if hash_match else "pdf_signature"
                    if pdf_match else "steganography"
                    if stego_data else "ai_support"
                    if ai_match else "none"
                ),
                "issue_date": doc.created_at.date().isoformat() if doc.created_at else None,
                "owner": doc.owner_name,
                "plot": doc.plot_number,
                "location": doc.location,
                "issuer": "Ministry of Lands",
                "verified_by": "System",
                "timestamp": datetime.now().isoformat()
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/api/documents/pdf/{record_id}")
async def generate_document_pdf(record_id: str, db: Session = Depends(get_db)):
    """
    Generate a PDF title deed for a document
    """
    try:
        print(f"Generating PDF for record: {record_id}")
        
        # Find document in database
        from models.database import Document
        doc = db.query(Document).filter(Document.record_id == record_id).first()
        
        if not doc:
            print(f"Document not found: {record_id}")
            raise HTTPException(status_code=404, detail="Document not found")
        
        print(f"Document found: {doc.record_id}")
        
        # Prepare document data
        doc_data = {
            "record_id": doc.record_id,
            "owner": doc.owner_name,
            "plot_number": doc.plot_number,
            "location": doc.location,
            "area": doc.area,
            "region": doc.region,
            "district": doc.district or "",
            "fingerprint": doc.document_hash
        }
        
        # Generate QR code for this document
        print("Generating QR code...")
        qr_code = QRService.generate_mini_qr(doc.record_id)
        print(f"QR code generated, length: {len(qr_code)}")
        
        # Generate PDF
        print("Generating PDF...")
        pdf_bytes = PDFService.generate_title_deed(doc_data, qr_code)
        print(f"PDF generated, size: {len(pdf_bytes)} bytes")
        
        # Return PDF as downloadable file
        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={
                "Content-Disposition": f"attachment; filename=title_deed_{doc.record_id}.pdf"
            }
        )
    except ImportError as e:
        print(f"Import Error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Import Error: {str(e)}")
    except Exception as e:
        print(f"PDF Generation Error: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"PDF generation failed: {str(e)}")

@router.get("/api/admin/documents")
async def admin_view_documents(
    authorization: str | None = Header(default=None),
    db: Session = Depends(get_db)
):
    require_firebase_admin(authorization)
    """Admin view to see all documents (decrypted)"""
    documents = db.query(Document).all()
    result = []
    for doc in documents:
        metadata = doc.metadata_json if isinstance(doc.metadata_json, dict) else {}
        ai_fingerprint = metadata.get("ai_fingerprint") if isinstance(metadata, dict) else None
        result.append({
            "id": doc.id,
            "record_id": doc.record_id,
            "owner": doc.owner_name,
            "plot": doc.plot_number,
            "location": doc.location,
            "area": doc.area,
            "region": doc.region,
            "district": doc.district,
            "fingerprint": doc.document_hash[:20] + "...",
            "full_fingerprint": doc.document_hash,
            "ai_signature": ai_fingerprint.get("signature") if isinstance(ai_fingerprint, dict) else None,
            "ai_algorithm": ai_fingerprint.get("algorithm") if isinstance(ai_fingerprint, dict) else None,
            "ai_embedding_dim": ai_fingerprint.get("embedding_dim") if isinstance(ai_fingerprint, dict) else None,
            "created_at": doc.created_at,
            "file_hash": doc.file_hash[:20] + "..."
        })
    return {"documents": result}


@router.delete("/api/admin/documents/{record_id}")
async def admin_delete_document(
    record_id: str,
    authorization: str | None = Header(default=None),
    db: Session = Depends(get_db)
):
    require_firebase_admin(authorization)
    deleted = DocumentCRUD.delete_document(db, record_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Document not found")

    stego_suffix = record_id.replace("LAND-", "", 1)
    stego_filename = f"stego_{stego_suffix}.png"
    stego_path = os.path.join("stego_images", stego_filename)
    if os.path.exists(stego_path):
        try:
            os.remove(stego_path)
        except OSError as exc:
            print(f"⚠️ Failed to remove stego image {stego_path}: {exc}")

    return {"success": True, "record_id": record_id}


@router.get("/api/admin/audit-logs")
async def admin_view_audit_logs(
    status: str | None = None,
    authorization: str | None = Header(default=None),
    db: Session = Depends(get_db)
):
    require_firebase_admin(authorization)

    query = db.query(AccessLog).order_by(AccessLog.created_at.desc())
    if status:
        query = query.filter(AccessLog.status == status)

    logs = query.limit(200).all()
    return {
        "logs": [
            {
                "id": log.id,
                "request_id": log.request_id,
                "document_id": log.document_id,
                "requester": log.requester,
                "reason": log.reason,
                "status": log.status,
                "approvals": log.approvals or [],
                "approval_count": len(log.approvals or []),
                "created_at": log.created_at.isoformat() if log.created_at else None,
            }
            for log in logs
        ]
    }

# New endpoint to verify steganography specifically
@router.post("/api/documents/verify-stego")
async def verify_steganography(file: UploadFile = File(...)):
    """
    Verify document by extracting hidden fingerprint
    """
    try:
        content = await file.read()
        
        # Extract hidden data
        hidden_data = SteganographyService.extract_fingerprint(content)
        
        if not hidden_data:
            return {
                "has_steganography": False,
                "message": "No hidden fingerprint found in image"
            }
        
        return {
            "has_steganography": True,
            "hidden_data": hidden_data,
            "verified": True
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
@router.post("/api/documents/extract-hidden")
async def extract_hidden_data(file: UploadFile = File(...)):
    """Extract hidden data from image (for testing)"""
    try:
        content = await file.read()
        
        # Check if it's an image
        if not file.content_type or not file.content_type.startswith('image/'):
            return {"error": "File must be an image"}
        
        # Extract hidden data
        hidden = SteganographyService.extract_data(content)
        
        if hidden:
            return {
                "success": True,
                "hidden_data": hidden,
                "message": "Hidden data found!"
            }
        else:
            return {
                "success": False,
                "message": "No hidden data found in image"
            }
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

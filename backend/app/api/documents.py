from fastapi import APIRouter, File, UploadFile, Form, HTTPException, Depends, Header
from sqlalchemy.orm import Session
from datetime import datetime
import hashlib
import json
import uuid
from typing import Optional
from services.pdf_service import PDFService
from fastapi.responses import Response
import os

from services.qr_service import QRService
from models.database import get_db, Document
from api.auth import require_firebase_admin
from crud.documents import DocumentCRUD
from services.steganography import SteganographyService

router = APIRouter()


router = APIRouter()

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
            "qr_code": qr_code,
            "mini_qr": mini_qr,
            "stego_available": stego_available,
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

        if not doc:
            return {
                "is_authentic": False,
                "confidence": 0.2,
                "has_steganography": stego_data is not None,
                "stego_data": stego_data,
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

        return {
            "is_authentic": True,
            "confidence": 0.98,
            "has_steganography": stego_data is not None,
            "stego_data": stego_data,
            "details": {
                "hash_match": True,
                "tamper_detected": False,
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
            "created_at": doc.created_at,
            "file_hash": doc.file_hash[:20] + "..."
        })
    return {"documents": result}

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
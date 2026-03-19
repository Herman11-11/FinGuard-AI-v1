from sqlalchemy.orm import Session
from models.database import Document
from datetime import datetime

class DocumentCRUD:
    @staticmethod
    def create_document(db: Session, document_data: dict, file_hash: str, fingerprint: str):
        """Create a new document with encrypted fields"""
        db_document = Document(
            record_id=document_data.get('record_id'),
            document_hash=fingerprint,
            file_hash=file_hash,
            area=int(document_data.get('area', 0)),
            metadata_json=document_data
        )
        # Use property setters for encrypted fields
        db_document.owner_name = document_data.get('owner')
        db_document.plot_number = document_data.get('plot_number')
        db_document.location = document_data.get('location')
        db_document.region = document_data.get('region')
        db_document.district = document_data.get('district')
        
        db.add(db_document)
        db.commit()
        db.refresh(db_document)
        return db_document

    @staticmethod
    def get_document_by_plot(db: Session, plot_number: str):
        """Get document by plot number (search on encrypted field)"""
        # Note: Can't search directly on encrypted field
        # Get all and decrypt in memory (for small DB)
        documents = db.query(Document).all()
        for doc in documents:
            if doc.plot_number == plot_number:
                return doc
        return None

    @staticmethod
    def get_document_by_record_id(db: Session, record_id: str):
        """Get document by record ID (not encrypted)"""
        return db.query(Document).filter(Document.record_id == record_id).first()

    @staticmethod
    def get_document_by_file_hash(db: Session, file_hash: str):
        """Get document by file hash (not encrypted)"""
        return db.query(Document).filter(Document.file_hash == file_hash).first()

    @staticmethod
    def get_all_documents(db: Session, skip: int = 0, limit: int = 100):
        """Get all documents with pagination"""
        return db.query(Document).offset(skip).limit(limit).all()
    
    @staticmethod
    def count_documents(db: Session):
        """Count total documents"""
        return db.query(Document).count()
    
    @staticmethod
    def count_today(db: Session):
        """Count documents created today"""
        today_start = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
        return db.query(Document).filter(Document.created_at >= today_start).count()
    
    @staticmethod
    def delete_document(db: Session, record_id: str):
        """Delete a document (admin only)"""
        doc = db.query(Document).filter(Document.record_id == record_id).first()
        if doc:
            db.delete(doc)
            db.commit()
            return True
        return False
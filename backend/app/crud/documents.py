from sqlalchemy.orm import Session
from models.database import Document
from datetime import datetime

class DocumentCRUD:
    @staticmethod
    def create_document(db: Session, document_data: dict, file_hash: str, fingerprint: str):
        db_document = Document(
            record_id=document_data.get('record_id'),
            document_hash=fingerprint,
            file_hash=file_hash,
            owner_name=document_data.get('owner'),
            plot_number=document_data.get('plot_number'),
            location=document_data.get('location'),
            area=int(document_data.get('area', 0)),
            region=document_data.get('region'),
            district=document_data.get('district'),
            metadata_json=document_data
        )
        db.add(db_document)
        db.commit()
        db.refresh(db_document)
        return db_document

    @staticmethod
    def get_document_by_plot(db: Session, plot_number: str):
        return db.query(Document).filter(Document.plot_number == plot_number).first()

    @staticmethod
    def get_document_by_record_id(db: Session, record_id: str):
        return db.query(Document).filter(Document.record_id == record_id).first()

    @staticmethod
    def get_all_documents(db: Session, skip: int = 0, limit: int = 100):
        return db.query(Document).offset(skip).limit(limit).all()
    
    @staticmethod
    def count_documents(db: Session):
        return db.query(Document).count()
    
    @staticmethod
    def count_today(db: Session):
        today_start = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
        return db.query(Document).filter(Document.created_at >= today_start).count()
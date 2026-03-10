from sqlalchemy import create_engine, Column, String, Integer, DateTime, JSON, Boolean
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from datetime import datetime

# Database setup - using SQLite for simplicity
DATABASE_URL = "sqlite:///./finguard.db"

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

class Document(Base):
    __tablename__ = "documents"
    
    id = Column(Integer, primary_key=True, index=True)
    record_id = Column(String, unique=True, index=True)
    document_hash = Column(String, index=True)
    file_hash = Column(String)
    owner_name = Column(String)
    plot_number = Column(String, index=True)
    location = Column(String)
    area = Column(Integer)
    region = Column(String)
    district = Column(String, nullable=True)
    metadata_json = Column(JSON, default={})
    created_at = Column(DateTime, default=datetime.now)
    is_active = Column(Boolean, default=True)

class AccessLog(Base):
    __tablename__ = "access_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    document_id = Column(String, index=True)
    request_id = Column(String, unique=True, index=True)
    requester = Column(String)
    reason = Column(String)
    approvals = Column(JSON, default=[])
    status = Column(String, default="pending")
    created_at = Column(DateTime, default=datetime.now)

# Create tables
Base.metadata.create_all(bind=engine)

# Database dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
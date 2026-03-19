from sqlalchemy import create_engine, Column, String, Integer, DateTime, JSON, Boolean
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from datetime import datetime
import os
from services.encryption import EncryptionService

# Database setup
DATABASE_URL = "sqlite:///./finguard.db"

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

class Document(Base):
    __tablename__ = "documents"
    
    id = Column(Integer, primary_key=True, index=True)
    record_id = Column(String, unique=True, index=True)
    document_hash = Column(String, index=True)
    file_hash = Column(String, index=True)
    
    # Encrypted fields (store as encrypted text)
    owner_name_encrypted = Column(String, nullable=True)
    plot_number_encrypted = Column(String, nullable=True)
    location_encrypted = Column(String, nullable=True)
    region_encrypted = Column(String, nullable=True)
    district_encrypted = Column(String, nullable=True)
    
    # Regular fields
    area = Column(Integer)
    metadata_json = Column(JSON, default={})
    created_at = Column(DateTime, default=datetime.now)
    is_active = Column(Boolean, default=True)

    @property
    def owner_name(self):
        """Decrypt owner name when accessed"""
        return EncryptionService.decrypt(self.owner_name_encrypted) if self.owner_name_encrypted else None
    
    @owner_name.setter
    def owner_name(self, value):
        """Encrypt owner name when set"""
        self.owner_name_encrypted = EncryptionService.encrypt(value) if value else None
    
    @property
    def plot_number(self):
        return EncryptionService.decrypt(self.plot_number_encrypted) if self.plot_number_encrypted else None
    
    @plot_number.setter
    def plot_number(self, value):
        self.plot_number_encrypted = EncryptionService.encrypt(value) if value else None
    
    @property
    def location(self):
        return EncryptionService.decrypt(self.location_encrypted) if self.location_encrypted else None
    
    @location.setter
    def location(self, value):
        self.location_encrypted = EncryptionService.encrypt(value) if value else None
    
    @property
    def region(self):
        return EncryptionService.decrypt(self.region_encrypted) if self.region_encrypted else None
    
    @region.setter
    def region(self, value):
        self.region_encrypted = EncryptionService.encrypt(value) if value else None
    
    @property
    def district(self):
        return EncryptionService.decrypt(self.district_encrypted) if self.district_encrypted else None
    
    @district.setter
    def district(self, value):
        self.district_encrypted = EncryptionService.encrypt(value) if value else None

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

class Officer(Base):
    __tablename__ = "officers"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    role = Column(String, nullable=True)
    password_hash = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    password_hash = Column(String, nullable=False)
    role = Column(String, default="user")  # user | admin
    is_active = Column(Boolean, default=True)
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

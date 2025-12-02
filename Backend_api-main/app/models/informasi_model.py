"""
Informasi Model
===============
Model untuk tabel informasi (pengumuman/info untuk mobile app)
"""

from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base


class Informasi(Base):
    __tablename__ = "informasi"
    
    # Primary Key
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    
    # Informasi Content
    judul = Column(String(255), nullable=False)
    deskripsi = Column(Text, nullable=False)
    gambar_url = Column(String(500), nullable=True)
    
    # Status & Priority
    is_active = Column(Boolean, default=True, index=True)
    priority = Column(Integer, default=0, index=True, comment="Higher priority = tampil lebih atas (0-100)")
    
    # Visibility Period
    tanggal_mulai = Column(DateTime, nullable=True, comment="Kapan mulai ditampilkan (NULL = langsung)")
    tanggal_selesai = Column(DateTime, nullable=True, comment="Kapan berhenti ditampilkan (NULL = tidak ada batas)")
    
    # Target Audience (MySQL ENUM handled as String in SQLAlchemy)
    target_role = Column(String(20), default='all', index=True)
    
    # Metadata
    created_by = Column(Integer, ForeignKey('users.id_user', ondelete='CASCADE'), nullable=False)
    created_at = Column(DateTime, default=func.now(), index=True)
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
    
    # Relationships
    creator = relationship("User", foreign_keys=[created_by])
    
    def __repr__(self):
        return f"<Informasi(id={self.id}, judul='{self.judul}', is_active={self.is_active})>"
    
    def to_dict(self):
        """Convert model to dictionary"""
        return {
            'id': self.id,
            'judul': self.judul,
            'deskripsi': self.deskripsi,
            'gambar_url': self.gambar_url,
            'is_active': self.is_active,
            'priority': self.priority,
            'tanggal_mulai': self.tanggal_mulai.isoformat() if self.tanggal_mulai else None,
            'tanggal_selesai': self.tanggal_selesai.isoformat() if self.tanggal_selesai else None,
            'target_role': self.target_role,
            'created_by': self.created_by,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
        }

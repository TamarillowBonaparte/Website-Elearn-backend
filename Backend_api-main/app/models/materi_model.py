# # app/models/materi_model.py
# from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
# from sqlalchemy.orm import relationship
# from app.core.database import Base
# from datetime import datetime

# class Materi(Base):
#     __tablename__ = "materi"
    
#     id_materi = Column(Integer, primary_key=True, autoincrement=True)
#     kode_mk = Column(String(20), ForeignKey("mata_kuliah.kode_mk"), nullable=False)
#     minggu = Column(Integer, nullable=False)  # 1-16
#     judul = Column(String(255), nullable=False)
#     deskripsi = Column(Text, nullable=True)
#     file_pdf = Column(String(255), nullable=True)
#     tanggal_upload = Column(DateTime, default=datetime.utcnow)
    
#     # Relationship
#     mata_kuliah = relationship("MataKuliah", back_populates="materi_list")

# app/models/materi_model.py
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Index
from sqlalchemy.orm import relationship
from app.core.database import Base
from datetime import datetime

class Materi(Base):
    __tablename__ = "materi"
    
    id_materi = Column(Integer, primary_key=True, autoincrement=True)
    kode_mk = Column(String(20), ForeignKey("mata_kuliah.kode_mk"), nullable=False)
    id_kelas = Column(Integer, ForeignKey("kelas.id_kelas"), nullable=False)
    minggu = Column(Integer, nullable=False)  # 1-16
    judul = Column(String(255), nullable=False)
    deskripsi = Column(Text, nullable=True)
    file_pdf = Column(String(255), nullable=True)
    uploaded_by = Column(Integer, ForeignKey("dosen.id_dosen"), nullable=True)  # Dosen who uploaded
    tanggal_upload = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    mata_kuliah = relationship("MataKuliah", back_populates="materi_list")
    kelas = relationship("Kelas", foreign_keys=[id_kelas])
    dosen = relationship("Dosen", foreign_keys=[uploaded_by])
    skor_materi = relationship("SkorMateri", back_populates="materi", cascade="all, delete-orphan")
    
    # Index untuk performa query
    __table_args__ = (
        Index('idx_mk_kelas', 'kode_mk', 'id_kelas'),
        Index('idx_mk_kelas_minggu', 'kode_mk', 'id_kelas', 'minggu'),
        Index('idx_uploaded_by', 'uploaded_by'),
    )
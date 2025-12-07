# app/models/skor_materi_model.py
from sqlalchemy import Column, Integer, String, Text, DateTime, Enum, ForeignKey, TIMESTAMP
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base
import enum

class TrackingModeEnum(str, enum.Enum):
    camera = "camera"
    simulated = "simulated"

class SkorMateri(Base):
    __tablename__ = "skor_materi"

    id_skor = Column(Integer, primary_key=True, index=True, autoincrement=True)
    id_mahasiswa = Column(Integer, ForeignKey("mahasiswa.id_mahasiswa"), nullable=False)
    id_materi = Column(Integer, ForeignKey("materi.id_materi", ondelete="CASCADE", onupdate="CASCADE"), nullable=False)
    waktu_belajar = Column(Integer, default=0, comment="Total waktu belajar dalam detik")
    waktu_fokus = Column(Integer, default=0, comment="Total waktu fokus dalam detik")
    jumlah_gangguan = Column(Integer, default=0, comment="Jumlah gangguan/distraksi")
    skor_perhatian = Column(Integer, default=0, comment="Skor perhatian 0-100")
    tracking_mode = Column(Enum(TrackingModeEnum), nullable=False)
    session_start = Column(TIMESTAMP, server_default=func.current_timestamp())
    session_end = Column(TIMESTAMP, nullable=True)
    updated_at = Column(TIMESTAMP, server_default=func.current_timestamp(), onupdate=func.current_timestamp())

    # Relationships
    mahasiswa = relationship("Mahasiswa", back_populates="skor_materi")
    materi = relationship("Materi", back_populates="skor_materi")

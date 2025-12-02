from sqlalchemy import Column, Integer, String, Enum, DateTime, Time, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base

class JadwalKuliah(Base):
    __tablename__ = "jadwal_kuliah"
    
    id_jadwal = Column(Integer, primary_key=True, index=True, autoincrement=True)
    id_kelas_mk = Column(Integer, ForeignKey("kelas_mata_kuliah.id_kelas_mk", ondelete="CASCADE", onupdate="CASCADE"), nullable=False)
    hari = Column(Enum("Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", name="hari_enum"), nullable=False)
    jam_mulai = Column(Time, nullable=True)
    jam_selesai = Column(Time, nullable=True)
    ruangan = Column(String(80), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    kelas_mata_kuliah = relationship("KelasMatKuliah", backref="jadwal_kuliah")

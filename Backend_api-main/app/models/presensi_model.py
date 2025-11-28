from sqlalchemy import Column, Integer, String, Date, DateTime, Enum, TIMESTAMP, Time, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.core.database import Base
from datetime import datetime

class Presensi(Base):
    __tablename__ = "presensi"

    id_presensi = Column(Integer, primary_key=True, autoincrement=True)
    id_mahasiswa = Column(Integer, ForeignKey('mahasiswa.id_mahasiswa', ondelete='CASCADE', onupdate='CASCADE'), nullable=False)
    id_kelas_mk = Column(Integer, ForeignKey('kelas_mata_kuliah.id_kelas_mk'), nullable=False)
    tanggal = Column(Date, nullable=False)
    pertemuan_ke = Column(Integer, nullable=False)
    waktu_mulai = Column(Time)
    waktu_selesai = Column(Time)
    status = Column(Enum("Hadir", "Belum Absen", "Alfa"), default="Belum Absen")
    waktu_input = Column(DateTime, default=None, nullable=True)
    keterangan = Column(String(255), nullable=True)

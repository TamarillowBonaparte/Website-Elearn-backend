from sqlalchemy import Column, Integer, String, ForeignKey, Date, Enum, Text
from sqlalchemy.orm import relationship
from app.core.database import Base

class Mahasiswa(Base):
    __tablename__ = "mahasiswa"

    id_mahasiswa = Column(Integer, primary_key=True, autoincrement=True, index=True)
    user_id = Column(Integer, ForeignKey('users.id_user', ondelete='CASCADE', onupdate='CASCADE'), unique=True, nullable=False)
    nim = Column(String(50), unique=True, nullable=False, index=True)
    nama = Column(String(255), nullable=False, index=True)
    tempat_lahir = Column(String(100))
    tanggal_lahir = Column(Date)
    jenis_kelamin = Column(Enum('L', 'P'))
    agama = Column(String(50))
    alamat = Column(Text)
    no_hp = Column(String(20))
    id_kelas = Column(Integer, ForeignKey('kelas.id_kelas', ondelete='SET NULL', onupdate='CASCADE'))
    
    # Relationships
    user = relationship("User", backref="mahasiswa_profile")
    kelas = relationship("Kelas", backref="mahasiswa_list")
    skor_materi = relationship("SkorMateri", back_populates="mahasiswa")

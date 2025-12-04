# app/schemas/skor_materi_schema.py
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from enum import Enum

class TrackingMode(str, Enum):
    camera = "camera"
    simulated = "simulated"

class SkorMateriBase(BaseModel):
    id_mahasiswa: int
    id_materi: int
    waktu_belajar: int = Field(default=0, description="Total waktu belajar dalam detik")
    waktu_fokus: int = Field(default=0, description="Total waktu fokus dalam detik")
    jumlah_gangguan: int = Field(default=0, description="Jumlah gangguan")
    skor_perhatian: int = Field(default=0, ge=0, le=100, description="Skor perhatian 0-100")
    tracking_mode: TrackingMode

class SkorMateriCreate(SkorMateriBase):
    session_start: Optional[str | datetime] = None
    session_end: Optional[str | datetime] = None

class SkorMateriUpdate(BaseModel):
    waktu_belajar: Optional[int] = None
    waktu_fokus: Optional[int] = None
    jumlah_gangguan: Optional[int] = None
    skor_perhatian: Optional[int] = Field(None, ge=0, le=100)
    session_end: Optional[datetime] = None

class SkorMateriResponse(SkorMateriBase):
    id_skor: int
    session_start: datetime
    session_end: Optional[datetime]
    updated_at: datetime
    
    # Additional fields from joins
    nama_mahasiswa: Optional[str] = None
    nim: Optional[str] = None
    
    class Config:
        from_attributes = True

class SkorMateriStatistik(BaseModel):
    """Response untuk statistik skor per materi"""
    id_materi: int
    judul_materi: str
    total_mahasiswa_kelas: int
    total_sudah_baca: int
    total_belum_baca: int
    rata_rata_skor: Optional[float] = None
    rata_rata_waktu_belajar: Optional[float] = None  # dalam detik
    rata_rata_fokus: Optional[float] = None  # dalam detik
    skor_tertinggi: Optional[int] = None
    skor_terendah: Optional[int] = None
    daftar_skor: list[SkorMateriResponse] = []

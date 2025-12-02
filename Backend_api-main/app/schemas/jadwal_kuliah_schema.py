from pydantic import BaseModel
from datetime import datetime, time
from typing import Optional

class JadwalKuliahBase(BaseModel):
    id_kelas_mk: int
    hari: str
    jam_mulai: Optional[time] = None
    jam_selesai: Optional[time] = None
    ruangan: Optional[str] = None

class JadwalKuliahCreate(JadwalKuliahBase):
    pass

class JadwalKuliahUpdate(BaseModel):
    hari: Optional[str] = None
    jam_mulai: Optional[time] = None
    jam_selesai: Optional[time] = None
    ruangan: Optional[str] = None

class JadwalKuliahResponse(JadwalKuliahBase):
    id_jadwal: int
    created_at: datetime
    updated_at: datetime
    
    # Nested info from kelas_mata_kuliah join
    kode_mk: Optional[str] = None
    nama_mk: Optional[str] = None
    nama_kelas: Optional[str] = None
    nama_dosen: Optional[str] = None
    prodi: Optional[str] = None
    tahun_ajaran: Optional[str] = None
    semester_aktif: Optional[str] = None
    
    class Config:
        from_attributes = True

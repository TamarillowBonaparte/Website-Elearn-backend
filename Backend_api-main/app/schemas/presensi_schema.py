from pydantic import BaseModel
from typing import Optional
from datetime import date, datetime

class PresensiGenerateRequest(BaseModel):
    id_kelas_mk: int
    pertemuan_ke: int
    tanggal: date
    waktu_mulai: str  # Format: "HH:MM"
    waktu_selesai: str  # Format: "HH:MM"

class PresensiResponse(BaseModel):
    id_presensi: int
    id_mahasiswa: int
    id_kelas_mk: int
    tanggal: date
    pertemuan_ke: int
    status: str
    waktu_input: Optional[datetime]
    waktu_mulai: Optional[str]
    waktu_selesai: Optional[str]
    
    class Config:
        from_attributes = True

class PresensiDetailResponse(BaseModel):
    id_presensi: int
    id_mahasiswa: int
    nim: str
    nama_mahasiswa: str
    status: str
    waktu_input: Optional[datetime]
    waktu_mulai: Optional[str]
    waktu_selesai: Optional[str]
    keterangan: Optional[str]
    
    class Config:
        from_attributes = True

class PresensiSummary(BaseModel):
    id: int
    id_kelas_mk: int
    kelas: str
    matkul: str
    kode_mk: str
    pertemuan: int
    tanggal: date
    waktu_mulai: str
    waktu_selesai: str
    total_mhs: int
    hadir: int
    alpa: int

class PresensiMahasiswaResponse(BaseModel):
    """Response schema untuk GET /presensi/mahasiswa/{id_mahasiswa} - Android"""
    id_presensi: int
    id_kelas_mk: int
    kode_mk: str
    nama_mk: str
    kelas: str
    tanggal: date
    pertemuan_ke: int
    status: str
    waktu_mulai: Optional[str]
    waktu_selesai: Optional[str]
    waktu_input: Optional[datetime]
    
    class Config:
        from_attributes = True

class FaceRecognitionUpdateRequest(BaseModel):
    """Request schema untuk POST /presensi/update-status-face-recognition - Android"""
    id_presensi: int
    nim: str

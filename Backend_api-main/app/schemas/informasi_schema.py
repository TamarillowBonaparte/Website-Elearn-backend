"""
Informasi Schemas
================
Pydantic schemas untuk validasi request/response informasi
"""

from pydantic import BaseModel, Field, field_validator
from typing import Optional
from datetime import datetime
from enum import Enum


class TargetRoleEnum(str, Enum):
    """Enum untuk target role"""
    all = "all"
    mahasiswa = "mahasiswa"
    dosen = "dosen"  # Untuk target dosen (admin role)


class InformasiBase(BaseModel):
    """Base schema untuk Informasi"""
    judul: str = Field(..., min_length=5, max_length=255, description="Judul informasi")
    deskripsi: str = Field(..., min_length=10, description="Deskripsi/konten informasi")
    gambar_url: Optional[str] = Field(None, max_length=500, description="URL gambar informasi")
    priority: int = Field(0, ge=0, le=100, description="Prioritas tampil (0-100, lebih tinggi = lebih atas)")
    tanggal_mulai: Optional[datetime] = Field(None, description="Kapan mulai ditampilkan")
    tanggal_selesai: Optional[datetime] = Field(None, description="Kapan berhenti ditampilkan")
    target_role: TargetRoleEnum = Field(TargetRoleEnum.all, description="Target audience")
    
    @field_validator('tanggal_selesai')
    @classmethod
    def validate_tanggal_selesai(cls, v, info):
        """Validasi tanggal_selesai harus setelah tanggal_mulai"""
        if v and info.data.get('tanggal_mulai'):
            if v <= info.data['tanggal_mulai']:
                raise ValueError('tanggal_selesai harus setelah tanggal_mulai')
        return v


class InformasiCreate(InformasiBase):
    """Schema untuk create informasi"""
    pass


class InformasiUpdate(BaseModel):
    """Schema untuk update informasi (semua field optional)"""
    judul: Optional[str] = Field(None, min_length=5, max_length=255)
    deskripsi: Optional[str] = Field(None, min_length=10)
    gambar_url: Optional[str] = Field(None, max_length=500)
    is_active: Optional[bool] = None
    priority: Optional[int] = Field(None, ge=0, le=100)
    tanggal_mulai: Optional[datetime] = None
    tanggal_selesai: Optional[datetime] = None
    target_role: Optional[TargetRoleEnum] = None


class InformasiResponse(InformasiBase):
    """Schema untuk response informasi"""
    id: int
    is_active: bool
    created_by: int
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class InformasiListResponse(BaseModel):
    """Schema untuk response list informasi dengan pagination"""
    total: int
    page: int
    per_page: int
    total_pages: int
    items: list[InformasiResponse]


class InformasiMobileResponse(BaseModel):
    """Schema untuk response mobile app (simplified)"""
    id: int
    judul: str
    deskripsi: str
    gambar_url: Optional[str]
    priority: int
    created_at: datetime
    
    class Config:
        from_attributes = True

# app/schemas/materi_schema.py
from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class MateriBase(BaseModel):
    minggu: int
    judul: str
    deskripsi: Optional[str] = None

class MateriCreate(MateriBase):
    kode_mk: str
    id_kelas: int

class MateriUpdate(BaseModel):
    judul: Optional[str] = None
    deskripsi: Optional[str] = None
    minggu: Optional[int] = None

class MateriResponse(MateriBase):
    id_materi: int
    kode_mk: str
    id_kelas: int
    file_pdf: Optional[str] = None
    uploaded_by: Optional[int] = None
    nama_dosen: Optional[str] = None  # Nama dosen yang upload
    tanggal_upload: datetime
    pdf_url: Optional[str] = None  # URL untuk akses PDF via static
    pdf_file_url: Optional[str] = None  # URL untuk streaming PDF
    pdf_view_url: Optional[str] = None  # URL untuk preview PDF
    pdf_download_url: Optional[str] = None  # URL untuk download PDF
    
    class Config:
        from_attributes = True

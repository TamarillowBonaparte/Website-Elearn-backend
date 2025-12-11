from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from app.core.database import get_db
from app.models.kelas_model import Kelas
from app.utils.token_utils import require_super_admin, require_admin_or_super_admin
from pydantic import BaseModel, Field

router = APIRouter(prefix="/kelas", tags=["Kelas"])


# 🧱 Model Response Aman
class KelasResponse(BaseModel):
    id_kelas: int
    nama_kelas: str
    prodi: Optional[str] = None
    tahun_angkatan: Optional[int] = None
    golongan: Optional[str] = None
    # Kolom lama yang mungkin tidak ada di DB, dibuat opsional agar aman
    tahun_ajaran: Optional[str] = None
    semester: Optional[str] = None

    class Config:
        from_attributes = True


class KelasCreate(BaseModel):
    nama_kelas: str = Field(..., min_length=2, max_length=50)
    prodi: str = Field(..., description="TIF|MIF|TKK")
    tahun_angkatan: Optional[int] = Field(None, ge=2000, le=2100)
    golongan: Optional[str] = Field(None, max_length=10)


class KelasUpdate(BaseModel):
    nama_kelas: Optional[str] = Field(None, min_length=2, max_length=50)
    prodi: Optional[str] = Field(None, description="TIF|MIF|TKK")
    tahun_angkatan: Optional[int] = Field(None, ge=2000, le=2100)
    golongan: Optional[str] = Field(None, max_length=10)


@router.get("/", response_model=List[KelasResponse])
def get_all_kelas(db: Session = Depends(get_db)):
    """
    Ambil semua kelas dari database.
    Akan menampilkan data meskipun kolom tahun_ajaran/semester belum ada atau NULL.
    """
    try:
        kelas_list = db.query(Kelas).all()

        if not kelas_list:
            raise HTTPException(status_code=404, detail="Belum ada data kelas")

        return kelas_list

    except HTTPException:
        raise
    except Exception as e:
        print(f"🔴 Error get_all_kelas: {e}")
        raise HTTPException(status_code=500, detail=f"Gagal mengambil data kelas: {str(e)}")


@router.get("/{id_kelas}", response_model=KelasResponse)
def get_kelas_by_id(id_kelas: int, db: Session = Depends(get_db)):
    """Get kelas by ID"""
    try:
        kelas = db.query(Kelas).filter(Kelas.id_kelas == id_kelas).first()
        
        if not kelas:
            raise HTTPException(status_code=404, detail="Kelas tidak ditemukan")
        
        return kelas
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"🔴 Error get_kelas_by_id: {e}")
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")


@router.post("/", response_model=KelasResponse, status_code=status.HTTP_201_CREATED)
def create_kelas(
    payload: KelasCreate, 
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_admin_or_super_admin)
):
    """Tambah kelas baru (Admin or Super Admin)"""
    try:
        if payload.prodi not in ("TIF", "MIF", "TKK"):
            raise HTTPException(status_code=400, detail="Prodi harus salah satu dari: TIF, MIF, TKK")

        # Check if kelas with same name already exists
        existing = db.query(Kelas).filter(Kelas.nama_kelas == payload.nama_kelas).first()
        if existing:
            raise HTTPException(status_code=400, detail="Kelas dengan nama tersebut sudah ada")

        new_kelas = Kelas(
            nama_kelas=payload.nama_kelas,
            prodi=payload.prodi,
            tahun_angkatan=payload.tahun_angkatan,
            golongan=payload.golongan
        )
        db.add(new_kelas)
        db.commit()
        db.refresh(new_kelas)
        return new_kelas
    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        print(f"🔴 Error create_kelas: {e}")
        raise HTTPException(status_code=500, detail=f"Gagal menambah kelas: {str(e)}")


@router.put("/{id_kelas}", response_model=KelasResponse)
def update_kelas(
    id_kelas: int,
    payload: KelasUpdate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_admin_or_super_admin)
):
    """Update kelas (Admin or Super Admin)"""
    try:
        kelas = db.query(Kelas).filter(Kelas.id_kelas == id_kelas).first()
        if not kelas:
            raise HTTPException(status_code=404, detail="Kelas tidak ditemukan")
        
        # Validate prodi if provided
        if payload.prodi and payload.prodi not in ("TIF", "MIF", "TKK"):
            raise HTTPException(status_code=400, detail="Prodi harus salah satu dari: TIF, MIF, TKK")
        
        # Check duplicate nama_kelas
        if payload.nama_kelas:
            existing = db.query(Kelas).filter(
                Kelas.nama_kelas == payload.nama_kelas,
                Kelas.id_kelas != id_kelas
            ).first()
            if existing:
                raise HTTPException(status_code=400, detail="Kelas dengan nama tersebut sudah ada")
        
        # Update fields
        if payload.nama_kelas is not None:
            kelas.nama_kelas = payload.nama_kelas
        if payload.prodi is not None:
            kelas.prodi = payload.prodi
        if payload.tahun_angkatan is not None:
            kelas.tahun_angkatan = payload.tahun_angkatan
        if payload.golongan is not None:
            kelas.golongan = payload.golongan
        
        db.commit()
        db.refresh(kelas)
        return kelas
    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        print(f"🔴 Error update_kelas: {e}")
        raise HTTPException(status_code=500, detail=f"Gagal mengupdate kelas: {str(e)}")


@router.delete("/{id_kelas}", status_code=status.HTTP_200_OK)
def delete_kelas(
    id_kelas: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_admin_or_super_admin)
):
    """Delete kelas (Admin or Super Admin)"""
    try:
        kelas = db.query(Kelas).filter(Kelas.id_kelas == id_kelas).first()
        if not kelas:
            raise HTTPException(status_code=404, detail="Kelas tidak ditemukan")
        
        # Check if kelas is being used by students or courses
        from app.models.mahasiswa_model import Mahasiswa
        from app.models.kelas_mata_kuliah_model import KelasMatKuliah
        
        mahasiswa_count = db.query(Mahasiswa).filter(Mahasiswa.id_kelas == id_kelas).count()
        if mahasiswa_count > 0:
            raise HTTPException(
                status_code=400, 
                detail=f"Tidak dapat menghapus kelas. Masih ada {mahasiswa_count} mahasiswa terdaftar di kelas ini"
            )
        
        kelas_mk_count = db.query(KelasMatKuliah).filter(KelasMatKuliah.id_kelas == id_kelas).count()
        if kelas_mk_count > 0:
            raise HTTPException(
                status_code=400,
                detail=f"Tidak dapat menghapus kelas. Masih ada {kelas_mk_count} mata kuliah terkait dengan kelas ini"
            )
        
        db.delete(kelas)
        db.commit()
        return {"message": "Kelas berhasil dihapus", "id_kelas": id_kelas}
    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        print(f"🔴 Error delete_kelas: {e}")
        raise HTTPException(status_code=500, detail=f"Gagal menghapus kelas: {str(e)}")

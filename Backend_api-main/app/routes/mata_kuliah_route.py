# # # app/routers/mata_kuliah_router.py
# # from fastapi import APIRouter, Depends, HTTPException
# # from sqlalchemy.orm import Session, joinedload
# # from app.core.database import get_db
# # from app.models.mata_kuliah_model import MataKuliah
# # from app.schemas.mata_kuliah_schema import MataKuliahResponse
# # from typing import List

# # router = APIRouter(prefix="/mata-kuliah", tags=["Mata Kuliah"])

# # @router.get("/", response_model=List[MataKuliahResponse])
# # def get_all_mata_kuliah(db: Session = Depends(get_db)):
# #     """
# #     Mendapatkan semua data mata kuliah beserta nama dosen
# #     """
# #     try:
# #         # Query dengan JOIN ke tabel dosen
# #         mata_kuliah_list = db.query(MataKuliah).options(
# #             joinedload(MataKuliah.dosen)
# #         ).all()
        
# #         # Transform data ke format frontend
# #         result = []
# #         for mk in mata_kuliah_list:
# #             result.append({
# #                 "kode": mk.kode_mk,
# #                 "nama": mk.nama_mk,
# #                 "dosen": mk.dosen.nama_dosen if mk.dosen else "Belum ditentukan",
# #                 "sks": mk.sks if mk.sks is not None else 0
# #             })
        
# #         return result
        
# #     except Exception as e:
# #         raise HTTPException(
# #             status_code=500, 
# #             detail=f"Error mengambil data mata kuliah: {str(e)}"
# #         )

# from fastapi import APIRouter, Depends, HTTPException
# from sqlalchemy.orm import Session
# from sqlalchemy import text
# from app.core.database import get_db

# router = APIRouter(prefix="/mata-kuliah", tags=["Mata Kuliah"])

# @router.get("/")
# def get_all_mata_kuliah(db: Session = Depends(get_db)):
#     try:
#         query = text("""
#             SELECT 
#                 mk.kode_mk as kode,
#                 mk.nama_mk as nama,
#                 COALESCE(d.nama_dosen, 'Belum ditentukan') as dosen,
#                 COALESCE(k.nama_kelas, 'Belum ditentukan') as kelas,
#                 COALESCE(mk.sks, 0) as sks
#             FROM mata_kuliah mk
#             LEFT JOIN dosen d ON mk.id_dosen = d.id_dosen
#             LEFT JOIN kelas k ON mk.id_kelas = k.id_kelas
#             ORDER BY mk.kode_mk
#         """)
        
#         result = db.execute(query)
#         rows = result.fetchall()
        
#         data = []
#         for row in rows:
#             data.append({
#                 "kode": row.kode,
#                 "nama": row.nama,
#                 "dosen": row.dosen,
#                 "kelas": row.kelas,  # ✅ Tambahkan kelas
#                 "sks": row.sks
#             })
        
#         return data
        
#     except Exception as e:
#         print(f"🔴 Error: {str(e)}")
#         raise HTTPException(status_code=500, detail=f"Error: {str(e)}")

# app/routes/mata_kuliah_route.py
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.core.database import get_db
from app.models.mata_kuliah_model import MataKuliah
from app.utils.token_utils import get_current_user, require_super_admin, require_admin_or_super_admin
from typing import Optional
from pydantic import BaseModel, Field

router = APIRouter(prefix="/mata-kuliah", tags=["Mata Kuliah"])


class MataKuliahCreate(BaseModel):
    kode_mk: str = Field(..., min_length=2, max_length=20, description="Kode mata kuliah")
    nama_mk: str = Field(..., min_length=3, max_length=200, description="Nama mata kuliah")
    sks: Optional[int] = Field(None, ge=1, le=6, description="Jumlah SKS (1-6)")
    semester: Optional[int] = Field(None, ge=1, le=8, description="Semester (1-8)")
    deskripsi: Optional[str] = Field(None, max_length=1000, description="Deskripsi mata kuliah")


class MataKuliahUpdate(BaseModel):
    nama_mk: Optional[str] = Field(None, min_length=3, max_length=200)
    sks: Optional[int] = Field(None, ge=1, le=6)
    semester: Optional[int] = Field(None, ge=1, le=8)
    deskripsi: Optional[str] = Field(None, max_length=1000)

@router.get("/")
def get_all_mata_kuliah(db: Session = Depends(get_db)):
    """Get semua mata kuliah"""
    try:
        query = text("""
            SELECT 
                mk.kode_mk,
                mk.nama_mk,
                COALESCE(mk.sks, 0) as sks,
                mk.semester,
                mk.deskripsi
            FROM mata_kuliah mk
            ORDER BY mk.kode_mk
        """)
        result = db.execute(query)
        
        rows = result.fetchall()
        
        data = []
        for row in rows:
            data.append({
                "kode_mk": row.kode_mk,
                "nama_mk": row.nama_mk,
                "sks": row.sks,
                "semester": row.semester if row.semester else None,
                "deskripsi": row.deskripsi if row.deskripsi else None
            })
        
        return data
        
    except Exception as e:
        print(f"Error get_all_mata_kuliah: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")


@router.get("/kelas/{id_kelas}")
def get_mata_kuliah_by_kelas(id_kelas: int, db: Session = Depends(get_db)):
    """Get mata kuliah berdasarkan ID kelas"""
    try:
        query = text("""
            SELECT 
                mk.kode_mk,
                mk.nama_mk,
                COALESCE(d.nama_dosen, 'Belum ditentukan') as nama_dosen,
                COALESCE(mk.sks, 0) as sks,
                mk.id_kelas,
                mk.id_dosen,
                mk.semester
            FROM mata_kuliah mk
            LEFT JOIN dosen d ON mk.id_dosen = d.id_dosen
            WHERE mk.id_kelas = :id_kelas
            ORDER BY mk.kode_mk
        """)
        
        result = db.execute(query, {"id_kelas": id_kelas})
        rows = result.fetchall()
        
        data = []
        for row in rows:
            data.append({
                "kode_mk": row.kode_mk,
                "nama_mk": row.nama_mk,
                "nama_dosen": row.nama_dosen,
                "sks": row.sks,
                "id_kelas": row.id_kelas,
                "id_dosen": row.id_dosen,
                "semester": row.semester
            })
        
        return data
        
    except Exception as e:
        print(f"Error get_mata_kuliah_by_kelas: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")


@router.get("/{kode_mk}")
def get_mata_kuliah_by_kode(kode_mk: str, db: Session = Depends(get_db)):
    """Get mata kuliah by kode"""
    try:
        query = text("""
            SELECT 
                mk.kode_mk,
                mk.nama_mk,
                COALESCE(d.nama_dosen, 'Belum ditentukan') as nama_dosen,
                COALESCE(k.nama_kelas, '-') as nama_kelas,
                COALESCE(mk.sks, 0) as sks,
                mk.id_kelas,
                mk.id_dosen,
                mk.semester
            FROM mata_kuliah mk
            LEFT JOIN dosen d ON mk.id_dosen = d.id_dosen
            LEFT JOIN kelas k ON mk.id_kelas = k.id_kelas
            WHERE mk.kode_mk = :kode_mk
        """)
        
        result = db.execute(query, {"kode_mk": kode_mk})
        row = result.fetchone()
        
        if not row:
            raise HTTPException(status_code=404, detail="Mata kuliah tidak ditemukan")
        
        return {
            "kode_mk": row.kode_mk,
            "nama_mk": row.nama_mk,
            "nama_dosen": row.nama_dosen,
            "nama_kelas": row.nama_kelas,
            "sks": row.sks,
            "id_kelas": row.id_kelas,
            "id_dosen": row.id_dosen,
            "semester": row.semester
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error get_mata_kuliah_by_kode: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")


@router.post("/", status_code=status.HTTP_201_CREATED)
def create_mata_kuliah(
    payload: MataKuliahCreate, 
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_admin_or_super_admin)
):
    """Tambah mata kuliah baru (Admin or Super Admin)"""
    try:
        existing = db.query(MataKuliah).filter(MataKuliah.kode_mk == payload.kode_mk).first()
        if existing:
            raise HTTPException(status_code=400, detail="Kode mata kuliah sudah digunakan")
        
        new_mk = MataKuliah(
            kode_mk=payload.kode_mk,
            nama_mk=payload.nama_mk,
            sks=payload.sks,
            semester=payload.semester,
            deskripsi=payload.deskripsi
        )
        db.add(new_mk)
        db.commit()
        db.refresh(new_mk)
        return {
            "message": "Mata kuliah berhasil ditambahkan",
            "kode_mk": new_mk.kode_mk,
            "nama_mk": new_mk.nama_mk,
            "sks": new_mk.sks,
            "semester": new_mk.semester,
            "deskripsi": new_mk.deskripsi
        }
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        print(f"Error create_mata_kuliah: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Gagal menambah mata kuliah: {str(e)}")


@router.put("/{kode_mk}")
def update_mata_kuliah(
    kode_mk: str, 
    payload: MataKuliahUpdate, 
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_admin_or_super_admin)
):
    """Edit data mata kuliah (Admin or Super Admin)"""
    try:
        mk = db.query(MataKuliah).filter(MataKuliah.kode_mk == kode_mk).first()
        if not mk:
            raise HTTPException(status_code=404, detail="Mata kuliah tidak ditemukan")
        
        if payload.nama_mk is not None:
            mk.nama_mk = payload.nama_mk
        if payload.sks is not None:
            mk.sks = payload.sks
        if payload.semester is not None:
            mk.semester = payload.semester
        if payload.deskripsi is not None:
            mk.deskripsi = payload.deskripsi
        
        db.commit()
        db.refresh(mk)
        return {
            "message": "Mata kuliah berhasil diupdate",
            "kode_mk": mk.kode_mk,
            "nama_mk": mk.nama_mk,
            "sks": mk.sks,
            "semester": mk.semester,
            "deskripsi": mk.deskripsi
        }
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        print(f"Error update_mata_kuliah: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Gagal mengedit mata kuliah: {str(e)}")


@router.delete("/{kode_mk}", status_code=status.HTTP_200_OK)
def delete_mata_kuliah(
    kode_mk: str, 
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_admin_or_super_admin)
):
    """Hapus mata kuliah (Admin or Super Admin)"""
    try:
        mk = db.query(MataKuliah).filter(MataKuliah.kode_mk == kode_mk).first()
        if not mk:
            raise HTTPException(status_code=404, detail="Mata kuliah tidak ditemukan")
        db.delete(mk)
        db.commit()
        return {"message": "Mata kuliah berhasil dihapus", "kode_mk": kode_mk}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        print(f"Error delete_mata_kuliah: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Gagal menghapus mata kuliah: {str(e)}")
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from typing import List
from app.core.database import get_db
from app.models.jadwal_kuliah_model import JadwalKuliah
from app.models.kelas_mata_kuliah_model import KelasMatKuliah
from app.models.mata_kuliah_model import MataKuliah
from app.models.kelas_model import Kelas
from app.models.dosen_model import Dosen
from app.models.mahasiswa_model import Mahasiswa
from app.schemas.jadwal_kuliah_schema import (
    JadwalKuliahCreate,
    JadwalKuliahUpdate,
    JadwalKuliahResponse
)
from app.utils.token_utils import get_current_user, require_super_admin

router = APIRouter(prefix="/jadwal-kuliah", tags=["Jadwal Kuliah"])

@router.get("/", response_model=List[JadwalKuliahResponse])
def get_all_jadwal(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """Get all jadwal kuliah (for super_admin)"""
    jadwal_list = db.query(JadwalKuliah).options(
        joinedload(JadwalKuliah.kelas_mata_kuliah)
        .joinedload(KelasMatKuliah.mata_kuliah),
        joinedload(JadwalKuliah.kelas_mata_kuliah)
        .joinedload(KelasMatKuliah.kelas),
        joinedload(JadwalKuliah.kelas_mata_kuliah)
        .joinedload(KelasMatKuliah.dosen)
    ).offset(skip).limit(limit).all()
    
    result = []
    for jadwal in jadwal_list:
        kmk = jadwal.kelas_mata_kuliah
        result.append({
            "id_jadwal": jadwal.id_jadwal,
            "id_kelas_mk": jadwal.id_kelas_mk,
            "hari": jadwal.hari,
            "jam_mulai": jadwal.jam_mulai,
            "jam_selesai": jadwal.jam_selesai,
            "ruangan": jadwal.ruangan,
            "created_at": jadwal.created_at,
            "updated_at": jadwal.updated_at,
            "kode_mk": kmk.kode_mk if kmk else None,
            "nama_mk": kmk.mata_kuliah.nama_mk if kmk and kmk.mata_kuliah else None,
            "nama_kelas": kmk.kelas.nama_kelas if kmk and kmk.kelas else None,
            "nama_dosen": kmk.dosen.nama_dosen if kmk and kmk.dosen else None,
            "prodi": kmk.kelas.prodi if kmk and kmk.kelas else None,
            "tahun_ajaran": kmk.tahun_ajaran if kmk else None,
            "semester_aktif": kmk.semester_aktif if kmk else None
        })
    
    return result

@router.get("/me", response_model=List[JadwalKuliahResponse])
def get_my_jadwal(
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get jadwal kuliah for logged in user (admin/dosen gets filtered, super_admin gets all)"""
    user_role = current_user.get("role")
    
    # Super admin can see all jadwal
    if user_role == "super_admin":
        return get_all_jadwal(db=db)
    
    # Admin (dosen) can only see their own jadwal
    if user_role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only dosen (admin) or super admin can access this endpoint"
        )
    
    # Get dosen by user_id
    dosen = db.query(Dosen).filter(Dosen.user_id == current_user.get("user_id")).first()
    if not dosen:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Dosen profile not found"
        )
    
    # Get jadwal for dosen's kelas_mata_kuliah only (status Aktif)
    jadwal_list = db.query(JadwalKuliah).join(
        KelasMatKuliah, JadwalKuliah.id_kelas_mk == KelasMatKuliah.id_kelas_mk
    ).filter(
        KelasMatKuliah.id_dosen == dosen.id_dosen,
        KelasMatKuliah.status == "Aktif"
    ).options(
        joinedload(JadwalKuliah.kelas_mata_kuliah)
        .joinedload(KelasMatKuliah.mata_kuliah),
        joinedload(JadwalKuliah.kelas_mata_kuliah)
        .joinedload(KelasMatKuliah.kelas),
        joinedload(JadwalKuliah.kelas_mata_kuliah)
        .joinedload(KelasMatKuliah.dosen)
    ).all()
    
    result = []
    for jadwal in jadwal_list:
        kmk = jadwal.kelas_mata_kuliah
        result.append({
            "id_jadwal": jadwal.id_jadwal,
            "id_kelas_mk": jadwal.id_kelas_mk,
            "hari": jadwal.hari,
            "jam_mulai": jadwal.jam_mulai,
            "jam_selesai": jadwal.jam_selesai,
            "ruangan": jadwal.ruangan,
            "created_at": jadwal.created_at,
            "updated_at": jadwal.updated_at,
            "kode_mk": kmk.kode_mk if kmk else None,
            "nama_mk": kmk.mata_kuliah.nama_mk if kmk and kmk.mata_kuliah else None,
            "nama_kelas": kmk.kelas.nama_kelas if kmk and kmk.kelas else None,
            "nama_dosen": kmk.dosen.nama_dosen if kmk and kmk.dosen else None,
            "prodi": kmk.kelas.prodi if kmk and kmk.kelas else None,
            "tahun_ajaran": kmk.tahun_ajaran if kmk else None,
            "semester_aktif": kmk.semester_aktif if kmk else None
        })
    
    return result

@router.get("/mahasiswa/me", response_model=List[JadwalKuliahResponse])
def get_mahasiswa_jadwal(
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get jadwal kuliah for logged in mahasiswa based on their kelas"""
    user_role = current_user.get("role")
    
    # Only mahasiswa can access this endpoint
    if user_role != "mahasiswa":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only mahasiswa can access this endpoint"
        )
    
    # Get mahasiswa by user_id
    mahasiswa = db.query(Mahasiswa).filter(Mahasiswa.user_id == current_user.get("user_id")).first()
    if not mahasiswa:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Mahasiswa profile not found"
        )
    
    if not mahasiswa.id_kelas:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Mahasiswa tidak memiliki kelas"
        )
    
    # Get all active kelas_mata_kuliah for this kelas
    kelas_mk_list = db.query(KelasMatKuliah).filter(
        KelasMatKuliah.id_kelas == mahasiswa.id_kelas,
        KelasMatKuliah.status == "Aktif"
    ).all()
    
    if not kelas_mk_list:
        return []
    
    # Get all jadwal for these kelas_mata_kuliah
    kelas_mk_ids = [kmk.id_kelas_mk for kmk in kelas_mk_list]
    jadwal_list = db.query(JadwalKuliah).filter(
        JadwalKuliah.id_kelas_mk.in_(kelas_mk_ids)
    ).options(
        joinedload(JadwalKuliah.kelas_mata_kuliah)
        .joinedload(KelasMatKuliah.mata_kuliah),
        joinedload(JadwalKuliah.kelas_mata_kuliah)
        .joinedload(KelasMatKuliah.kelas),
        joinedload(JadwalKuliah.kelas_mata_kuliah)
        .joinedload(KelasMatKuliah.dosen)
    ).order_by(
        JadwalKuliah.hari,
        JadwalKuliah.jam_mulai
    ).all()
    
    result = []
    for jadwal in jadwal_list:
        kmk = jadwal.kelas_mata_kuliah
        result.append({
            "id_jadwal": jadwal.id_jadwal,
            "id_kelas_mk": jadwal.id_kelas_mk,
            "hari": jadwal.hari,
            "jam_mulai": jadwal.jam_mulai,
            "jam_selesai": jadwal.jam_selesai,
            "ruangan": jadwal.ruangan,
            "created_at": jadwal.created_at,
            "updated_at": jadwal.updated_at,
            "kode_mk": kmk.kode_mk if kmk else None,
            "nama_mk": kmk.mata_kuliah.nama_mk if kmk and kmk.mata_kuliah else None,
            "nama_kelas": kmk.kelas.nama_kelas if kmk and kmk.kelas else None,
            "nama_dosen": kmk.dosen.nama_dosen if kmk and kmk.dosen else None,
            "prodi": kmk.kelas.prodi if kmk and kmk.kelas else None,
            "tahun_ajaran": kmk.tahun_ajaran if kmk else None,
            "semester_aktif": kmk.semester_aktif if kmk else None
        })
    
    return result

@router.get("/{id_jadwal}", response_model=JadwalKuliahResponse)
def get_jadwal_by_id(
    id_jadwal: int,
    db: Session = Depends(get_db)
):
    """Get specific jadwal kuliah by ID"""
    jadwal = db.query(JadwalKuliah).options(
        joinedload(JadwalKuliah.kelas_mata_kuliah)
        .joinedload(KelasMatKuliah.mata_kuliah),
        joinedload(JadwalKuliah.kelas_mata_kuliah)
        .joinedload(KelasMatKuliah.kelas),
        joinedload(JadwalKuliah.kelas_mata_kuliah)
        .joinedload(KelasMatKuliah.dosen)
    ).filter(JadwalKuliah.id_jadwal == id_jadwal).first()
    
    if not jadwal:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Jadwal Kuliah not found"
        )
    
    kmk = jadwal.kelas_mata_kuliah
    return {
        "id_jadwal": jadwal.id_jadwal,
        "id_kelas_mk": jadwal.id_kelas_mk,
        "hari": jadwal.hari,
        "jam_mulai": jadwal.jam_mulai,
        "jam_selesai": jadwal.jam_selesai,
        "ruangan": jadwal.ruangan,
        "created_at": jadwal.created_at,
        "updated_at": jadwal.updated_at,
        "kode_mk": kmk.kode_mk if kmk else None,
        "nama_mk": kmk.mata_kuliah.nama_mk if kmk and kmk.mata_kuliah else None,
        "nama_kelas": kmk.kelas.nama_kelas if kmk and kmk.kelas else None,
        "nama_dosen": kmk.dosen.nama_dosen if kmk and kmk.dosen else None,
        "prodi": kmk.kelas.prodi if kmk and kmk.kelas else None,
        "tahun_ajaran": kmk.tahun_ajaran if kmk else None,
        "semester_aktif": kmk.semester_aktif if kmk else None
    }

@router.post("/", response_model=JadwalKuliahResponse, status_code=status.HTTP_201_CREATED)
def create_jadwal(
    jadwal: JadwalKuliahCreate,
    current_user: dict = Depends(require_super_admin),
    db: Session = Depends(get_db)
):
    """Create new jadwal kuliah (super_admin only)"""
    # Validate kelas_mata_kuliah exists
    kelas_mk = db.query(KelasMatKuliah).filter(
        KelasMatKuliah.id_kelas_mk == jadwal.id_kelas_mk
    ).first()
    
    if not kelas_mk:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Kelas Mata Kuliah with id {jadwal.id_kelas_mk} not found"
        )
    
    # Check for duplicate jadwal (same kelas_mk and hari)
    existing = db.query(JadwalKuliah).filter(
        JadwalKuliah.id_kelas_mk == jadwal.id_kelas_mk,
        JadwalKuliah.hari == jadwal.hari
    ).first()
    
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Jadwal for this kelas mata kuliah on {jadwal.hari} already exists"
        )
    
    new_jadwal = JadwalKuliah(**jadwal.dict())
    db.add(new_jadwal)
    db.commit()
    db.refresh(new_jadwal)
    
    return get_jadwal_by_id(new_jadwal.id_jadwal, db)

@router.put("/{id_jadwal}", response_model=JadwalKuliahResponse)
def update_jadwal(
    id_jadwal: int,
    jadwal_update: JadwalKuliahUpdate,
    current_user: dict = Depends(require_super_admin),
    db: Session = Depends(get_db)
):
    """Update jadwal kuliah (super_admin only)"""
    jadwal = db.query(JadwalKuliah).filter(JadwalKuliah.id_jadwal == id_jadwal).first()
    
    if not jadwal:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Jadwal Kuliah not found"
        )
    
    update_data = jadwal_update.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(jadwal, key, value)
    
    db.commit()
    db.refresh(jadwal)
    
    return get_jadwal_by_id(jadwal.id_jadwal, db)

@router.delete("/{id_jadwal}", status_code=status.HTTP_204_NO_CONTENT)
def delete_jadwal(
    id_jadwal: int,
    current_user: dict = Depends(require_super_admin),
    db: Session = Depends(get_db)
):
    """Delete jadwal kuliah (super_admin only)"""
    jadwal = db.query(JadwalKuliah).filter(JadwalKuliah.id_jadwal == id_jadwal).first()
    
    if not jadwal:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Jadwal Kuliah not found"
        )
    
    db.delete(jadwal)
    db.commit()
    
    return None

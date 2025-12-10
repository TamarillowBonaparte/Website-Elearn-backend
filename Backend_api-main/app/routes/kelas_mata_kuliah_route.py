from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from typing import List
from app.core.database import get_db
from app.models.kelas_mata_kuliah_model import KelasMatKuliah
from app.models.mata_kuliah_model import MataKuliah
from app.models.kelas_model import Kelas
from app.models.dosen_model import Dosen
from app.schemas.kelas_mata_kuliah_schema import (
    KelasMatKuliahCreate,
    KelasMatKuliahUpdate,
    KelasMatKuliahResponse,
    KelasMatKuliahDetail
)
from app.utils.token_utils import get_current_user, require_super_admin, require_admin_or_super_admin

router = APIRouter(prefix="/kelas-mata-kuliah", tags=["Kelas Mata Kuliah"])

@router.get("/", response_model=List[KelasMatKuliahDetail])
def get_all_kelas_mk(
    skip: int = 0,
    limit: int = 100,
    tahun_ajaran: str = None,
    semester_aktif: str = None,
    status: str = None,
    db: Session = Depends(get_db)
):
    """Get all kelas mata kuliah with filters"""
    query = db.query(KelasMatKuliah).options(
        joinedload(KelasMatKuliah.mata_kuliah),
        joinedload(KelasMatKuliah.kelas),
        joinedload(KelasMatKuliah.dosen)
    )
    
    if tahun_ajaran:
        query = query.filter(KelasMatKuliah.tahun_ajaran == tahun_ajaran)
    if semester_aktif:
        query = query.filter(KelasMatKuliah.semester_aktif == semester_aktif)
    if status:
        query = query.filter(KelasMatKuliah.status == status)
    
    kelas_mk_list = query.offset(skip).limit(limit).all()
    
    result = []
    for kmk in kelas_mk_list:
        result.append({
            "id_kelas_mk": kmk.id_kelas_mk,
            "kode_mk": kmk.kode_mk,
            "id_kelas": kmk.id_kelas,
            "id_dosen": kmk.id_dosen,
            "tahun_ajaran": kmk.tahun_ajaran,
            "semester_aktif": kmk.semester_aktif,
            "status": kmk.status,
            "created_at": kmk.created_at,
            "updated_at": kmk.updated_at,
            "nama_mk": kmk.mata_kuliah.nama_mk if kmk.mata_kuliah else None,
            "sks": kmk.mata_kuliah.sks if kmk.mata_kuliah else None,
            "semester": kmk.mata_kuliah.semester if kmk.mata_kuliah else None,
            "nama_kelas": kmk.kelas.nama_kelas if kmk.kelas else None,
            "prodi": kmk.kelas.prodi if kmk.kelas else None,
            "nama_dosen": kmk.dosen.nama_dosen if kmk.dosen else None,
            "nip": kmk.dosen.nip if kmk.dosen else None,
            "email_dosen": kmk.dosen.email_dosen if kmk.dosen else None
        })
    
    return result

@router.get("/dosen/{id_dosen}", response_model=List[KelasMatKuliahDetail])
def get_kelas_mk_by_dosen(
    id_dosen: int,
    tahun_ajaran: str = None,
    semester_aktif: str = None,
    db: Session = Depends(get_db)
):
    """Get all kelas mata kuliah for specific dosen"""
    query = db.query(KelasMatKuliah).options(
        joinedload(KelasMatKuliah.mata_kuliah),
        joinedload(KelasMatKuliah.kelas),
        joinedload(KelasMatKuliah.dosen)
    ).filter(KelasMatKuliah.id_dosen == id_dosen)
    
    if tahun_ajaran:
        query = query.filter(KelasMatKuliah.tahun_ajaran == tahun_ajaran)
    if semester_aktif:
        query = query.filter(KelasMatKuliah.semester_aktif == semester_aktif)
    
    # Default filter: only Aktif
    query = query.filter(KelasMatKuliah.status == "Aktif")
    
    kelas_mk_list = query.all()
    
    result = []
    for kmk in kelas_mk_list:
        result.append({
            "id_kelas_mk": kmk.id_kelas_mk,
            "kode_mk": kmk.kode_mk,
            "id_kelas": kmk.id_kelas,
            "id_dosen": kmk.id_dosen,
            "tahun_ajaran": kmk.tahun_ajaran,
            "semester_aktif": kmk.semester_aktif,
            "status": kmk.status,
            "created_at": kmk.created_at,
            "updated_at": kmk.updated_at,
            "nama_mk": kmk.mata_kuliah.nama_mk if kmk.mata_kuliah else None,
            "sks": kmk.mata_kuliah.sks if kmk.mata_kuliah else None,
            "semester": kmk.mata_kuliah.semester if kmk.mata_kuliah else None,
            "nama_kelas": kmk.kelas.nama_kelas if kmk.kelas else None,
            "prodi": kmk.kelas.prodi if kmk.kelas else None,
            "nama_dosen": kmk.dosen.nama_dosen if kmk.dosen else None,
            "nip": kmk.dosen.nip if kmk.dosen else None,
            "email_dosen": kmk.dosen.email_dosen if kmk.dosen else None
        })
    
    return result

@router.get("/me", response_model=List[KelasMatKuliahDetail])
def get_my_kelas_mk(
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get kelas mata kuliah for logged in user (admin/dosen or all for super_admin)"""
    user_role = current_user.get("role")
    
    # Super admin can see all kelas mata kuliah
    if user_role == "super_admin":
        return get_all_kelas_mk(db=db)
    
    # Admin (dosen) can only see their own
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
    
    return get_kelas_mk_by_dosen(dosen.id_dosen, db=db)

@router.get("/{id_kelas_mk}", response_model=KelasMatKuliahDetail)
def get_kelas_mk_by_id(
    id_kelas_mk: int,
    db: Session = Depends(get_db)
):
    """Get specific kelas mata kuliah by ID"""
    kmk = db.query(KelasMatKuliah).options(
        joinedload(KelasMatKuliah.mata_kuliah),
        joinedload(KelasMatKuliah.kelas),
        joinedload(KelasMatKuliah.dosen)
    ).filter(KelasMatKuliah.id_kelas_mk == id_kelas_mk).first()
    
    if not kmk:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Kelas Mata Kuliah not found"
        )
    
    return {
        "id_kelas_mk": kmk.id_kelas_mk,
        "kode_mk": kmk.kode_mk,
        "id_kelas": kmk.id_kelas,
        "id_dosen": kmk.id_dosen,
        "tahun_ajaran": kmk.tahun_ajaran,
        "semester_aktif": kmk.semester_aktif,
        "status": kmk.status,
        "created_at": kmk.created_at,
        "updated_at": kmk.updated_at,
        "nama_mk": kmk.mata_kuliah.nama_mk if kmk.mata_kuliah else None,
        "sks": kmk.mata_kuliah.sks if kmk.mata_kuliah else None,
        "semester": kmk.mata_kuliah.semester if kmk.mata_kuliah else None,
        "nama_kelas": kmk.kelas.nama_kelas if kmk.kelas else None,
        "prodi": kmk.kelas.prodi if kmk.kelas else None,
        "nama_dosen": kmk.dosen.nama_dosen if kmk.dosen else None,
        "nip": kmk.dosen.nip if kmk.dosen else None,
        "email_dosen": kmk.dosen.email_dosen if kmk.dosen else None
    }

@router.post("/", response_model=KelasMatKuliahResponse, status_code=status.HTTP_201_CREATED)
def create_kelas_mk(
    kelas_mk: KelasMatKuliahCreate,
    current_user: dict = Depends(require_admin_or_super_admin),
    db: Session = Depends(get_db)
):
    """Create new kelas mata kuliah (admin or super_admin)"""
    # Validate mata_kuliah exists
    mata_kuliah = db.query(MataKuliah).filter(MataKuliah.kode_mk == kelas_mk.kode_mk).first()
    if not mata_kuliah:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Mata Kuliah with kode_mk {kelas_mk.kode_mk} not found"
        )
    
    # Validate kelas exists
    kelas = db.query(Kelas).filter(Kelas.id_kelas == kelas_mk.id_kelas).first()
    if not kelas:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Kelas with id {kelas_mk.id_kelas} not found"
        )
    
    # Validate dosen exists
    dosen = db.query(Dosen).filter(Dosen.id_dosen == kelas_mk.id_dosen).first()
    if not dosen:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Dosen with id {kelas_mk.id_dosen} not found"
        )
    
    # Check for duplicate (unique constraint)
    existing = db.query(KelasMatKuliah).filter(
        KelasMatKuliah.kode_mk == kelas_mk.kode_mk,
        KelasMatKuliah.id_kelas == kelas_mk.id_kelas,
        KelasMatKuliah.tahun_ajaran == kelas_mk.tahun_ajaran,
        KelasMatKuliah.semester_aktif == kelas_mk.semester_aktif
    ).first()
    
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This combination of mata_kuliah, kelas, tahun_ajaran, and semester already exists"
        )
    
    new_kelas_mk = KelasMatKuliah(**kelas_mk.dict())
    db.add(new_kelas_mk)
    db.commit()
    db.refresh(new_kelas_mk)
    
    return new_kelas_mk

@router.put("/{id_kelas_mk}", response_model=KelasMatKuliahResponse)
def update_kelas_mk(
    id_kelas_mk: int,
    kelas_mk_update: KelasMatKuliahUpdate,
    current_user: dict = Depends(require_admin_or_super_admin),
    db: Session = Depends(get_db)
):
    """Update kelas mata kuliah (admin or super_admin)"""
    kelas_mk = db.query(KelasMatKuliah).filter(KelasMatKuliah.id_kelas_mk == id_kelas_mk).first()
    
    if not kelas_mk:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Kelas Mata Kuliah not found"
        )
    
    update_data = kelas_mk_update.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(kelas_mk, key, value)
    
    db.commit()
    db.refresh(kelas_mk)
    
    return kelas_mk

@router.delete("/{id_kelas_mk}", status_code=status.HTTP_204_NO_CONTENT)
def delete_kelas_mk(
    id_kelas_mk: int,
    current_user: dict = Depends(require_admin_or_super_admin),
    db: Session = Depends(get_db)
):
    """Delete kelas mata kuliah (admin or super_admin)"""
    kelas_mk = db.query(KelasMatKuliah).filter(KelasMatKuliah.id_kelas_mk == id_kelas_mk).first()
    
    if not kelas_mk:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Kelas Mata Kuliah not found"
        )
    
    db.delete(kelas_mk)
    db.commit()
    
    return None

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload
from typing import Optional, List, Union
from app.core.database import get_db
from app.models.user_model import User, RoleEnum
from app.models.mahasiswa_model import Mahasiswa
from app.models.dosen_model import Dosen
from app.models.kelas_model import Kelas
from app.schemas.user_schema import UserResponse, UserRegister, UserUpdate, AdminCreate, AdminResponse
from app.schemas.mahasiswa_schema import (
    UserMahasiswaCreate, 
    UserMahasiswaResponse, 
    UserMahasiswaUpdate
)
from app.schemas.dosen_schema import (
    UserDosenCreate,
    UserDosenResponse,
    UserDosenUpdate
)
from app.core.security import hash_password
from app.utils.token_utils import require_super_admin, require_admin_or_super_admin, get_current_user

router = APIRouter(prefix="/users", tags=["Users"])

# =====================================================
# GET ALL USERS
# Returns users with their profile data (if mahasiswa)
# =====================================================
@router.get("/")
def get_users(
    role: Optional[str] = Query(None, description="Filter by role: admin, super_admin, mahasiswa"),
    db: Session = Depends(get_db)
):
    """Get all users with their profile data (mahasiswa or dosen)"""
    query = db.query(User)
    
    if role:
        query = query.filter(User.role == role)
    
    users = query.all()
    
    result = []
    for user in users:
        user_dict = {
            "id_user": user.id_user,
            "username": user.username,
            "email": user.email,
            "role": user.role.value if hasattr(user.role, 'value') else user.role,
            "is_active": user.is_active,
        }
        
        # If mahasiswa, include profile data
        if user.role == RoleEnum.mahasiswa:
            mhs = db.query(Mahasiswa).filter(Mahasiswa.user_id == user.id_user).first()
            if mhs:
                user_dict.update({
                    "id_mahasiswa": mhs.id_mahasiswa,
                    "nim": mhs.nim,
                    "nama": mhs.nama,
                    "tempat_lahir": mhs.tempat_lahir,
                    "tanggal_lahir": mhs.tanggal_lahir,
                    "jenis_kelamin": mhs.jenis_kelamin,
                    "agama": mhs.agama,
                    "alamat": mhs.alamat,
                    "no_hp": mhs.no_hp,
                    "id_kelas": mhs.id_kelas,
                })
                
                # Add kelas name if exists
                if mhs.id_kelas:
                    kelas = db.query(Kelas).filter(Kelas.id_kelas == mhs.id_kelas).first()
                    if kelas:
                        user_dict["nama_kelas"] = kelas.nama_kelas
        
        # If admin (dosen), include dosen profile data
        elif user.role == RoleEnum.admin:
            dosen = db.query(Dosen).filter(Dosen.user_id == user.id_user).first()
            if dosen:
                user_dict.update({
                    "id_dosen": dosen.id_dosen,
                    "nip": dosen.nip,
                    "nama_dosen": dosen.nama_dosen,
                    "email_dosen": dosen.email_dosen,
                    "tempat_lahir": dosen.tempat_lahir,
                    "tanggal_lahir": dosen.tanggal_lahir,
                    "jenis_kelamin": dosen.jenis_kelamin,
                    "agama": dosen.agama,
                    "alamat": dosen.alamat,
                    "no_hp": dosen.no_hp,
                })
        
        result.append(user_dict)
    
    return result

# =====================================================
# GET USER BY ID
# =====================================================
@router.get("/{user_id}")
def get_user(user_id: int, db: Session = Depends(get_db)):
    """Get user by ID with profile data (mahasiswa or dosen)"""
    user = db.query(User).filter(User.id_user == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User tidak ditemukan")
    
    user_dict = {
        "id_user": user.id_user,
        "username": user.username,
        "email": user.email,
        "role": user.role.value if hasattr(user.role, 'value') else user.role,
        "is_active": user.is_active,
    }
    
    # If mahasiswa, get profile data
    if user.role == RoleEnum.mahasiswa:
        mhs = db.query(Mahasiswa).filter(Mahasiswa.user_id == user_id).first()
        if mhs:
            user_dict.update({
                "id_mahasiswa": mhs.id_mahasiswa,
                "nim": mhs.nim,
                "nama": mhs.nama,
                "tempat_lahir": mhs.tempat_lahir,
                "tanggal_lahir": mhs.tanggal_lahir,
                "jenis_kelamin": mhs.jenis_kelamin,
                "agama": mhs.agama,
                "alamat": mhs.alamat,
                "no_hp": mhs.no_hp,
                "id_kelas": mhs.id_kelas,
            })
            
            if mhs.id_kelas:
                kelas = db.query(Kelas).filter(Kelas.id_kelas == mhs.id_kelas).first()
                if kelas:
                    user_dict["nama_kelas"] = kelas.nama_kelas
    
    # If admin (dosen), get dosen profile data
    elif user.role == RoleEnum.admin:
        dosen = db.query(Dosen).filter(Dosen.user_id == user_id).first()
        if dosen:
            user_dict.update({
                "id_dosen": dosen.id_dosen,
                "nip": dosen.nip,
                "nama_dosen": dosen.nama_dosen,
                "email_dosen": dosen.email_dosen,
                "tempat_lahir": dosen.tempat_lahir,
                "tanggal_lahir": dosen.tanggal_lahir,
                "jenis_kelamin": dosen.jenis_kelamin,
                "agama": dosen.agama,
                "alamat": dosen.alamat,
                "no_hp": dosen.no_hp,
            })
    
    return user_dict

# =====================================================
# CREATE ADMIN USER (No Profile - Super Admin only)
# =====================================================
@router.post("/admin", response_model=AdminResponse)
def create_admin(
    user_data: AdminCreate, 
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_super_admin)
):
    """Create super_admin user without profile - Only super_admin"""
    # Only allow super_admin creation here
    if user_data.role != 'super_admin':
        raise HTTPException(status_code=400, detail="Endpoint ini hanya untuk super_admin. Gunakan /users/dosen untuk admin/dosen")
    
    # Check if username exists
    if db.query(User).filter(User.username == user_data.username).first():
        raise HTTPException(status_code=400, detail="Username sudah digunakan")
    
    # Check if email exists
    if db.query(User).filter(User.email == user_data.email).first():
        raise HTTPException(status_code=400, detail="Email sudah digunakan")
    
    # Create user
    new_user = User(
        username=user_data.username,
        email=user_data.email,
        password=hash_password(user_data.password),
        role=user_data.role,
        is_active=True
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    return {
        "id_user": new_user.id_user,
        "username": new_user.username,
        "email": new_user.email,
        "role": new_user.role.value if hasattr(new_user.role, 'value') else new_user.role,
        "is_active": new_user.is_active
    }

# =====================================================
# CREATE DOSEN (User + Profile)
# =====================================================
@router.post("/dosen", response_model=UserDosenResponse)
def create_dosen(
    dosen_data: UserDosenCreate, 
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_admin_or_super_admin)
):
    """Create dosen with user account and profile - Admin or Super Admin"""
    # Check if username exists
    if db.query(User).filter(User.username == dosen_data.username).first():
        raise HTTPException(status_code=400, detail="Username sudah digunakan")
    
    # Check if email exists
    if db.query(User).filter(User.email == dosen_data.email).first():
        raise HTTPException(status_code=400, detail="Email sudah digunakan")
    
    # Check if NIP exists
    if db.query(Dosen).filter(Dosen.nip == dosen_data.nip).first():
        raise HTTPException(status_code=400, detail="NIP sudah digunakan")
    
    try:
        # 1. Create user (authentication)
        new_user = User(
            username=dosen_data.username,
            email=dosen_data.email,
            password=hash_password(dosen_data.password),
            role='admin',  # Dosen = admin role
            is_active=True
        )
        db.add(new_user)
        db.flush()  # Get user_id without committing
        
        # 2. Create dosen profile
        new_dosen = Dosen(
            user_id=new_user.id_user,
            nip=dosen_data.nip,
            nama_dosen=dosen_data.nama_dosen,
            email_dosen=dosen_data.email_dosen,
            tempat_lahir=dosen_data.tempat_lahir,
            tanggal_lahir=dosen_data.tanggal_lahir,
            jenis_kelamin=dosen_data.jenis_kelamin,
            agama=dosen_data.agama,
            alamat=dosen_data.alamat,
            no_hp=dosen_data.no_hp
        )
        db.add(new_dosen)
        db.commit()
        db.refresh(new_user)
        db.refresh(new_dosen)
        
        return {
            "id_user": new_user.id_user,
            "username": new_user.username,
            "email": new_user.email,
            "role": new_user.role.value if hasattr(new_user.role, 'value') else new_user.role,
            "is_active": new_user.is_active,
            "id_dosen": new_dosen.id_dosen,
            "nip": new_dosen.nip,
            "nama_dosen": new_dosen.nama_dosen,
            "email_dosen": new_dosen.email_dosen,
            "tempat_lahir": new_dosen.tempat_lahir,
            "tanggal_lahir": new_dosen.tanggal_lahir,
            "jenis_kelamin": new_dosen.jenis_kelamin,
            "agama": new_dosen.agama,
            "alamat": new_dosen.alamat,
            "no_hp": new_dosen.no_hp
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Gagal membuat dosen: {str(e)}")

# =====================================================
# CREATE MAHASISWA (User + Profile)
# =====================================================
@router.post("/mahasiswa", response_model=UserMahasiswaResponse)
def create_mahasiswa(
    mahasiswa_data: UserMahasiswaCreate, 
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_admin_or_super_admin)
):
    """Create mahasiswa with user account and profile - Admin or Super Admin"""
    # Check if username exists
    if db.query(User).filter(User.username == mahasiswa_data.username).first():
        raise HTTPException(status_code=400, detail="Username sudah digunakan")
    
    # Check if email exists
    if db.query(User).filter(User.email == mahasiswa_data.email).first():
        raise HTTPException(status_code=400, detail="Email sudah digunakan")
    
    # Check if NIM exists
    if db.query(Mahasiswa).filter(Mahasiswa.nim == mahasiswa_data.nim).first():
        raise HTTPException(status_code=400, detail="NIM sudah digunakan")
    
    try:
        # 1. Create user (authentication)
        new_user = User(
            username=mahasiswa_data.username,
            email=mahasiswa_data.email,
            password=hash_password(mahasiswa_data.password),
            role='mahasiswa',
            is_active=True
        )
        db.add(new_user)
        db.flush()  # Get user_id without committing
        
        # 2. Create mahasiswa profile
        new_mahasiswa = Mahasiswa(
            user_id=new_user.id_user,
            nim=mahasiswa_data.nim,
            nama=mahasiswa_data.nama,
            tempat_lahir=mahasiswa_data.tempat_lahir,
            tanggal_lahir=mahasiswa_data.tanggal_lahir,
            jenis_kelamin=mahasiswa_data.jenis_kelamin,
            agama=mahasiswa_data.agama,
            alamat=mahasiswa_data.alamat,
            no_hp=mahasiswa_data.no_hp,
            id_kelas=mahasiswa_data.id_kelas
        )
        db.add(new_mahasiswa)
        db.commit()
        db.refresh(new_user)
        db.refresh(new_mahasiswa)
        
        # Get kelas name
        nama_kelas = None
        if new_mahasiswa.id_kelas:
            kelas = db.query(Kelas).filter(Kelas.id_kelas == new_mahasiswa.id_kelas).first()
            if kelas:
                nama_kelas = kelas.nama_kelas
        
        return {
            "id_user": new_user.id_user,
            "username": new_user.username,
            "email": new_user.email,
            "role": new_user.role.value if hasattr(new_user.role, 'value') else new_user.role,
            "is_active": new_user.is_active,
            "id_mahasiswa": new_mahasiswa.id_mahasiswa,
            "nim": new_mahasiswa.nim,
            "nama": new_mahasiswa.nama,
            "tempat_lahir": new_mahasiswa.tempat_lahir,
            "tanggal_lahir": new_mahasiswa.tanggal_lahir,
            "jenis_kelamin": new_mahasiswa.jenis_kelamin,
            "agama": new_mahasiswa.agama,
            "alamat": new_mahasiswa.alamat,
            "no_hp": new_mahasiswa.no_hp,
            "id_kelas": new_mahasiswa.id_kelas,
            "nama_kelas": nama_kelas
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Gagal membuat mahasiswa: {str(e)}")

# =====================================================
# UPDATE USER (Mahasiswa)
# =====================================================
@router.put("/mahasiswa/{user_id}", response_model=UserMahasiswaResponse)
def update_mahasiswa(
    user_id: int, 
    update_data: UserMahasiswaUpdate, 
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_admin_or_super_admin)
):
    """Update mahasiswa user and profile - Admin or Super Admin"""
    user = db.query(User).filter(User.id_user == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User tidak ditemukan")
    
    if user.role != RoleEnum.mahasiswa:
        raise HTTPException(status_code=400, detail="User bukan mahasiswa")
    
    try:
        # Update user fields
        if update_data.username is not None:
            existing = db.query(User).filter(
                User.username == update_data.username,
                User.id_user != user_id
            ).first()
            if existing:
                raise HTTPException(status_code=400, detail="Username sudah digunakan")
            user.username = update_data.username
        
        if update_data.email is not None:
            existing = db.query(User).filter(
                User.email == update_data.email,
                User.id_user != user_id
            ).first()
            if existing:
                raise HTTPException(status_code=400, detail="Email sudah digunakan")
            user.email = update_data.email
        
        if update_data.password is not None and update_data.password != "":
            user.password = hash_password(update_data.password)
        
        # Update mahasiswa profile
        mahasiswa = db.query(Mahasiswa).filter(Mahasiswa.user_id == user_id).first()
        if mahasiswa:
            if update_data.nim is not None:
                existing = db.query(Mahasiswa).filter(
                    Mahasiswa.nim == update_data.nim,
                    Mahasiswa.id_mahasiswa != mahasiswa.id_mahasiswa
                ).first()
                if existing:
                    raise HTTPException(status_code=400, detail="NIM sudah digunakan")
                mahasiswa.nim = update_data.nim
            
            if update_data.nama is not None:
                mahasiswa.nama = update_data.nama
            if update_data.tempat_lahir is not None:
                mahasiswa.tempat_lahir = update_data.tempat_lahir
            if update_data.tanggal_lahir is not None:
                mahasiswa.tanggal_lahir = update_data.tanggal_lahir
            if update_data.jenis_kelamin is not None:
                mahasiswa.jenis_kelamin = update_data.jenis_kelamin
            if update_data.agama is not None:
                mahasiswa.agama = update_data.agama
            if update_data.alamat is not None:
                mahasiswa.alamat = update_data.alamat
            if update_data.no_hp is not None:
                mahasiswa.no_hp = update_data.no_hp
            if update_data.id_kelas is not None:
                mahasiswa.id_kelas = update_data.id_kelas
        
        db.commit()
        db.refresh(user)
        db.refresh(mahasiswa)
        
        # Build response
        user_dict = {
            "id_user": user.id_user,
            "username": user.username,
            "email": user.email,
            "role": user.role.value if hasattr(user.role, 'value') else user.role,
            "is_active": user.is_active,
            "id_mahasiswa": mahasiswa.id_mahasiswa,
            "nim": mahasiswa.nim,
            "nama": mahasiswa.nama,
            "tempat_lahir": mahasiswa.tempat_lahir,
            "tanggal_lahir": mahasiswa.tanggal_lahir,
            "jenis_kelamin": mahasiswa.jenis_kelamin,
            "agama": mahasiswa.agama,
            "alamat": mahasiswa.alamat,
            "no_hp": mahasiswa.no_hp,
            "id_kelas": mahasiswa.id_kelas,
        }
        
        if mahasiswa.id_kelas:
            kelas = db.query(Kelas).filter(Kelas.id_kelas == mahasiswa.id_kelas).first()
            if kelas:
                user_dict["nama_kelas"] = kelas.nama_kelas
        
        return user_dict
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Gagal update mahasiswa: {str(e)}")

# =====================================================
# UPDATE USER (Dosen)
# =====================================================
# =====================================================
# UPDATE DOSEN SELF PROFILE (for dosen editing their own profile)
# =====================================================
@router.put("/dosen/me/profile", response_model=UserDosenResponse)
def update_own_dosen_profile(
    update_data: UserDosenUpdate, 
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Update own dosen profile - Dosen can edit their own profile"""
    # Verify user is a dosen/admin
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Hanya dosen yang dapat mengakses endpoint ini")
    
    user_id = current_user.get("user_id")
    user = db.query(User).filter(User.id_user == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User tidak ditemukan")
    
    try:
        # Update user fields
        if update_data.username is not None:
            existing = db.query(User).filter(
                User.username == update_data.username,
                User.id_user != user_id
            ).first()
            if existing:
                raise HTTPException(status_code=400, detail="Username sudah digunakan")
            user.username = update_data.username
        
        if update_data.email is not None:
            existing = db.query(User).filter(
                User.email == update_data.email,
                User.id_user != user_id
            ).first()
            if existing:
                raise HTTPException(status_code=400, detail="Email sudah digunakan")
            user.email = update_data.email
        
        if update_data.password is not None and update_data.password != "":
            user.password = hash_password(update_data.password)
        
        # Dosen cannot change their own is_active status
        # if update_data.is_active is not None:
        #     user.is_active = update_data.is_active
        
        # Update dosen profile
        dosen = db.query(Dosen).filter(Dosen.user_id == user_id).first()
        if not dosen:
            raise HTTPException(status_code=404, detail="Profil dosen tidak ditemukan")
        
        if update_data.nip is not None:
            existing = db.query(Dosen).filter(
                Dosen.nip == update_data.nip,
                Dosen.id_dosen != dosen.id_dosen
            ).first()
            if existing:
                raise HTTPException(status_code=400, detail="NIP sudah digunakan")
            dosen.nip = update_data.nip
        
        if update_data.nama_dosen is not None:
            dosen.nama_dosen = update_data.nama_dosen
        if update_data.email_dosen is not None:
            dosen.email_dosen = update_data.email_dosen
        if update_data.tempat_lahir is not None:
            dosen.tempat_lahir = update_data.tempat_lahir
        if update_data.tanggal_lahir is not None:
            dosen.tanggal_lahir = update_data.tanggal_lahir
        if update_data.jenis_kelamin is not None:
            dosen.jenis_kelamin = update_data.jenis_kelamin
        if update_data.agama is not None:
            dosen.agama = update_data.agama
        if update_data.alamat is not None:
            dosen.alamat = update_data.alamat
        if update_data.no_hp is not None:
            dosen.no_hp = update_data.no_hp
        
        db.commit()
        db.refresh(user)
        db.refresh(dosen)
        
        # Build response
        return {
            "id_user": user.id_user,
            "username": user.username,
            "email": user.email,
            "role": user.role.value if hasattr(user.role, 'value') else user.role,
            "is_active": user.is_active,
            "id_dosen": dosen.id_dosen,
            "nip": dosen.nip,
            "nama_dosen": dosen.nama_dosen,
            "email_dosen": dosen.email_dosen,
            "tempat_lahir": dosen.tempat_lahir,
            "tanggal_lahir": dosen.tanggal_lahir,
            "jenis_kelamin": dosen.jenis_kelamin,
            "agama": dosen.agama,
            "alamat": dosen.alamat,
            "no_hp": dosen.no_hp
        }
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Gagal update profil: {str(e)}")

# =====================================================
# UPDATE DOSEN (by super_admin)
# =====================================================
@router.put("/dosen/{user_id}", response_model=UserDosenResponse)
def update_dosen(
    user_id: int, 
    update_data: UserDosenUpdate, 
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_admin_or_super_admin)
):
    """Update dosen user and profile - Admin or Super Admin"""
    user = db.query(User).filter(User.id_user == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User tidak ditemukan")
    
    if user.role != RoleEnum.admin:
        raise HTTPException(status_code=400, detail="User bukan dosen")
    
    try:
        # Update user fields
        if update_data.username is not None:
            existing = db.query(User).filter(
                User.username == update_data.username,
                User.id_user != user_id
            ).first()
            if existing:
                raise HTTPException(status_code=400, detail="Username sudah digunakan")
            user.username = update_data.username
        
        if update_data.email is not None:
            existing = db.query(User).filter(
                User.email == update_data.email,
                User.id_user != user_id
            ).first()
            if existing:
                raise HTTPException(status_code=400, detail="Email sudah digunakan")
            user.email = update_data.email
        
        if update_data.password is not None and update_data.password != "":
            user.password = hash_password(update_data.password)
        
        if update_data.is_active is not None:
            user.is_active = update_data.is_active
        
        # Update dosen profile
        dosen = db.query(Dosen).filter(Dosen.user_id == user_id).first()
        if dosen:
            if update_data.nip is not None:
                existing = db.query(Dosen).filter(
                    Dosen.nip == update_data.nip,
                    Dosen.id_dosen != dosen.id_dosen
                ).first()
                if existing:
                    raise HTTPException(status_code=400, detail="NIP sudah digunakan")
                dosen.nip = update_data.nip
            
            if update_data.nama_dosen is not None:
                dosen.nama_dosen = update_data.nama_dosen
            if update_data.email_dosen is not None:
                dosen.email_dosen = update_data.email_dosen
            if update_data.tempat_lahir is not None:
                dosen.tempat_lahir = update_data.tempat_lahir
            if update_data.tanggal_lahir is not None:
                dosen.tanggal_lahir = update_data.tanggal_lahir
            if update_data.jenis_kelamin is not None:
                dosen.jenis_kelamin = update_data.jenis_kelamin
            if update_data.agama is not None:
                dosen.agama = update_data.agama
            if update_data.alamat is not None:
                dosen.alamat = update_data.alamat
            if update_data.no_hp is not None:
                dosen.no_hp = update_data.no_hp
        
        db.commit()
        db.refresh(user)
        db.refresh(dosen)
        
        # Build response
        return {
            "id_user": user.id_user,
            "username": user.username,
            "email": user.email,
            "role": user.role.value if hasattr(user.role, 'value') else user.role,
            "is_active": user.is_active,
            "id_dosen": dosen.id_dosen,
            "nip": dosen.nip,
            "nama_dosen": dosen.nama_dosen,
            "email_dosen": dosen.email_dosen,
            "tempat_lahir": dosen.tempat_lahir,
            "tanggal_lahir": dosen.tanggal_lahir,
            "jenis_kelamin": dosen.jenis_kelamin,
            "agama": dosen.agama,
            "alamat": dosen.alamat,
            "no_hp": dosen.no_hp
        }
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Gagal update dosen: {str(e)}")

# =====================================================
# DELETE USER
# =====================================================
@router.delete("/{user_id}")
def delete_user(
    user_id: int, 
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_admin_or_super_admin)
):
    """Delete user - Admin or Super Admin (mahasiswa/dosen profile will be deleted automatically via CASCADE)"""
    user = db.query(User).filter(User.id_user == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User tidak ditemukan")
    
    # Prevent deleting super_admin
    if user.role == RoleEnum.super_admin:
        raise HTTPException(
            status_code=403, 
            detail="Super Admin tidak dapat dihapus untuk menjaga keamanan sistem."
        )
    
    try:
        # Manual cascade delete untuk mahasiswa profile jika ada
        if user.role == RoleEnum.mahasiswa:
            mahasiswa = db.query(Mahasiswa).filter(Mahasiswa.user_id == user_id).first()
            if mahasiswa:
                # Delete akan cascade ke presensi melalui database FK
                db.delete(mahasiswa)
        
        # Manual cascade delete untuk dosen profile jika ada
        elif user.role == RoleEnum.admin:
            dosen = db.query(Dosen).filter(Dosen.user_id == user_id).first()
            if dosen:
                # Delete akan cascade melalui database FK
                db.delete(dosen)
        
        # Delete user
        db.delete(user)
        db.commit()
        return {"message": "User berhasil dihapus", "id": user_id}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Gagal menghapus user: {str(e)}")

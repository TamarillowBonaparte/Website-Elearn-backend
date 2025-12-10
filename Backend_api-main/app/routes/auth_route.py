from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.user_model import User
from app.schemas.user_schema import UserRegister, UserLogin, UserResponse
from app.core.security import hash_password, verify_password
from app.utils.token_utils import create_access_token, get_current_user

router = APIRouter(prefix="/auth", tags=["Auth"])

@router.post("/register", response_model=UserResponse)
def register(user: UserRegister, db: Session = Depends(get_db)):
    """Register new user (authentication only). For mahasiswa with profile, use /users/mahasiswa"""
    if db.query(User).filter(User.username == user.username).first():
        raise HTTPException(status_code=400, detail="Username sudah digunakan")
    if db.query(User).filter(User.email == user.email).first():
        raise HTTPException(status_code=400, detail="Email sudah digunakan")

    new_user = User(
        username=user.username,
        email=user.email,
        password=hash_password(user.password),
        role=user.role,
        is_active=True
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user


@router.post("/login")
def login(request: UserLogin, db: Session = Depends(get_db)):
    from app.models.mahasiswa_model import Mahasiswa
    from app.models.dosen_model import Dosen
    
    user = db.query(User).filter(User.username == request.username).first()
    if not user or not verify_password(request.password, user.password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Username atau password salah")

    # Check if user role - Block mahasiswa from web login
    user_role = user.role.value if hasattr(user.role, 'value') else str(user.role)
    if user_role == 'mahasiswa':
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, 
            detail="Mahasiswa tidak memiliki akses ke website. Silakan gunakan aplikasi mobile."
        )
    
    # Only allow admin and super_admin to login to web
    if user_role not in ['admin', 'super_admin']:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Akses ditolak. Hanya admin dan super admin yang dapat mengakses website."
        )

    # Create access token with user_id, username, role, and email
    access_token = create_access_token({
        "sub": user.username,
        "user_id": user.id_user,
        "username": user.username,
        "role": user_role,
        "email": user.email
    })
    
    # Build user info
    user_info = {
        "id_user": user.id_user,
        "username": user.username,
        "role": user_role,
        "email": user.email
    }
    
    # If admin (dosen), get name from dosen table
    if user_role == 'admin':
        dosen = db.query(Dosen).filter(Dosen.user_id == user.id_user).first()
        if dosen:
            user_info["nama"] = dosen.nama_dosen
            user_info["nip"] = dosen.nip
    # If super_admin, just use username or email as name
    elif user_role == 'super_admin':
        user_info["nama"] = user.username
    
    return {
        "access_token": access_token, 
        "token_type": "bearer",
        "user": user_info
    }


@router.get("/me")
def get_current_user_info(
    current_user: dict = Depends(get_current_user)
):
    """
    Get current authenticated user info from token
    Useful for debugging token payload
    """
    return {
        "user_id": current_user.get("user_id"),
        "username": current_user.get("username"),
        "role": current_user.get("role"),
        "email": current_user.get("email"),
        "full_payload": current_user
    }


@router.post("/login/mobile")
def login_mobile(request: UserLogin, db: Session = Depends(get_db)):
    """
    Login endpoint khusus untuk Android/Mobile app
    Hanya mahasiswa yang bisa login melalui endpoint ini
    """
    from app.models.mahasiswa_model import Mahasiswa
    from app.models.kelas_model import Kelas
    
    user = db.query(User).filter(User.username == request.username).first()
    if not user or not verify_password(request.password, user.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, 
            detail="Username atau password salah"
        )

    # Check if user is mahasiswa
    user_role = user.role.value if hasattr(user.role, 'value') else str(user.role)
    if user_role != 'mahasiswa':
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Akses ditolak. Hanya mahasiswa yang dapat login ke aplikasi mobile."
        )
    
    # Get mahasiswa profile
    mahasiswa = db.query(Mahasiswa).filter(Mahasiswa.user_id == user.id_user).first()
    if not mahasiswa:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Data mahasiswa tidak ditemukan"
        )
    
    # Get kelas information if available
    nama_kelas = None
    if mahasiswa.id_kelas:
        kelas = db.query(Kelas).filter(Kelas.id_kelas == mahasiswa.id_kelas).first()
        if kelas:
            nama_kelas = kelas.nama_kelas
    
    # Create access token
    access_token = create_access_token({
        "sub": user.username,
        "user_id": user.id_user,
        "username": user.username,
        "role": user_role,
        "email": user.email,
        "id_mahasiswa": mahasiswa.id_mahasiswa
    })
    
    # Build user info
    user_info = {
        "id_user": user.id_user,
        "id_mahasiswa": mahasiswa.id_mahasiswa,
        "username": user.username,
        "role": user_role,
        "email": user.email,
        "nim": mahasiswa.nim,
        "nama": mahasiswa.nama,
        "id_kelas": mahasiswa.id_kelas,
        "nama_kelas": nama_kelas
    }
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user_info
    }


# from fastapi import APIRouter, Depends, HTTPException, status
# from sqlalchemy.orm import Session
# from app.core.database import get_db
# from app.models.user_model import User
# from app.schemas.user_schema import UserRegister, UserLogin, UserResponse
# from app.core.security import hash_password, verify_password
# from app.utils.token_utils import create_access_token

# router = APIRouter(prefix="/auth", tags=["Auth"])


# @router.post("/register", response_model=UserResponse)
# def register(user: UserRegister, db: Session = Depends(get_db)):
#     # Cek apakah username sudah digunakan
#     if db.query(User).filter(User.username == user.username).first():
#         raise HTTPException(status_code=400, detail="Username sudah digunakan")

#     # Cek apakah email sudah digunakan
#     if db.query(User).filter(User.email == user.email).first():
#         raise HTTPException(status_code=400, detail="Email sudah digunakan")

#     # Pastikan password berupa string murni dan tidak melebihi 72 karakter
#     password_str = str(user.password)[:72]

#     # Hash password menggunakan fungsi dari security.py
#     hashed_pw = hash_password(password_str)

#     # Buat objek user baru
#     new_user = User(
#         nama=user.nama,
#         username=user.username,
#         email=user.email,
#         password=hashed_pw,
#         role=user.role,
#     )

#     # Simpan ke database
#     db.add(new_user)
#     db.commit()
#     db.refresh(new_user)

#     return new_user


# @router.post("/login")
# def login(request: UserLogin, db: Session = Depends(get_db)):
#     # Cari user berdasarkan username
#     user = db.query(User).filter(User.username == request.username).first()

#     # Jika tidak ditemukan atau password salah
#     if not user or not verify_password(request.password, user.password):
#         raise HTTPException(
#             status_code=status.HTTP_401_UNAUTHORIZED,
#             detail="Username atau password salah",
#         )

#     # Buat JWT token
#     access_token = create_access_token({"sub": user.username})

#     return {"access_token": access_token, "token_type": "bearer"}

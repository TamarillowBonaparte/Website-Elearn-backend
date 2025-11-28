from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, text
from app.core.database import get_db
from app.models.presensi_model import Presensi
from app.models.mahasiswa_model import Mahasiswa
from app.schemas.presensi_schema import (
    PresensiGenerateRequest, 
    PresensiResponse, 
    PresensiDetailResponse,
    PresensiSummary,
    PresensiMahasiswaResponse,
    FaceRecognitionUpdateRequest
)
from typing import List
from datetime import datetime, time, timedelta

router = APIRouter(prefix="/presensi", tags=["Presensi"])

@router.post("/generate", status_code=status.HTTP_201_CREATED)
def generate_presensi(
    request: PresensiGenerateRequest,
    db: Session = Depends(get_db)
):
    """
    Generate presensi untuk semua mahasiswa di kelas_mata_kuliah tertentu
    Status default: Belum Absen (mahasiswa belum hadir)
    """
    
    # Validasi kelas_mata_kuliah dan ambil info lengkap
    kelas_mk = db.execute(
        text("""
            SELECT 
                km.id_kelas_mk, km.kode_mk, km.id_kelas,
                mk.nama_mk, k.nama_kelas
            FROM kelas_mata_kuliah km
            JOIN mata_kuliah mk ON km.kode_mk = mk.kode_mk
            JOIN kelas k ON km.id_kelas = k.id_kelas
            WHERE km.id_kelas_mk = :id_kelas_mk AND km.status = 'Aktif'
        """),
        {"id_kelas_mk": request.id_kelas_mk}
    ).fetchone()
    
    if not kelas_mk:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Kelas mata kuliah dengan ID {request.id_kelas_mk} tidak ditemukan atau tidak aktif"
        )
    
    # Cek apakah presensi untuk pertemuan ini sudah dibuat
    existing_presensi = db.query(Presensi).filter(
        and_(
            Presensi.id_kelas_mk == request.id_kelas_mk,
            Presensi.tanggal == request.tanggal,
            Presensi.pertemuan_ke == request.pertemuan_ke
        )
    ).first()
    
    if existing_presensi:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Presensi untuk {kelas_mk.nama_mk} minggu ke-{request.pertemuan_ke} pada tanggal {request.tanggal} sudah dibuat"
        )
    
    # Ambil semua mahasiswa di kelas tersebut
    mahasiswa_list = db.query(Mahasiswa).filter(
        Mahasiswa.id_kelas == kelas_mk.id_kelas
    ).all()
    
    if not mahasiswa_list:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Tidak ada mahasiswa di kelas {kelas_mk.nama_kelas}"
        )
    
    # Generate presensi untuk semua mahasiswa
    presensi_created = []
    for mahasiswa in mahasiswa_list:
        new_presensi = Presensi(
            id_mahasiswa=mahasiswa.id_mahasiswa,
            id_kelas_mk=request.id_kelas_mk,
            tanggal=request.tanggal,
            pertemuan_ke=request.pertemuan_ke,
            status="Belum Absen",
            waktu_mulai=request.waktu_mulai,
            waktu_selesai=request.waktu_selesai,
            waktu_input=None
        )
        db.add(new_presensi)
        presensi_created.append({
            "nim": mahasiswa.nim,
            "nama": mahasiswa.nama
        })
    
    db.commit()
    
    return {
        "message": "Presensi berhasil digenerate",
        "data": {
            "kelas": kelas_mk.nama_kelas,
            "mata_kuliah": kelas_mk.nama_mk,
            "kode_mk": kelas_mk.kode_mk,
            "pertemuan_ke": request.pertemuan_ke,
            "tanggal": request.tanggal,
            "waktu_mulai": request.waktu_mulai,
            "waktu_selesai": request.waktu_selesai,
            "total_mahasiswa": len(presensi_created),
            "mahasiswa": presensi_created
        }
    }


@router.get("/list", response_model=List[PresensiSummary])
def get_presensi_list(
    kelas: str = None,
    kode_mk: str = None,
    pertemuan_ke: int = None,
    db: Session = Depends(get_db)
):
    """
    Get daftar presensi yang sudah dibuat dengan filter
    """
    
    # Query manual dengan JOIN menggunakan id_kelas_mk
    query = """
        SELECT 
            p.id_kelas_mk,
            p.tanggal,
            p.pertemuan_ke,
            p.waktu_mulai,
            p.waktu_selesai,
            COUNT(p.id_presensi) as total_mhs,
            SUM(CASE WHEN p.status = 'Hadir' THEN 1 ELSE 0 END) as hadir,
            SUM(CASE WHEN p.status = 'Alfa' THEN 1 ELSE 0 END) as alpa,
            mk.nama_mk,
            mk.kode_mk,
            k.nama_kelas
        FROM presensi p
        JOIN kelas_mata_kuliah km ON p.id_kelas_mk = km.id_kelas_mk
        JOIN mata_kuliah mk ON km.kode_mk = mk.kode_mk
        JOIN kelas k ON km.id_kelas = k.id_kelas
        WHERE 1=1
    """
    
    params = {}
    
    if kode_mk:
        query += " AND mk.kode_mk = :kode_mk"
        params["kode_mk"] = kode_mk
    
    if kelas:
        query += " AND k.nama_kelas LIKE :kelas"
        params["kelas"] = f"%{kelas}%"
    
    if pertemuan_ke:
        query += " AND p.pertemuan_ke = :pertemuan_ke"
        params["pertemuan_ke"] = pertemuan_ke
    
    query += """
        GROUP BY p.id_kelas_mk, p.tanggal, p.pertemuan_ke, p.waktu_mulai, p.waktu_selesai, mk.nama_mk, mk.kode_mk, k.nama_kelas
        ORDER BY p.tanggal DESC, p.pertemuan_ke DESC
    """
    
    results = db.execute(text(query), params).fetchall()
    
    # Format response
    response = []
    for idx, result in enumerate(results, start=1):
        # Convert timedelta to string format HH:MM
        waktu_mulai_str = str(result.waktu_mulai) if result.waktu_mulai else "00:00"
        waktu_selesai_str = str(result.waktu_selesai) if result.waktu_selesai else "00:00"
        
        # Handle timedelta format (remove seconds if present)
        if len(waktu_mulai_str) > 5:
            waktu_mulai_str = waktu_mulai_str[:5]  # Get HH:MM only
        if len(waktu_selesai_str) > 5:
            waktu_selesai_str = waktu_selesai_str[:5]  # Get HH:MM only
        
        response.append(PresensiSummary(
            id=idx,
            id_kelas_mk=result.id_kelas_mk,
            kelas=result.nama_kelas,
            matkul=result.nama_mk,
            kode_mk=result.kode_mk,
            pertemuan=result.pertemuan_ke,
            tanggal=result.tanggal,
            waktu_mulai=waktu_mulai_str,
            waktu_selesai=waktu_selesai_str,
            total_mhs=result.total_mhs,
            hadir=result.hadir or 0,
            alpa=result.alpa or 0
        ))
    
    return response


@router.get("/detail/{id_kelas_mk}/{tanggal}/{pertemuan_ke}", response_model=List[PresensiDetailResponse])
def get_presensi_detail(
    id_kelas_mk: int,
    tanggal: str,
    pertemuan_ke: int,
    db: Session = Depends(get_db)
):
    """
    Get detail presensi mahasiswa untuk pertemuan tertentu
    Auto-update status "Belum Absen" menjadi "Alfa" jika waktu sudah lewat
    """
    
    # Auto-update status Belum Absen menjadi Alfa jika sudah melewati waktu_selesai
    current_datetime = datetime.now()
    current_date = current_datetime.date()
    current_time = current_datetime.time()
    
    # Update status yang masih "Belum Absen" menjadi "Alfa" jika sudah lewat waktu
    presensi_list_check = db.query(Presensi).filter(
        and_(
            Presensi.id_kelas_mk == id_kelas_mk,
            Presensi.tanggal == tanggal,
            Presensi.pertemuan_ke == pertemuan_ke,
            Presensi.status == "Belum Absen"
        )
    ).all()
    
    for presensi in presensi_list_check:
        # Jika tanggal presensi sudah lewat ATAU tanggal sama tapi waktu sudah lewat waktu_selesai
        if presensi.tanggal < current_date or \
           (presensi.tanggal == current_date and presensi.waktu_selesai and current_time > presensi.waktu_selesai):
            presensi.status = "Alfa"
    
    db.commit()
    
    # Query manual dengan JOIN
    query = """
        SELECT 
            p.id_presensi,
            p.id_mahasiswa,
            p.status,
            p.waktu_input,
            m.nim,
            m.nama
        FROM presensi p
        JOIN mahasiswa m ON p.id_mahasiswa = m.id_mahasiswa
        WHERE p.id_kelas_mk = :id_kelas_mk 
        AND p.tanggal = :tanggal 
        AND p.pertemuan_ke = :pertemuan_ke
        ORDER BY m.nim
    """
    
    results = db.execute(text(query), {
        "id_kelas_mk": id_kelas_mk,
        "tanggal": tanggal,
        "pertemuan_ke": pertemuan_ke
    }).fetchall()
    
    if not results:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Presensi tidak ditemukan"
        )
    
    response = []
    for result in results:
        response.append(PresensiDetailResponse(
            id_presensi=result.id_presensi,
            id_mahasiswa=result.id_mahasiswa,
            nim=result.nim,
            nama_mahasiswa=result.nama,
            status=result.status,
            waktu_input=result.waktu_input
        ))
    
    return response


@router.put("/update-status/{id_presensi}")
def update_status_presensi(
    id_presensi: int,
    status: str,  # "Hadir" atau "Alfa"
    db: Session = Depends(get_db)
):
    """
    Update status presensi mahasiswa (untuk mobile app)
    """
    
    if status not in ["Hadir", "Alfa"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Status harus 'Hadir' atau 'Alfa'"
        )
    
    presensi = db.query(Presensi).filter(Presensi.id_presensi == id_presensi).first()
    
    if not presensi:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Presensi tidak ditemukan"
        )
    
    presensi.status = status
    presensi.waktu_input = datetime.now()
    
    db.commit()
    db.refresh(presensi)
    
    return {
        "message": "Status presensi berhasil diupdate",
        "data": {
            "id_presensi": presensi.id_presensi,
            "status": presensi.status,
            "waktu_input": presensi.waktu_input
        }
    }


@router.delete("/delete/{id_kelas_mk}/{tanggal}/{pertemuan_ke}")
def delete_presensi(
    id_kelas_mk: int,
    tanggal: str,
    pertemuan_ke: int,
    db: Session = Depends(get_db)
):
    """
    Hapus presensi untuk pertemuan tertentu (hapus semua mahasiswa)
    """
    
    deleted_count = db.query(Presensi).filter(
        and_(
            Presensi.id_kelas_mk == id_kelas_mk,
            Presensi.tanggal == tanggal,
            Presensi.pertemuan_ke == pertemuan_ke
        )
    ).delete()
    
    if deleted_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Presensi tidak ditemukan"
        )
    
    db.commit()
    
    return {
        "message": f"Presensi berhasil dihapus ({deleted_count} record)"
    }


# ============================================
# ANDROID INTEGRATION ENDPOINTS
# ============================================

@router.get("/mahasiswa/{id_mahasiswa}", response_model=List[PresensiMahasiswaResponse])
def get_presensi_mahasiswa(
    id_mahasiswa: int,
    db: Session = Depends(get_db)
):
    """
    Get semua presensi untuk mahasiswa tertentu (untuk Android app)
    Auto-update status "Belum Absen" menjadi "Alfa" jika waktu sudah lewat
    """
    
    # Validasi mahasiswa exists
    mahasiswa = db.query(Mahasiswa).filter(Mahasiswa.id_mahasiswa == id_mahasiswa).first()
    if not mahasiswa:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Mahasiswa dengan ID {id_mahasiswa} tidak ditemukan"
        )
    
    # Auto-update status Belum Absen menjadi Alfa jika sudah lewat waktu
    current_datetime = datetime.now()
    current_date = current_datetime.date()
    current_time = current_datetime.time()
    
    # Update status yang masih "Belum Absen" menjadi "Alfa" jika sudah lewat waktu
    presensi_list_check = db.query(Presensi).filter(
        and_(
            Presensi.id_mahasiswa == id_mahasiswa,
            Presensi.status == "Belum Absen"
        )
    ).all()
    
    for presensi in presensi_list_check:
        # Jika tanggal presensi sudah lewat ATAU tanggal sama tapi waktu sudah lewat waktu_selesai
        if presensi.tanggal < current_date or \
           (presensi.tanggal == current_date and presensi.waktu_selesai and current_time > presensi.waktu_selesai):
            presensi.status = "Alfa"
    
    db.commit()
    
    # Query presensi mahasiswa dengan JOIN ke kelas_mata_kuliah
    query = """
        SELECT 
            p.id_presensi,
            p.id_kelas_mk,
            p.tanggal,
            p.pertemuan_ke,
            p.status,
            p.waktu_mulai,
            p.waktu_selesai,
            p.waktu_input,
            mk.kode_mk,
            mk.nama_mk,
            k.nama_kelas
        FROM presensi p
        JOIN kelas_mata_kuliah km ON p.id_kelas_mk = km.id_kelas_mk
        JOIN mata_kuliah mk ON km.kode_mk = mk.kode_mk
        JOIN kelas k ON km.id_kelas = k.id_kelas
        WHERE p.id_mahasiswa = :id_mahasiswa
        ORDER BY p.tanggal DESC, p.pertemuan_ke DESC
    """
    
    results = db.execute(text(query), {"id_mahasiswa": id_mahasiswa}).fetchall()
    
    # Format response
    response = []
    for result in results:
        # Convert timedelta to string format HH:MM
        waktu_mulai_str = str(result.waktu_mulai) if result.waktu_mulai else None
        waktu_selesai_str = str(result.waktu_selesai) if result.waktu_selesai else None
        
        # Handle timedelta format (remove seconds if present)
        if waktu_mulai_str and len(waktu_mulai_str) > 5:
            waktu_mulai_str = waktu_mulai_str[:5]
        if waktu_selesai_str and len(waktu_selesai_str) > 5:
            waktu_selesai_str = waktu_selesai_str[:5]
        
        response.append(PresensiMahasiswaResponse(
            id_presensi=result.id_presensi,
            id_kelas_mk=result.id_kelas_mk,
            kode_mk=result.kode_mk,
            nama_mk=result.nama_mk,
            kelas=result.nama_kelas,
            tanggal=result.tanggal,
            pertemuan_ke=result.pertemuan_ke,
            status=result.status,
            waktu_mulai=waktu_mulai_str,
            waktu_selesai=waktu_selesai_str,
            waktu_input=result.waktu_input
        ))
    
    return response


@router.post("/update-status-face-recognition")
def update_status_face_recognition(
    request: FaceRecognitionUpdateRequest,
    db: Session = Depends(get_db)
):
    """
    Update status presensi setelah face recognition (untuk Android app)
    Validasi: NIM harus match, tanggal valid, dalam waktu presensi
    """
    
    # 1. Validasi presensi exists
    presensi = db.query(Presensi).filter(
        Presensi.id_presensi == request.id_presensi
    ).first()
    
    if not presensi:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Presensi tidak ditemukan"
        )
    
    # 2. Validasi NIM match dengan mahasiswa di presensi
    mahasiswa = db.query(Mahasiswa).filter(
        Mahasiswa.id_mahasiswa == presensi.id_mahasiswa
    ).first()
    
    if not mahasiswa or mahasiswa.nim != request.nim:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="NIM tidak sesuai dengan data presensi"
        )
    
    # 3. Validasi tanggal presensi
    current_date = datetime.now().date()
    if presensi.tanggal != current_date:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Presensi hanya bisa dilakukan pada tanggal {presensi.tanggal}"
        )
    
    # 4. Validasi waktu presensi (harus dalam rentang waktu_mulai dan waktu_selesai)
    current_time = datetime.now().time()
    
    if presensi.waktu_mulai and current_time < presensi.waktu_mulai:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Presensi belum dibuka. Waktu mulai: {presensi.waktu_mulai}"
        )
    
    if presensi.waktu_selesai and current_time > presensi.waktu_selesai:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Waktu presensi sudah ditutup. Waktu selesai: {presensi.waktu_selesai}"
        )
    
    # 5. Cek apakah sudah pernah absen
    if presensi.status == "Hadir":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Anda sudah melakukan presensi sebelumnya"
        )
    
    # 6. Update status presensi
    presensi.status = "Hadir"
    presensi.waktu_input = datetime.now()
    
    db.commit()
    db.refresh(presensi)
    
    # Get info kelas mata kuliah untuk response
    query = """
        SELECT 
            mk.nama_mk,
            k.nama_kelas
        FROM kelas_mata_kuliah km
        JOIN mata_kuliah mk ON km.kode_mk = mk.kode_mk
        JOIN kelas k ON km.id_kelas = k.id_kelas
        WHERE km.id_kelas_mk = :id_kelas_mk
    """
    
    result = db.execute(text(query), {"id_kelas_mk": presensi.id_kelas_mk}).fetchone()
    
    return {
        "message": "Presensi berhasil disimpan",
        "data": {
            "id_presensi": presensi.id_presensi,
            "nim": mahasiswa.nim,
            "nama": mahasiswa.nama,
            "mata_kuliah": result.nama_mk if result else "-",
            "kelas": result.nama_kelas if result else "-",
            "tanggal": presensi.tanggal,
            "pertemuan_ke": presensi.pertemuan_ke,
            "status": presensi.status,
            "waktu_input": presensi.waktu_input
        }
    }

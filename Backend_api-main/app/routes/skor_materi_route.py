# app/routes/skor_materi_route.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.skor_materi_model import SkorMateri
from app.models.mahasiswa_model import Mahasiswa
from app.schemas.skor_materi_schema import (
    SkorMateriCreate,
    SkorMateriUpdate,
    SkorMateriResponse
)
from typing import Optional, List
from datetime import datetime

router = APIRouter(prefix="/skor-materi", tags=["Skor Materi"])

# ========== Endpoints ==========

@router.post("/", response_model=SkorMateriResponse, status_code=status.HTTP_201_CREATED)
def create_skor_materi(skor: SkorMateriCreate, db: Session = Depends(get_db)):
    """
    Simpan skor materi setelah mahasiswa selesai membaca.
    
    - **id_mahasiswa**: ID mahasiswa
    - **id_materi**: ID materi yang dibaca
    - **waktu_belajar**: Total waktu belajar (detik)
    - **waktu_fokus**: Waktu fokus (detik)
    - **jumlah_gangguan**: Jumlah gangguan/distraksi
    - **skor_perhatian**: Skor perhatian 0-100%
    - **tracking_mode**: "camera" atau "simulated"
    - **session_start**: Waktu mulai (ISO format)
    - **session_end**: Waktu selesai (ISO format)
    """
    try:
        # Parse datetime strings jika ada
        session_start = None
        session_end = None
        
        if skor.session_start:
            try:
                session_start = datetime.fromisoformat(skor.session_start.replace('Z', '+00:00'))
            except:
                pass
        
        if skor.session_end:
            try:
                session_end = datetime.fromisoformat(skor.session_end.replace('Z', '+00:00'))
            except:
                pass
        
        # Buat record baru
        new_skor = SkorMateri(
            id_mahasiswa=skor.id_mahasiswa,
            id_materi=skor.id_materi,
            waktu_belajar=skor.waktu_belajar,
            waktu_fokus=skor.waktu_fokus,
            jumlah_gangguan=skor.jumlah_gangguan,
            skor_perhatian=skor.skor_perhatian,
            tracking_mode=skor.tracking_mode,
            session_start=session_start,
            session_end=session_end
        )
        
        db.add(new_skor)
        db.commit()
        db.refresh(new_skor)
        
        return new_skor
        
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to save skor materi: {str(e)}"
        )

@router.get("/mahasiswa/{id_mahasiswa}", response_model=List[SkorMateriResponse])
def get_skor_by_mahasiswa(id_mahasiswa: int, db: Session = Depends(get_db)):
    """
    Ambil semua skor materi berdasarkan ID mahasiswa.
    """
    skor_list = db.query(SkorMateri).filter(SkorMateri.id_mahasiswa == id_mahasiswa).all()
    return skor_list


@router.put("/{id_skor}", response_model=SkorMateriResponse)
def update_skor_materi(
    id_skor: int,
    skor_update: SkorMateriUpdate,
    db: Session = Depends(get_db)
):
    """Update skor materi (untuk update session_end, dll)"""
    skor = db.query(SkorMateri).filter(SkorMateri.id_skor == id_skor).first()
    if not skor:
        raise HTTPException(status_code=404, detail="Skor tidak ditemukan")
    
    # Update fields yang diberikan
    update_data = skor_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(skor, key, value)
    
    db.commit()
    db.refresh(skor)
    
    # Enrich dengan data mahasiswa
    mahasiswa = db.query(Mahasiswa).filter(
        Mahasiswa.id_mahasiswa == skor.id_mahasiswa
    ).first()
    
    result = {
        "id_skor": skor.id_skor,
        "id_mahasiswa": skor.id_mahasiswa,
        "id_materi": skor.id_materi,
        "waktu_belajar": skor.waktu_belajar,
        "waktu_fokus": skor.waktu_fokus,
        "jumlah_gangguan": skor.jumlah_gangguan,
        "skor_perhatian": skor.skor_perhatian,
        "tracking_mode": skor.tracking_mode,
        "session_start": skor.session_start,
        "session_end": skor.session_end,
        "updated_at": skor.updated_at,
        "nama_mahasiswa": mahasiswa.nama if mahasiswa else None,
        "nim": mahasiswa.nim if mahasiswa else None,
    }
    
    return result


@router.get("/materi/{id_materi}", response_model=List[SkorMateriResponse])
def get_skor_by_materi(id_materi: int, db: Session = Depends(get_db)):
    """
    Ambil semua skor untuk materi tertentu.
    """
    skor_list = db.query(SkorMateri).filter(SkorMateri.id_materi == id_materi).all()
    return skor_list


@router.get("/statistik/{id_materi}")
def get_statistik_skor_materi(id_materi: int, db: Session = Depends(get_db)):
    """
    Ambil statistik skor untuk materi tertentu (untuk ditampilkan di halaman dosen).
    Mengembalikan data agregat dari semua mahasiswa yang telah mengerjakan materi ini.
    """
    try:
        from sqlalchemy import func
        from app.models.mahasiswa_model import Mahasiswa
        from app.models.materi_model import Materi
        from app.models.kelas_model import Kelas
        
        # Get info materi dan kelas
        materi = db.query(Materi).filter(Materi.id_materi == id_materi).first()
        if not materi:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Materi dengan ID {id_materi} tidak ditemukan"
            )
        
        # Query untuk mendapatkan skor dengan data mahasiswa
        skor_list = db.query(
            SkorMateri,
            Mahasiswa.nama,
            Mahasiswa.nim
        ).join(
            Mahasiswa, SkorMateri.id_mahasiswa == Mahasiswa.id_mahasiswa
        ).filter(
            SkorMateri.id_materi == id_materi
        ).all()
        
        # Get total mahasiswa di kelas (jika ada id_kelas di materi)
        total_mahasiswa_kelas = 0
        if materi.id_kelas:
            total_mahasiswa_kelas = db.query(func.count(Mahasiswa.id_mahasiswa)).filter(
                Mahasiswa.id_kelas == materi.id_kelas
            ).scalar() or 0
        
        total_sudah_baca = len(skor_list)
        total_belum_baca = max(0, total_mahasiswa_kelas - total_sudah_baca)
        
        # Agregasi data
        rata_rata_skor = 0
        rata_rata_waktu_belajar = 0
        rata_rata_waktu_fokus = 0
        rata_rata_gangguan = 0
        
        if skor_list:
            total_skor = sum(skor.SkorMateri.skor_perhatian for skor in skor_list)
            total_waktu_belajar = sum(skor.SkorMateri.waktu_belajar for skor in skor_list)
            total_waktu_fokus = sum(skor.SkorMateri.waktu_fokus for skor in skor_list)
            total_gangguan = sum(skor.SkorMateri.jumlah_gangguan for skor in skor_list)
            
            rata_rata_skor = round(total_skor / total_sudah_baca, 2)
            rata_rata_waktu_belajar = round(total_waktu_belajar / total_sudah_baca, 2)
            rata_rata_waktu_fokus = round(total_waktu_fokus / total_sudah_baca, 2)
            rata_rata_gangguan = round(total_gangguan / total_sudah_baca, 2)
        
        # Detail per mahasiswa (daftar_skor)
        daftar_skor = []
        for skor, nama, nim in skor_list:
            daftar_skor.append({
                "id_skor": skor.id_skor,
                "id_mahasiswa": skor.id_mahasiswa,
                "nama": nama,
                "nim": nim,
                "waktu_belajar": skor.waktu_belajar,
                "waktu_fokus": skor.waktu_fokus,
                "jumlah_gangguan": skor.jumlah_gangguan,
                "skor_perhatian": skor.skor_perhatian,
                "tracking_mode": skor.tracking_mode,
                "session_start": skor.session_start.isoformat() if skor.session_start else None,
                "session_end": skor.session_end.isoformat() if skor.session_end else None,
                "updated_at": skor.updated_at.isoformat() if skor.updated_at else None
            })
        
        return {
            "id_materi": id_materi,
            "judul_materi": materi.judul,
            "total_mahasiswa_kelas": total_mahasiswa_kelas,
            "total_sudah_baca": total_sudah_baca,
            "total_belum_baca": total_belum_baca,
            "rata_rata_skor": rata_rata_skor,
            "rata_rata_waktu_belajar": rata_rata_waktu_belajar,
            "rata_rata_waktu_fokus": rata_rata_waktu_fokus,
            "rata_rata_gangguan": rata_rata_gangguan,
            "daftar_skor": daftar_skor
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error get_statistik_skor_materi: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get statistik skor: {str(e)}"
        )

@router.get("/mahasiswa/{id_mahasiswa}/materi/{id_materi}", response_model=List[SkorMateriResponse])
def get_skor_mahasiswa_materi(id_mahasiswa: int, id_materi: int, db: Session = Depends(get_db)):
    """
    Ambil skor mahasiswa untuk materi tertentu (bisa multiple attempts).
    """
    skor_list = db.query(SkorMateri).filter(
        SkorMateri.id_mahasiswa == id_mahasiswa,
        SkorMateri.id_materi == id_materi
    ).all()
    return skor_list

@router.get("/{id_skor}", response_model=SkorMateriResponse)
def get_skor_by_id(id_skor: int, db: Session = Depends(get_db)):
    """
    Ambil detail skor berdasarkan ID.
    """
    skor = db.query(SkorMateri).filter(SkorMateri.id_skor == id_skor).first()
    if not skor:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Skor dengan ID {id_skor} tidak ditemukan"
        )
    return skor

@router.delete("/{id_skor}", status_code=status.HTTP_204_NO_CONTENT)
def delete_skor(id_skor: int, db: Session = Depends(get_db)):
    """
    Hapus skor berdasarkan ID.
    """
    skor = db.query(SkorMateri).filter(SkorMateri.id_skor == id_skor).first()
    if not skor:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Skor dengan ID {id_skor} tidak ditemukan"
        )
    
    db.delete(skor)
    db.commit()
    return None

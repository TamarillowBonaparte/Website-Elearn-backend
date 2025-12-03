# app/routes/skor_materi_route.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
from app.core.database import get_db
from app.models.skor_materi_model import SkorMateri
from app.models.materi_model import Materi
from app.models.mahasiswa_model import Mahasiswa
from app.models.kelas_model import Kelas
from app.schemas.skor_materi_schema import (
    SkorMateriCreate,
    SkorMateriUpdate,
    SkorMateriResponse,
    SkorMateriStatistik
)

router = APIRouter(prefix="/skor-materi", tags=["Skor Materi"])


# ===========================
# GET STATISTIK SKOR PER MATERI
# ===========================
@router.get("/statistik/{id_materi}", response_model=SkorMateriStatistik)
def get_statistik_skor_materi(id_materi: int, db: Session = Depends(get_db)):
    """
    Mendapatkan statistik skor untuk materi tertentu.
    Menampilkan mahasiswa yang sudah dan belum membaca, beserta skor mereka.
    """
    # Cek apakah materi ada
    materi = db.query(Materi).filter(Materi.id_materi == id_materi).first()
    if not materi:
        raise HTTPException(status_code=404, detail="Materi tidak ditemukan")
    
    # Ambil semua mahasiswa di kelas tersebut
    mahasiswa_kelas = db.query(Mahasiswa).filter(
        Mahasiswa.id_kelas == materi.id_kelas
    ).all()
    
    total_mahasiswa_kelas = len(mahasiswa_kelas)
    
    # Ambil semua skor untuk materi ini
    skor_list = db.query(SkorMateri).filter(
        SkorMateri.id_materi == id_materi
    ).all()
    
    # Buat dictionary untuk tracking mahasiswa yang sudah baca
    mahasiswa_sudah_baca = {skor.id_mahasiswa for skor in skor_list}
    
    # Hitung statistik
    total_sudah_baca = len(mahasiswa_sudah_baca)
    total_belum_baca = total_mahasiswa_kelas - total_sudah_baca
    
    # Statistik skor
    rata_rata_skor = None
    rata_rata_waktu_belajar = None
    rata_rata_fokus = None
    skor_tertinggi = None
    skor_terendah = None
    
    if skor_list:
        rata_rata_skor = sum(s.skor_perhatian for s in skor_list) / len(skor_list)
        rata_rata_waktu_belajar = sum(s.waktu_belajar for s in skor_list) / len(skor_list)
        rata_rata_fokus = sum(s.waktu_fokus for s in skor_list) / len(skor_list)
        skor_tertinggi = max(s.skor_perhatian for s in skor_list)
        skor_terendah = min(s.skor_perhatian for s in skor_list)
    
    # Enrich skor dengan data mahasiswa
    daftar_skor_enriched = []
    for skor in skor_list:
        mahasiswa = db.query(Mahasiswa).filter(
            Mahasiswa.id_mahasiswa == skor.id_mahasiswa
        ).first()
        
        skor_dict = {
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
        daftar_skor_enriched.append(skor_dict)
    
    return {
        "id_materi": id_materi,
        "judul_materi": materi.judul,
        "total_mahasiswa_kelas": total_mahasiswa_kelas,
        "total_sudah_baca": total_sudah_baca,
        "total_belum_baca": total_belum_baca,
        "rata_rata_skor": round(rata_rata_skor, 2) if rata_rata_skor else None,
        "rata_rata_waktu_belajar": round(rata_rata_waktu_belajar, 2) if rata_rata_waktu_belajar else None,
        "rata_rata_fokus": round(rata_rata_fokus, 2) if rata_rata_fokus else None,
        "skor_tertinggi": skor_tertinggi,
        "skor_terendah": skor_terendah,
        "daftar_skor": daftar_skor_enriched
    }


# ===========================
# CREATE SKOR MATERI (untuk testing/mobile app)
# ===========================
@router.post("/", response_model=SkorMateriResponse, status_code=201)
def create_skor_materi(
    skor_data: SkorMateriCreate,
    db: Session = Depends(get_db)
):
    """
    Membuat record skor materi baru.
    Biasanya dipanggil dari mobile app setelah mahasiswa selesai membaca materi.
    """
    # Validasi mahasiswa ada
    mahasiswa = db.query(Mahasiswa).filter(
        Mahasiswa.id_mahasiswa == skor_data.id_mahasiswa
    ).first()
    if not mahasiswa:
        raise HTTPException(status_code=404, detail="Mahasiswa tidak ditemukan")
    
    # Validasi materi ada
    materi = db.query(Materi).filter(
        Materi.id_materi == skor_data.id_materi
    ).first()
    if not materi:
        raise HTTPException(status_code=404, detail="Materi tidak ditemukan")
    
    # Cek apakah sudah ada skor untuk mahasiswa + materi ini
    existing = db.query(SkorMateri).filter(
        SkorMateri.id_mahasiswa == skor_data.id_mahasiswa,
        SkorMateri.id_materi == skor_data.id_materi
    ).first()
    
    if existing:
        raise HTTPException(
            status_code=400,
            detail="Skor untuk mahasiswa dan materi ini sudah ada. Gunakan endpoint update."
        )
    
    # Buat skor baru
    new_skor = SkorMateri(**skor_data.model_dump())
    
    db.add(new_skor)
    db.commit()
    db.refresh(new_skor)
    
    # Enrich dengan data mahasiswa
    result = {
        "id_skor": new_skor.id_skor,
        "id_mahasiswa": new_skor.id_mahasiswa,
        "id_materi": new_skor.id_materi,
        "waktu_belajar": new_skor.waktu_belajar,
        "waktu_fokus": new_skor.waktu_fokus,
        "jumlah_gangguan": new_skor.jumlah_gangguan,
        "skor_perhatian": new_skor.skor_perhatian,
        "tracking_mode": new_skor.tracking_mode,
        "session_start": new_skor.session_start,
        "session_end": new_skor.session_end,
        "updated_at": new_skor.updated_at,
        "nama_mahasiswa": mahasiswa.nama,
        "nim": mahasiswa.nim,
    }
    
    return result


# ===========================
# UPDATE SKOR MATERI
# ===========================
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


# ===========================
# GET SKOR BY MAHASISWA
# ===========================
@router.get("/mahasiswa/{id_mahasiswa}", response_model=List[SkorMateriResponse])
def get_skor_by_mahasiswa(
    id_mahasiswa: int,
    db: Session = Depends(get_db)
):
    """Mendapatkan semua skor materi untuk mahasiswa tertentu"""
    mahasiswa = db.query(Mahasiswa).filter(
        Mahasiswa.id_mahasiswa == id_mahasiswa
    ).first()
    if not mahasiswa:
        raise HTTPException(status_code=404, detail="Mahasiswa tidak ditemukan")
    
    skor_list = db.query(SkorMateri).filter(
        SkorMateri.id_mahasiswa == id_mahasiswa
    ).all()
    
    result = []
    for skor in skor_list:
        result.append({
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
            "nama_mahasiswa": mahasiswa.nama,
            "nim": mahasiswa.nim,
        })
    
    return result


# ===========================
# DELETE SKOR (untuk testing)
# ===========================
@router.delete("/{id_skor}")
def delete_skor_materi(id_skor: int, db: Session = Depends(get_db)):
    """Hapus skor materi"""
    skor = db.query(SkorMateri).filter(SkorMateri.id_skor == id_skor).first()
    if not skor:
        raise HTTPException(status_code=404, detail="Skor tidak ditemukan")
    
    db.delete(skor)
    db.commit()
    
    return {"message": "Skor berhasil dihapus", "id_skor": id_skor}

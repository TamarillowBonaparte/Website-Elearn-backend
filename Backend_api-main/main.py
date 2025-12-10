# from fastapi import FastAPI
# from app.routes import auth_route
# from app.core.database import Base, engine

# # Inisialisasi database (jika belum ada tabel)
# Base.metadata.create_all(bind=engine)

# app = FastAPI(title="E-Learn API")

# # Daftarkan route
# app.include_router(auth_route.router)

# @app.get("/")
# def root():
#     return {"message": "E-Learn API is running!"}

# from fastapi import FastAPI
# from fastapi.middleware.cors import CORSMiddleware
# from app.routes import auth_route
# from app.core.database import Base, engine

# # Inisialisasi database (jika belum ada tabel)
# Base.metadata.create_all(bind=engine)

# app = FastAPI(title="E-Learn API")

# # Konfigurasi CORS
# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=["http://localhost:3000", "http://localhost:5173"],  # URL frontend React/Vite
#     allow_credentials=True,
#     allow_methods=["*"],
#     allow_headers=["*"],
# )

# # Daftarkan route
# app.include_router(auth_route.router)

# @app.get("/")
# def root():
#     return {"message": "E-Learn API is running!"}

# CADANGAN
# from fastapi.middleware.cors import CORSMiddleware
# from fastapi import FastAPI
# from app.routes import auth_route

# app = FastAPI()

# # 🚀 Tambahkan middleware CORS
# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=[
#         "http://localhost:3000",  # React default
#         "http://127.0.0.1:3000",
#         "http://localhost:5173",  # Vite default
#         "http://127.0.0.1:5173",
#     ],
#     allow_credentials=True,
#     allow_methods=["*"],
#     allow_headers=["*"],
# )

# app.include_router(auth_route.router)

from fastapi.middleware.cors import CORSMiddleware
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from app.routes import (
    auth_route, 
    mata_kuliah_route, 
    materi_route, 
    kelas_route, 
    presensi_route, 
    mahasiswa_route,
    dosen_route,
    user_route,
    dashboard_route,
    kelas_mata_kuliah_route,
    face_registration_db_route,
    face_recognition_route,
    gaze_detection_route,
    informasi_route,
    jadwal_kuliah_route,
    informasi_route,
    jadwal_kuliah_route,
    skor_materi_route,
    notification_route
)

# Import models (no relationships needed)
from app.models import mata_kuliah_model, kelas_model, mahasiswa_model, dosen_model, presensi_model, kelas_mata_kuliah_model, face_registration_model, informasi_model, jadwal_kuliah_model, skor_materi_model, user_device_model

app = FastAPI(title="E-Learning API", version="1.0.0")

# 🚀 Tambahkan middleware CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5174",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 📌 Include routers
app.include_router(auth_route.router)
app.include_router(user_route.router)
app.include_router(dosen_route.router)
app.include_router(mata_kuliah_route.router)
app.include_router(kelas_route.router)
app.include_router(kelas_mata_kuliah_route.router)
app.include_router(materi_route.router)
app.include_router(presensi_route.router)
app.include_router(mahasiswa_route.router)
app.include_router(dashboard_route.router)
app.include_router(face_registration_db_route.router)
app.include_router(face_recognition_route.router)
app.include_router(gaze_detection_route.router)
app.include_router(informasi_route.router)
app.include_router(jadwal_kuliah_route.router)
app.include_router(skor_materi_route.router)
app.include_router(notification_route.router)

# Mount static files untuk uploads
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

@app.get("/")
def read_root():
    return {
        "message": "E-Learning API is running",
        "version": "3.2.0 - Complete Features (Eye Tracking, Informasi & Jadwal)",
        "endpoints": {
            "auth": "/auth",
            "users": "/users",
            "dosen": "/dosen",
            "mata_kuliah": "/mata-kuliah",
            "kelas": "/kelas",
            "kelas_mata_kuliah": "/kelas-mata-kuliah",
            "jadwal_kuliah": "/jadwal-kuliah",
            "presensi": "/presensi",
            "mahasiswa": "/mahasiswa",
            "materi": "/materi",
            "dashboard": "/dashboard",
            "face_registration": "/face-registration",
            "face_recognition": "/face",
            "gaze_detection": "/gaze",
            "informasi": "/api/informasi",
            "skor_materi": "/skor-materi"
        }
    }
# 🚀 Quick Start Guide

## Step 1: Setup Virtual Environment

```bash
cd face-recognition-test
```

**Otomatis Setup (Recommended):**
```bash
# Windows PowerShell
.\setup_env.ps1

# Atau Command Prompt / Double-click file
setup_env.bat
```

Script akan otomatis:
- ✅ Membuat virtual environment (`venv`)
- ✅ Aktivasi environment
- ✅ Install semua dependencies dari `requirements.txt`
- ✅ Fallback ke tensorflow-cpu jika ada error

**Manual Setup:**
```bash
# 1. Buat venv
python -m venv venv

# 2. Aktivasi (PowerShell)
.\venv\Scripts\Activate.ps1

# 2. Aktivasi (Command Prompt)
venv\Scripts\activate.bat

# 3. Install dependencies
pip install -r requirements.txt
```

## Step 2: Registrasi Wajah

**Quick Launch (Double-click):**
```bash
run_register.bat
```

**Manual:**
```bash
# Aktivasi venv jika belum
.\venv\Scripts\Activate.ps1

# Jalankan script
python face_register.py
```

1. Pilih menu `1` (Register from Camera)
2. Posisikan wajah di depan kamera
3. Tunggu hingga muncul "READY - Press 'c' to capture"
4. Tekan `c` untuk capture
5. Masukkan username/NIM (misal: `E41253310`)
6. Selesai! File embedding tersimpan di `embeddings/E41253310.pkl`

**Tips:**
- Pastikan pencahayaan cukup
- Wajah menghadap langsung ke kamera
- Jarak ideal: 30-50 cm dari kamera
- Registrasi minimal 1 wajah untuk testing

## Step 3: Face Recognition

**Quick Launch (Double-click):**
```bash
run_recognize.bat
```

**Manual:**
```bash
# Aktivasi venv jika belum
.\venv\Scripts\Activate.ps1

# Jalankan script
python face_recognize.py
```

1. Pilih menu `1` (Recognize from Camera)
2. Posisikan wajah di depan kamera
3. Wajah yang terdaftar akan dikenali dengan kotak hijau
4. Wajah tidak terdaftar akan ditandai kotak merah
5. Tekan `q` untuk keluar

## Features

### Face Registration Script (face_register.py)
- ✅ Register dari webcam (real-time)
- ✅ Register dari file gambar
- ✅ List semua wajah yang terdaftar
- ✅ Auto-detect confidence level
- ✅ Overwrite protection

### Face Recognition Script (face_recognize.py)
- ✅ Real-time recognition dari webcam
- ✅ Recognition dari file gambar
- ✅ Batch test semua wajah terdaftar
- ✅ Adjustable threshold
- ✅ Live statistics
- ✅ Reload database tanpa restart

## Troubleshooting

### Camera tidak terbuka
```python
# Edit face_register.py atau face_recognize.py
# Ganti: cap = cv2.VideoCapture(0)
# Dengan: cap = cv2.VideoCapture(1)  # Coba camera index lain
```

### Error "No module named 'keras_facenet'"
```bash
pip install keras-facenet==0.3.2
```

### Accuracy rendah
- Coba adjust threshold di face_recognize.py
- Default: 0.4 (lower = more strict)
- Untuk testing: 0.5-0.6 (lebih lenient)

### Slow performance
- Recognition dilakukan setiap 3 frame
- Untuk lebih cepat: ubah `if frame_count % 3 == 0:` → `% 5`
- Untuk lebih akurat: ubah menjadi `% 1` (setiap frame)

## Configuration

Edit di bagian atas script:

**face_recognize.py:**
```python
THRESHOLD = 0.4  # Lower = more strict (0.3-0.5 recommended)
```

**face_register.py:**
```python
EMBEDDINGS_DIR = "embeddings"  # Folder penyimpanan
```

## Testing Workflow

1. Registrasi 2-3 wajah berbeda
2. Jalankan batch test: `face_recognize.py` → Menu `3`
3. Check accuracy untuk setiap wajah
4. Adjust threshold jika perlu
5. Test real-time recognition

## Next Steps

Setelah testing berhasil, fitur ini bisa diintegrasikan ke:
- Backend API (FastAPI)
- Mobile App (Android)
- Web Dashboard (React)

Happy testing! 🎉

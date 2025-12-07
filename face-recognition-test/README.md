# Face Recognition Test Environment

Folder ini digunakan untuk testing dan eksperimen face recognition sebelum diintegrasikan ke sistem utama.

## 📁 Struktur Folder

```
face-recognition-test/
├── embeddings/           # Folder penyimpanan file .pkl embedding wajah
├── test_images/          # Folder untuk menyimpan foto test
├── face_register.py      # Script untuk registrasi wajah
├── face_recognize.py     # Script untuk mengenali wajah
├── requirements.txt      # Dependencies yang dibutuhkan
└── README.md            # Dokumentasi ini
```

## 🚀 Cara Penggunaan

### 1. Setup Virtual Environment & Install Dependencies

**Otomatis (Recommended):**
```bash
# Windows PowerShell
.\setup_env.ps1

# Atau Command Prompt
setup_env.bat
```

**Manual:**
```bash
# Buat virtual environment
python -m venv venv

# Aktivasi (PowerShell)
.\venv\Scripts\Activate.ps1

# Aktivasi (Command Prompt)
venv\Scripts\activate.bat

# Install dependencies
pip install -r requirements.txt
```

### 2. Registrasi Wajah Baru

**Quick Launch:**
```bash
run_register.bat
```

**Manual:**
```bash
### 3. Face Recognition Test

**Quick Launch:**
```bash
run_recognize.bat
```

**Manual:**
```bash
# Pastikan venv aktif
.\venv\Scripts\Activate.ps1

# Jalankan script
python face_recognize.py
```alankan script
python face_register.py
```
- Program akan membuka kamera
- Posisikan wajah di depan kamera
- Tekan 'c' untuk capture dan registrasi
- Tekan 'q' untuk quit

### 3. Face Recognition Test
```bash
python face_recognize.py
```
- Program akan membuka kamera
- Wajah yang terdaftar akan dikenali secara real-time
- Tekan 'q' untuk quit

## 📝 Catatan

- Pastikan kamera sudah terhubung
- Pencahayaan yang baik sangat mempengaruhi akurasi
- Threshold default: 0.4 (bisa diubah di script)

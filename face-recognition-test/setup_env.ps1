# Setup Virtual Environment for Face Recognition Test
# PowerShell Script

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Face Recognition Test - Environment Setup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if Python is installed
Write-Host "Checking Python installation..." -ForegroundColor Yellow
$pythonVersion = python --version 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Python tidak ditemukan!" -ForegroundColor Red
    Write-Host "Install Python terlebih dahulu dari https://www.python.org/downloads/" -ForegroundColor Red
    exit 1
}
Write-Host "Python found: $pythonVersion" -ForegroundColor Green
Write-Host ""

# Create virtual environment
if (Test-Path "venv") {
    Write-Host "Virtual environment sudah ada." -ForegroundColor Yellow
    $overwrite = Read-Host "Hapus dan buat ulang? (y/n)"
    if ($overwrite -eq "y") {
        Write-Host "Menghapus venv lama..." -ForegroundColor Yellow
        Remove-Item -Path "venv" -Recurse -Force
    } else {
        Write-Host "Menggunakan venv yang sudah ada." -ForegroundColor Green
        Write-Host ""
        Write-Host "Untuk aktivasi, jalankan:" -ForegroundColor Cyan
        Write-Host "  .\venv\Scripts\Activate.ps1" -ForegroundColor White
        Write-Host ""
        exit 0
    }
}

Write-Host "Creating virtual environment..." -ForegroundColor Yellow
python -m venv venv

if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Gagal membuat virtual environment!" -ForegroundColor Red
    exit 1
}
Write-Host "Virtual environment created successfully!" -ForegroundColor Green
Write-Host ""

# Activate virtual environment
Write-Host "Activating virtual environment..." -ForegroundColor Yellow
& .\venv\Scripts\Activate.ps1

# Upgrade pip
Write-Host "Upgrading pip..." -ForegroundColor Yellow
python -m pip install --upgrade pip

# Install requirements
Write-Host ""
Write-Host "Installing dependencies from requirements.txt..." -ForegroundColor Yellow
Write-Host "This may take several minutes..." -ForegroundColor Yellow
Write-Host ""

pip install -r requirements.txt

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "WARNING: Beberapa package mungkin gagal install." -ForegroundColor Yellow
    Write-Host "Mencoba install dengan CPU-only TensorFlow..." -ForegroundColor Yellow
    Write-Host ""
    
    # Try with CPU-only tensorflow
    pip install tensorflow-cpu==2.13.0 keras-facenet==0.3.2 mtcnn==0.1.1
    pip install opencv-python==4.8.1.78 opencv-contrib-python==4.8.1.78
    pip install numpy==1.24.3 scipy==1.11.4 Pillow==10.1.0
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "Setup Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Activate environment:" -ForegroundColor White
Write-Host "   .\venv\Scripts\Activate.ps1" -ForegroundColor Yellow
Write-Host ""
Write-Host "2. Register face:" -ForegroundColor White
Write-Host "   python face_register.py" -ForegroundColor Yellow
Write-Host ""
Write-Host "3. Recognize face:" -ForegroundColor White
Write-Host "   python face_recognize.py" -ForegroundColor Yellow
Write-Host ""

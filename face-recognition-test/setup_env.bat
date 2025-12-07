@echo off
REM Setup Virtual Environment for Face Recognition Test
REM Batch Script for Windows

echo ========================================
echo Face Recognition Test - Environment Setup
echo ========================================
echo.

REM Check if Python is installed
echo Checking Python installation...
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Python tidak ditemukan!
    echo Install Python terlebih dahulu dari https://www.python.org/downloads/
    pause
    exit /b 1
)
python --version
echo.

REM Create virtual environment
if exist venv (
    echo Virtual environment sudah ada.
    set /p overwrite="Hapus dan buat ulang? (y/n): "
    if /i "%overwrite%"=="y" (
        echo Menghapus venv lama...
        rmdir /s /q venv
    ) else (
        echo Menggunakan venv yang sudah ada.
        echo.
        echo Untuk aktivasi, jalankan:
        echo   venv\Scripts\activate.bat
        echo.
        pause
        exit /b 0
    )
)

echo Creating virtual environment...
python -m venv venv

if %errorlevel% neq 0 (
    echo ERROR: Gagal membuat virtual environment!
    pause
    exit /b 1
)
echo Virtual environment created successfully!
echo.

REM Activate virtual environment
echo Activating virtual environment...
call venv\Scripts\activate.bat

REM Upgrade pip
echo Upgrading pip...
python -m pip install --upgrade pip

REM Install requirements
echo.
echo Installing dependencies from requirements.txt...
echo This may take several minutes...
echo.

pip install -r requirements.txt

if %errorlevel% neq 0 (
    echo.
    echo WARNING: Beberapa package mungkin gagal install.
    echo Mencoba install dengan CPU-only TensorFlow...
    echo.
    
    REM Try with CPU-only tensorflow
    pip install tensorflow-cpu==2.13.0 keras-facenet==0.3.2 mtcnn==0.1.1
    pip install opencv-python==4.8.1.78 opencv-contrib-python==4.8.1.78
    pip install numpy==1.24.3 scipy==1.11.4 Pillow==10.1.0
)

echo.
echo ========================================
echo Setup Complete!
echo ========================================
echo.
echo Next steps:
echo 1. Activate environment:
echo    venv\Scripts\activate.bat
echo.
echo 2. Register face:
echo    python face_register.py
echo.
echo 3. Recognize face:
echo    python face_recognize.py
echo.
pause

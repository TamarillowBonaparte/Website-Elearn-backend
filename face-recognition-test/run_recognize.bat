@echo off
REM Quick Launch: Face Recognition

echo Starting Face Recognition...
echo.

if not exist venv (
    echo ERROR: Virtual environment belum dibuat!
    echo Jalankan setup_env.bat terlebih dahulu.
    pause
    exit /b 1
)

call venv\Scripts\activate.bat
python face_recognize.py

pause

@echo off
REM Quick Launch: Face Registration

echo Starting Face Registration...
echo.

if not exist venv (
    echo ERROR: Virtual environment belum dibuat!
    echo Jalankan setup_env.bat terlebih dahulu.
    pause
    exit /b 1
)

call venv\Scripts\activate.bat
python face_register.py

pause

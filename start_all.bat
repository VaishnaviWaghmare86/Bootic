@echo off
echo ========================================================
echo   Starting B2B Wholesale Clothing Platform Ecosystem
echo ========================================================

:: 1. Start MongoDB Server
echo [1/3] Starting MongoDB Local Database on port 27017...
start "MongoDB Server" "%~dp0mongodb_bin\mongodb-win32-x86_64-windows-8.0.4\bin\mongod.exe" --dbpath "%~dp0mongodb_data" --bind_ip 127.0.0.1,localhost --port 27017

timeout /t 2 >nul

:: 2. Start FastAPI Backend
echo [2/3] Starting FastAPI Backend on http://localhost:8000...
start "FastAPI Backend" cmd /k "cd /d %~dp0 && .\venv\Scripts\activate && python run.py"

timeout /t 2 >nul

:: 3. Start React Frontend
echo [3/3] Starting React Vite Frontend on http://localhost:5173...
start "React Frontend" cmd /k "cd /d %~dp0frontend && npm run dev"

echo ========================================================
echo   All services launched successfully!
echo   Frontend: http://localhost:5173
echo   Backend:  http://localhost:8000
echo   Swagger:  http://localhost:8000/docs
echo   MongoDB:  mongodb://localhost:27017
echo ========================================================
pause

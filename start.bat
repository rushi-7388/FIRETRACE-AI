@echo off
echo ===================================================
echo   FIRETRACE AI - NASA Space Apps Challenge 2026
echo   Harmonization of MODIS and VIIRS Hot Spots
echo ===================================================
echo.

echo [1/2] Starting FastAPI Backend on http://localhost:8000...
start "FIRETRACE AI Backend" cmd /k "cd /d %~dp0backend && set PYTHONPATH=. && uvicorn main:app --reload --host 0.0.0.0 --port 8000"

echo [2/2] Starting React Vite Frontend on http://localhost:5173...
start "FIRETRACE AI Frontend" cmd /k "cd /d %~dp0frontend && npm run dev"

echo.
echo Application successfully launched!
echo - Frontend: http://localhost:5173
echo - Backend API Docs: http://localhost:8000/docs
echo ===================================================
pause


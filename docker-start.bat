@echo off
echo ===================================================
echo   FIRETRACE AI - Launching with Docker Compose
echo   NASA Space Apps Challenge 2026
echo ===================================================
echo.

echo Building and starting containers...
docker compose up --build -d

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo Docker compose command failed, trying legacy docker-compose...
    docker-compose up --build -d
)

echo.
echo ===================================================
echo   FIRETRACE AI Containers are Running!
echo   - Web Dashboard:     http://localhost:3000
echo   - Backend API Docs:  http://localhost:9000/docs
echo   - View Logs:         docker compose logs -f
echo   - Stop Containers:   docker compose down
echo ===================================================
echo.
pause


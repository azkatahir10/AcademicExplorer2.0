@echo off
echo ========================================
echo   ACADEMIC EXPLORER 2.0 - STARTING
echo ========================================
echo.

echo [1/4] Checking and installing backend dependencies...
cd backend
if exist node_modules (
    echo Backend dependencies already installed.
) else (
    echo Installing backend dependencies...
    call npm install
)
echo.

echo [2/4] Starting backend server (port 5000)...
start cmd /k "title BACKEND - Academic Explorer & node server.js"
timeout /t 3 /nobreak > nul
cd ..

echo [3/4] Checking and installing frontend dependencies...
cd src
if exist node_modules (
    echo Frontend dependencies already installed.
) else (
    echo Installing frontend dependencies...
    call npm install
)
echo.

echo [4/4] Starting frontend development server (port 3000)...
start cmd /k "title FRONTEND - Academic Explorer & npm start"
cd ..

echo.
echo ========================================
echo            READY TO USE!
echo ========================================
echo Frontend: http://localhost:3000
echo Backend:  http://localhost:5000
echo.
echo Both terminals will open separately.
echo Keep them running while using the app.
echo ========================================
timeout /t 5
exit
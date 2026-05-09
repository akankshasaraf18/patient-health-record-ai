@echo off
echo ========================================
echo    ShiftFlow AI - Starting System
echo ========================================
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Node.js is not installed!
    echo Please install Node.js from https://nodejs.org
    pause
    exit /b 1
)

echo Node.js found: 
node --version
echo.

REM Check if MongoDB is running
echo Checking MongoDB connection...
timeout /t 2 /nobreak >nul
echo (Make sure MongoDB is running on localhost:27017)
echo.

echo ========================================
echo  Installing Dependencies (if needed)
echo ========================================
echo.

REM Install backend dependencies
echo Installing backend dependencies...
cd backend
if not exist node_modules (
    echo Running npm install in backend...
    call npm install
) else (
    echo Backend dependencies already installed
)
echo.

REM Install frontend dependencies
echo Installing frontend dependencies...
cd ..\frontend
if not exist node_modules (
    echo Running npm install in frontend...
    call npm install
) else (
    echo Frontend dependencies already installed
)
echo.

echo ========================================
echo       Starting Backend Server
echo ========================================
echo.
cd ..\backend
echo Starting backend on http://localhost:5000
start "ShiftFlow Backend" cmd /k "npm run dev"

timeout /t 3 /nobreak >nul

echo ========================================
echo       Starting Frontend Server
echo ========================================
echo.
cd ..\frontend
echo Starting frontend on http://localhost:5173
start "ShiftFlow Frontend" cmd /k "npm run dev"

timeout /t 3 /nobreak >nul

echo.
echo ========================================
echo     ShiftFlow AI is Starting!
echo ========================================
echo.
echo Backend:  http://localhost:5000
echo Frontend: http://localhost:5173
echo.
echo Two terminal windows should have opened.
echo.
echo Next Steps:
echo 1. Wait for both servers to start
echo 2. Open http://localhost:5173 in your browser
echo 3. Create a doctor account at /signup
echo 4. Follow the QUICKSTART-COMPLETE.md guide
echo.
echo Press any key to open browser...
pause >nul

start http://localhost:5173

echo.
echo Enjoy using ShiftFlow AI!
echo.
pause

@echo off
REM Check ML Setup Status

echo ========================================
echo ML Setup Status Checker
echo ========================================
echo.

REM Check Python
echo [1/4] Checking Python installation...
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Python NOT found
    echo    Please install Python 3.8+ from https://www.python.org/
) else (
    for /f "tokens=*" %%i in ('python --version') do echo ✅ %%i
)
echo.

REM Check Node.js
echo [2/4] Checking Node.js installation...
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js NOT found
    echo    Please install Node.js from https://nodejs.org/
) else (
    for /f "tokens=*" %%i in ('node --version') do echo ✅ Node.js %%i
)
echo.

REM Check if Python packages are installed
echo [3/4] Checking Python dependencies...
if exist "backend\ml\models\metrics.json" (
    echo ✅ Model has been trained
) else (
    echo ⚠️  Model not yet trained
    echo    Run SETUP_ML.bat to train the model
)
echo.

REM Check dataset
echo [4/4] Checking dataset...
if exist "backend\data\patient_records_200.csv" (
    echo ✅ Dataset found (patient_records_200.csv)
) else (
    echo ❌ Dataset NOT found
    echo    Expected: backend\data\patient_records_200.csv
)
echo.

echo ========================================
echo Summary
echo ========================================
echo.
echo Next steps:
echo 1. If Python/Node missing, install them
echo 2. Run SETUP_ML.bat to install dependencies and train model
echo 3. Start backend: cd backend ^&^& npm start
echo 4. Start frontend: cd frontend ^&^& npm run dev
echo 5. Visit http://localhost:5173 and click "ML Model"
echo.

pause

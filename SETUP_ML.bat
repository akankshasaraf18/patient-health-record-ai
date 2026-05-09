@echo off
REM ML Model Setup and Training Script for Windows

echo ========================================
echo ML Model Setup and Training
echo ========================================
echo.

REM Check if Python is installed
py --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Python is not installed or not in PATH
    echo Please install Python 3.8+ and try again
    pause
    exit /b 1
)

echo Python found!
echo.

REM Navigate to ML directory
cd /d "%~dp0"
cd backend\ml

echo Installing Python dependencies...
py -m pip install -r requirements.txt

if errorlevel 1 (
    echo.
    echo ERROR: Failed to install dependencies
    pause
    exit /b 1
)

echo.
echo Dependencies installed successfully!
echo.
echo Starting model training...
echo This may take several minutes...
echo.

echo Training ML model with sklearn train_test_split...
echo.
py backend\ml\train_test_model_improved.py

if errorlevel 1 (
    echo.
    echo ERROR: Model training failed
    pause
    exit /b 1
)

echo.
echo ========================================
echo Model training completed successfully!
echo ========================================
echo.
echo Metrics have been saved to backend\ml\models\metrics.json
echo You can now view the results on the ML Model page in the application
echo.
pause

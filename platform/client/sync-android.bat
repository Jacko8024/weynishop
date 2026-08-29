@echo off
setlocal
cd /d "%~dp0"
title WeyniShop - Build + Sync + Open Android Studio

REM ---------------------------------------------------------------------------
REM WeyniShop Android workflow (Windows)
REM   1. Builds the web bundle with Vite (bakes .env values into the bundle)
REM   2. npx cap sync android  (copies dist/ -> android/app/src/main/assets/
REM                             + updates native plugins)
REM   3. npx cap open android  (launches Android Studio with the project)
REM
REM If Android Studio is not auto-detected, uncomment and fix this line:
REM set "CAPACITOR_ANDROID_STUDIO_DIR=C:\Program Files\Android\Android Studio\bin\studio64.exe"
REM ---------------------------------------------------------------------------

echo ==========================================================
echo  WeyniShop - Build web app, sync Capacitor, open Android
echo ==========================================================
echo.

REM --- Guard: never bake a localhost API URL into the APK --------------------
if exist ".env" (
    findstr /B /C:"VITE_API_URL=https://" .env >nul 2>&1
    if errorlevel 1 (
        echo [WARN] .env does not set VITE_API_URL to an https:// URL.
        echo        The APK would fall back to http://localhost:5000 and
        echo        the app would show no products on a real device!
        choice /C YN /M "Continue anyway"
        if errorlevel 2 exit /b 1
    ) else (
        for /f "delims=" %%A in ('findstr /B /C:"VITE_API_URL=" .env') do echo [OK] %%A
    )
) else (
    echo [WARN] No .env file found - the API URL will default to localhost:5000.
    choice /C YN /M "Continue anyway"
    if errorlevel 2 exit /b 1
)

echo.
echo [1/3] Building web bundle ^(vite build^)...
call npm run build
if errorlevel 1 goto :fail

echo.
echo [2/3] Syncing web assets + plugins into android/...
call npx cap sync android
if errorlevel 1 goto :fail

echo.
echo [3/3] Launching Android Studio...
call npx cap open android
if errorlevel 1 goto :fail

echo.
echo Done! Android Studio is opening this project:
echo   %CD%\android
echo ^(If no window appears, start Android Studio manually and open that folder.^)
echo.
pause
exit /b 0

:fail
echo.
echo *** FAILED - scroll up for the error above. ***
pause
exit /b 1

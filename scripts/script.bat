@echo off
setlocal
:: Fortune Decor - project setup (Windows, local development)
::   scripts\script.bat

set "ROOT=%~dp0.."
pushd "%ROOT%"
set "ROOT=%CD%"

echo ===================================================
echo  Fortune Decor - Setup
echo ===================================================

echo [1/5] Checking prerequisites...
where py >nul 2>nul || (echo [error] Python launcher 'py' not found. Install Python 3.11+. & goto :fail)
where node >nul 2>nul || (echo [error] Node.js not found. Install Node.js 20+. & goto :fail)
where npm >nul 2>nul || (echo [error] npm not found. & goto :fail)

echo [2/5] Backend: virtualenv + dependencies...
cd /d "%ROOT%\backend"
if not exist "venv\Scripts\python.exe" py -3 -m venv venv || goto :fail
venv\Scripts\python.exe -m pip install --upgrade pip -q
venv\Scripts\pip.exe install -r requirements.txt -q || goto :fail
if not exist ".env" (
    copy /y .env.example .env >nul
    venv\Scripts\python.exe "%ROOT%\scripts\env_set.py" .env SECRET_KEY "" >nul
    venv\Scripts\python.exe "%ROOT%\scripts\env_set.py" .env SECRET_KEY --secret >nul
    echo [warn] Created backend\.env - set DATABASE_URL before running.
)
if not exist "uploads" mkdir uploads
:: One secret shared by backend\.env and frontend\.env.local for cache refreshes
for /f "delims=" %%S in ('venv\Scripts\python.exe "%ROOT%\scripts\env_set.py" .env REVALIDATE_SECRET --secret') do set "REVALIDATE_SECRET=%%S"

echo [3/5] Website dependencies...
call :setup_next frontend || goto :fail
echo [4/5] CMS dependencies...
call :setup_next cms || goto :fail

echo [5/5] Database migrations + seed content...
cd /d "%ROOT%\backend"
venv\Scripts\alembic.exe upgrade head
if errorlevel 1 (
    echo [warn] Migrations failed - check DATABASE_URL in backend\.env and that PostgreSQL is running,
    echo        then run: cd backend ^&^& venv\Scripts\alembic upgrade head ^&^& venv\Scripts\python -m app.seed
) else (
    venv\Scripts\python.exe -m app.seed
)

echo.
echo Setup complete.
echo   Create a CMS login : cd backend ^&^& venv\Scripts\python -m app.cli create-admin --email you@example.com
echo   Start dev servers  : scripts\run.bat
popd
exit /b 0

:setup_next
cd /d "%ROOT%\%~1"
if exist package-lock.json (call npm ci --no-audit --no-fund) else (call npm install --no-audit --no-fund)
if errorlevel 1 exit /b 1
if not exist ".env.local" if exist ".env.example" (
    copy /y .env.example .env.local >nul
    if "%~1"=="frontend" "%ROOT%\backend\venv\Scripts\python.exe" "%ROOT%\scripts\env_set.py" .env.local REVALIDATE_SECRET %REVALIDATE_SECRET%
    echo [warn] Created %~1\.env.local from .env.example
)
exit /b 0

:fail
echo Setup failed.
popd
exit /b 1

@echo off
setlocal
:: Fortune Decor - run all services in dev mode (Windows)
::   scripts\run.bat         Ctrl+C stops everything

set "ROOT=%~dp0.."
pushd "%ROOT%"
set "ROOT=%CD%"

if "%WEB_PORT%"=="" set WEB_PORT=3000
if "%CMS_PORT%"=="" set CMS_PORT=3001
if "%API_PORT%"=="" set API_PORT=8000
if "%ADMIN_API_PORT%"=="" set ADMIN_API_PORT=8001

if not exist "backend\venv\Scripts\uvicorn.exe" (
    echo [error] Backend venv missing - run scripts\script.bat first.
    popd & exit /b 1
)
if not exist "frontend\node_modules" (
    echo [error] frontend\node_modules missing - run scripts\script.bat first.
    popd & exit /b 1
)
if not exist "cms\node_modules" (
    echo [error] cms\node_modules missing - run scripts\script.bat first.
    popd & exit /b 1
)

echo ===================================================
echo  Fortune Decor - Dev servers
echo   Website   http://localhost:%WEB_PORT%
echo   CMS       http://localhost:%CMS_PORT%
echo   API       http://localhost:%API_PORT%/docs
echo   Admin API http://localhost:%ADMIN_API_PORT%/docs
echo ===================================================

call npx -y concurrently --kill-others --names "API,ADMIN_API,WEB,CMS" --prefix-colors "blue,magenta,green,yellow" ^
  "cd backend && venv\Scripts\uvicorn.exe app.main:app --reload --reload-dir app --port %API_PORT%" ^
  "cd backend && venv\Scripts\uvicorn.exe app.admin_main:app --reload --reload-dir app --port %ADMIN_API_PORT%" ^
  "cd frontend && npm run dev -- -p %WEB_PORT%" ^
  "cd cms && npm run dev -- -p %CMS_PORT%"

popd

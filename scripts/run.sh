#!/usr/bin/env bash
# Fortune Decor - run the stack (Linux / macOS / Hostinger VPS)
#
#   ./scripts/run.sh            # dev: all 4 services with hot reload, Ctrl+C stops everything
#   ./scripts/run.sh prod       # production: migrate + seed DB, start APIs, build web + CMS, (re)start all under PM2
#                               # (SKIP_BUILD=1 ./scripts/run.sh prod restarts without rebuilding)
#   ./scripts/run.sh stop       # stop PM2 processes
#   ./scripts/run.sh status     # PM2 status
#   ./scripts/run.sh logs       # tail PM2 logs
#
# Ports (override via env): WEB_PORT=3000 CMS_PORT=3001 API_PORT=8000 ADMIN_API_PORT=8001
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKEND="$ROOT/backend"
ECOSYSTEM="$ROOT/deploy/ecosystem.config.js"

export WEB_PORT="${WEB_PORT:-3000}"
export CMS_PORT="${CMS_PORT:-3001}"
export API_PORT="${API_PORT:-8000}"
export ADMIN_API_PORT="${ADMIN_API_PORT:-8001}"

fail() { printf '\033[1;31m[error]\033[0m %s\n' "$*" >&2; exit 1; }

require_setup() {
  [[ -x "$BACKEND/venv/bin/python" ]] || fail "Backend venv missing - run ./scripts/script.sh first"
  [[ -d "$ROOT/frontend/node_modules" && -d "$ROOT/cms/node_modules" ]] || fail "node_modules missing - run ./scripts/script.sh first"
}

require_pm2() {
  command -v pm2 >/dev/null || fail "pm2 not found (sudo npm install -g pm2)"
}

run_dev() {
  require_setup
  local pids=()

  # Prefix every line of a service's output with a coloured label
  start() {
    local label="$1" color="$2" dir="$3"; shift 3
    ( cd "$dir" && exec "$@" ) 2>&1 | sed -u "s/^/\x1b[${color}m[${label}]\x1b[0m /" &
    pids+=($!)
  }

  cleanup() {
    trap - INT TERM EXIT
    echo; echo "Stopping all services..."
    kill 0 2>/dev/null || true
  }
  trap cleanup INT TERM EXIT

  echo "Website   http://localhost:$WEB_PORT"
  echo "CMS       http://localhost:$CMS_PORT"
  echo "API       http://localhost:$API_PORT/docs"
  echo "Admin API http://localhost:$ADMIN_API_PORT/docs"
  echo

  local uv="$BACKEND/venv/bin/uvicorn"
  start "API"       "34" "$BACKEND"       "$uv" app.main:app       --reload --reload-dir app --port "$API_PORT"
  start "ADMIN_API" "35" "$BACKEND"       "$uv" app.admin_main:app --reload --reload-dir app --port "$ADMIN_API_PORT"
  start "WEB"       "32" "$ROOT/frontend" npm run dev -- -p "$WEB_PORT"
  start "CMS"       "33" "$ROOT/cms"      npm run dev -- -p "$CMS_PORT"

  wait -n "${pids[@]}" || true   # if any service dies, take the rest down
}

wait_for() {
  local url="$1" tries=30
  until curl -fsS "$url" >/dev/null 2>&1; do
    (( --tries )) || fail "Timed out waiting for $url"
    sleep 1
  done
}

run_prod() {
  require_setup
  require_pm2
  command -v curl >/dev/null || fail "curl not found (apt install curl)"

  echo "Applying database migrations and seeding missing content..."
  ( cd "$BACKEND" && ./venv/bin/alembic upgrade head && ./venv/bin/python -m app.seed )

  # The website prerenders pages from the API at build time, so the APIs start first
  echo "Starting APIs..."
  pm2 startOrReload "$ECOSYSTEM" --only fd-api,fd-admin-api --update-env
  wait_for "http://127.0.0.1:$API_PORT/health"
  wait_for "http://127.0.0.1:$ADMIN_API_PORT/health"

  if [[ "${SKIP_BUILD:-0}" != "1" ]]; then
    echo "Building website and CMS..."
    ( cd "$ROOT/frontend" && npm run build )
    ( cd "$ROOT/cms" && npm run build )
  fi

  pm2 startOrReload "$ECOSYSTEM" --update-env
  pm2 save
  pm2 status
  echo
  echo "Tip: run 'pm2 startup' once so PM2 restarts the apps after a server reboot."
}

case "${1:-dev}" in
  dev)    run_dev ;;
  prod)   run_prod ;;
  stop)   require_pm2; pm2 stop "$ECOSYSTEM" ;;
  status) require_pm2; pm2 status ;;
  logs)   require_pm2; pm2 logs ;;
  *)      fail "Unknown command '$1' (use: dev | prod | stop | status | logs)" ;;
esac

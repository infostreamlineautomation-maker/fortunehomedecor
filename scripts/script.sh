#!/usr/bin/env bash
# Fortune Decor - project setup (Linux / macOS / Hostinger VPS)
#
#   ./scripts/script.sh           # development setup
#   ./scripts/script.sh --prod    # production setup (APP_ENV=production; builds happen in run.sh prod)
#
# Safe to re-run: it only creates what is missing and re-installs dependencies.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKEND="$ROOT/backend"
MODE="dev"
[[ "${1:-}" == "--prod" ]] && MODE="prod"

info() { printf '\033[1;34m[setup]\033[0m %s\n' "$*"; }
warn() { printf '\033[1;33m[warn]\033[0m  %s\n' "$*"; }
fail() { printf '\033[1;31m[error]\033[0m %s\n' "$*" >&2; exit 1; }

info "Mode: $MODE   Root: $ROOT"

# ---------------------------------------------------------------- prerequisites
info "[1/5] Checking prerequisites"
command -v python3 >/dev/null || fail "python3 not found (apt install python3 python3-venv python3-pip)"
command -v node    >/dev/null || fail "node not found (install Node.js 20+)"
command -v npm     >/dev/null || fail "npm not found"

python3 -c 'import sys; sys.exit(0 if sys.version_info >= (3, 11) else 1)' \
  || fail "Python 3.11+ required (found $(python3 --version))"
NODE_MAJOR="$(node -p 'process.versions.node.split(".")[0]')"
(( NODE_MAJOR >= 20 )) || fail "Node.js 20+ required (found $(node -v))"
python3 -c 'import venv' 2>/dev/null || fail "python3-venv missing (apt install python3-venv)"

# ---------------------------------------------------------------- backend
info "[2/5] Backend: virtualenv + dependencies"
cd "$BACKEND"
[[ -d venv ]] || python3 -m venv venv
./venv/bin/python -m pip install --upgrade pip -q
./venv/bin/pip install -r requirements.txt -q

if [[ ! -f .env ]]; then
  cp .env.example .env
  SECRET="$(./venv/bin/python -c 'import secrets; print(secrets.token_urlsafe(64))')"
  sed -i.bak "s|^SECRET_KEY=.*|SECRET_KEY=$SECRET|" .env && rm -f .env.bak
  if [[ "$MODE" == "prod" ]]; then
    sed -i.bak "s|^APP_ENV=.*|APP_ENV=production|" .env && rm -f .env.bak
  fi
  warn "Created backend/.env - set DATABASE_URL and CORS origins before running."
fi
mkdir -p uploads

# One secret shared by backend/.env and frontend/.env.local for cache refreshes
REVALIDATE_SECRET="$(grep -E '^REVALIDATE_SECRET=' .env | cut -d= -f2- || true)"
if [[ -z "$REVALIDATE_SECRET" ]]; then
  REVALIDATE_SECRET="$(./venv/bin/python -c 'import secrets; print(secrets.token_urlsafe(32))')"
  if grep -qE '^REVALIDATE_SECRET=' .env; then
    sed -i.bak "s|^REVALIDATE_SECRET=.*|REVALIDATE_SECRET=$REVALIDATE_SECRET|" .env && rm -f .env.bak
  else
    printf '\nREVALIDATE_SECRET=%s\n' "$REVALIDATE_SECRET" >> .env
  fi
fi

# ---------------------------------------------------------------- frontends
setup_next() {
  local name="$1" dir="$ROOT/$1"
  info "Installing $name dependencies"
  cd "$dir"
  if [[ -f package-lock.json ]]; then npm ci --no-audit --no-fund; else npm install --no-audit --no-fund; fi
  if [[ ! -f .env.local && -f .env.example ]]; then
    cp .env.example .env.local
    sed -i.bak "s|^REVALIDATE_SECRET=.*|REVALIDATE_SECRET=$REVALIDATE_SECRET|" .env.local && rm -f .env.local.bak
    warn "Created $name/.env.local from .env.example - review the API URLs."
  fi
}

info "[3/5] Website (frontend)"
setup_next frontend
info "[4/5] CMS (cms)"
setup_next cms

# ---------------------------------------------------------------- database
info "[5/5] Database migrations + seed content"
cd "$BACKEND"
if ./venv/bin/alembic upgrade head; then
  info "Database is up to date."
  ./venv/bin/python -m app.seed
else
  warn "Migrations failed - check DATABASE_URL in backend/.env and that PostgreSQL is running,"
  warn "then run: cd backend && ./venv/bin/alembic upgrade head"
fi

chmod +x "$ROOT/scripts/"*.sh

cat <<EOF

Setup complete ($MODE).
  Create a CMS login : cd backend && ./venv/bin/python -m app.cli create-admin --email you@example.com
  Start dev servers  : ./scripts/run.sh
  Start production   : ./scripts/run.sh prod
EOF

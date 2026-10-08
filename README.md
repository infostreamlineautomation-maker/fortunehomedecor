# Fortune Decor

Website + CMS. Next.js (website, CMS) · FastAPI · PostgreSQL · Alembic.

| Service    | URL (dev)                    |
|------------|------------------------------|
| Website    | http://localhost:3000        |
| CMS        | http://localhost:3001        |
| Public API | http://localhost:8000/docs   |
| Admin API  | http://localhost:8001/docs   |

## Quick start

Prerequisites: Python 3.11+, Node.js 20+, PostgreSQL with an empty `fortune_decor` database.

**Windows**
```bat
scripts\script.bat
scripts\run.bat
```

**Linux / macOS**
```bash
./scripts/script.sh
./scripts/run.sh
```

Setup creates `backend/.env`, `frontend/.env.local` and `cms/.env.local` from their `.env.example` — set
`DATABASE_URL` in `backend/.env`, then create a CMS login:

```bash
cd backend && venv/bin/python -m app.cli create-admin --email you@example.com      # Windows: venv\Scripts\python
```

## Seed content

Setup loads the Figma content (categories, products, page text, FAQs, settings, media library).
It only creates what's missing, so it never overwrites CMS edits:

```bash
cd backend && venv/bin/python -m app.seed                    # add missing content
cd backend && venv/bin/python -m app.seed --reset-content    # restore seed text over CMS edits
```

## Tests

Backend tests run against a separate `<db>_test` database (created and dropped automatically):

```bash
cd backend && venv/bin/pip install -r requirements-dev.txt
venv/bin/python -m pytest
venv/bin/ruff check app tests
```

## Database migrations

```bash
cd backend
venv/bin/alembic revision --autogenerate -m "describe change"   # after editing models (import new models in app/models/__init__.py)
venv/bin/alembic upgrade head
```

## Docs

- [Project plan](docs/PLAN.md)
- [Hostinger deployment](docs/DEPLOYMENT.md)

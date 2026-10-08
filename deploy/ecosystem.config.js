// PM2 process file for production (Hostinger VPS, Linux).
// Started by: ./scripts/run.sh prod
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const BACKEND = path.join(ROOT, "backend");
const GUNICORN = path.join(BACKEND, "venv", "bin", "gunicorn");

const WEB_PORT = process.env.WEB_PORT || 3000;
const CMS_PORT = process.env.CMS_PORT || 3001;
const API_PORT = process.env.API_PORT || 8000;
const ADMIN_API_PORT = process.env.ADMIN_API_PORT || 8001;
const API_WORKERS = process.env.API_WORKERS || 2;

const gunicornArgs = (module, port, workers) =>
  `${module} -k uvicorn.workers.UvicornWorker -w ${workers} -b 127.0.0.1:${port} --timeout 60 --access-logfile -`;

module.exports = {
  apps: [
    {
      name: "fd-api",
      cwd: BACKEND,
      script: GUNICORN,
      args: gunicornArgs("app.main:app", API_PORT, API_WORKERS),
      interpreter: "none",
      max_memory_restart: "400M",
    },
    {
      name: "fd-admin-api",
      cwd: BACKEND,
      script: GUNICORN,
      args: gunicornArgs("app.admin_main:app", ADMIN_API_PORT, 1),
      interpreter: "none",
      max_memory_restart: "300M",
    },
    {
      name: "fd-web",
      cwd: path.join(ROOT, "frontend"),
      script: "node_modules/next/dist/bin/next",
      args: `start -p ${WEB_PORT} -H 127.0.0.1`,
      env: { NODE_ENV: "production" },
      max_memory_restart: "500M",
    },
    {
      name: "fd-cms",
      cwd: path.join(ROOT, "cms"),
      script: "node_modules/next/dist/bin/next",
      args: `start -p ${CMS_PORT} -H 127.0.0.1`,
      env: { NODE_ENV: "production" },
      max_memory_restart: "400M",
    },
  ],
};

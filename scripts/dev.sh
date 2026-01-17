#!/usr/bin/env bash
set -euo pipefail

root_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

if command -v pnpm >/dev/null 2>&1; then
  echo "[dev] Using pnpm"
else
  echo "[dev] pnpm is required but not installed." >&2
  exit 1
fi

if command -v uv >/dev/null 2>&1; then
  echo "[dev] Using uv"
else
  echo "[dev] uv is required but not installed." >&2
  exit 1
fi

echo "[dev] Sync backend dependencies"
( cd "$root_dir/backend" && uv sync )

if [[ ! -f "$root_dir/backend/.env" ]]; then
  echo "[dev] Creating backend/.env from .env.example"
  cp "$root_dir/backend/.env.example" "$root_dir/backend/.env"
fi

if ! grep -q '^CORS_ORIGINS=' "$root_dir/backend/.env"; then
  echo 'CORS_ORIGINS=["http://localhost:5174","http://127.0.0.1:5174"]' >> "$root_dir/backend/.env"
fi

echo "[dev] Install frontend dependencies"
( cd "$root_dir" && pnpm install )

echo "[dev] Starting backend at http://127.0.0.1:8000"
( cd "$root_dir/backend" && uv run uvicorn app.main:app --reload ) &
backend_pid=$!

cleanup() {
  echo "[dev] Stopping backend (pid $backend_pid)"
  kill "$backend_pid" 2>/dev/null || true
}
trap cleanup EXIT

echo "[dev] Starting frontend at http://localhost:5174"
( cd "$root_dir" && pnpm exec vite --host localhost --port 5174 --strictPort )

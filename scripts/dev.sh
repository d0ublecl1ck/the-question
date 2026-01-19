#!/usr/bin/env bash
set -euo pipefail

root_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

if command -v pnpm >/dev/null 2>&1; then
  echo "[dev] Using pnpm"
else
  echo "[dev] pnpm is required but not installed." >&2
  exit 1
fi

echo "[dev] Install frontend dependencies"
( cd "$root_dir" && pnpm install )

echo "[dev] Starting frontend at http://localhost:5174"
( cd "$root_dir" && pnpm exec vite --host localhost --port 5174 --strictPort )

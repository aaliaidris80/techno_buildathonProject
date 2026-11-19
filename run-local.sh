#!/usr/bin/env bash
# =============================================================================
# DocuPing - run the full stack locally
#
#   MongoDB  -> Docker container "docuping-mongo"   (127.0.0.1:27017)
#   Backend  -> Express API                          (http://localhost:5000/api)
#   Frontend -> static server for /frontend          (http://127.0.0.1:5500)
#
# Usage:
#   ./run-local.sh            start everything (Ctrl+C stops backend + frontend)
#   ./run-local.sh --stop-db  also stop the MongoDB container on exit
#
# Requirements: Docker (running), Node.js + npm, Python 3.
# =============================================================================
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$ROOT/backend"
FRONTEND_DIR="$ROOT/frontend"

MONGO_CONTAINER="docuping-mongo"
MONGO_VOLUME="docuping-mongo-data"
MONGO_IMAGE="mongo:7"
MONGO_PORT=27017
BACKEND_PORT=5000
FRONTEND_PORT=5500

STOP_DB_ON_EXIT=false
[[ "${1:-}" == "--stop-db" ]] && STOP_DB_ON_EXIT=true

info() { printf '\033[1;32m▸\033[0m %s\n' "$*"; }
warn() { printf '\033[1;33m!\033[0m %s\n' "$*"; }
fail() { printf '\033[1;31m✗\033[0m %s\n' "$*" >&2; exit 1; }

port_in_use() { lsof -iTCP:"$1" -sTCP:LISTEN -P >/dev/null 2>&1; }

wait_for_http() { # url, name, seconds
  local url="$1" name="$2" tries=$(( $3 * 2 ))
  for ((i = 0; i < tries; i++)); do
    if curl --noproxy '*' -s -o /dev/null "$url"; then return 0; fi
    sleep 0.5
  done
  fail "$name did not start in time ($url)."
}

# --- 1. Prerequisites --------------------------------------------------------
command -v docker  >/dev/null || fail "Docker is not installed."
docker info >/dev/null 2>&1   || fail "Docker is not running. Start Docker Desktop and retry."
command -v node    >/dev/null || fail "Node.js is not installed."
command -v npm     >/dev/null || fail "npm is not installed."
command -v python3 >/dev/null || fail "Python 3 is not installed."

port_in_use "$BACKEND_PORT"  && fail "Port $BACKEND_PORT is already in use (another backend running?). Stop it first: lsof -iTCP:$BACKEND_PORT -sTCP:LISTEN"
port_in_use "$FRONTEND_PORT" && fail "Port $FRONTEND_PORT is already in use. Stop it first: lsof -iTCP:$FRONTEND_PORT -sTCP:LISTEN"

# --- 2. MongoDB --------------------------------------------------------------
if docker ps --format '{{.Names}}' | grep -qx "$MONGO_CONTAINER"; then
  info "MongoDB container already running."
elif docker ps -a --format '{{.Names}}' | grep -qx "$MONGO_CONTAINER"; then
  info "Starting existing MongoDB container..."
  docker start "$MONGO_CONTAINER" >/dev/null
else
  port_in_use "$MONGO_PORT" && fail "Port $MONGO_PORT is taken by something other than $MONGO_CONTAINER."
  info "Creating MongoDB container ($MONGO_IMAGE)..."
  docker run -d --name "$MONGO_CONTAINER" \
    -p "127.0.0.1:$MONGO_PORT:27017" \
    -v "$MONGO_VOLUME:/data/db" \
    "$MONGO_IMAGE" >/dev/null
fi

info "Waiting for MongoDB..."
for ((i = 0; i < 60; i++)); do
  if docker exec "$MONGO_CONTAINER" mongosh --quiet --eval 'db.runCommand({ping:1}).ok' 2>/dev/null | grep -q 1; then
    break
  fi
  sleep 0.5
  [[ $i -eq 59 ]] && fail "MongoDB did not become ready."
done

# --- 3. Backend env + dependencies ------------------------------------------
if [[ ! -f "$BACKEND_DIR/.env" ]]; then
  info "Creating backend/.env for local development..."
  {
    echo "PORT=$BACKEND_PORT"
    echo "MONGO_URI=mongodb://127.0.0.1:$MONGO_PORT/docuping_local"
    echo "JWT_SECRET=$(openssl rand -hex 32)"
  } > "$BACKEND_DIR/.env"
else
  info "Using existing backend/.env"
  grep -q '127.0.0.1\|localhost' "$BACKEND_DIR/.env" \
    || warn "backend/.env MONGO_URI is not local — the backend will use that remote database."
fi

if [[ ! -d "$BACKEND_DIR/node_modules" ]]; then
  info "Installing backend dependencies (npm ci)..."
  (cd "$BACKEND_DIR" && npm ci)
fi

# --- 4. Start servers --------------------------------------------------------
PIDS=()
cleanup() {
  trap - INT TERM EXIT
  echo
  info "Stopping backend and frontend..."
  for pid in "${PIDS[@]:-}"; do
    [[ -n "$pid" ]] && kill "$pid" 2>/dev/null || true
  done
  wait 2>/dev/null || true
  if $STOP_DB_ON_EXIT; then
    info "Stopping MongoDB container..."
    docker stop "$MONGO_CONTAINER" >/dev/null || true
  else
    info "MongoDB left running (stop it with: docker stop $MONGO_CONTAINER)"
  fi
}
trap cleanup INT TERM EXIT

info "Starting backend on :$BACKEND_PORT..."
(cd "$BACKEND_DIR" && exec node server.js) > >(sed -u 's/^/[backend]  /') 2>&1 &
PIDS+=($!)

info "Starting frontend on :$FRONTEND_PORT..."
(cd "$FRONTEND_DIR" && exec python3 -m http.server "$FRONTEND_PORT" --bind 127.0.0.1) > >(sed -u 's/^/[frontend] /') 2>&1 &
PIDS+=($!)

wait_for_http "http://localhost:$BACKEND_PORT/api/documents" "Backend" 30
wait_for_http "http://127.0.0.1:$FRONTEND_PORT/" "Frontend" 15

cat <<EOF

  ✅ DocuPing is running locally

     App:       http://127.0.0.1:$FRONTEND_PORT/pages/login.html
     Sign up:   http://127.0.0.1:$FRONTEND_PORT/pages/signup.html
     My Vault:  http://127.0.0.1:$FRONTEND_PORT/pages/my-vault.html
     API:       http://localhost:$BACKEND_PORT/api

     Press Ctrl+C to stop.

EOF

wait

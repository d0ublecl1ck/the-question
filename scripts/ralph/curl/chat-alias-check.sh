#!/usr/bin/env bash
set -euo pipefail

BASE_URL=${BASE_URL:-http://127.0.0.1:8000}
EMAIL="alias-$(uuidgen)@b.com"

TOKEN=$(curl -sS -X POST "$BASE_URL/api/v1/auth/register" \
  -H 'Content-Type: application/json' \
  -d "{\"email\":\"$EMAIL\",\"password\":\"secret123\"}" | jq -r '.id' >/dev/null; \
  curl -sS -X POST "$BASE_URL/api/v1/auth/login" \
  -H 'Content-Type: application/json' \
  -d "{\"email\":\"$EMAIL\",\"password\":\"secret123\"}" | jq -r '.access_token')

AUTH="Authorization: Bearer $TOKEN"

SKILL_ID=$(curl -sS -X POST "$BASE_URL/api/v1/skills" \
  -H "Content-Type: application/json" -H "$AUTH" \
  -d '{"name":"alias-skill","description":"desc","visibility":"public","tags":["alias"],"content":"v1"}' | jq -r '.id')

SESSION_ID=$(curl -sS -X POST "$BASE_URL/api/v1/chat/sessions" \
  -H "Content-Type: application/json" -H "$AUTH" \
  -d '{"title":"alias"}' | jq -r '.id')

curl -sS -X POST "$BASE_URL/api/v1/chat/sessions/$SESSION_ID/messages" \
  -H "Content-Type: application/json" -H "$AUTH" \
  -d '{"role":"user","content":"hi"}' | jq -e '.id' >/dev/null

SUGGESTION_ID=$(curl -sS -X POST "$BASE_URL/api/v1/skill-suggestions" \
  -H "Content-Type: application/json" -H "$AUTH" \
  -d "{\"session_id\":\"$SESSION_ID\",\"skill_id\":\"$SKILL_ID\"}" | jq -r '.id')

curl -sS -X PATCH "$BASE_URL/api/v1/chats/$SESSION_ID/suggestions/$SUGGESTION_ID" \
  -H "Content-Type: application/json" -H "$AUTH" \
  -d '{"status":"rejected"}' | jq -e '.status' >/dev/null

STATUS=$(curl -sS -o /dev/null -w "%{http_code}" -X POST "$BASE_URL/api/v1/skill-suggestions" \
  -H "Content-Type: application/json" -H "$AUTH" \
  -d "{\"session_id\":\"$SESSION_ID\",\"skill_id\":\"$SKILL_ID\"}")

if [ "$STATUS" -ne 409 ]; then
  echo "Expected 409, got $STATUS" >&2
  exit 1
fi

echo "chat alias check ok"

#!/usr/bin/env bash
set -euo pipefail

# --- load secrets ---
ENV_FILE="$HOME/Research 2025/Tesla Fleet API/tesla-fleet/fleet.env"
if [[ -f $ENV_FILE ]]; then
  # export all names found in the file
  set -a            # automatically export every variable that gets set
  # shellcheck disable=SC1090
  source "$ENV_FILE"
  set +a
else
  echo "❌  Env file not found: $ENV_FILE" >&2
  exit 1
fi

# Check required variables
if [[ -z "${NGROK_DOMAIN:-}" ]]; then
  echo "❌  NGROK_DOMAIN is not set" >&2
  exit 1
fi

curl -X POST "https://${NGROK_DOMAIN}/user/auth/register" \
-H "Content-Type: application/json" \
-d '{ "email": "rishabh.mohapatra@gmail.com", "password": "Tbf14&*7pr!7=^" }'
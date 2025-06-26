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

curl -i -X POST "https://fleet-api.prd.na.vn.cloud.tesla.com/api/1/partner_accounts" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "Content-Type: application/json" \
  -d "{\"domain\":\"${NGROK_DOMAIN}\"}"

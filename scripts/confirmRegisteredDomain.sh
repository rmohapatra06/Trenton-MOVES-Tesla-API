#!/usr/bin/env bash
set -euo pipefail

echo "Tesla Fleet API - Third-Party OAuth Setup"
echo "==========================================="

echo "Domain confirmation is NOT required for third-party (ownerapi) OAuth."
echo "Instead, you must register your redirect URI in the Tesla developer portal."
echo ""
echo "1. Go to https://developer.tesla.com/"
echo "2. Find your app and add your ngrok domain with /extractToken as an allowed redirect URI."
echo "   Example: https://your-ngrok-domain.ngrok-free.app/extractToken"
echo "3. Save your changes."
echo ""
echo "You can now use the third-party OAuth flow as described in the README."

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
if [[ -z "${ACCESS_TOKEN:-}" ]]; then
  echo "❌  ACCESS_TOKEN is not set" >&2
  exit 1
fi

echo "Checking if domain is registered: ${NGROK_DOMAIN}"

curl -X GET "https://fleet-api.prd.na.vn.cloud.tesla.com/api/1/partner_accounts" \
  -H 'Content-Type: application/json' \
  -H "Authorization: Bearer ${ACCESS_TOKEN}"

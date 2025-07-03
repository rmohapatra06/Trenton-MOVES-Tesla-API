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

if [[ -z "${REFRESH_TOKEN:-}" ]]; then
  echo "❌ REFRESH_TOKEN not found in environment variables" >&2
  exit 1
fi

echo "🔄 Using REFRESH_TOKEN to get new tokens..."

# Refresh token request
TOKEN_RESPONSE=$(curl --silent --request POST \
  --header 'Content-Type: application/x-www-form-urlencoded' \
  --data-urlencode 'grant_type=refresh_token' \
  --data-urlencode "client_id=${CLIENT_ID}" \
  --data-urlencode "refresh_token=${REFRESH_TOKEN}" \
  'https://fleet-auth.prd.vn.cloud.tesla.com/oauth2/v3/token')

echo "$TOKEN_RESPONSE"  # print the response for reference

# Extract tokens using jq
TP_TOKEN=$(echo "$TOKEN_RESPONSE" | jq -r '.access_token')
NEW_REFRESH_TOKEN=$(echo "$TOKEN_RESPONSE" | jq -r '.refresh_token')
ID_TOKEN=$(echo "$TOKEN_RESPONSE" | jq -r '.id_token')

if [[ -z "$TP_TOKEN" || "$TP_TOKEN" == "null" ]]; then
  echo "❌ No access_token found in response."
  exit 1
fi

if [[ -z "$NEW_REFRESH_TOKEN" || "$NEW_REFRESH_TOKEN" == "null" ]]; then
  echo "❌ No refresh_token found in response."
  exit 1
fi

if [[ -z "$ID_TOKEN" || "$ID_TOKEN" == "null" ]]; then
  echo "❌ No id_token found in response."
  exit 1
fi

# Update or add TP_TOKEN in the env file
if grep -q '^TP_TOKEN=' "$ENV_FILE"; then
  sed -i '' "s|^TP_TOKEN=.*|TP_TOKEN='${TP_TOKEN}'|" "$ENV_FILE"
else
  echo "TP_TOKEN='${TP_TOKEN}'" >> "$ENV_FILE"
fi

# Update or add REFRESH_TOKEN in the env file
if grep -q '^REFRESH_TOKEN=' "$ENV_FILE"; then
  sed -i '' "s|^REFRESH_TOKEN=.*|REFRESH_TOKEN='${NEW_REFRESH_TOKEN}'|" "$ENV_FILE"
else
  echo "REFRESH_TOKEN='${NEW_REFRESH_TOKEN}'" >> "$ENV_FILE"
fi

# Update or add ID_TOKEN in the env file
if grep -q '^ID_TOKEN=' "$ENV_FILE"; then
  sed -i '' "s|^ID_TOKEN=.*|ID_TOKEN='${ID_TOKEN}'|" "$ENV_FILE"
else
  echo "ID_TOKEN='${ID_TOKEN}'" >> "$ENV_FILE"
fi

echo "✅ Tokens updated in $ENV_FILE:"
echo "   TP_TOKEN: ${TP_TOKEN:0:50}..."
echo "   REFRESH_TOKEN: ${NEW_REFRESH_TOKEN}"
echo "   ID_TOKEN: ${ID_TOKEN:0:50}..."
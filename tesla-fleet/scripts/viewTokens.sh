#!/usr/bin/env bash
set -euo pipefail

# Helper script to view tokens from token.env file
TOKEN_ENV_FILE="$HOME/Research 2025/Tesla Fleet API/tesla-fleet/token.env"

if [[ ! -f $TOKEN_ENV_FILE ]]; then
  echo "❌ Token environment file not found: $TOKEN_ENV_FILE" >&2
  exit 1
fi

echo "📋 Current tokens in token.env:"
echo "================================"

# Load and display tokens
source "$TOKEN_ENV_FILE"

echo "TP_TOKEN:"
if [[ -n "${TP_TOKEN:-}" && "${TP_TOKEN}" != "''" ]]; then
  echo "  ${TP_TOKEN:0:50}..."
else
  echo "  (empty)"
fi

echo ""
echo "REFRESH_TOKEN:"
if [[ -n "${REFRESH_TOKEN:-}" && "${REFRESH_TOKEN}" != "''" ]]; then
  echo "  ${REFRESH_TOKEN}"
else
  echo "  (empty)"
fi

echo ""
echo "ID_TOKEN:"
if [[ -n "${ID_TOKEN:-}" && "${ID_TOKEN}" != "''" ]]; then
  echo "  ${ID_TOKEN:0:50}..."
else
  echo "  (empty)"
fi

echo ""
echo "File location: $TOKEN_ENV_FILE" 
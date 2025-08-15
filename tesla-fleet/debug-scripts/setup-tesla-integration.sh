#!/usr/bin/env bash
set -euo pipefail

# Tesla Fleet API Third-Party OAuth Setup Script
# This script helps you set up and test the third-party (ownerapi) OAuth flow

echo "🚗 Tesla Fleet API Third-Party OAuth Setup"
echo "==========================================="

# --- load secrets ---
ENV_FILE="$(dirname "$0")/../fleet.env"
if [[ -f $ENV_FILE ]]; then
  echo "✅ Loading environment variables from: $ENV_FILE"
  set -a
  source "$ENV_FILE"
  set +a
else
  echo "❌ Env file not found: $ENV_FILE" >&2
  exit 1
fi

# Check required variables
if [[ -z "${NGROK_DOMAIN:-}" ]]; then
  echo "❌ NGROK_DOMAIN is not set" >&2
  exit 1
fi

echo "✅ Environment variables loaded successfully"
echo "   NGROK_DOMAIN: $NGROK_DOMAIN"
echo ""

# Step 1: Check if server is running
echo "1️⃣  Checking if server is running..."
if curl -s http://localhost:3000/health > /dev/null 2>&1; then
  echo "✅ Server is running on localhost:3000"
else
  echo "❌ Server is not running. Please start the server first:"
  echo "   cd tesla-fleet && npm start"
  exit 1
fi

# Step 2: Check if ngrok domain is accessible
echo ""
echo "2️⃣  Checking ngrok domain accessibility..."
if curl -s "https://${NGROK_DOMAIN}/health" > /dev/null 2>&1; then
  echo "✅ Ngrok domain is accessible: https://${NGROK_DOMAIN}"
else
  echo "❌ Ngrok domain is not accessible: https://${NGROK_DOMAIN}"
  echo "   Please check if ngrok is running: ngrok http 3000"
  exit 1
fi

# Step 2.5: Check if the Client ID has been imported correctly
echo "2.5️⃣  Checking if the Client ID has been imported correctly..."
echo "   Client ID: $CLIENT_ID"

# Step 3: Remind user to register redirect URI
echo ""
echo "3️⃣  Register your redirect URI in the Tesla developer portal:"
echo "   https://${NGROK_DOMAIN}/extractToken"
echo "   (Go to your Tesla developer portal and add this as an allowed redirect URI)"
echo ""

# Step 4: Generate and display the OAuth URL for third-party flow
echo "4️⃣  Generated OAuth URL (Third-Party):"
RAND_STATE=$(openssl rand -hex 32)
OAUTH_URL="https://fleet-auth.prd.vn.cloud.tesla.com/oauth2/v3/authorize?&client_id=${CLIENT_ID}&locale=en-US&prompt=login&redirect_uri=https%3A%2F%2F${NGROK_DOMAIN}%2FextractToken&response_type=code&scope=openid%20vehicle_device_data%20offline_access%20vehicle_cmds%20vehicle_location%20user_data&state=${RAND_STATE}"
echo "   $OAUTH_URL"
echo ""
echo "   1. Open this URL in your browser"
echo "   2. Log in and consent"
echo "   3. Tesla will redirect to /extractToken with a code parameter"
echo "   4. Your backend will exchange the code for tokens (handled automatically)"
echo ""
echo "🎉 Setup completed for Tesla third-party OAuth!"
echo ""
echo "📋 Next Steps:"
echo "- Use the access token returned from /extractToken to call the Fleet API"
echo "- See README.md for more details"
echo "" 
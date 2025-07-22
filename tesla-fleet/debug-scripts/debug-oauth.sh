#!/usr/bin/env bash
set -euo pipefail

# Tesla OAuth Debug Script
# This script helps diagnose OAuth "unauthorized_client" errors

echo "🔍 Tesla OAuth Debug Script"
echo "============================"

# --- load secrets ---
ENV_FILE="$(dirname "$0")/fleet.env"
if [[ -f $ENV_FILE ]]; then
  echo "✅ Loading environment variables from: $ENV_FILE"
  set -a
  source "$ENV_FILE"
  set +a
else
  echo "❌ Env file not found: $ENV_FILE" >&2
  exit 1
fi

echo ""
echo "📋 Current Configuration:"
echo "   CLIENT_ID: $CLIENT_ID"
echo "   NGROK_DOMAIN: $NGROK_DOMAIN"
echo "   REDIRECT_URI: https://${NGROK_DOMAIN}/extractToken"
echo ""

# Test 1: Check if server is running
echo "1️⃣  Checking server status..."
if curl -s http://localhost:3000/health > /dev/null 2>&1; then
  echo "✅ Server is running on localhost:3000"
else
  echo "❌ Server is not running"
  echo "   Please start the server: cd tesla-fleet && npm start"
  exit 1
fi

# Test 2: Check if ngrok domain is accessible
echo ""
echo "2️⃣  Checking ngrok domain accessibility..."
if curl -s "https://${NGROK_DOMAIN}/health" > /dev/null 2>&1; then
  echo "✅ Ngrok domain is accessible: https://${NGROK_DOMAIN}"
else
  echo "❌ Ngrok domain is not accessible: https://${NGROK_DOMAIN}"
  echo "   Please check if ngrok is running: ngrok http 3000"
  exit 1
fi

# Test 3: Test partner token generation (this should work even if OAuth doesn't)
echo ""
echo "3️⃣  Testing partner token generation..."
TOKEN_RESPONSE=$(curl -s --request POST \
  --header 'Content-Type: application/x-www-form-urlencoded' \
  --data-urlencode 'grant_type=client_credentials' \
  --data-urlencode "client_id=$CLIENT_ID" \
  --data-urlencode "client_secret=$CLIENT_SECRET" \
  --data-urlencode 'scope=openid vehicle_device_data vehicle_cmds vehicle_charging_cmds' \
  --data-urlencode "audience=https://fleet-api.prd.na.vn.cloud.tesla.com" \
  'https://auth.tesla.com/oauth2/v3/token')

if echo "$TOKEN_RESPONSE" | grep -q "access_token"; then
  echo "✅ Partner token generation successful"
  echo "   This confirms your CLIENT_ID and CLIENT_SECRET are valid"
else
  echo "❌ Partner token generation failed"
  echo "   Response: $TOKEN_RESPONSE"
  echo "   This suggests your CLIENT_ID or CLIENT_SECRET may be incorrect"
  exit 1
fi

# Test 4: Generate and display the exact OAuth URL
echo ""
echo "4️⃣  Generated OAuth URL:"
OAUTH_URL="https://auth.tesla.com/oauth2/v3/authorize?response_type=code&client_id=${CLIENT_ID}&redirect_uri=https://${NGROK_DOMAIN}/extractToken&scope=openid%20user_data%20offline_access%20vehicle_device_data%20vehicle_cmds%20vehicle_charging_cmds&state=user_id=test-user-id"
echo "   $OAUTH_URL"
echo ""

# Test 5: Check if extractToken endpoint is accessible
echo "5️⃣  Testing extractToken endpoint accessibility..."
if curl -s "https://${NGROK_DOMAIN}/extractToken" > /dev/null 2>&1; then
  echo "✅ extractToken endpoint is accessible"
else
  echo "❌ extractToken endpoint is not accessible"
  echo "   This could be causing the OAuth redirect to fail"
fi

echo ""
echo "🔧 Troubleshooting Steps:"
echo ""
echo "1. **Check Tesla Developer Portal Configuration:**"
echo "   - Go to: https://developer.tesla.com/"
echo "   - Find your app and check 'Allowed Redirect URIs'"
echo "   - Make sure it includes: https://${NGROK_DOMAIN}/extractToken"
echo "   - The URI must match EXACTLY (including /extractToken)"
echo ""
echo "2. **Verify App Status:**"
echo "   - Check if your app is approved for Fleet API access"
echo "   - Ensure your app is active and not suspended"
echo ""
echo "3. **Check Client ID:**"
echo "   - Verify the CLIENT_ID in fleet.env matches your Tesla developer portal"
echo "   - Make sure you're using the correct app's credentials"
echo ""
echo "4. **Common Issues:**"
echo "   - Missing /extractToken in redirect URI"
echo "   - Wrong ngrok domain in developer portal"
echo "   - App not approved for Fleet API"
echo "   - Using wrong client credentials"
echo ""
echo "5. **Test with Different Redirect URI:**"
echo "   Try adding this to your Tesla developer portal:"
echo "   https://${NGROK_DOMAIN}/extractToken"
echo ""
echo "6. **Alternative Test:**"
echo "   Try the OAuth URL in an incognito/private browser window"
echo "   Sometimes browser cache can cause issues" 
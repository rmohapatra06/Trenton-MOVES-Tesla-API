#!/usr/bin/env node

// Comprehensive OAuth Test Script
require('dotenv').config({ path: '../fleet.env' });

const CLIENT_ID = process.env.CLIENT_ID;
const NGROK_DOMAIN = process.env.NGROK_DOMAIN;

console.log('🔍 Comprehensive OAuth Test');
console.log('============================');
console.log('');

// Test 1: Basic OAuth URL (what you're currently using)
console.log('1️⃣  Current OAuth URL:');
const currentOauthUrl = `https://auth.tesla.com/oauth2/v3/authorize?response_type=code&client_id=${CLIENT_ID}&redirect_uri=https://${NGROK_DOMAIN}/extractToken&scope=openid%20user_data%20offline_access%20vehicle_device_data%20vehicle_cmds%20vehicle_charging_cmds&state=user_id=test-user-id`;
console.log(currentOauthUrl);
console.log('');

// Test 2: Alternative OAuth URL (without state parameter)
console.log('2️⃣  OAuth URL without state parameter:');
const oauthUrlNoState = `https://auth.tesla.com/oauth2/v3/authorize?response_type=code&client_id=${CLIENT_ID}&redirect_uri=https://${NGROK_DOMAIN}/extractToken&scope=openid%20user_data%20offline_access%20vehicle_device_data%20vehicle_cmds%20vehicle_charging_cmds`;
console.log(oauthUrlNoState);
console.log('');

// Test 3: OAuth URL with different scope format
console.log('3️⃣  OAuth URL with different scope format:');
const oauthUrlAltScope = `https://auth.tesla.com/oauth2/v3/authorize?response_type=code&client_id=${CLIENT_ID}&redirect_uri=https://${NGROK_DOMAIN}/extractToken&scope=openid+user_data+offline_access+vehicle_device_data+vehicle_cmds+vehicle_charging_cmds&state=user_id=test-user-id`;
console.log(oauthUrlAltScope);
console.log('');

// Test 4: OAuth URL with minimal scope
console.log('4️⃣  OAuth URL with minimal scope:');
const oauthUrlMinimalScope = `https://auth.tesla.com/oauth2/v3/authorize?response_type=code&client_id=${CLIENT_ID}&redirect_uri=https://${NGROK_DOMAIN}/extractToken&scope=openid%20vehicle_device_data%20vehicle_cmds&state=user_id=test-user-id`;
console.log(oauthUrlMinimalScope);
console.log('');

// Test 5: OAuth URL with different redirect URI format
console.log('5️⃣  OAuth URL with different redirect URI:');
const oauthUrlAltRedirect = `https://auth.tesla.com/oauth2/v3/authorize?response_type=code&client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(`https://${NGROK_DOMAIN}/extractToken`)}&scope=openid%20user_data%20offline_access%20vehicle_device_data%20vehicle_cmds%20vehicle_charging_cmds&state=user_id=test-user-id`;
console.log(oauthUrlAltRedirect);
console.log('');

// Test 6: Check if there are any special characters in the client ID
console.log('6️⃣  Client ID Analysis:');
console.log(`   Raw CLIENT_ID: ${CLIENT_ID}`);
console.log(`   Length: ${CLIENT_ID.length}`);
console.log(`   Contains special chars: ${/[^a-zA-Z0-9-]/.test(CLIENT_ID)}`);
console.log(`   Format check: ${/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(CLIENT_ID) ? 'Valid UUID format' : 'Not UUID format'}`);
console.log('');

// Test 7: Check ngrok domain format
console.log('7️⃣  Ngrok Domain Analysis:');
console.log(`   Raw NGROK_DOMAIN: ${NGROK_DOMAIN}`);
console.log(`   Length: ${NGROK_DOMAIN.length}`);
console.log(`   Contains ngrok-free.app: ${NGROK_DOMAIN.includes('ngrok-free.app')}`);
console.log(`   Starts with https://: ${NGROK_DOMAIN.startsWith('https://')}`);
console.log('');

// Test 8: Alternative OAuth endpoints to try
console.log('8️⃣  Alternative OAuth Endpoints:');
console.log('   Standard: https://auth.tesla.com/oauth2/v3/authorize');
console.log('   Alternative 1: https://auth.tesla.com/oauth2/authorize');
console.log('   Alternative 2: https://auth.tesla.com/oauth2/v2/authorize');
console.log('');

// Test 9: Different response_type values
console.log('9️⃣  Different response_type values to try:');
console.log('   Current: response_type=code');
console.log('   Alternative: response_type=token');
console.log('');

console.log('🔧 Additional Troubleshooting Steps:');
console.log('');
console.log('1. **Try different browsers**: Chrome, Firefox, Safari, Edge');
console.log('2. **Clear browser cache and cookies**');
console.log('3. **Try incognito/private browsing mode**');
console.log('4. **Check if your Tesla account has Fleet API access**');
console.log('5. **Verify your Tesla app is in the correct environment (dev/prod)**');
console.log('6. **Check if there are any IP restrictions on your Tesla app**');
console.log('7. **Try the OAuth URL from a different network/location**');
console.log('8. **Check Tesla developer portal for any error messages or warnings**');
console.log('9. **Verify your Tesla account email matches the one in your developer portal**');
console.log('10. **Try creating a new Tesla app in the developer portal**');
console.log('');
console.log('💡 **Most Likely Issues**:');
console.log('   - Tesla app environment mismatch (dev vs prod)');
console.log('   - IP restrictions on your Tesla app');
console.log('   - Tesla account not approved for Fleet API');
console.log('   - Browser cache/cookie issues');
console.log('   - Network/firewall blocking Tesla OAuth'); 
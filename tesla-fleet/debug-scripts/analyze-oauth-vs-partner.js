#!/usr/bin/env node

// Analyze OAuth vs Partner Token Generation
require('dotenv').config({ path: '../fleet.env' });

const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const NGROK_DOMAIN = process.env.NGROK_DOMAIN;

console.log('🔍 OAuth vs Partner Token Analysis');
console.log('==================================');
console.log('');

console.log('📋 Same CLIENT_ID used in both flows:');
console.log(`   CLIENT_ID: ${CLIENT_ID}`);
console.log('');

console.log('🔄 Partner Token Generation (WORKS):');
console.log('   Endpoint: https://auth.tesla.com/oauth2/v3/token');
console.log('   Method: POST');
console.log('   Grant Type: client_credentials');
console.log('   Audience: https://fleet-api.prd.na.vn.cloud.tesla.com');
console.log('   Scope: openid vehicle_device_data vehicle_cmds vehicle_charging_cmds');
console.log('   No redirect_uri needed');
console.log('');

console.log('❌ OAuth Flow (FAILS):');
console.log('   Endpoint: https://auth.tesla.com/oauth2/v3/authorize');
console.log('   Method: GET');
console.log('   Grant Type: authorization_code');
console.log('   Redirect URI: https://major-charmed-parakeet.ngrok-free.app/extractToken');
console.log('   Scope: openid user_data offline_access vehicle_device_data vehicle_cmds vehicle_charging_cmds');
console.log('');

console.log('🔍 Key Differences:');
console.log('');
console.log('1. **Grant Type**:');
console.log('   - Partner: client_credentials (server-to-server)');
console.log('   - OAuth: authorization_code (user authorization)');
console.log('');

console.log('2. **Scope Differences**:');
console.log('   - Partner: openid vehicle_device_data vehicle_cmds vehicle_charging_cmds');
console.log('   - OAuth: openid user_data offline_access vehicle_device_data vehicle_cmds vehicle_charging_cmds');
console.log('   - OAuth has additional scopes: user_data, offline_access');
console.log('');

console.log('3. **Redirect URI**:');
console.log('   - Partner: Not required');
console.log('   - OAuth: Required and must be pre-registered');
console.log('');

console.log('4. **Authentication Flow**:');
console.log('   - Partner: Direct server authentication');
console.log('   - OAuth: User consent flow');
console.log('');

console.log('💡 **Most Likely Causes**:');
console.log('');
console.log('1. **Missing OAuth Scopes**:');
console.log('   Your Tesla app might not be approved for the additional OAuth scopes:');
console.log('   - user_data');
console.log('   - offline_access');
console.log('   Try removing these scopes from the OAuth URL');
console.log('');

console.log('2. **OAuth vs Partner App Configuration**:');
console.log('   Tesla might have separate configurations for:');
console.log('   - Partner API access (what works)');
console.log('   - OAuth user flows (what fails)');
console.log('');

console.log('3. **App Type Mismatch**:');
console.log('   Your app might be configured for:');
console.log('   - Server-to-server communication (partner tokens)');
console.log('   - But not for user OAuth flows');
console.log('');

console.log('🔧 **Solutions to Try**:');
console.log('');
console.log('1. **Try OAuth with partner scopes only**:');
const oauthPartnerScopes = `https://auth.tesla.com/oauth2/v3/authorize?response_type=code&client_id=${CLIENT_ID}&redirect_uri=https://${NGROK_DOMAIN}/extractToken&scope=openid%20vehicle_device_data%20vehicle_cmds%20vehicle_charging_cmds&state=user_id=test-user-id`;
console.log(`   ${oauthPartnerScopes}`);
console.log('');

console.log('2. **Check Tesla Developer Portal for OAuth settings**:');
console.log('   - Look for "OAuth Configuration" or "User Authorization" settings');
console.log('   - Check if OAuth flows are enabled for your app');
console.log('   - Verify OAuth scopes are approved');
console.log('');

console.log('3. **Contact Tesla Developer Support**:');
console.log('   - Ask about OAuth vs Partner API configuration differences');
console.log('   - Inquire about required app settings for user OAuth flows');
console.log('');

console.log('4. **Alternative: Use Partner Token Only**:');
console.log('   - If OAuth continues to fail, you might be able to use');
console.log('   - Partner tokens for vehicle commands without user OAuth');
console.log('   - This depends on your specific use case'); 
#!/usr/bin/env node

// Test OAuth URL Generation for Tesla Fleet API (official client_id)
require('dotenv').config({ path: '../fleet.env' });

const CLIENT_ID = process.env.CLIENT_ID;
const NGROK_DOMAIN = process.env.NGROK_DOMAIN;

console.log('🔍 OAuth URL Test (Official Tesla Fleet API)');
console.log('=================');
console.log('');
console.log('📋 Configuration:');
console.log(`   CLIENT_ID: ${CLIENT_ID}`);
console.log(`   NGROK_DOMAIN: ${NGROK_DOMAIN}`);
console.log('');

// Generate the exact OAuth URL for official flow
const oauthUrl = `https://auth.tesla.com/oauth2/v3/authorize?client_id=${CLIENT_ID}&redirect_uri=https://${NGROK_DOMAIN}/extractToken&response_type=code&scope=openid%20user_data%20offline_access%20vehicle_device_data%20vehicle_cmds%20vehicle_charging_cmds&state=test`;

console.log('🔗 Generated OAuth URL:');
console.log(oauthUrl);
console.log('');

// Break down the URL components
console.log('📝 URL Components:');
console.log(`   Base URL: https://auth.tesla.com/oauth2/v3/authorize`);
console.log(`   response_type: code`);
console.log(`   client_id: ${CLIENT_ID}`);
console.log(`   redirect_uri: https://${NGROK_DOMAIN}/extractToken`);
console.log(`   scope: openid user_data offline_access vehicle_device_data vehicle_cmds vehicle_charging_cmds`);
console.log(`   state: test`);
console.log('');

console.log('🔧 Troubleshooting Checklist:');
console.log('');
console.log('1. ✅ Register your redirect_uri in the Tesla developer portal');
console.log('2. ✅ Use your official client_id for OAuth');
console.log('3. ✅ Use scopes: openid email offline_access');
console.log('4. ✅ Try the URL in an incognito browser window');
console.log('');
console.log('💡 This is the official Tesla Fleet API OAuth flow.'); 
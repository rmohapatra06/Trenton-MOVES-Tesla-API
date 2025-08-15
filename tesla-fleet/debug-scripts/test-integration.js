#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: '../fleet.env' });

const NGROK_DOMAIN = process.env.NGROK_DOMAIN;
const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const ACCESS_TOKEN = process.env.ACCESS_TOKEN;

console.log('🚗 Tesla Fleet API Integration Test\n');

// Test 1: Check if server is running
console.log('1️⃣  Testing server health...');
try {
  const healthResponse = execSync(`curl -s http://localhost:3000/health`, { encoding: 'utf8' });
  console.log('✅ Server is running:', healthResponse.trim());
} catch (error) {
  console.log('❌ Server is not running. Please start the server first.');
  process.exit(1);
}

// Test 2: Verify key files exist
console.log('\n2️⃣  Verifying key files...');
const privateKeyPath = path.join(__dirname, 'keys', 'private-key.pem');
const publicKeyPath = path.join(__dirname, 'public', '.well-known', 'appspecific', 'com.tesla.3p.public-key.pem');

if (fs.existsSync(privateKeyPath)) {
  console.log('✅ Private key found:', privateKeyPath);
} else {
  console.log('❌ Private key not found:', privateKeyPath);
}

if (fs.existsSync(publicKeyPath)) {
  console.log('✅ Public key found:', publicKeyPath);
} else {
  console.log('❌ Public key not found:', publicKeyPath);
}

// Test 3: Test key verification endpoint
console.log('\n3️⃣  Testing key verification endpoint...');
try {
  const keyVerifyResponse = execSync(`curl -s https://${NGROK_DOMAIN}/user/vehicles/verify-keys`, { encoding: 'utf8' });
  const keyVerifyData = JSON.parse(keyVerifyResponse);
  console.log('✅ Key verification:', keyVerifyData);
} catch (error) {
  console.log('❌ Key verification failed:', error.message);
}

// Test 4: Test user registration (Step 7)
console.log('\n4️⃣  Testing user registration...');
try {
  const registerResponse = execSync(`curl -s -X POST https://${NGROK_DOMAIN}/user/auth/register \
    -H "Content-Type: application/json" \
    -d '{"email": "rishabh.mohapatra@gmail.com", "password": "Tbf14&*7pr!7=^"}'`, { encoding: 'utf8' });
  
  const registerData = JSON.parse(registerResponse);
  console.log('✅ User registered successfully:', registerData);
  
  if (registerData.user_id) {
    console.log(`📝 User ID: ${registerData.user_id}`);
    console.log(`📝 Save this user_id for the next steps!`);
  }
} catch (error) {
  console.log('❌ User registration failed:', error.message);
}

// Test 5: Test OAuth URL generation (Step 9)
console.log('\n5️⃣  Generating OAuth URL...');
if (process.argv.includes('--user-id')) {
  const userId = process.argv[process.argv.indexOf('--user-id') + 1];
  const oauthUrl = `https://auth.tesla.com/oauth2/v3/authorize?response_type=code&client_id=${CLIENT_ID}&redirect_uri=https://${NGROK_DOMAIN}/extractToken&scope=openid%20user_data%20offline_access%20vehicle_device_data%20vehicle_cmds%20vehicle_charging_cmds&state=user_id=${userId}`;
  console.log('🔗 OAuth URL:', oauthUrl);
  console.log('📝 Open this URL in your browser to complete OAuth flow');
} else {
  console.log('⚠️  Run with --user-id <YOUR_USER_ID> to generate OAuth URL');
}

// Test 6: Test vehicle pairing URL (Step 6)
console.log('\n6️⃣  Vehicle pairing URL...');
const pairingUrl = `https://tesla.com/_ak/${NGROK_DOMAIN}`;
console.log('🔗 Vehicle pairing URL:', pairingUrl);
console.log('📝 Open this URL on the same device as your Tesla mobile app');

// Test 7: Test getVehicles endpoint (Step 10)
console.log('\n7️⃣  Testing getVehicles endpoint...');
if (process.argv.includes('--user-id')) {
  const userId = process.argv[process.argv.indexOf('--user-id') + 1];
  try {
    const vehiclesResponse = execSync(`curl -s https://${NGROK_DOMAIN}/user/vehicles/getVehicles/${userId}`, { encoding: 'utf8' });
    const vehiclesData = JSON.parse(vehiclesResponse);
    console.log('✅ Vehicles retrieved:', vehiclesData);
  } catch (error) {
    console.log('❌ Failed to get vehicles:', error.message);
  }
} else {
  console.log('⚠️  Run with --user-id <YOUR_USER_ID> to test getVehicles');
}

// Test 8: Test honk horn endpoint
console.log('\n8️⃣  Testing honk horn endpoint...');
if (process.argv.includes('--user-id') && process.argv.includes('--vin')) {
  const userId = process.argv[process.argv.indexOf('--user-id') + 1];
  const vin = process.argv[process.argv.indexOf('--vin') + 1];
  try {
    const honkResponse = execSync(`curl -s -X POST https://${NGROK_DOMAIN}/user/vehicles/honkHorn \
      -H "Content-Type: application/json" \
      -d '{"user_id": "${userId}", "vin": "${vin}"}'`, { encoding: 'utf8' });
    const honkData = JSON.parse(honkResponse);
    console.log('✅ Honk horn response:', honkData);
  } catch (error) {
    console.log('❌ Failed to honk horn:', error.message);
  }
} else {
  console.log('⚠️  Run with --user-id <YOUR_USER_ID> --vin <YOUR_VIN> to test honk horn');
}

console.log('\n📋 Summary:');
console.log('• Make sure your server is running on localhost:3000');
console.log('• Make sure ngrok is running and pointing to localhost:3000');
console.log('• Verify your key files are in the correct locations');
console.log('• Update your Tesla developer portal with the ngrok domain');
console.log('• Complete the OAuth flow to get user-specific tokens');
console.log('• Pair your vehicle key using the pairing URL');
console.log('• Test vehicle commands with your user_id and VIN');

console.log('\n🔧 Usage examples:');
console.log('node test-integration.js --user-id <YOUR_USER_ID>');
console.log('node test-integration.js --user-id <YOUR_USER_ID> --vin <YOUR_VIN>'); 
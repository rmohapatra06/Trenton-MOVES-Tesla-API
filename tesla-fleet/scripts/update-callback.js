#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Function to extract ONLY the code value from URL
function extractCodeFromUrl(url) {
    try {
        const urlObj = new URL(url);
        const code = urlObj.searchParams.get('code');
        return code;
    } catch (error) {
        console.error('Error parsing URL:', error.message);
        return null;
    }
}

// Function to update fleet.env file
function updateFleetEnv(callbackUrl, code) {
    const envPath = path.join(__dirname, '..', 'fleet.env');
    
    try {
        // Read the current fleet.env file
        let content = fs.readFileSync(envPath, 'utf8');
        
        // Update CALLBACK variable (full URL)
        content = content.replace(
            /^CALLBACK=.*$/m,
            `CALLBACK='${callbackUrl}'`
        );
        
        // Update CODE variable (just the code value)
        content = content.replace(
            /^CODE=.*$/m,
            `CODE='${code}'`
        );
        
        // Write back to file
        fs.writeFileSync(envPath, content);
        
        console.log('✅ Successfully updated fleet.env:');
        console.log(`   CALLBACK: ${callbackUrl}`);
        console.log(`   CODE: ${code}`);
        
    } catch (error) {
        console.error('❌ Error updating fleet.env:', error.message);
        process.exit(1);
    }
}

// Main function for interactive mode
async function main() {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });
    
    console.log('🔄 Tesla Fleet API - Callback URL Updater');
    console.log('==========================================\n');
    console.log('This script will:');
    console.log('1. Extract the code parameter from your redirect URI');
    console.log('2. Update CALLBACK with the full redirect URI');
    console.log('3. Update CODE with just the extracted code value\n');
    
    // Get redirect URI from user
    const redirectUri = await new Promise((resolve) => {
        rl.question('Enter the redirect URI: ', (answer) => {
            resolve(answer.trim());
        });
    });
    
    if (!redirectUri) {
        console.error('❌ No redirect URI provided');
        rl.close();
        process.exit(1);
    }
    
    // Extract code from the URI
    const code = extractCodeFromUrl(redirectUri);
    
    if (!code) {
        console.error('❌ Could not extract code from the provided URI');
        console.log('Make sure the URI contains a "code" parameter');
        rl.close();
        process.exit(1);
    }
    
    console.log(`\n📋 Extracted information:`);
    console.log(`   Full Redirect URI: ${redirectUri}`);
    console.log(`   Extracted Code: ${code}\n`);
    
    // Confirm with user
    const confirm = await new Promise((resolve) => {
        rl.question('Do you want to update fleet.env with these values? (y/N): ', (answer) => {
            resolve(answer.toLowerCase().trim());
        });
    });
    
    if (confirm === 'y' || confirm === 'yes') {
        updateFleetEnv(redirectUri, code);
    } else {
        console.log('❌ Update cancelled');
    }
    
    rl.close();
}

// Handle command line arguments
if (process.argv.length > 2) {
    const redirectUri = process.argv[2];
    const code = extractCodeFromUrl(redirectUri);
    
    if (!code) {
        console.error('❌ Could not extract code from the provided URI');
        console.log('Usage: node update-callback.js <redirect_uri>');
        console.log('Example: node update-callback.js "https://example.com/callback?code=ABC123&state=xyz"');
        process.exit(1);
    }
    
    console.log('🔄 Tesla Fleet API - Callback URL Updater');
    console.log('==========================================\n');
    console.log(`📋 Extracted information:`);
    console.log(`   Full Redirect URI: ${redirectUri}`);
    console.log(`   Extracted Code: ${code}\n`);
    
    updateFleetEnv(redirectUri, code);
} else {
    // Interactive mode
    main().catch(console.error);
} 
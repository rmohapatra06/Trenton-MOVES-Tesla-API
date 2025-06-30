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

// Function to update only CODE in fleet.env file
function updateCodeInFleetEnv(code) {
    const envPath = path.join(__dirname, '..', 'fleet.env');
    
    try {
        // Read the current fleet.env file
        let content = fs.readFileSync(envPath, 'utf8');
        
        // Update only CODE variable
        content = content.replace(
            /^CODE=.*$/m,
            `CODE='${code}'`
        );
        
        // Write back to file
        fs.writeFileSync(envPath, content);
        
        console.log('✅ Successfully updated CODE in fleet.env:');
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
    
    console.log('🔄 Tesla Fleet API - Code Updater');
    console.log('==================================\n');
    console.log('This script will update ONLY the CODE variable in fleet.env\n');
    
    // Get input from user
    const userInput = await new Promise((resolve) => {
        rl.question('Enter the redirect URI or just the code value: ', (answer) => {
            resolve(answer.trim());
        });
    });
    
    if (!userInput) {
        console.error('❌ No input provided');
        rl.close();
        process.exit(1);
    }
    
    let code;
    
    // Check if input looks like a URL
    if (userInput.includes('http') || userInput.includes('?')) {
        // Extract code from URL
        code = extractCodeFromUrl(userInput);
        
        if (!code) {
            console.error('❌ Could not extract code from the provided URI');
            console.log('Make sure the URI contains a "code" parameter');
            rl.close();
            process.exit(1);
        }
        
        console.log(`\n📋 Extracted code from URL: ${code}`);
    } else {
        // Treat as direct code value
        code = userInput;
        console.log(`\n📋 Using provided code: ${code}`);
    }
    
    // Confirm with user
    const confirm = await new Promise((resolve) => {
        rl.question(`\nDo you want to update CODE in fleet.env with "${code}"? (y/N): `, (answer) => {
            resolve(answer.toLowerCase().trim());
        });
    });
    
    if (confirm === 'y' || confirm === 'yes') {
        updateCodeInFleetEnv(code);
    } else {
        console.log('❌ Update cancelled');
    }
    
    rl.close();
}

// Handle command line arguments
if (process.argv.length > 2) {
    const input = process.argv[2];
    let code;
    
    // Check if input looks like a URL
    if (input.includes('http') || input.includes('?')) {
        code = extractCodeFromUrl(input);
        
        if (!code) {
            console.error('❌ Could not extract code from the provided URI');
            console.log('Usage: node update-code.js <redirect_uri_or_code>');
            console.log('Example: node update-code.js "https://example.com/callback?code=ABC123&state=xyz"');
            console.log('Example: node update-code.js "ABC123"');
            process.exit(1);
        }
        
        console.log('🔄 Tesla Fleet API - Code Updater');
        console.log('==================================\n');
        console.log(`📋 Extracted code from URL: ${code}\n`);
    } else {
        // Treat as direct code value
        code = input;
        console.log('🔄 Tesla Fleet API - Code Updater');
        console.log('==================================\n');
        console.log(`📋 Using provided code: ${code}\n`);
    }
    
    updateCodeInFleetEnv(code);
} else {
    // Interactive mode
    main().catch(console.error);
} 
#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Function to extract tokens from JSON string
function extractTokensFromJson(jsonString) {
    try {
        // Clean the JSON string (remove trailing % and any extra characters)
        const cleanJson = jsonString.replace(/%$/, '').trim();
        const tokens = JSON.parse(cleanJson);
        
        return {
            tp_token: tokens.access_token,
            refresh_token: tokens.refresh_token,
            id_token: tokens.id_token
        };
    } catch (error) {
        console.error('Error parsing JSON:', error.message);
        return null;
    }
}

// Function to update tokens in fleet.env file
function updateTokensInFleetEnv(tpToken, refreshToken, idToken) {
    const envPath = path.join(__dirname, '..', 'fleet.env');
    
    try {
        // Read the current fleet.env file
        let content = fs.readFileSync(envPath, 'utf8');
        
        // Update TP_TOKEN variable
        if (tpToken) {
            content = content.replace(
                /^TP_TOKEN=.*$/m,
                `TP_TOKEN='${tpToken}'`
            );
        }
        
        // Update REFRESH_TOKEN variable (add if doesn't exist)
        if (refreshToken) {
            if (content.includes('REFRESH_TOKEN=')) {
                content = content.replace(
                    /^REFRESH_TOKEN=.*$/m,
                    `REFRESH_TOKEN='${refreshToken}'`
                );
            } else {
                // Add REFRESH_TOKEN after TP_TOKEN
                content = content.replace(
                    /^(TP_TOKEN=.*)$/m,
                    `$1\nREFRESH_TOKEN='${refreshToken}'`
                );
            }
        }
        
        // Update ID_TOKEN variable (add if doesn't exist)
        if (idToken) {
            if (content.includes('ID_TOKEN=')) {
                content = content.replace(
                    /^ID_TOKEN=.*$/m,
                    `ID_TOKEN='${idToken}'`
                );
            } else {
                // Add ID_TOKEN after REFRESH_TOKEN or ACCESS_TOKEN
                if (content.includes('REFRESH_TOKEN=')) {
                    content = content.replace(
                        /^(REFRESH_TOKEN=.*)$/m,
                        `$1\nID_TOKEN='${idToken}'`
                    );
                } else {
                    content = content.replace(
                        /^(TP_TOKEN=.*)$/m,
                        `$1\nID_TOKEN='${idToken}'`
                    );
                }
            }
        }
        
        // Write back to file
        fs.writeFileSync(envPath, content);
        
        console.log('✅ Successfully updated tokens in fleet.env:');
        if (tpToken) console.log(`   TP_TOKEN: ${tpToken.substring(0, 50)}...`);
        if (refreshToken) console.log(`   REFRESH_TOKEN: ${refreshToken}`);
        if (idToken) console.log(`   ID_TOKEN: ${idToken.substring(0, 50)}...`);
        
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
    
    console.log('🔄 Tesla Fleet API - Token Updater');
    console.log('==================================\n');
    console.log('This script will extract tokens from JSON output and update fleet.env\n');
    
    // Get JSON input from user
    const jsonInput = await new Promise((resolve) => {
        rl.question('Paste the JSON output containing tokens: ', (answer) => {
            resolve(answer.trim());
        });
    });
    
    if (!jsonInput) {
        console.error('❌ No JSON input provided');
        rl.close();
        process.exit(1);
    }
    
    // Extract tokens from JSON
    const tokens = extractTokensFromJson(jsonInput);
    
    if (!tokens) {
        console.error('❌ Could not extract tokens from the provided JSON');
        rl.close();
        process.exit(1);
    }
    
    console.log(`\n📋 Extracted tokens:`);
    if (tokens.tp_token) console.log(`   TP Token: ${tokens.tp_token.substring(0, 50)}...`);
    if (tokens.refresh_token) console.log(`   Refresh Token: ${tokens.refresh_token}`);
    if (tokens.id_token) console.log(`   ID Token: ${tokens.id_token.substring(0, 50)}...`);
    
    // Confirm with user
    const confirm = await new Promise((resolve) => {
        rl.question(`\nDo you want to update fleet.env with these tokens? (y/N): `, (answer) => {
            resolve(answer.toLowerCase().trim());
        });
    });
    
    if (confirm === 'y' || confirm === 'yes') {
        updateTokensInFleetEnv(tokens.tp_token, tokens.refresh_token, tokens.id_token);
    } else {
        console.log('❌ Update cancelled');
    }
    
    rl.close();
}

// Handle command line arguments
if (process.argv.length > 2) {
    const jsonInput = process.argv[2];
    const tokens = extractTokensFromJson(jsonInput);
    
    if (!tokens) {
        console.error('❌ Could not extract tokens from the provided JSON');
        console.log('Usage: node update-tokens.js <json_string>');
        console.log('Example: node update-tokens.js \'{"access_token":"...","refresh_token":"..."}\'');
        process.exit(1);
    }
    
    console.log('🔄 Tesla Fleet API - Token Updater');
    console.log('==================================\n');
    console.log(`📋 Extracted tokens:`);
    if (tokens.tp_token) console.log(`   TP Token: ${tokens.tp_token.substring(0, 50)}...`);
    if (tokens.refresh_token) console.log(`   Refresh Token: ${tokens.refresh_token}`);
    if (tokens.id_token) console.log(`   ID Token: ${tokens.id_token.substring(0, 50)}...\n`);
    
    updateTokensInFleetEnv(tokens.tp_token, tokens.refresh_token, tokens.id_token);
} else {
    // Interactive mode
    main().catch(console.error);
} 
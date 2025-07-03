#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Load environment variables from fleet.env
function loadEnvVars() {
    const envPath = path.join(__dirname, '..', 'fleet.env');
    try {
        const envContent = fs.readFileSync(envPath, 'utf8');
        const envVars = {};
        
        envContent.split('\n').forEach(line => {
            // Skip comments and empty lines
            if (line.startsWith('#') || !line.trim()) return;
            
            // Extract key and value, handling quotes
            const match = line.match(/^([^=]+)=(?:'([^']*)'|"([^"]*)"|(.*))/);
            if (match) {
                const key = match[1].trim();
                // Use the first non-undefined value from the captured groups
                const value = match[2] || match[3] || match[4] || '';
                envVars[key] = value;
            }
        });
        
        return envVars;
    } catch (error) {
        console.error('❌ Error loading environment variables:', error.message);
        process.exit(1);
    }
}

async function sendNavigationRequest(destination) {
    const env = loadEnvVars();
    
    if (!env.TP_TOKEN) {
        console.error('❌ TP_TOKEN not found in environment variables');
        process.exit(1);
    }
    
    if (!env.TESLA_VEHICLE_ID) {
        console.error('❌ TESLA_VEHICLE_ID not found in environment variables');
        process.exit(1);
    }
    
    // Use Google Maps link for autocomplete/typed destinations
    const GOOGLE_LINK = `https://maps.google.com/?q=${encodeURIComponent(destination)}`;
    
    console.log('🚗 Sending navigation request to Tesla API...');
    console.log(`📍 Destination: ${destination}`);
    
    try {
        const response = await fetch(
            `https://fleet-api.prd.na.vn.cloud.tesla.com/api/1/vehicles/${env.TESLA_VEHICLE_ID}/command/navigation_request`,
            {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${env.TP_TOKEN}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    locale: 'en-US',
                    timestamp_ms: Date.now(),
                    type: 'share_ext_content_raw',
                    value: { 'android.intent.extra.TEXT': GOOGLE_LINK },
                }),
            }
        );
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(`API request failed: ${data.error || response.statusText}`);
        }
        
        console.log('✅ Navigation request sent successfully!');
        console.log('Response:', JSON.stringify(data, null, 2));
        return data;
        
    } catch (error) {
        console.error('❌ Error sending navigation request:', error.message);
        process.exit(1);
    }
}

// Main function to handle interactive input
async function main() {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });
    
    console.log('🗺️  Tesla Navigation Request');
    console.log('==========================\n');
    
    const destination = await new Promise((resolve) => {
        rl.question('Enter destination: ', (answer) => {
            resolve(answer.trim());
        });
    });
    
    if (!destination) {
        console.error('❌ No destination provided');
        rl.close();
        process.exit(1);
    }
    
    await sendNavigationRequest(destination);
    rl.close();
}

// Handle command line arguments or run interactive mode
if (process.argv.length > 2) {
    const destination = process.argv[2];
    sendNavigationRequest(destination).catch(console.error);
} else {
    main().catch(console.error);
}
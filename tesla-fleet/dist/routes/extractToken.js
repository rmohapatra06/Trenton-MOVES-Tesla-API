"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const node_fetch_1 = __importDefault(require("node-fetch")); // or axios
const dotenv_1 = require("dotenv");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const db_1 = require("../db");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken")); // to decode sub from idToken
const proxy_1 = require("../proxy");
// Load environment variables from fleet.env
(0, dotenv_1.config)({ path: path_1.default.join(__dirname, '../../fleet.env') });
const router = (0, express_1.Router)();
// helper
function upsertTokenRow(vin_1, vehicleId_1, _a) {
    return __awaiter(this, arguments, void 0, function* (vin, vehicleId, { userIdSub, tpToken, refreshToken, idToken, expiresIn }) {
        yield db_1.VehicleToken.upsert({
            userId: userIdSub,
            vin,
            vehicleId,
            idToken,
            accessToken: tpToken,
            refreshToken,
            expiresAt: new Date(Date.now() + expiresIn * 1000),
        });
    });
}
// Helper function to update token environment file
const updateTokenEnvFile = (tokens) => __awaiter(void 0, void 0, void 0, function* () {
    const tokenEnvFilePath = path_1.default.join(__dirname, '../../fleet.env');
    if (!fs_1.default.existsSync(tokenEnvFilePath)) {
        throw new Error(`Token environment file not found: ${tokenEnvFilePath}`);
    }
    let envContent = fs_1.default.readFileSync(tokenEnvFilePath, 'utf8');
    // Update TP_TOKEN if provided
    if (tokens.tpToken) {
        const tpTokenRegex = /^TP_TOKEN=.*/m;
        if (tpTokenRegex.test(envContent)) {
            envContent = envContent.replace(tpTokenRegex, `TP_TOKEN='${tokens.tpToken}'`);
        }
        else {
            envContent += `\nTP_TOKEN='${tokens.tpToken}'`;
        }
    }
    // Update REFRESH_TOKEN if provided
    if (tokens.refreshToken) {
        const refreshTokenRegex = /^REFRESH_TOKEN=.*/m;
        if (refreshTokenRegex.test(envContent)) {
            envContent = envContent.replace(refreshTokenRegex, `REFRESH_TOKEN='${tokens.refreshToken}'`);
        }
        else {
            envContent += `\nREFRESH_TOKEN='${tokens.refreshToken}'`;
        }
    }
    // Update ID_TOKEN if provided
    if (tokens.idToken) {
        const idTokenRegex = /^ID_TOKEN=.*/m;
        if (idTokenRegex.test(envContent)) {
            envContent = envContent.replace(idTokenRegex, `ID_TOKEN='${tokens.idToken}'`);
        }
        else {
            envContent += `\nID_TOKEN='${tokens.idToken}'`;
        }
    }
    fs_1.default.writeFileSync(tokenEnvFilePath, envContent);
});
// Enhanced extractToken endpoint with authCodeTokenReq functionality
router.get('/extractToken', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    console.log(`🌐 Received ${req.method} request to ${req.path}`);
    console.log(`📝 Query params:`, req.query);
    const code = req.query.code;
    if (!code) {
        console.log('❌ No code parameter found in request');
        res.status(400).json({
            error: 'Missing code parameter',
            message: 'Authorization code is required for token exchange',
            receivedParams: Object.keys(req.query),
            fullUrl: req.url
        });
        return;
    }
    try {
        console.log(`🔄 Processing token exchange for code: ${code.substring(0, 20)}...`);
        const formData = new URLSearchParams();
        formData.append('grant_type', 'authorization_code');
        formData.append('client_id', process.env.CLIENT_ID);
        formData.append('client_secret', process.env.CLIENT_SECRET);
        formData.append('code', code);
        formData.append('redirect_uri', process.env.CALLBACK);
        console.log(`🔗 Making request to: https://fleet-auth.prd.vn.cloud.tesla.com/oauth2/v3/token`);
        console.log(`📋 Request parameters:`, {
            grant_type: 'authorization_code',
            client_id: process.env.CLIENT_ID,
            code: code.substring(0, 20) + '...',
            redirect_uri: process.env.CALLBACK
        });
        const response = yield (0, node_fetch_1.default)('https://fleet-auth.prd.vn.cloud.tesla.com/oauth2/v3/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: formData.toString()
        });
        if (!response.ok) {
            const errorText = yield response.text();
            console.log(`❌ Tesla API Error Response: ${errorText}`);
            throw new Error(`Token exchange failed: ${response.status} ${response.statusText} - ${errorText}`);
        }
        const tokenResponse = yield response.json();
        console.log('🎯 Token exchange successful');
        // Extract tokens
        const tpToken = tokenResponse.access_token;
        const refreshToken = tokenResponse.refresh_token;
        const idToken = tokenResponse.id_token;
        // Validate required tokens
        if (!tpToken || !refreshToken || !idToken) {
            throw new Error('Missing required tokens in response');
        }
        // Extract user ID from idToken
        const { sub } = jsonwebtoken_1.default.decode(idToken);
        // Get vehicles list using the access token
        const vehicleResponse = yield (0, node_fetch_1.default)('https://fleet-api.prd.vn.cloud.tesla.com/api/1/vehicles', {
            headers: { 'Authorization': `Bearer ${tpToken}` }
        });
        if (!vehicleResponse.ok) {
            throw new Error('Failed to fetch vehicles');
        }
        const vehicles = (yield vehicleResponse.json()).response;
        // Store tokens for each vehicle in database
        for (const v of vehicles) {
            proxy_1.cache.ensureVehicle(v.id_s, v.vin);
            yield upsertTokenRow(v.vin, v.id_s, {
                userIdSub: sub,
                tpToken,
                refreshToken,
                idToken,
                expiresIn: tokenResponse.expires_in
            });
        }
        /* Commented out environment file update for fallback
        try {
          await updateTokenEnvFile({ tpToken, refreshToken, idToken });
          console.log('✅ Token environment file updated with new tokens');
        } catch (envError) {
          console.error('⚠️ Failed to update token environment file:', envError);
        }
        */
        res.json({
            success: true,
            message: 'Token exchange and storage completed successfully',
            tokens: {
                access_token: tpToken,
                refresh_token: refreshToken,
                id_token: idToken,
                token_type: tokenResponse.token_type,
                expires_in: tokenResponse.expires_in
            },
            vehicles: vehicles.map(v => ({ vin: v.vin, id: v.id_s }))
        });
    }
    catch (err) {
        console.error('❌ Error:', err);
        res.status(500).json({
            error: 'Operation failed',
            message: err instanceof Error ? err.message : 'Unknown error occurred'
        });
    }
}));
// POST handler with same logic
router.post('/extractToken', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const code = (req.query.code || req.body.code);
    // Set the code in query params for consistent handling
    req.query.code = code;
    // Remove code from body to avoid confusion
    if (req.body && 'code' in req.body) {
        delete req.body.code;
    }
    // Handle the request using the same logic
    yield new Promise((resolve) => {
        router.get('/extractToken')(req, res, () => resolve());
    });
}));
exports.default = router;

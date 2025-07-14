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
const crypto_1 = __importDefault(require("crypto"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
// Load environment variables from fleet.env
(0, dotenv_1.config)({ path: path_1.default.join(__dirname, '../../fleet.env') });
const router = (0, express_1.Router)();
// In-memory storage for users (in production, use a proper database)
const users = new Map();
// In-memory token storage (replace with database later)
const tokenStorage = new Map();
// Helper function to generate user ID
const generateUserId = () => {
    return crypto_1.default.randomUUID();
};
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
// Helper function to store tokens (database preparation)
const storeTokens = (userId, tokens) => {
    const key = userId || 'default';
    tokenStorage.set(key, tokens);
    console.log(`✅ Tokens stored for user: ${key}`);
};
// Step 7: Create a token manager account
router.post('/user/auth/register', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            res.status(400).json({ error: 'Email and password are required' });
            return;
        }
        // Check if user already exists
        if (users.has(email)) {
            res.status(409).json({ error: 'User already exists' });
            return;
        }
        // Create new user
        const userId = generateUserId();
        users.set(email, {
            id: userId,
            email,
            password // In production, hash this password!
        });
        console.log(`✅ User registered: ${email} with ID: ${userId}`);
        res.status(201).json({
            message: 'User registered successfully',
            user_id: userId,
            email: email
        });
    }
    catch (err) {
        console.error('Error registering user:', err);
        res.status(500).json({ error: 'Registration failed' });
    }
}));
// Enhanced extractToken endpoint with authCodeTokenReq functionality
router.get('/extractToken', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    console.log(`🌐 Received ${req.method} request to ${req.path}`);
    console.log(`📝 Query params:`, req.query);
    console.log(`📝 Body:`, req.body);
    const code = req.query.code;
    const userId = req.query.userId; // Optional user ID for database functionality
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
        // Prepare token exchange request (matching exact curl format with data-urlencode)
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
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
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
        if (!tpToken) {
            throw new Error('No access_token found in response');
        }
        if (!refreshToken) {
            throw new Error('No refresh_token found in response');
        }
        // Prepare token data for storage
        const tokenData = {
            userId,
            tpToken,
            refreshToken,
            idToken,
            updatedAt: new Date()
        };
        // Store tokens in memory (database preparation)
        storeTokens(userId, tokenData);
        // Update token environment file (safe testing)
        try {
            yield updateTokenEnvFile({
                tpToken,
                refreshToken,
                idToken
            });
            console.log('✅ Token environment file updated with new tokens');
            console.log(`   TP_TOKEN: ${tpToken.substring(0, 50)}...`);
            console.log(`   REFRESH_TOKEN: ${refreshToken}`);
            console.log(`   ID_TOKEN: ${idToken ? idToken.substring(0, 50) + '...' : 'N/A'}`);
        }
        catch (envError) {
            console.error('⚠️ Failed to update token environment file:', envError);
            // Continue processing even if env update fails
        }
        // Prepare response
        const responseData = {
            success: true,
            message: 'Token exchange completed successfully',
            tokens: {
                access_token: tpToken,
                refresh_token: refreshToken,
                id_token: idToken,
                token_type: tokenResponse.token_type,
                expires_in: tokenResponse.expires_in
            },
            storage: {
                tokenEnvFile: 'updated',
                inMemoryStorage: 'updated'
            },
            userId,
            updatedAt: tokenData.updatedAt
        };
        res.json(responseData);
    }
    catch (err) {
        console.error('❌ Error exchanging code for tokens:', err);
        res.status(500).json({
            error: 'Token exchange failed',
            message: err instanceof Error ? err.message : 'Unknown error occurred'
        });
    }
}));
// Also handle POST requests for extractToken (in case that's needed)
router.post('/extractToken', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    console.log(`🌐 Received ${req.method} request to ${req.path}`);
    console.log(`📝 Query params:`, req.query);
    console.log(`📝 Body:`, req.body);
    // For POST, code might be in body or query
    const code = (req.query.code || req.body.code);
    const userId = (req.query.userId || req.body.userId);
    if (!code) {
        console.log('❌ No code parameter found in request');
        res.status(400).json({
            error: 'Missing code parameter',
            message: 'Authorization code is required for token exchange',
            receivedParams: {
                queryKeys: Object.keys(req.query),
                bodyKeys: Object.keys(req.body || {})
            },
            fullUrl: req.url
        });
        return;
    }
    try {
        console.log(`🔄 Processing token exchange for code: ${code.substring(0, 20)}...`);
        // Prepare token exchange request (matching exact curl format with data-urlencode)
        const formData = new URLSearchParams();
        formData.append('grant_type', 'authorization_code');
        formData.append('client_id', process.env.CLIENT_ID);
        formData.append('client_secret', process.env.CLIENT_SECRET);
        formData.append('code', code);
        formData.append('audience', process.env.AUDIENCE);
        formData.append('redirect_uri', process.env.CALLBACK);
        console.log(`🔗 Making request to: https://fleet-auth.prd.vn.cloud.tesla.com/oauth2/v3/token`);
        console.log(`📋 Request parameters:`, {
            grant_type: 'authorization_code',
            client_id: process.env.CLIENT_ID,
            code: code.substring(0, 20) + '...',
            audience: process.env.AUDIENCE,
            redirect_uri: process.env.CALLBACK
        });
        const response = yield (0, node_fetch_1.default)('https://fleet-auth.prd.vn.cloud.tesla.com/oauth2/v3/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
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
        if (!tpToken) {
            throw new Error('No access_token found in response');
        }
        if (!refreshToken) {
            throw new Error('No refresh_token found in response');
        }
        // Prepare token data for storage
        const tokenData = {
            userId,
            tpToken,
            refreshToken,
            idToken,
            updatedAt: new Date()
        };
        // Store tokens in memory (database preparation)
        storeTokens(userId, tokenData);
        // Update token environment file (safe testing)
        try {
            yield updateTokenEnvFile({
                tpToken,
                refreshToken,
                idToken
            });
            console.log('✅ Token environment file updated with new tokens');
            console.log(`   TP_TOKEN: ${tpToken.substring(0, 50)}...`);
            console.log(`   REFRESH_TOKEN: ${refreshToken}`);
            console.log(`   ID_TOKEN: ${idToken ? idToken.substring(0, 50) + '...' : 'N/A'}`);
        }
        catch (envError) {
            console.error('⚠️ Failed to update token environment file:', envError);
            // Continue processing even if env update fails
        }
        // Prepare response
        const responseData = {
            success: true,
            message: 'Token exchange completed successfully',
            tokens: {
                access_token: tpToken,
                refresh_token: refreshToken,
                id_token: idToken,
                token_type: tokenResponse.token_type,
                expires_in: tokenResponse.expires_in
            },
            storage: {
                tokenEnvFile: 'updated',
                inMemoryStorage: 'updated'
            },
            userId,
            updatedAt: tokenData.updatedAt
        };
        res.json(responseData);
    }
    catch (err) {
        console.error('❌ Error exchanging code for tokens:', err);
        res.status(500).json({
            error: 'Token exchange failed',
            message: err instanceof Error ? err.message : 'Unknown error occurred'
        });
    }
}));
// New endpoint to get stored tokens for a user (database preparation)
router.get('/tokens/:userId', (req, res) => {
    const { userId } = req.params;
    const tokenData = tokenStorage.get(userId);
    if (!tokenData) {
        res.status(404).json({ error: 'No tokens found for this user' });
        return;
    }
    res.json({
        userId,
        hasTokens: true,
        updatedAt: tokenData.updatedAt,
        // Don't expose actual token values for security
        tokenInfo: {
            hasTpToken: !!tokenData.tpToken,
            hasRefreshToken: !!tokenData.refreshToken,
            hasIdToken: !!tokenData.idToken
        }
    });
});
// Helper endpoint to get user by ID
router.get('/user/:userId', (req, res) => {
    const { userId } = req.params;
    for (const [email, user] of users.entries()) {
        if (user.id === userId) {
            res.json({ user_id: user.id, email: user.email });
            return;
        }
    }
    res.status(404).json({ error: 'User not found' });
});
exports.default = router;

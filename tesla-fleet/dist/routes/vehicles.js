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
const node_fetch_1 = __importDefault(require("node-fetch"));
const dotenv_1 = require("dotenv");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const crypto_1 = __importDefault(require("crypto"));
(0, dotenv_1.config)();
const router = (0, express_1.Router)();
// Load private key for signing vehicle commands
const loadPrivateKey = () => {
    try {
        const privateKeyPath = path_1.default.join(__dirname, '..', '..', 'keys', 'private-key.pem');
        return fs_1.default.readFileSync(privateKeyPath, 'utf8');
    }
    catch (error) {
        console.error('Error loading private key:', error);
        throw new Error('Private key not found or unreadable');
    }
};
// Load public key for verification
const loadPublicKey = () => {
    try {
        const publicKeyPath = path_1.default.join(__dirname, '..', '..', 'public', '.well-known', 'appspecific', 'com.tesla.3p.public-key.pem');
        return fs_1.default.readFileSync(publicKeyPath, 'utf8');
    }
    catch (error) {
        console.error('Error loading public key:', error);
        throw new Error('Public key not found or unreadable');
    }
};
// Sign data with EC private key
const signWithECKey = (data, privateKey) => {
    try {
        // Create a sign object with EC key
        const sign = crypto_1.default.createSign('SHA256');
        sign.update(data);
        const signature = sign.sign(privateKey, 'base64');
        return signature;
    }
    catch (error) {
        console.error('Error signing data:', error);
        throw new Error('Failed to sign data with EC key');
    }
};
// Get vehicles for a specific user
router.get('/user/vehicles/getVehicles/:userId', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { userId } = req.params;
        // TODO: Get access token for this user from storage
        const accessToken = process.env.ACCESS_TOKEN; // For now, use the partner token
        if (!accessToken) {
            res.status(401).json({ error: 'No access token available' });
            return;
        }
        const response = yield (0, node_fetch_1.default)('https://fleet-api.prd.na.vn.cloud.tesla.com/api/1/vehicles', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            }
        });
        if (!response.ok) {
            console.error('Tesla API error:', response.status, response.statusText);
            res.status(response.status).json({ error: 'Failed to fetch vehicles from Tesla API' });
            return;
        }
        const vehicles = yield response.json();
        console.log(`✅ Retrieved vehicles for user ${userId}:`, vehicles);
        res.json({
            user_id: userId,
            vehicles: vehicles
        });
    }
    catch (err) {
        console.error('Error fetching vehicles:', err);
        res.status(500).json({ error: 'Failed to fetch vehicles' });
    }
}));
// Honk horn endpoint
router.post('/user/vehicles/honkHorn', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // TODO: Get user_id and VIN from request body or query params
        // For now, these would need to be set explicitly as mentioned in the docs
        const userId = req.body.user_id || req.query.user_id;
        const vin = req.body.vin || req.query.vin;
        if (!userId || !vin) {
            res.status(400).json({
                error: 'user_id and vin are required. Set these explicitly in the code temporarily.'
            });
            return;
        }
        // TODO: Get access token for this user from storage
        const accessToken = process.env.ACCESS_TOKEN; // For now, use the partner token
        if (!accessToken) {
            res.status(401).json({ error: 'No access token available' });
            return;
        }
        // Load private key for signing the command
        const privateKey = loadPrivateKey();
        // Create a signature for the command (Tesla may require this for vehicle commands)
        const commandData = JSON.stringify({
            command: 'honk_horn',
            vin: vin,
            timestamp: Date.now()
        });
        const signature = signWithECKey(commandData, privateKey);
        const response = yield (0, node_fetch_1.default)(`https://fleet-api.prd.na.vn.cloud.tesla.com/api/1/vehicles/${vin}/command/honk_horn`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
                'X-Signature': signature
            },
            body: commandData
        });
        if (!response.ok) {
            console.error('Tesla API error:', response.status, response.statusText);
            res.status(response.status).json({ error: 'Failed to honk horn via Tesla API' });
            return;
        }
        const result = yield response.json();
        console.log(`✅ Honked horn for vehicle ${vin} (user: ${userId}):`, result);
        res.json({
            user_id: userId,
            vin: vin,
            result: result,
            signature: signature
        });
    }
    catch (err) {
        console.error('Error honking horn:', err);
        res.status(500).json({ error: 'Failed to honk horn' });
    }
}));
// Endpoint to verify public key is accessible
router.get('/user/vehicles/verify-keys', (req, res) => {
    try {
        const privateKey = loadPrivateKey();
        const publicKey = loadPublicKey();
        // Test signing with the private key
        const testData = 'test-signature-data';
        const testSignature = signWithECKey(testData, privateKey);
        res.json({
            status: 'success',
            message: 'Keys loaded and signing works successfully',
            private_key_length: privateKey.length,
            public_key_length: publicKey.length,
            public_key_available: true,
            signing_works: true,
            test_signature: testSignature
        });
    }
    catch (error) {
        res.status(500).json({
            status: 'error',
            message: 'Failed to load keys or sign data',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
exports.default = router;

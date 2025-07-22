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
const dotenv_1 = require("dotenv");
const node_fetch_1 = __importDefault(require("node-fetch"));
const proxy_1 = require("../proxy");
const db_1 = require("../db");
(0, dotenv_1.config)();
const router = (0, express_1.Router)();
// Get vehicles for a specific user
router.get('/user/vehicles/getVehicles/:userId', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { userId } = req.params;
        // Get access token from database
        const vehicleToken = yield db_1.VehicleToken.findOne({ where: { userId } });
        if (!vehicleToken) {
            res.status(401).json({ error: 'No access token found for user' });
            return;
        }
        const accessToken = vehicleToken.get('accessToken');
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
        const userId = req.body.user_id || req.query.user_id;
        const vin = req.body.vin || req.query.vin;
        if (!userId || !vin) {
            res.status(400).json({ error: 'user_id and vin are required' });
            return;
        }
        // Get access token from database
        const vehicleToken = yield db_1.VehicleToken.findOne({
            where: { userId, vin }
        });
        if (!vehicleToken) {
            res.status(401).json({ error: 'No access token found for user and vehicle' });
            return;
        }
        const accessToken = vehicleToken.get('accessToken');
        const vehicleId = vehicleToken.get('vehicleId');
        // Ensure vehicle is in cache
        proxy_1.cache.ensureVehicle(vehicleId, vin);
        // Create and sign command data
        const commandData = JSON.stringify({
            command: 'honk_horn',
            vin: vin,
            timestamp: Date.now()
        });
        const signature = (0, proxy_1.signWithECKey)(commandData);
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
        const publicKey = (0, proxy_1.getPublicKey)();
        // Test signing with the private key
        const testData = 'test-signature-data';
        const testSignature = (0, proxy_1.signWithECKey)(testData);
        res.json({
            status: 'success',
            message: 'Keys loaded and signing works successfully',
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

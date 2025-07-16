import express, { Router, Request, Response } from 'express';
import { config } from 'dotenv';
import fetch from 'node-fetch';
import { cache, signWithECKey, getPublicKey } from '../proxy';
import { VehicleToken } from '../db';

config();

const router = Router();

// Get vehicles for a specific user
router.get('/user/vehicles/getVehicles/:userId', async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;
    
    // Get access token from database
    const vehicleToken = await VehicleToken.findOne({ where: { userId } });
    
    if (!vehicleToken) {
      res.status(401).json({ error: 'No access token found for user' });
      return;
    }

    const accessToken = vehicleToken.get('accessToken') as string;

    const response = await fetch('https://fleet-api.prd.na.vn.cloud.tesla.com/api/1/vehicles', {
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

    const vehicles = await response.json();
    console.log(`✅ Retrieved vehicles for user ${userId}:`, vehicles);
    
    res.json({
      user_id: userId,
      vehicles: vehicles
    });
  } catch (err) {
    console.error('Error fetching vehicles:', err);
    res.status(500).json({ error: 'Failed to fetch vehicles' });
  }
});

// Honk horn endpoint
router.post('/user/vehicles/honkHorn', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.body.user_id || req.query.user_id;
    const vin = req.body.vin || req.query.vin;
    
    if (!userId || !vin) {
      res.status(400).json({ error: 'user_id and vin are required' });
      return;
    }

    // Get access token from database
    const vehicleToken = await VehicleToken.findOne({ 
      where: { userId, vin }
    });
    
    if (!vehicleToken) {
      res.status(401).json({ error: 'No access token found for user and vehicle' });
      return;
    }

    const accessToken = vehicleToken.get('accessToken') as string;
    const vehicleId = vehicleToken.get('vehicleId') as string;

    // Ensure vehicle is in cache
    cache.ensureVehicle(vehicleId, vin);
    
    // Create and sign command data
    const commandData = JSON.stringify({
      command: 'honk_horn',
      vin: vin,
      timestamp: Date.now()
    });
    
    const signature = signWithECKey(commandData);

    const response = await fetch(`https://fleet-api.prd.na.vn.cloud.tesla.com/api/1/vehicles/${vin}/command/honk_horn`, {
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

    const result = await response.json();
    console.log(`✅ Honked horn for vehicle ${vin} (user: ${userId}):`, result);
    
    res.json({
      user_id: userId,
      vin: vin,
      result: result,
      signature: signature
    });
  } catch (err) {
    console.error('Error honking horn:', err);
    res.status(500).json({ error: 'Failed to honk horn' });
  }
});

// Endpoint to verify public key is accessible
router.get('/user/vehicles/verify-keys', (req: Request, res: Response): void => {
  try {
    const publicKey = getPublicKey();
    
    // Test signing with the private key
    const testData = 'test-signature-data';
    const testSignature = signWithECKey(testData);
    
    res.json({
      status: 'success',
      message: 'Keys loaded and signing works successfully',
      public_key_length: publicKey.length,
      public_key_available: true,
      signing_works: true,
      test_signature: testSignature
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to load keys or sign data',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router; 
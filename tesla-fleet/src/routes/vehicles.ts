import express, { Router, Request, Response } from 'express';
import { config } from 'dotenv';
import fetch from 'node-fetch';
import { VehicleToken } from '../db';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

config();

const router = Router();

// Load private key for signing commands
const privateKey = fs.readFileSync(
  path.join(__dirname, '../../keys/private-key.pem'),
  'utf8'
);

// Helper function to sign commands
function signWithECKey(data: string): string {
  const sign = crypto.createSign('SHA256');
  sign.update(data);
  return sign.sign(privateKey, 'base64');
}

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

    const accessToken = vehicleToken.get('accessToken');
    const vehicleId = vehicleToken.get('vehicleId');

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

  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router; 
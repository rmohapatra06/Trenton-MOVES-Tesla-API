import express, { Router, Request, Response } from 'express';
import { config } from 'dotenv';
import fetch from 'node-fetch';
import { VehicleToken, refreshToken } from '../db';
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

// Helper function to execute vehicle command with token refresh
async function executeVehicleCommand(
  vehicleToken: any,
  vin: string,
  command: string,
  commandData: string
): Promise<any> {
  try {
    const signature = signWithECKey(commandData);
    
    const response = await fetch(
      `https://fleet-api.prd.na.vn.cloud.tesla.com/api/1/vehicles/${vin}/command/${command}`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${vehicleToken.accessToken}`,
          'Content-Type': 'application/json',
          'X-Signature': signature
        },
        body: commandData
      }
    );

    // If unauthorized, try refreshing token and retry once
    if (response.status === 401) {
      console.log(`🔄 Token expired for ${vin}, attempting refresh...`);
      const refreshSuccess = await refreshToken(vehicleToken);
      
      if (!refreshSuccess) {
        throw new Error('Token refresh failed');
      }

      // Retry with new token
      const retryResponse = await fetch(
        `https://fleet-api.prd.na.vn.cloud.tesla.com/api/1/vehicles/${vin}/command/${command}`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${vehicleToken.accessToken}`,
            'Content-Type': 'application/json',
            'X-Signature': signature
          },
          body: commandData
        }
      );

      if (!retryResponse.ok) {
        throw new Error(`Command failed after token refresh: ${retryResponse.status} ${retryResponse.statusText}`);
      }

      return await retryResponse.json();
    }

    if (!response.ok) {
      throw new Error(`Command failed: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    throw error;
  }
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

    // Create command data
    const commandData = JSON.stringify({
      command: 'honk_horn',
      vin: vin,
      timestamp: Date.now()
    });

    const result = await executeVehicleCommand(vehicleToken, vin, 'honk_horn', commandData);
    
    console.log(`✅ Honked horn for vehicle ${vin} (user: ${userId}):`, result);
    
    res.json({
      user_id: userId,
      vin: vin,
      result: result
    });

  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    });
  }
});

export default router; 
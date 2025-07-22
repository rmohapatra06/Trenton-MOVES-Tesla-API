import express, { Router, Request, Response } from 'express';
import fetch from 'node-fetch'; // or axios
import { config } from 'dotenv';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { VehicleToken } from '../db';
import jwt from 'jsonwebtoken'; // to decode sub from idToken

// Load environment variables from fleet.env
config({ path: path.join(__dirname, '../../fleet.env') });

const router = Router();

interface TokenResponse {
  access_token: string;
  refresh_token: string;
  id_token: string;
  token_type: string;
  expires_in: number;
}

// helper
async function storeTokens(
  { userIdSub, tpToken, refreshToken, idToken, expiresIn }: {
    userIdSub: string, tpToken: string, refreshToken: string,
    idToken: string, expiresIn: number }
) {
  await VehicleToken.upsert({
    userId: userIdSub,
    vin: null,  // No vehicle info for now
    vehicleId: null,  // No vehicle info for now
    idToken,
    accessToken: tpToken,
    refreshToken,
    expiresAt: new Date(Date.now() + expiresIn * 1000),
  });
}

// Helper function to update token environment file
const updateTokenEnvFile = async (tokens: {
  tpToken?: string;
  refreshToken?: string;
  idToken?: string;
}): Promise<void> => {
  const tokenEnvFilePath = path.join(__dirname, '../../fleet.env');
  
  if (!fs.existsSync(tokenEnvFilePath)) {
    throw new Error(`Token environment file not found: ${tokenEnvFilePath}`);
  }

  let envContent = fs.readFileSync(tokenEnvFilePath, 'utf8');

  // Update TP_TOKEN if provided
  if (tokens.tpToken) {
    const tpTokenRegex = /^TP_TOKEN=.*/m;
    if (tpTokenRegex.test(envContent)) {
      envContent = envContent.replace(tpTokenRegex, `TP_TOKEN='${tokens.tpToken}'`);
    } else {
      envContent += `\nTP_TOKEN='${tokens.tpToken}'`;
    }
  }

  // Update REFRESH_TOKEN if provided
  if (tokens.refreshToken) {
    const refreshTokenRegex = /^REFRESH_TOKEN=.*/m;
    if (refreshTokenRegex.test(envContent)) {
      envContent = envContent.replace(refreshTokenRegex, `REFRESH_TOKEN='${tokens.refreshToken}'`);
    } else {
      envContent += `\nREFRESH_TOKEN='${tokens.refreshToken}'`;
    }
  }

  // Update ID_TOKEN if provided
  if (tokens.idToken) {
    const idTokenRegex = /^ID_TOKEN=.*/m;
    if (idTokenRegex.test(envContent)) {
      envContent = envContent.replace(idTokenRegex, `ID_TOKEN='${tokens.idToken}'`);
    } else {
      envContent += `\nID_TOKEN='${tokens.idToken}'`;
    }
  }

  fs.writeFileSync(tokenEnvFilePath, envContent);
};

// Enhanced extractToken endpoint with authCodeTokenReq functionality
router.get('/extractToken', async (req: Request, res: Response): Promise<void> => {
  console.log(`🌐 Received ${req.method} request to ${req.path}`);
  console.log(`📝 Query params:`, req.query);

  const code = req.query.code as string | undefined;

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
    formData.append('client_id', process.env.CLIENT_ID!);
    formData.append('client_secret', process.env.CLIENT_SECRET!);
    formData.append('code', code);
    formData.append('redirect_uri', process.env.CALLBACK!);

    console.log(`🔗 Making request to: https://fleet-auth.prd.vn.cloud.tesla.com/oauth2/v3/token`);
    console.log(`📋 Request parameters:`, {
      grant_type: 'authorization_code',
      client_id: process.env.CLIENT_ID,
      code: code.substring(0, 20) + '...',
      redirect_uri: process.env.CALLBACK
    });

    const response = await fetch('https://fleet-auth.prd.vn.cloud.tesla.com/oauth2/v3/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: formData.toString()
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.log(`❌ Tesla API Error Response: ${errorText}`);
      throw new Error(`Token exchange failed: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const tokenResponse = await response.json() as TokenResponse;
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
    const decodedToken = jwt.decode(idToken) as { [key: string]: any };
    const { sub } = decodedToken;

    // Store tokens in database
    await storeTokens({
      userIdSub: sub,
      tpToken,
      refreshToken,
      idToken,
      expiresIn: tokenResponse.expires_in
    });

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
      decodedIdToken: decodedToken  // Include decoded token information in response
    });

  } catch (err) {
    console.error('❌ Error:', err);
    res.status(500).json({ 
      error: 'Operation failed',
      message: err instanceof Error ? err.message : 'Unknown error occurred'
    });
  }
});

// POST handler with same logic
router.post('/extractToken', async (req: Request, res: Response): Promise<void> => {
  const code = (req.query.code || req.body.code) as string | undefined;
  // Set the code in query params for consistent handling
  req.query.code = code;
  // Remove code from body to avoid confusion
  if (req.body && 'code' in req.body) {
    delete req.body.code;
  }
  // Handle the request using the same logic
  await new Promise<void>((resolve) => {
    router.get('/extractToken')(req, res, () => resolve());
  });
});

export default router;

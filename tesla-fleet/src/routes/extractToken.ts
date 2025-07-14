import express, { Router, Request, Response } from 'express';
import fetch from 'node-fetch'; // or axios
import { config } from 'dotenv';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

// Load environment variables from fleet.env
config({ path: path.join(__dirname, '../../fleet.env') });

const router = Router();

// In-memory storage for users (in production, use a proper database)
const users: Map<string, { id: string; email: string; password: string }> = new Map();

// Token storage interface for future database implementation
interface TokenData {
  userId?: string;
  tpToken: string;
  refreshToken: string;
  idToken?: string;
  updatedAt: Date;
}

// In-memory token storage (replace with database later)
const tokenStorage: Map<string, TokenData> = new Map();

// Helper function to generate user ID
const generateUserId = (): string => {
  return crypto.randomUUID();
};

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

// Helper function to store tokens (database preparation)
const storeTokens = (userId: string | undefined, tokens: TokenData): void => {
  const key = userId || 'default';
  tokenStorage.set(key, tokens);
  console.log(`✅ Tokens stored for user: ${key}`);
};

// Step 7: Create a token manager account
router.post('/user/auth/register', async (req: Request, res: Response): Promise<void> => {
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
  } catch (err) {
    console.error('Error registering user:', err);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Enhanced extractToken endpoint with authCodeTokenReq functionality
router.get('/extractToken', async (req: Request, res: Response): Promise<void> => {
  console.log(`🌐 Received ${req.method} request to ${req.path}`);
  console.log(`📝 Query params:`, req.query);
  console.log(`📝 Body:`, req.body);

  const code = req.query.code as string | undefined;
  const userId = req.query.userId as string | undefined; // Optional user ID for database functionality

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
      headers: { 
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: formData.toString()
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.log(`❌ Tesla API Error Response: ${errorText}`);
      throw new Error(`Token exchange failed: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const tokenResponse = await response.json() as any;
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
    const tokenData: TokenData = {
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
      await updateTokenEnvFile({ 
        tpToken, 
        refreshToken, 
        idToken
      });

      console.log('✅ Token environment file updated with new tokens');
      console.log(`   TP_TOKEN: ${tpToken.substring(0, 50)}...`);
      console.log(`   REFRESH_TOKEN: ${refreshToken}`);
      console.log(`   ID_TOKEN: ${idToken ? idToken.substring(0, 50) + '...' : 'N/A'}`);
    } catch (envError) {
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

  } catch (err) {
    console.error('❌ Error exchanging code for tokens:', err);
    res.status(500).json({ 
      error: 'Token exchange failed',
      message: err instanceof Error ? err.message : 'Unknown error occurred'
    });
  }
});

// Also handle POST requests for extractToken (in case that's needed)
router.post('/extractToken', async (req: Request, res: Response): Promise<void> => {
  console.log(`🌐 Received ${req.method} request to ${req.path}`);
  console.log(`📝 Query params:`, req.query);
  console.log(`📝 Body:`, req.body);

  // For POST, code might be in body or query
  const code = (req.query.code || req.body.code) as string | undefined;
  const userId = (req.query.userId || req.body.userId) as string | undefined;

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
    formData.append('client_id', process.env.CLIENT_ID!);
    formData.append('client_secret', process.env.CLIENT_SECRET!);
    formData.append('code', code);
    formData.append('audience', process.env.AUDIENCE!);
    formData.append('redirect_uri', process.env.CALLBACK!);

    console.log(`🔗 Making request to: https://fleet-auth.prd.vn.cloud.tesla.com/oauth2/v3/token`);
    console.log(`📋 Request parameters:`, {
      grant_type: 'authorization_code',
      client_id: process.env.CLIENT_ID,
      code: code.substring(0, 20) + '...',
      audience: process.env.AUDIENCE,
      redirect_uri: process.env.CALLBACK
    });

    const response = await fetch('https://fleet-auth.prd.vn.cloud.tesla.com/oauth2/v3/token', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: formData.toString()
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.log(`❌ Tesla API Error Response: ${errorText}`);
      throw new Error(`Token exchange failed: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const tokenResponse = await response.json() as any;
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
    const tokenData: TokenData = {
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
      await updateTokenEnvFile({ 
        tpToken, 
        refreshToken, 
        idToken
      });

      console.log('✅ Token environment file updated with new tokens');
      console.log(`   TP_TOKEN: ${tpToken.substring(0, 50)}...`);
      console.log(`   REFRESH_TOKEN: ${refreshToken}`);
      console.log(`   ID_TOKEN: ${idToken ? idToken.substring(0, 50) + '...' : 'N/A'}`);
    } catch (envError) {
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

  } catch (err) {
    console.error('❌ Error exchanging code for tokens:', err);
    res.status(500).json({ 
      error: 'Token exchange failed',
      message: err instanceof Error ? err.message : 'Unknown error occurred'
    });
  }
});

// New endpoint to get stored tokens for a user (database preparation)
router.get('/tokens/:userId', (req: Request, res: Response): void => {
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
router.get('/user/:userId', (req: Request, res: Response): void => {
  const { userId } = req.params;
  
  for (const [email, user] of users.entries()) {
    if (user.id === userId) {
      res.json({ user_id: user.id, email: user.email });
      return;
    }
  }
  
  res.status(404).json({ error: 'User not found' });
});

export default router;

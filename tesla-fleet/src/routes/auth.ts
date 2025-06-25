import express, { Router, Request, Response } from 'express';
import fetch from 'node-fetch'; // or axios
import { config } from 'dotenv';
import crypto from 'crypto';

config();

const router = Router();

// In-memory storage for users (in production, use a proper database)
const users: Map<string, { id: string; email: string; password: string }> = new Map();

// Helper function to generate user ID
const generateUserId = (): string => {
  return crypto.randomUUID();
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

// Official Tesla Fleet API OAuth: /extractToken endpoint
router.get('/extractToken', async (req: Request, res: Response): Promise<void> => {
  const code = req.query.code as string | undefined;
  if (!code) {
    res.status(400).send('Missing code');
    return;
  }
  try {
    const params = new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: process.env.CLIENT_ID!,
      code,
      redirect_uri: `https://${process.env.NGROK_DOMAIN}/extractToken`
    });
    const response = await fetch('https://auth.tesla.com/oauth2/v3/token', {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: params
    });
    const body = await response.json();
    console.log('OAuth tokens:', body);
    res.json(body);
  } catch (err) {
    console.error('Error exchanging code:', err);
    res.status(500).send('Token exchange failed');
  }
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

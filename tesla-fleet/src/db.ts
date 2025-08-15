import { Sequelize, DataTypes, Op, Model } from "sequelize";
import dotenv from "dotenv";
import fetch from 'node-fetch';
import jwt from 'jsonwebtoken';
dotenv.config();

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is not set. Please check your .env file.');
}

export const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: "postgres",
  protocol: "postgres",
  logging: false,
});

// Test the database connection
sequelize.authenticate()
  .then(() => {
    console.log('Database connection has been established successfully.');
  })
  .catch(err => {
    console.error('Unable to connect to the database:', err);
  });

interface TokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
}

interface VehicleTokenAttributes {
  userId: string;
  email: string | null;
  fullName: string | null;
  vin: string | null;
  vehicleId: string | null;
  idToken: string;
  refreshToken: string;
  accessToken: string;
  expiresAt: Date;
}

// define VehicleTokens model
export const VehicleToken = sequelize.define<Model<VehicleTokenAttributes>>('VehicleToken', {
  userId:      { type: DataTypes.STRING, allowNull: false },
  email:       { type: DataTypes.STRING, allowNull: true },
  fullName:    { type: DataTypes.STRING, allowNull: true },
  vin:         { type: DataTypes.STRING, allowNull: true },
  vehicleId:   { type: DataTypes.STRING, allowNull: true },
  idToken:     { type: DataTypes.TEXT,   allowNull: false },
  refreshToken:{ type: DataTypes.TEXT,   allowNull: false },
  accessToken: { type: DataTypes.TEXT,   allowNull: false },
  expiresAt:   { type: DataTypes.DATE,   allowNull: false },
}, {
  indexes: [
    { unique: true, fields: ["userId", "vin"] },
    { unique: true, fields: ["userId"] },
    { unique: true, fields: ["email"], where: { email: { [Op.ne]: null } } }
  ]
});

// Function to refresh a single token
export async function refreshToken(token: Model<VehicleTokenAttributes>): Promise<boolean> {
  try {
    const tokenData = token.get();
    const formData = new URLSearchParams();
    formData.append('grant_type', 'refresh_token');
    formData.append('client_id', process.env.CLIENT_ID!);
    formData.append('client_secret', process.env.CLIENT_SECRET!);
    formData.append('refresh_token', tokenData.refreshToken);

    const response = await fetch('https://fleet-auth.prd.vn.cloud.tesla.com/oauth2/v3/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: formData.toString()
    });

    if (!response.ok) {
      throw new Error(`Token refresh failed: ${response.status} ${response.statusText}`);
    }

    const tokenResponse = await response.json() as TokenResponse;
    
    await token.update({
      accessToken: tokenResponse.access_token,
      refreshToken: tokenResponse.refresh_token,
      expiresAt: new Date(Date.now() + tokenResponse.expires_in * 1000)
    });

    console.log(`🔄 Refreshed token for ${tokenData.userId}/${tokenData.vin}`);
    return true;
  } catch (e) {
    console.error('Token refresh failed:', e);
    return false;
  }
}

// Function to refresh expired tokens
export async function refreshExpired() {
  const now = new Date();
  const rows = await VehicleToken.findAll({ 
    where: { 
      expiresAt: { [Op.lt]: now }
    }
  });

  console.log(`Found ${rows.length} expired tokens to refresh`);
  
  for (const row of rows) {
    await refreshToken(row);
  }
}

// Initialize database
export async function initialiseDb() {
  try {
    // Sync tables
    await sequelize.sync({ alter: true });
    console.log('Database synchronized');
    
    // Start periodic token refresh (every 5 minutes)
    setInterval(refreshExpired, 5 * 60 * 1000);
    
    // Also refresh on startup
    await refreshExpired();
  } catch (e) {
    console.error('Database initialization failed:', e);
    throw e;
  }
}



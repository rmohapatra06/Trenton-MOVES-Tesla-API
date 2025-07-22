import { Sequelize, DataTypes, Op } from "sequelize";
import dotenv from "dotenv";
import fetch from 'node-fetch';
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

// define VehicleTokens model
export const VehicleToken = sequelize.define("VehicleToken", {
  userId:      { type: DataTypes.STRING, allowNull: true },
  vin:         { type: DataTypes.STRING, allowNull: true },
  vehicleId:   { type: DataTypes.STRING, allowNull: true },
  idToken:     { type: DataTypes.TEXT,   allowNull: false },
  refreshToken:{ type: DataTypes.TEXT,   allowNull: false },
  accessToken: { type: DataTypes.TEXT,   allowNull: false },
  expiresAt:   { type: DataTypes.DATE,   allowNull: false },
}, {
  indexes: [
    { unique: true, fields: ["userId", "vin"] }
  ]
});

export async function refreshExpired() {
  const now = new Date();
  const rows = await VehicleToken.findAll({ where: { expiresAt: { [Op.lt]: now } } });

  for (const row of rows as any[]) {
    try {
      const formData = new URLSearchParams();
      formData.append('grant_type', 'refresh_token');
      formData.append('client_id', process.env.CLIENT_ID!);
      formData.append('client_secret', process.env.CLIENT_SECRET!);
      formData.append('refresh_token', row.refreshToken);

      const response = await fetch('https://fleet-auth.prd.vn.cloud.tesla.com/oauth2/v3/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: formData.toString()
      });

      if (!response.ok) {
        throw new Error(`Token refresh failed: ${response.status} ${response.statusText}`);
      }

      const tokenResponse = await response.json() as TokenResponse;
      
      row.accessToken = tokenResponse.access_token;
      row.refreshToken = tokenResponse.refresh_token;
      row.expiresAt = new Date(Date.now() + tokenResponse.expires_in * 1000);
      await row.save();
      console.log(`🔄  refreshed for ${row.userId}/${row.vin}`);
    } catch (e) {
      console.error('refresh failed for', row.userId, row.vin, e);
    }
  }
}

// Initialize database
export async function initialiseDb() {
  // Force alter table to update constraints
  await sequelize.sync({ alter: true });
  console.log('Database synchronized and altered');
}



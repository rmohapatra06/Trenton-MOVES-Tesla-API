// src/proxy.ts
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { VehicleCache } from 'tesla-api-toolkit';
import { VehicleToken } from './db';
import { Model } from 'sequelize';

interface VehicleTokenAttributes {
  userId: string;
  vin: string;
  vehicleId: string;
  idToken: string;
  refreshToken: string;
  accessToken: string;
  expiresAt: Date;
}

// ── key material ─────────────────────────
const publicKey = fs.readFileSync(
  path.join(__dirname, '..', 'public', '.well-known', 'appspecific', 'com.tesla.3p.public-key.pem'),
  'utf8'
);
const privateKey = fs.readFileSync(
  path.join(__dirname, '..', 'keys', 'private-key.pem'),
  'utf8'
);

// ── key management functions ─────────────
export function signWithECKey(data: string): string {
  const sign = crypto.createSign('SHA256');
  sign.update(data);
  return sign.sign(privateKey, 'base64');
}

export function getPublicKey(): string {
  return publicKey;
}

// ── helpers the cache needs ──────────────
async function getAccess(userId: string): Promise<string> {
  const row = await VehicleToken.findOne({ where: { userId } }) as Model<VehicleTokenAttributes> | null;
  const token = row?.get('accessToken');
  return typeof token === 'string' ? token : '';
}
async function refreshAccess(userId: string): Promise<string> {
  // do **not** touch cache here; db.ts.refreshExpired already did it
  const row = await VehicleToken.findOne({ where: { userId } }) as Model<VehicleTokenAttributes> | null;
  const token = row?.get('accessToken');
  return typeof token === 'string' ? token : '';
}

// ── export a singleton ───────────────────
export const cache = new VehicleCache(publicKey, privateKey, getAccess, refreshAccess);

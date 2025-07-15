import express from 'express';
import path from 'node:path';
import { config } from 'dotenv';
import { sequelize, VehicleToken } from './db';
import { VehicleCache } from "tesla-api-toolkit";
import healthRouter from './routes/health';
import authRouter from './routes/extractToken';
import vehiclesRouter from './routes/vehicles';

config();  // loads .env into process.env

const app = express();
const PORT = process.env.PORT ?? 3000;

// JSON body parser if you need POST/JSON
app.use(express.json());

// Serve static files under /.well-known for Tesla to fetch public key
app.use(
  '/.well-known',
  express.static(path.join(__dirname, '..', 'public', '.well-known'))
);

// Mount routes
app.use('/health', healthRouter);
app.use('/', authRouter);
app.use('/', vehiclesRouter);

// Connect and sync database

app.listen(PORT, () => {
  console.log(`🚀 Server listening on http://localhost:${PORT}`);
});





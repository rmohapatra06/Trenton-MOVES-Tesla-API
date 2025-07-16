import { Sequelize, DataTypes, Op } from "sequelize";
import dotenv from "dotenv";
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

// define VehicleTokens model
export const VehicleToken = sequelize.define("VehicleToken", {
  userId:      { type: DataTypes.STRING, allowNull: false },
  vin:         { type: DataTypes.STRING, allowNull: false },
  vehicleId:   { type: DataTypes.STRING, allowNull: false },
  idToken:     { type: DataTypes.TEXT,   allowNull: false },
  refreshToken:{ type: DataTypes.TEXT,   allowNull: false },
  accessToken: { type: DataTypes.TEXT,   allowNull: false },
  expiresAt:   { type: DataTypes.DATE,   allowNull: false },
}, {
  indexes: [
    { unique: true, fields: ["userId", "vin"] }
  ]
});

export async function refreshExpired(toolkit: any) {
  const now = new Date();
  const rows = await VehicleToken.findAll({ where: { expiresAt: { [Op.lt]: now } } });

  for (const row of rows as any[]) {
    try {
      const t = await toolkit.refreshTokens(row.refreshToken);
      row.accessToken  = t.accessToken;
      row.refreshToken = t.refreshToken;
      row.expiresAt    = new Date(Date.now() + t.expiresIn * 1000);
      await row.save();
      console.log(`🔄  refreshed for ${row.userId}/${row.vin}`);
    } catch (e) {
      console.error('refresh failed for', row.userId, row.vin, e);
    }
  }
}

// Sync the model with the database
  export async function initialiseDb(toolkit: any) {
    await sequelize.authenticate();
    await sequelize.sync();
    console.log('Database connected and synced');
    await refreshExpired(toolkit);
  }



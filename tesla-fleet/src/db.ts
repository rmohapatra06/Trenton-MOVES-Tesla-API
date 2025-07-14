import { Sequelize, DataTypes } from "sequelize";
import dotenv from "dotenv";
dotenv.config();

export const sequelize = new Sequelize(process.env.DATABASE_URL!, {
  dialect: "postgres",
  protocol: "postgres",
  logging: false,
});

// define VehicleTokens model
export const VehicleToken = sequelize.define("VehicleToken", {
  userId:      { type: DataTypes.STRING, allowNull: false },
  vin:         { type: DataTypes.STRING, allowNull: false },
  idToken:     { type: DataTypes.TEXT,   allowNull: false },
  refreshToken:{ type: DataTypes.TEXT,   allowNull: false },
  accessToken: { type: DataTypes.TEXT,   allowNull: false },
  expiresAt:   { type: DataTypes.DATE,   allowNull: false },
}, {
  indexes: [
    { unique: true, fields: ["userId", "vin"] }
  ]
});

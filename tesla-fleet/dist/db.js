"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.VehicleToken = exports.sequelize = void 0;
const sequelize_1 = require("sequelize");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
exports.sequelize = new sequelize_1.Sequelize(process.env.DATABASE_URL, {
    dialect: "postgres",
    protocol: "postgres",
    logging: false,
});
// define VehicleTokens model
exports.VehicleToken = exports.sequelize.define("VehicleToken", {
    userId: { type: sequelize_1.DataTypes.STRING, allowNull: false },
    vin: { type: sequelize_1.DataTypes.STRING, allowNull: false },
    idToken: { type: sequelize_1.DataTypes.TEXT, allowNull: false },
    refreshToken: { type: sequelize_1.DataTypes.TEXT, allowNull: false },
    accessToken: { type: sequelize_1.DataTypes.TEXT, allowNull: false },
    expiresAt: { type: sequelize_1.DataTypes.DATE, allowNull: false },
}, {
    indexes: [
        { unique: true, fields: ["userId", "vin"] }
    ]
});

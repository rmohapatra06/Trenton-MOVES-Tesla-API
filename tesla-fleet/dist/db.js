"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.VehicleToken = exports.sequelize = void 0;
exports.refreshExpired = refreshExpired;
exports.initialiseDb = initialiseDb;
const sequelize_1 = require("sequelize");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL environment variable is not set. Please check your .env file.');
}
exports.sequelize = new sequelize_1.Sequelize(process.env.DATABASE_URL, {
    dialect: "postgres",
    protocol: "postgres",
    logging: false,
});
// Test the database connection
exports.sequelize.authenticate()
    .then(() => {
    console.log('Database connection has been established successfully.');
})
    .catch(err => {
    console.error('Unable to connect to the database:', err);
});
// define VehicleTokens model
exports.VehicleToken = exports.sequelize.define("VehicleToken", {
    userId: { type: sequelize_1.DataTypes.STRING, allowNull: false },
    vin: { type: sequelize_1.DataTypes.STRING, allowNull: false },
    vehicleId: { type: sequelize_1.DataTypes.STRING, allowNull: false },
    idToken: { type: sequelize_1.DataTypes.TEXT, allowNull: false },
    refreshToken: { type: sequelize_1.DataTypes.TEXT, allowNull: false },
    accessToken: { type: sequelize_1.DataTypes.TEXT, allowNull: false },
    expiresAt: { type: sequelize_1.DataTypes.DATE, allowNull: false },
}, {
    indexes: [
        { unique: true, fields: ["userId", "vin"] }
    ]
});
function refreshExpired(toolkit) {
    return __awaiter(this, void 0, void 0, function* () {
        const now = new Date();
        const rows = yield exports.VehicleToken.findAll({ where: { expiresAt: { [sequelize_1.Op.lt]: now } } });
        for (const row of rows) {
            try {
                const t = yield toolkit.refreshTokens(row.refreshToken);
                row.accessToken = t.accessToken;
                row.refreshToken = t.refreshToken;
                row.expiresAt = new Date(Date.now() + t.expiresIn * 1000);
                yield row.save();
                console.log(`🔄  refreshed for ${row.userId}/${row.vin}`);
            }
            catch (e) {
                console.error('refresh failed for', row.userId, row.vin, e);
            }
        }
    });
}
// Sync the model with the database
function initialiseDb(toolkit) {
    return __awaiter(this, void 0, void 0, function* () {
        yield exports.sequelize.authenticate();
        yield exports.sequelize.sync();
        console.log('Database connected and synced');
        yield refreshExpired(toolkit);
    });
}

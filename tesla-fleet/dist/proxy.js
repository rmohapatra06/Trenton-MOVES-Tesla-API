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
exports.cache = void 0;
exports.signWithECKey = signWithECKey;
exports.getPublicKey = getPublicKey;
// src/proxy.ts
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const crypto_1 = __importDefault(require("crypto"));
const tesla_api_toolkit_1 = require("tesla-api-toolkit");
const db_1 = require("./db");
// ── key material ─────────────────────────
const publicKey = fs_1.default.readFileSync(path_1.default.join(__dirname, '..', 'public', '.well-known', 'appspecific', 'com.tesla.3p.public-key.pem'), 'utf8');
const privateKey = fs_1.default.readFileSync(path_1.default.join(__dirname, '..', 'keys', 'private-key.pem'), 'utf8');
// ── key management functions ─────────────
function signWithECKey(data) {
    const sign = crypto_1.default.createSign('SHA256');
    sign.update(data);
    return sign.sign(privateKey, 'base64');
}
function getPublicKey() {
    return publicKey;
}
// ── helpers the cache needs ──────────────
function getAccess(userId) {
    return __awaiter(this, void 0, void 0, function* () {
        const row = yield db_1.VehicleToken.findOne({ where: { userId } });
        const token = row === null || row === void 0 ? void 0 : row.get('accessToken');
        return typeof token === 'string' ? token : '';
    });
}
function refreshAccess(userId) {
    return __awaiter(this, void 0, void 0, function* () {
        // do **not** touch cache here; db.ts.refreshExpired already did it
        const row = yield db_1.VehicleToken.findOne({ where: { userId } });
        const token = row === null || row === void 0 ? void 0 : row.get('accessToken');
        return typeof token === 'string' ? token : '';
    });
}
// ── export a singleton ───────────────────
exports.cache = new tesla_api_toolkit_1.VehicleCache(publicKey, privateKey, getAccess, refreshAccess);

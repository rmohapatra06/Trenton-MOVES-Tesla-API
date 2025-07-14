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
exports.createFleetClient = createFleetClient;
exports.listVehicles = listVehicles;
const axios_1 = __importDefault(require("axios"));
const BASE_URL = 'https://fleet-api.prd.na.vn.cloud.tesla.com/api/1';
function createFleetClient(token) {
    return axios_1.default.create({
        baseURL: BASE_URL,
        headers: { Authorization: `Bearer ${token}` },
    });
}
function listVehicles(token) {
    return __awaiter(this, void 0, void 0, function* () {
        const client = createFleetClient(token);
        const resp = yield client.get('/vehicles');
        return resp.data;
    });
}
// Further helpers, e.g., get vehicle state, send commands, etc.

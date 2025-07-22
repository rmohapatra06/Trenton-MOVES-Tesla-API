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
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const node_path_1 = __importDefault(require("node:path"));
const dotenv_1 = require("dotenv");
const db_1 = require("./db");
const proxy_1 = require("./proxy");
const health_1 = __importDefault(require("./routes/health"));
const extractToken_1 = __importDefault(require("./routes/extractToken"));
const vehicles_1 = __importDefault(require("./routes/vehicles"));
(0, dotenv_1.config)(); // loads .env into process.env
const app = (0, express_1.default)();
const PORT = (_a = process.env.PORT) !== null && _a !== void 0 ? _a : 3000;
// JSON body parser if you need POST/JSON
app.use(express_1.default.json());
// Serve static files under /.well-known for Tesla to fetch public key
app.use('/.well-known', express_1.default.static(node_path_1.default.join(__dirname, '..', 'public', '.well-known')));
// Mount routes
app.use('/health', health_1.default);
app.use('/', extractToken_1.default);
app.use('/', vehicles_1.default);
// Boot sequence
(() => __awaiter(void 0, void 0, void 0, function* () {
    yield (0, db_1.initialiseDb)(proxy_1.cache);
}))();
app.listen(PORT, () => {
    console.log(`🚀 Server listening on http://localhost:${PORT}`);
});

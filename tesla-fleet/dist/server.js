"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const node_path_1 = __importDefault(require("node:path"));
const dotenv_1 = require("dotenv");
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
app.listen(PORT, () => {
    console.log(`🚀 Server listening on http://localhost:${PORT}`);
});

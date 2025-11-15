"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createMiddleware = createMiddleware;
exports.loadFastayMiddlewares = loadFastayMiddlewares;
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const url_1 = require("url");
const logger_1 = require("./logger");
const wrapMiddleware_1 = require("./utils/wrapMiddleware");
function createMiddleware(map) {
    return (app) => {
        for (const [route, middlewares] of Object.entries(map)) {
            for (const mw of middlewares) {
                const wrapped = (0, wrapMiddleware_1.wrapMiddleware)(mw);
                app.use(route, wrapped);
            }
        }
    };
}
async function loadFastayMiddlewares(app) {
    const mwDir = path_1.default.resolve(process.cwd(), 'src', 'middlewares');
    if (!fs_1.default.existsSync(mwDir))
        return;
    const file = path_1.default.join(mwDir, 'middleware.ts');
    if (!fs_1.default.existsSync(file))
        return;
    const mod = await Promise.resolve(`${(0, url_1.pathToFileURL)(file).href}`).then(s => __importStar(require(s)));
    if (!mod.middleware)
        return;
    if (typeof mod.middleware === 'function') {
        // Se for função, chama passando o app
        mod.middleware(app);
        logger_1.logger.info('Loading Fastay core middleware...');
    }
    else {
        // Suporte antigo (mapa de rotas)
        const map = mod.middleware;
        for (const [route, middlewares] of Object.entries(map)) {
            for (const mw of middlewares) {
                app.use(route, mw);
            }
        }
    }
}

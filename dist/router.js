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
exports.filePathToRoute = filePathToRoute;
exports.collectFiles = collectFiles;
exports.loadApiRoutes = loadApiRoutes;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const url_1 = require("url");
const logger_1 = require("./logger");
/**
 * Converte caminho do arquivo em rota Express (somente arquivos route.ts)
 */
function filePathToRoute(apiDir, filePath, baseRoute) {
    const rel = path_1.default.relative(apiDir, filePath);
    const parts = rel.split(path_1.default.sep);
    const filename = parts.pop();
    if (filename !== 'route.ts' && filename !== 'route.js')
        return null;
    const segments = parts
        .map((s) => s.startsWith('[') && s.endsWith(']') ? `:${s.slice(1, -1)}` : s)
        .filter(Boolean);
    return `${baseRoute}/${segments.join('/')}`.replace(/\/+/g, '/');
}
/**
 * Retorna todos arquivos .ts/.js recursivamente
 */
function collectFiles(dir) {
    let out = [];
    const items = fs_1.default.readdirSync(dir, { withFileTypes: true });
    for (const it of items) {
        const full = path_1.default.join(dir, it.name);
        if (it.isDirectory())
            out = out.concat(collectFiles(full));
        else if (/\.(ts|js|mts|mjs)$/.test(it.name))
            out.push(full);
    }
    return out;
}
/**
 * Wrapper para suportar return JSON/string/number e capturar erros runtime
 */
function wrapHandler(fn, routePath, filePath) {
    return async (req, res, next) => {
        try {
            const result = fn.length >= 2 ? await fn(req, res) : await fn(req);
            if (res.headersSent)
                return;
            if (result === undefined)
                return;
            if (typeof result === 'string')
                return res.send(result);
            if (typeof result === 'number')
                return res.send(String(result));
            return res.json(result);
        }
        catch (err) {
            const stack = err?.stack?.split('\n').slice(0, 3).join('\n') || '';
            logger_1.logger.error(`✗ Runtime Error in route [${req.method} ${routePath}]\n` +
                `  File: ${filePath}\n` +
                `  Message: ${err.message || 'Unknown error'}\n` +
                `  Stack: ${stack}`);
            next(err);
        }
    };
}
/**
 * Carrega todas as rotas do diretório apiDir
 */
async function loadApiRoutes(app, apiDir, baseRoute) {
    if (!fs_1.default.existsSync(apiDir))
        return 0;
    const files = collectFiles(apiDir);
    let cont = 0;
    logger_1.logger.group('Routes Loaded');
    for (const file of files) {
        const route = filePathToRoute(apiDir, file, baseRoute);
        if (!route)
            continue;
        try {
            const fileUrl = (0, url_1.pathToFileURL)(file).href;
            const mod = await Promise.resolve(`${fileUrl}`).then(s => __importStar(require(s)));
            const httpMethods = [
                'GET',
                'POST',
                'PUT',
                'DELETE',
                'PATCH',
                'OPTIONS',
                'HEAD',
            ];
            for (const m of httpMethods) {
                if (typeof mod[m] === 'function') {
                    app[m.toLowerCase()](route, wrapHandler(mod[m], route, file));
                    cont++;
                    logger_1.logger.success(`Route: [${m}] ${route}`);
                }
            }
            if (mod.default && typeof mod.default === 'function') {
                app.get(route, wrapHandler(mod.default, route, file));
                cont++;
                logger_1.logger.success(`Route: [GET] ${route}`);
            }
        }
        catch (err) {
            const stack = err?.stack?.split('\n').slice(0, 3).join('\n') || '';
            logger_1.logger.error(`✗ Boot Error importing ${file}\n` +
                `  Message: ${err.message || 'Unknown error'}\n` +
                `  Stack: ${stack}`);
        }
    }
    return cont;
}

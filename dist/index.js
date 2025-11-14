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
exports.loadApiRoutes = loadApiRoutes;
exports.createApp = createApp;
const express_1 = __importDefault(require("express"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const url_1 = require("url");
/**
 * Helper: converte um caminho de ficheiro do API para a rota Express.
 * Ex: src/api/users/[id]/get.ts -> /api/users/:id
 *      src/api/users/get.ts -> /api/users
 */
function filePathToRoute(apiDir, filePath, baseRoute) {
    const rel = path_1.default.relative(apiDir, filePath); // users/[id]/get.ts  ou users/get.ts
    const parts = rel.split(path_1.default.sep); // ['users','[id]','get.ts']
    // remove filename if it's method file (get.ts) — route path is folder path
    const filename = parts[parts.length - 1];
    const nameNoExt = filename.replace(/\.[tj]s$/, '');
    let segments = parts.slice(0, -1); // folder segments
    // support also route files that are direct: users.ts -> route /users
    const isMethodFile = /^(get|post|put|delete|patch|options|head)$/i.test(nameNoExt);
    if (!isMethodFile) {
        // treat file as the last segment (users.ts -> /users)
        segments.push(nameNoExt);
    }
    // convert [id] -> :id
    const route = segments
        .map((s) => s.startsWith('[') && s.endsWith(']') ? `:${s.slice(1, -1)}` : s)
        .filter(Boolean)
        .join('/');
    return `${baseRoute}/${route}`.replace(/\/+/g, '/'); // ensure single slashes
}
/**
 * Recursively encontra todos os ficheiros .ts/.js dentro de apiDir
 */
function collectFiles(dir) {
    let out = [];
    const items = fs_1.default.readdirSync(dir, { withFileTypes: true });
    for (const it of items) {
        const full = path_1.default.join(dir, it.name);
        if (it.isDirectory()) {
            out = out.concat(collectFiles(full));
        }
        else if (it.isFile()) {
            if (/\.(ts|js|mts|mjs)$/.test(it.name))
                out.push(full);
        }
    }
    return out;
}
/**
 * Wrap: recebe handler export (possible shapes)
 * - export async function GET(req) { return {...} }
 * - or export async function GET(req,res) { res.send(...) }
 * Our wrapper supports both.
 */
function wrapHandler(fn) {
    return async (req, res, next) => {
        try {
            // prefer calling with (req, res) if function length >=2
            const result = fn.length >= 2 ? await fn(req, res) : await fn(req);
            if (res.headersSent)
                return; // handler handled response
            if (result === undefined) {
                // nothing returned, assume handler used res
                return;
            }
            if (typeof result === 'string')
                return res.send(result);
            if (typeof result === 'number')
                return res.status(200).send(String(result));
            // default send json
            return res.json(result);
        }
        catch (err) {
            next(err);
        }
    };
}
/**
 * Load routes from apiDir: will import each file and mount exported handlers.
 */
async function loadApiRoutes(app, apiDir, baseRoute) {
    if (!fs_1.default.existsSync(apiDir)) {
        // nothing to do
        return;
    }
    const files = collectFiles(apiDir);
    for (const file of files) {
        // dynamic import considers file URL
        const fileUrl = (0, url_1.pathToFileURL)(file).href;
        // import module dynamically
        // eslint-disable-next-line no-await-in-loop
        const mod = await Promise.resolve(`${fileUrl}`).then(s => __importStar(require(s)));
        const filename = path_1.default.basename(file);
        const methodName = filename.replace(/\.[tj]s$/, ''); // could be get/post or custom
        const route = filePathToRoute(apiDir, file, baseRoute);
        // If module exports HTTP methods named GET, POST, etc.
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
                app[m.toLowerCase()](route, wrapHandler(mod[m]));
            }
        }
        // If file was a method file (get.ts) we already mounted via exported functions.
        // Also support default export as a handler function (applies to any method: GET)
        if (mod.default && typeof mod.default === 'function') {
            // Mount default at GET
            app.get(route, wrapHandler(mod.default));
        }
        // Logging (dev): show loaded routes
        // console.log(`Loaded route: ${route} -> ${file}`);
    }
}
/**
 * Create an express app wired with file-based API routes
 */
async function createApp(opts) {
    const apiDir = opts?.apiDir ?? path_1.default.resolve(process.cwd(), 'src', 'api');
    const baseRoute = opts?.baseRoute ?? '/api';
    const app = (0, express_1.default)();
    app.use(express_1.default.json());
    // basic health check
    app.get('/_health', (_, res) => res.json({ ok: true }));
    // load routes
    await loadApiRoutes(app, apiDir, baseRoute);
    return app;
}

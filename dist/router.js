import fs from 'fs';
import path from 'node:path';
import mime from 'mime-types';
import { pathToFileURL } from 'url';
import { Router } from 'express';
import { logger } from './logger.js';
// Optimized cache with WeakMap for garbage collection
const mimeCache = new Map();
const routeCache = new Map();
const moduleCache = new Map();
// Predefined HTTP methods as an array for compatibility
const HTTP_METHODS = [
    'GET',
    'POST',
    'PUT',
    'DELETE',
    'PATCH',
    'OPTIONS',
    'HEAD',
];
/** Path → route with cache */
export function filePathToRoute(apiDir, filePath, baseRoute) {
    // Creates a unique key for the route cache.
    const key = `${apiDir}:${filePath}`;
    // Check if the route is already in the cache routeCache.
    if (routeCache.has(key)) {
        return routeCache.get(key);
    }
    // the relative path of the file in relation to the API folder
    const rel = path.relative(apiDir, filePath);
    // Divide the relative path into parts.
    const parts = rel.split(path.sep);
    // The `parts` array moves and returns the last element of the `parts` array, which is the filename.
    const filename = parts.pop();
    //Check if the file exists.
    if (!filename || !(filename === 'route.ts' || filename === 'route.js')) {
        routeCache.set(key, null);
        return null;
    }
    // Converts dynamic folders into Express route parameters.
    const segments = parts.map((s) => s.startsWith('[') && s.endsWith(']') ? `:${s.slice(1, -1)}` : s);
    const route = `${baseRoute}/${segments.join('/')}`.replace(/\/+/g, '/');
    routeCache.set(key, route);
    return route;
}
/** Walk recursion limit */
export function collectFiles(dir) {
    const result = [];
    const stack = [dir];
    const maxDepth = 20;
    while (stack.length > 0 && stack.length < maxDepth) {
        const current = stack.pop();
        try {
            const items = fs.readdirSync(current, { withFileTypes: true });
            for (let i = items.length - 1; i >= 0; i--) {
                const it = items[i];
                const full = path.join(current, it.name);
                if (it.isDirectory()) {
                    stack.push(full);
                }
                else if (/\.(ts|js|mts|mjs)$/.test(it.name)) {
                    result.push(full);
                }
            }
        }
        catch (error) {
            logger.warn(`Cannot read directory: ${current}`);
        }
    }
    return result;
}
/** Cache mime */
function getMime(filePath) {
    const cached = mimeCache.get(filePath);
    if (cached)
        return cached;
    const type = mime.lookup(filePath) || 'application/octet-stream';
    mimeCache.set(filePath, type);
    return type;
}
/** Highly optimized handler with fewer branches. */
function wrapHandler(fn) {
    return async (request, res, next) => {
        try {
            const result = await (fn.length >= 2 ? fn(request, res) : fn(request));
            // If response has already been sent, exit
            if (res.headersSent || result === undefined)
                return;
            //Optimized processing by type
            switch (typeof result) {
                case 'string':
                case 'number':
                case 'boolean':
                    return res.send(String(result));
                case 'object':
                    if (result === null)
                        return res.send('null');
                    const response = result;
                    // Headers first
                    if (response.headers) {
                        for (const [k, v] of Object.entries(response.headers)) {
                            res.setHeader(k, v);
                        }
                    }
                    // Cookies
                    if (response.cookies) {
                        for (const [name, cookie] of Object.entries(response.cookies)) {
                            res.cookie(name, cookie.value, cookie.options || {});
                        }
                    }
                    // Redirections e files
                    if (response.redirect) {
                        return res.redirect(response.status ?? 302, response.redirect);
                    }
                    if (response.file) {
                        return response.file.filename
                            ? res.download(response.file.path, response.file.filename, response.file.options)
                            : res.download(response.file.path, response.file.options);
                    }
                    if (response.stream) {
                        return response.stream.pipe(res);
                    }
                    if (response.raw) {
                        return res.status(response.status ?? 200).send(response.raw);
                    }
                    if (response.static) {
                        const type = response.static.contentType || getMime(response.static.path);
                        res.setHeader('Content-Type', type);
                        return res.sendFile(path.resolve(response.static.path));
                    }
                    // JSON response default
                    return res
                        .status(response.status ?? 200)
                        .json(response.body ?? result);
                default:
                    return res.json(result);
            }
        }
        catch (err) {
            const error = err;
            logger.error(`Handler Error [${request.method} ${request.path}]: ${error.message}`);
            next(err);
        }
    };
}
/** Optimized route loader with parallel import */
export async function loadApiRoutes(app, baseRoute, apiDirectory) {
    const isDev = process.env.NODE_ENV !== 'production';
    const apiDir = path.join(process.cwd(), isDev ? apiDirectory : 'dist/api');
    if (!fs.existsSync(apiDir)) {
        logger.warn(`API directory not found: ${apiDir}`);
        return 0;
    }
    const files = collectFiles(apiDir);
    let count = 0;
    logger.group('Loading Routes');
    // Optimized parallel loading
    const modulePromises = files.map(async (file) => {
        try {
            // Module cache in production
            if (process.env.NODE_ENV === 'production' && moduleCache.has(file)) {
                return { file, module: moduleCache.get(file) };
            }
            const module = await import(pathToFileURL(file).href);
            if (process.env.NODE_ENV === 'production') {
                moduleCache.set(file, module);
            }
            return { file, module };
        }
        catch (error) {
            logger.error(`Failed to load ${file}: ${error.message}`);
            return { file, module: null, error };
        }
    });
    const modules = await Promise.all(modulePromises);
    // Router per file
    for (const { file, module } of modules) {
        if (!module || module.error)
            continue;
        const route = filePathToRoute(apiDir, file, baseRoute);
        if (!route)
            continue;
        const routeRouter = Router({ mergeParams: true });
        let hasRoutes = false;
        // Register HTTP methods
        for (const method of HTTP_METHODS) {
            const handler = module[method];
            if (typeof handler === 'function') {
                // Using type assertion is safe.
                const routerMethod = method.toLowerCase();
                if (typeof routeRouter[routerMethod] === 'function') {
                    routeRouter[routerMethod]('/', wrapHandler(handler));
                    logger.success(`[${method}] ${route}`);
                    hasRoutes = true;
                    count++;
                }
            }
        }
        // Default export
        if (typeof module.default === 'function') {
            routeRouter.get('/', wrapHandler(module.default));
            logger.success(`[GET] ${route}`);
            hasRoutes = true;
            count++;
        }
        if (hasRoutes) {
            app.use(route, routeRouter);
        }
    }
    return count;
}

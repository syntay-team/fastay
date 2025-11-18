import path from 'path';
import fs from 'fs';
import { pathToFileURL } from 'url';
import { logger } from './logger.js';
import { wrapMiddleware } from './utils/wrapMiddleware.js';
/**
 * Creates a Fastay middleware loader.
 *
 * Fastay uses this internally to attach user-defined middleware to the
 * Express application during boot. The framework automatically discovers
 * and loads any `middleware` exported from the project's `src/` directory.
 *
 * Middleware functions are wrapped so both synchronous and asynchronous
 * handlers behave consistently.
 *
 * @param map - A map of route prefixes and the middleware stack for each route.
 * @returns A function that Fastay will call to register the mapped middleware.
 *
 * @example
 * ```ts
 * export const middleware = createMiddleware({
 *   '/auth': [authMiddleware],
 *   '/admin': [adminGuard, auditLogger]
 * });
 * ```
 */
export function createMiddleware(map) {
    return (app) => {
        for (const [route, middlewares] of Object.entries(map)) {
            for (const mw of middlewares) {
                const wrapped = wrapMiddleware(mw);
                app.use(route, wrapped);
            }
        }
    };
}
export async function loadFastayMiddlewares(app) {
    const isDev = process.env.NODE_ENV !== 'production';
    const mwDir = path.resolve(process.cwd(), isDev ? 'src/middlewares' : 'dist/middlewares');
    const file = path.join(mwDir, isDev ? 'middleware.ts' : 'middleware.js');
    if (!fs.existsSync(file))
        return;
    const mod = await import(pathToFileURL(file).href);
    if (!mod.middleware)
        return;
    logger.group('Fastay Auto-Middlewares');
    if (typeof mod.middleware === 'function') {
        mod.middleware(app);
        logger.info('Loading Fastay core middleware...');
    }
    else {
        const map = mod.middleware;
        for (const [route, middlewares] of Object.entries(map)) {
            for (const mw of middlewares) {
                app.use(route, mw);
            }
        }
    }
}

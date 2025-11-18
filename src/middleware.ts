import { Application, Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';
import { pathToFileURL } from 'url';
import { logger } from './logger.js';
import { wrapMiddleware } from './utils/wrapMiddleware.js';

type MiddlewareFn = (req: Request, res: Response, next: NextFunction) => any;

/**
 * Defines a map of routes and the middleware functions that Fastay
 * will automatically load and attach during boot.
 *
 * Keys represent route prefixes (e.g. `/auth`, `/admin`), and
 * values are arrays of Fastay middleware functions.
 *
 * Middleware functions use Fastay’s extended `Request`, `Response`,
 * and `Next` types — not the raw Express versions.
 *
 * @example
 * ```ts
 * // src/middleware.ts
 * import { createMiddleware } from '@syntay/fastay';
 * import { authMiddleware } from './auth';
 * import { auditLogger } from './audit';
 *
 * export const middleware = createMiddleware({
 *   '/auth': [authMiddleware],
 *   '/admin': [auditLogger]
 * });
 * ```
 *
 * @example
 * ```ts
 * // src/auth.ts
 * import { Request, Response, Next } from '@syntay/fastay';
 *
 * export async function authMiddleware(req: Request, _res: Response, next: Next) {
 *   // Custom logic using extended Fastay types
 *   req.user = { id: 1, role: "admin" };
 *   next();
 * }
 * ```
 */
export type MiddlewareMap = Record<string, MiddlewareFn[]>;

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
export function createMiddleware(map: Record<string, MiddlewareFn[]>) {
  return (app: Application) => {
    for (const [route, middlewares] of Object.entries(map)) {
      for (const mw of middlewares) {
        const wrapped = wrapMiddleware(mw);

        app.use(route, wrapped);
      }
    }
  };
}

export async function loadFastayMiddlewares(app: Application) {
  const isDev = process.env.NODE_ENV !== 'production';
  const mwDir = path.resolve(
    process.cwd(),
    isDev ? 'src/middlewares' : 'dist/middlewares'
  );

  const file = path.join(mwDir, isDev ? 'middleware.ts' : 'middleware.js');
  if (!fs.existsSync(file)) return;

  const mod = await import(pathToFileURL(file).href);

  if (!mod.middleware) return;

  logger.group('Fastay Auto-Middlewares');

  if (typeof mod.middleware === 'function') {
    mod.middleware(app);
    logger.info('Loading Fastay core middleware...');
  } else {
    const map = mod.middleware as Record<string, any[]>;
    for (const [route, middlewares] of Object.entries(map)) {
      for (const mw of middlewares) {
        app.use(route, mw);
      }
    }
  }
}

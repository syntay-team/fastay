import { Application, Request, Response, NextFunction } from 'express';
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
export declare function createMiddleware(map: Record<string, MiddlewareFn[]>): (app: Application) => void;
export declare function loadFastayMiddlewares(app: Application): Promise<void>;
export {};
//# sourceMappingURL=middleware.d.ts.map
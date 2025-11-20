import express from 'express';
import path from 'path';
import { loadApiRoutes } from './router.js';
import { loadFastayMiddlewares, createMiddleware, } from './middleware.js';
import { logger } from './logger.js';
import { printBanner } from './banner.js';
import { RequestCookies } from './utils/cookies.js';
/**
 * Bootstraps and configures a Fastay application.
 *
 * Fastay automatically:
 * - Discovers and registers routes defined in `apiDir`.
 * - Applies both built-in and user-provided middlewares.
 * - Exposes a health-check endpoint at `/_health`.
 *
 * @param opts - Configuration options for the Fastay application.
 * @returns A Promise that resolves to an Express `Application` instance.
 *
 * @example
 * ```ts
 * import { createApp } from '@syntay/fastay';
 * import cors from 'cors';
 * import helmet from 'helmet';
 *
 * void (async () => {
 *   await createApp({
 *     apiDir: './src/api',
 *     baseRoute: '/api',
 *     port: 5555,
 *     expressOptions: {
 *       middlewares: [cors(), helmet()],
 *     },
 *   });
 * })();
 * ```
 */
export async function createApp(opts) {
    const start = logger.timeStart();
    printBanner();
    // logger.group('Fastay');
    logger.info('Initializing server...');
    const apiDir = opts?.apiDir ?? path.resolve(process.cwd(), 'src', 'api');
    const baseRoute = opts?.baseRoute ?? '/api';
    logger.success(`API directory: ${apiDir}`);
    logger.success(`Base route: ${baseRoute}`);
    const app = express();
    if (opts?.expressOptions) {
        for (const [key, value] of Object.entries(opts.expressOptions)) {
            // Se for array → assume middleware global
            if (Array.isArray(value)) {
                value.forEach((mw) => app.use(mw));
            }
            // Se o app tiver método com esse nome
            else if (typeof app[key] === 'function') {
                // TS-safe
                app[key](value);
            }
            // special cases
            else if (key === 'static' && value && typeof value === 'object') {
                const v = value;
                app.use(express.static(v.path, v.options));
            }
            else if (key === 'jsonOptions') {
                app.use(express.json(value));
            }
            else if (key === 'urlencodedOptions') {
                app.use(express.urlencoded(value));
            }
        }
    }
    app.use(express.json());
    const defaltPort = opts?.port ? opts.port : 6000;
    app.listen(defaltPort, () => {
        logger.success(`Server running at http://localhost:${defaltPort}${baseRoute}`);
    });
    // external middlewares
    if (opts?.expressOptions?.middlewares) {
        logger.group('Express Middlewares');
        for (const mw of opts.expressOptions.middlewares) {
            logger.gear(`Loaded: ${mw.name || 'anonymous'}`);
            app.use(mw);
        }
    }
    // Fastay middlewares
    if (opts?.middlewares) {
        logger.group('Fastay Middlewares');
        const apply = createMiddleware(opts.middlewares);
        apply(app);
    }
    // automatic middlewares
    // logger.group('Fastay Auto-Middlewares');
    const isMiddleware = await loadFastayMiddlewares(app);
    // health check
    app.get('/_health', (_, res) => res.json({ ok: true }));
    app.use((req, res, next) => {
        res.setHeader('X-Powered-By', 'Syntay Engine');
        req.cookies = new RequestCookies(req.headers.cookie);
        next();
    });
    // load routes
    // logger.group('Routes Loaded');
    const totalRoutes = await loadApiRoutes(app, baseRoute, apiDir);
    logger.success(`Total routes loaded: ${totalRoutes}`);
    // app.use(errorHandler);
    const time = logger.timeEnd(start);
    logger.success(`Boot completed in ${time}ms`);
    return app;
}

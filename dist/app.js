import express from 'express';
import { createServer } from 'node:http';
import path from 'path';
import { loadApiRoutes } from './router.js';
import { loadFastayMiddlewares, createMiddleware, } from './middleware.js';
import { logger } from './logger.js';
import { printBanner } from './banner.js';
import { RequestCookies } from './utils/cookies.js';
import { formDataMiddleware } from './utils/formDataMiddleware.js';
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
/** pre-compiled CORS */
function createCorsHandler(opts) {
    if (!opts)
        return null;
    const { allowAnyOrigin = false, cookieOrigins = [], credentials = false, methods = 'GET,POST,PUT,PATCH,DELETE,OPTIONS', headers = 'Content-Type, Authorization', exposedHeaders, maxAge, } = opts;
    return (req, res, next) => {
        // Determine the origin in an optimized way.
        let origin = '*';
        if (credentials && cookieOrigins.length > 0) {
            const requestOrigin = req.headers.origin;
            if (requestOrigin && cookieOrigins.includes(requestOrigin)) {
                origin = requestOrigin;
            }
            else {
                origin = '';
            }
        }
        else if (!credentials && allowAnyOrigin) {
            origin = '*';
        }
        const corsHeaders = {
            'Access-Control-Allow-Origin': origin,
            'Access-Control-Allow-Credentials': credentials ? 'true' : 'false',
            'Access-Control-Allow-Methods': methods,
            'Access-Control-Allow-Headers': headers,
        };
        if (exposedHeaders) {
            corsHeaders['Access-Control-Expose-Headers'] = exposedHeaders;
        }
        if (maxAge) {
            corsHeaders['Access-Control-Max-Age'] = maxAge.toString();
        }
        for (const [key, value] of Object.entries(corsHeaders)) {
            res.setHeader(key, value);
        }
        if (req.method === 'OPTIONS') {
            return res.sendStatus(204);
        }
        next();
    };
}
export async function createApp(opts) {
    const start = logger.timeStart();
    printBanner();
    // logger.group('Fastay');
    logger.info('Initializing server...');
    const apiDir = opts?.apiDir ?? path.resolve(process.cwd(), 'src', 'api');
    const baseRoute = opts?.baseRoute ?? '/api';
    const port = opts?.port ?? 5000;
    logger.success(`API directory: ${apiDir}`);
    logger.success(`Base route: ${baseRoute}`);
    const app = express();
    const server = createServer(app);
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
    server.listen(port, () => {
        logger.success(`Server running at http://localhost:${port}${baseRoute}`);
    });
    // CORS handler pré-compilado
    const corsHandler = createCorsHandler(opts?.enableCors);
    if (corsHandler) {
        app.use(corsHandler);
    }
    // FormData middleware
    app.use(formDataMiddleware());
    // Fastay middlewares
    if (opts?.middlewares) {
        logger.group('Fastay Middlewares');
        const apply = createMiddleware(opts.middlewares);
        apply(app);
    }
    // Auto middlewares
    await loadFastayMiddlewares(app);
    // Health check otimizado
    app.get('/health', (_, res) => {
        res.setHeader('Content-Type', 'application/json');
        res.send('{"ok":true}');
    });
    // external middlewares
    if (opts?.expressOptions?.middlewares) {
        logger.group('Express Middlewares');
        for (const mw of opts.expressOptions.middlewares) {
            logger.gear(`Loaded: ${mw.name || 'anonymous'}`);
            app.use(mw);
        }
    }
    // FormData middleware
    app.use(formDataMiddleware());
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
        const corsOpts = opts?.enableCors || {};
        // Determina a origem
        let origin = '*';
        if (corsOpts.credentials && corsOpts.cookieOrigins?.length) {
            // Se a origem estiver na lista de cookieOrigins, permite cookies
            if (req.headers.origin &&
                corsOpts.cookieOrigins.includes(req.headers.origin)) {
                origin = req.headers.origin;
            }
            else {
                origin = ''; // bloqueia cookies para outras origens
            }
        }
        else if (!corsOpts.credentials && corsOpts.allowAnyOrigin) {
            origin = '*';
        }
        res.setHeader('Access-Control-Allow-Origin', origin);
        res.setHeader('Access-Control-Allow-Credentials', corsOpts.credentials ? 'true' : 'false');
        res.setHeader('Access-Control-Allow-Methods', corsOpts.methods || 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', corsOpts.headers || 'Content-Type, Authorization');
        if (corsOpts.exposedHeaders) {
            res.setHeader('Access-Control-Expose-Headers', corsOpts.exposedHeaders);
        }
        if (corsOpts.maxAge) {
            res.setHeader('Access-Control-Max-Age', corsOpts.maxAge.toString());
        }
        if (req.method === 'OPTIONS')
            return res.sendStatus(204);
        next();
    });
    app.use((req, res, next) => {
        res.setHeader('X-Powered-By', 'Syntay Engine');
        // Cookies parsing otimizado
        req.cookies = new RequestCookies(req.headers.cookie);
        next();
    });
    // Carregamento de rotas
    const totalRoutes = await loadApiRoutes(app, baseRoute, apiDir);
    // Error handler deve vir depois das rotas
    if (opts?.expressOptions?.errorHandler) {
        app.use(opts.expressOptions.errorHandler);
    }
    else {
        // Error handler padrão otimizado
        app.use((err, req, res, next) => {
            logger.error(`Unhandled Error [${req.method} ${req.path}]: ${err.message}`);
            res.status(500).json({
                error: 'Internal Server Error',
                ...(process.env.NODE_ENV === 'development' && { detail: err.message }),
            });
        });
    }
    // // load routes
    // // logger.group('Routes Loaded');
    // const totalRoutes = await loadApiRoutes(app, baseRoute, apiDir);
    // 404 handler otimizado - CORRIGIDO: Não usar '*'
    app.use((req, res) => {
        res.status(404).json({
            error: 'Not Found',
            path: req.originalUrl,
        });
    });
    // server.listen(port);
    // app.use(errorHandler);
    const time = logger.timeEnd(start);
    logger.success(`Total routes loaded: ${totalRoutes}`);
    logger.success(`Boot completed in ${time}ms`);
    if (process.env.NODE_ENV === 'development') {
        const used = process.memoryUsage();
        logger.info(`Memory: ${Math.round(used.heapUsed / 1024 / 1024)}MB`);
    }
    return { app, server };
}

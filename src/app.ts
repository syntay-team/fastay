import express from 'express';
import path from 'path';
import { loadApiRoutes } from './router.js';
import {
  MiddlewareMap,
  loadFastayMiddlewares,
  createMiddleware,
} from './middleware.js';
import { logger } from './logger.js';
import { printBanner } from './banner.js';
import type { ServeStaticOptions } from 'serve-static';
import { Next, Request, Response } from './types/index.js';
import { RequestCookies } from './utils/cookies.js';

/**
 * Express configuration options applied automatically by Fastay
 * before internal middleware and route loading.
 */
export interface ExpressOptions {
  /**
   * Global middlewares applied to all routes.
   * Example: [cors(), helmet()]
   */
  middlewares?: express.RequestHandler[];

  /**
   * Options passed to express.json().
   * Useful for customizing JSON payload limits or behavior.
   */
  jsonOptions?: Parameters<typeof express.json>[0];

  /**
   * Options passed to express.urlencoded().
   * Useful when handling form submissions or URL-encoded bodies.
   */
  urlencodedOptions?: Parameters<typeof express.urlencoded>[0];

  /**
   * Custom global error handler.
   * If provided, Fastay will use this instead of the default one.
   */
  errorHandler?: express.ErrorRequestHandler;

  /**
   * Static file serving configuration.
   * Example:
   * {
   *   path: "public",
   *   options: { maxAge: "1d" }
   * }
   */
  static?: {
    path: string;
    options?: ServeStaticOptions;
  };

  /**
   * View engine configuration for Express.
   * Example:
   * {
   *   engine: "pug",
   *   dir: "views"
   * }
   */
  views?: {
    engine: string;
    dir: string;
  };

  /**
   * Enables or disables Express' "trust proxy" mode.
   * Typically required when using reverse proxies (Nginx, Cloudflare, etc.).
   */
  trustProxy?: boolean;

  /**
   * Local variables available to all templates and responses.
   * Fastay automatically injects them into `response.locals`.
   */
  locals?: Record<string, any>;
}

/**
 * Options applied when creating a Fastay.js application.
 */
export type CreateAppOptions = {
  /**
   * Directory where API route modules are located.
   * Default: "src/api"
   */
  apiDir?: string;

  /**
   * Base route where all API routes will be mounted.
   * Default: "/api"
   */
  baseRoute?: string;

  /**
   * Port on which `.listen()` will run the server.
   * Default: 3000
   */
  port?: number;

  /**
   * Express-level configuration such as middleware, body parsers,
   * view engine, static assets, error handler, etc.
   */
  expressOptions?: ExpressOptions;

  /**
   * Internal Fastay middlewares applied after Express initialization
   * but before route mounting.
   */
  middlewares?: MiddlewareMap;
};

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
export async function createApp(opts?: CreateAppOptions) {
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
      else if (typeof (app as any)[key] === 'function') {
        // TS-safe
        ((app as any)[key] as Function)(value);
      }
      // special cases
      else if (key === 'static' && value && typeof value === 'object') {
        const v = value as { path: string; options?: any };
        app.use(express.static(v.path, v.options));
      } else if (key === 'jsonOptions') {
        app.use(express.json(value as any));
      } else if (key === 'urlencodedOptions') {
        app.use(express.urlencoded(value as any));
      }
    }
  }

  app.use(express.json());

  const defaltPort = opts?.port ? opts.port : 6000;

  app.listen(defaltPort, () => {
    logger.success(
      `Server running at http://localhost:${defaltPort}${baseRoute}`
    );
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
  app.use((req: Request, res: Response, next: Next) => {
    res.setHeader('X-Powered-By', 'Syntay Engine');
    (req as any).cookies = new RequestCookies(req.headers.cookie);
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

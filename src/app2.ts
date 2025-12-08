import express, { Request, Response, NextFunction, Router } from 'express';
import { createServer, Server } from 'node:http';
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
import { RequestCookies } from './utils/cookies.js';
import { formDataMiddleware } from './utils/formDataMiddleware.js';

/** Interfaces otimizadas */
export interface ExpressOptions {
  middlewares?: express.RequestHandler[];
  jsonOptions?: Parameters<typeof express.json>[0];
  urlencodedOptions?: Parameters<typeof express.urlencoded>[0];
  errorHandler?: express.ErrorRequestHandler;
  static?: {
    path: string;
    options?: ServeStaticOptions;
  };
  views?: {
    engine: string;
    dir: string;
  };
  trustProxy?: boolean;
  locals?: Record<string, any>;
}

export type CreateAppOptions = {
  apiDir?: string;
  baseRoute?: string;
  enableCors?: {
    allowAnyOrigin?: boolean;
    cookieOrigins?: string[];
    credentials?: boolean;
    methods?: string;
    headers?: string;
    exposedHeaders?: string;
    maxAge?: number;
  };
  port?: number;
  expressOptions?: ExpressOptions;
  middlewares?: MiddlewareMap;
};

/** CORS pré-compilado para melhor performance */
function createCorsHandler(opts?: CreateAppOptions['enableCors']) {
  if (!opts) return null;

  const {
    allowAnyOrigin = false,
    cookieOrigins = [],
    credentials = false,
    methods = 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
    headers = 'Content-Type, Authorization',
    exposedHeaders,
    maxAge,
  } = opts;

  return (req: Request, res: Response, next: NextFunction) => {
    // Determinar origem de forma otimizada
    let origin = '*';

    if (credentials && cookieOrigins.length > 0) {
      const requestOrigin = req.headers.origin;
      if (requestOrigin && cookieOrigins.includes(requestOrigin)) {
        origin = requestOrigin;
      } else {
        origin = '';
      }
    } else if (!credentials && allowAnyOrigin) {
      origin = '*';
    }

    // Set headers de uma vez
    const corsHeaders: Record<string, string> = {
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

/** Bootstrap otimizado */
export async function createApp(opts?: CreateAppOptions) {
  const start = logger.timeStart();

  // Banner apenas em desenvolvimento
  if (process.env.NODE_ENV !== 'production') {
    printBanner();
  }

  logger.info('🚀 Initializing optimized server...');

  const apiDir = opts?.apiDir ?? path.resolve(process.cwd(), 'src', 'api');
  const baseRoute = opts?.baseRoute ?? '/api';
  const port = opts?.port ?? 6000;

  logger.success(`API directory: ${apiDir}`);
  logger.success(`Base route: ${baseRoute}`);
  logger.success(`Port: ${port}`);

  // App Express com configurações otimizadas
  const app = express();
  const server: Server = createServer(app);

  // Configurações de performance do Express
  app.set('etag', 'strong'); // ETags for caching
  app.set('x-powered-by', false); // Remove header padrão
  app.set('trust proxy', opts?.expressOptions?.trustProxy ?? 1); // Para proxies

  // Configuração otimizada do Express
  if (opts?.expressOptions) {
    const expressOpts = opts.expressOptions;

    // Trust proxy primeiro
    if (expressOpts.trustProxy !== undefined) {
      app.set('trust proxy', expressOpts.trustProxy);
    }

    // Body parsers com configurações padrão otimizadas
    app.use(
      express.json(
        expressOpts.jsonOptions ?? {
          limit: '1mb',
          strict: true,
        }
      )
    );

    app.use(
      express.urlencoded(
        expressOpts.urlencodedOptions ?? {
          extended: true,
          limit: '1mb',
        }
      )
    );

    // Static files com cache headers
    if (expressOpts.static) {
      app.use(
        express.static(expressOpts.static.path, {
          ...expressOpts.static.options,
          maxAge: expressOpts.static.options?.maxAge ?? '1d',
          etag: true,
        })
      );
    }

    // View engine
    if (expressOpts.views) {
      app.set('view engine', expressOpts.views.engine);
      app.set('views', expressOpts.views.dir);
    }

    // Locals
    if (expressOpts.locals) {
      app.locals = { ...app.locals, ...expressOpts.locals };
    }

    // Middlewares globais
    if (expressOpts.middlewares?.length) {
      logger.group('Express Middlewares');
      for (const middleware of expressOpts.middlewares) {
        app.use(middleware);
        logger.gear(`Loaded: ${middleware.name || 'anonymous'}`);
      }
    }
  }

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

  // Header global otimizado
  app.use((req: Request, res: Response, next: NextFunction) => {
    res.setHeader('X-Powered-By', 'Syntay Engine');

    // Cookies parsing otimizado
    (req as any).cookies = new RequestCookies(req.headers.cookie);

    next();
  });

  // Carregamento de rotas
  const totalRoutes = await loadApiRoutes(app, baseRoute, apiDir);

  // Error handler deve vir depois das rotas
  if (opts?.expressOptions?.errorHandler) {
    app.use(opts.expressOptions.errorHandler);
  } else {
    // Error handler padrão otimizado
    app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
      logger.error(
        `Unhandled Error [${req.method} ${req.path}]: ${err.message}`
      );
      res.status(500).json({
        error: 'Internal Server Error',
        ...(process.env.NODE_ENV === 'development' && { detail: err.message }),
      });
    });
  }

  // 404 handler otimizado - CORRIGIDO: Não usar '*'
  app.use((req: Request, res: Response) => {
    res.status(404).json({
      error: 'Not Found',
      path: req.originalUrl,
    });
  });

  // Inicialização do servidor
  server.listen(port, () => {
    const time = logger.timeEnd(start);
    logger.success(`🚀 Server running on http://localhost:${port}${baseRoute}`);
    logger.success(`📊 Total routes: ${totalRoutes}`);
    logger.success(`⚡ Boot completed in ${time}ms`);

    // Metrics de performance
    if (process.env.NODE_ENV === 'development') {
      const used = process.memoryUsage();
      logger.info(`💾 Memory: ${Math.round(used.heapUsed / 1024 / 1024)}MB`);
    }
  });

  // Graceful shutdown
  process.on('SIGTERM', () => {
    logger.info('🛑 Received SIGTERM, shutting down gracefully');
    server.close(() => {
      logger.info('✅ Server closed');
      process.exit(0);
    });
  });

  return { app, server };
}

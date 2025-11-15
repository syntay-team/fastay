import express from 'express';
import path from 'path';
import { loadApiRoutes } from './router';
import {
  MiddlewareMap,
  loadFastayMiddlewares,
  createMiddleware,
} from './middleware';
import { logger } from './logger';
import { printBanner } from './banner';

export type CreateAppOptions = {
  apiDir?: string;
  baseRoute?: string;
  expressOptions?: any;
  middlewares?: MiddlewareMap;
};

export async function createApp(opts?: CreateAppOptions) {
  const start = logger.timeStart();

  printBanner();

  // logger.group('Fastay');
  logger.info('Initializing server...');

  const apiDir = opts?.apiDir ?? path.resolve(process.cwd(), 'src', 'api');
  const baseRoute = opts?.baseRoute ?? '/api';

  logger.success(`API directory: ${apiDir}`);
  logger.success(`Base route: ${baseRoute}`);
  logger.success(
    `Local: http://localhost:${process.env.PORT || 5000}${baseRoute}`
  );

  const app = express();
  app.use(express.json());

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
  logger.group('Fastay Auto-Middlewares');
  await loadFastayMiddlewares(app);

  // health check
  app.get('/_health', (_, res) => res.json({ ok: true }));

  // load routes
  // logger.group('Routes Loaded');
  const totalRoutes = await loadApiRoutes(app, apiDir, baseRoute);
  logger.success(`Total routes loaded: ${totalRoutes}`);

  const time = logger.timeEnd(start);
  logger.success(`Boot completed in ${time}ms`);

  return app;
}

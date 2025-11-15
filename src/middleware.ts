import { Application, Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';
import { pathToFileURL } from 'url';
import { logger } from './logger';
import { log } from 'console';
import { wrapMiddleware } from './utils/wrapMiddleware';

type MiddlewareFn = (req: Request, res: Response, next: NextFunction) => any;

export type MiddlewareMap = Record<string, MiddlewareFn[]>;

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
  const mwDir = path.resolve(process.cwd(), 'src', 'middlewares');

  if (!fs.existsSync(mwDir)) return;

  const file = path.join(mwDir, 'middleware.ts');
  if (!fs.existsSync(file)) return;

  const mod = await import(pathToFileURL(file).href);

  if (!mod.middleware) return;

  if (typeof mod.middleware === 'function') {
    // Se for função, chama passando o app
    mod.middleware(app);
    logger.info('Loading Fastay core middleware...');
  } else {
    // Suporte antigo (mapa de rotas)
    const map = mod.middleware as Record<string, any[]>;
    for (const [route, middlewares] of Object.entries(map)) {
      for (const mw of middlewares) {
        app.use(route, mw);
      }
    }
  }
}

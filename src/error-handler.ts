import { Request, Response, NextFunction } from 'express';
import { logger } from './logger';

export function errorHandler(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) {
  const status = err?.status || 500;
  const msg = err?.message || 'Erro desconhecido';

  logger.error(`✗ Runtime Error [${req.method} ${req.originalUrl}]: ${msg}`);

  if (process.env.NODE_ENV === 'production') {
    return res.status(status).json({ error: 'Erro interno no servidor' });
  }

  return res.status(status).json({
    error: msg,
    stack: err?.stack,
    route: `${req.method} ${req.originalUrl}`,
  });
}

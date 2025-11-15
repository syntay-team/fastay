import { Request, Response, NextFunction } from 'express';
import { logger } from '../logger';

export type MiddlewareFn = (
  req: Request,
  res: Response,
  next: NextFunction
) => any;

const color = {
  cyan: (s: string) => `\x1b[36m${s}\x1b[0m`,
  gray: (s: string) => `\x1b[90m${s}\x1b[0m`,
  red: (s: string) => `\x1b[31m${s}\x1b[0m`,
  yellow: (s: string) => `\x1b[33m${s}\x1b[0m`,
  green: (s: string) => `\x1b[32m${s}\x1b[0m`,
  white: (s: string) => `\x1b[37m${s}\x1b[0m`,
};

/**
 * Formata uma função para exibição bonitinha
 */
function formatFunction(fn: Function): string {
  let code = fn.toString();

  // deixa com quebras de linha
  code = code.replace(/;/g, ';\n');

  // tenta dar indentação
  code = code
    .replace(/{/g, '{\n  ')
    .replace(/}/g, '\n}')
    .replace(/\n\s*\n/g, '\n');

  return code.trim();
}

/**
 * Verifica se next() ou return existem
 */
function validateMiddlewareCode(mw: MiddlewareFn) {
  const raw = mw.toString();
  const name = mw.name || 'anonymous';

  const cleaned = raw
    .replace(/\/\/.*$/gm, '')
    .replace(/\/\*[\s\S]*?\*\//gm, '');

  const hasNext = /next\s*\(/.test(cleaned);
  const hasReturn = /\breturn\b/.test(cleaned);

  if (!hasNext && !hasReturn) {
    const prettyCode = formatFunction(mw);

    const message = [
      `${color.red('⨯ Fastay Middleware Error')}`,
      ``,
      `The middleware ${color.yellow(
        `"${name}"`
      )} does not call next() or return any value.`,
      `This will halt the middleware chain and block the request pipeline.`,
      ``,
      `▌ Middleware Source`,
      color.gray(prettyCode),
      ``,
      `${color.cyan('▌ How to fix')}`,
      `Ensure your middleware ends with either:`,
      `  • ${color.green('next()')}`,
      `  • ${color.green('return ...')}`,
      ``,
      `Fastay cannot continue until this middleware is fixed.`,
    ].join('\n');

    const err = new Error(message);
    err.name = 'FastayMiddlewareError';
    throw err;
  }
}

/**
 * Wrapper final
 */
export function wrapMiddleware(mw: MiddlewareFn): MiddlewareFn {
  const name = mw.name || 'anonymous';
  validateMiddlewareCode(mw);

  // retorna middleware "puro"
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      await mw(req, res, next);
    } catch (err) {
      logger.error(`[${name}] middleware error: ${err}`);
      next(err);
    }
  };
}

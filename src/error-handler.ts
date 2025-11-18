import { Request, Response, NextFunction } from 'express';
import { logger } from './logger';
import fs from 'fs';

export function errorHandler(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) {
  const isSyntaxError =
    err.name === 'SyntaxError' || err.message?.includes('Unexpected');
  const route = `${req.method} ${req.originalUrl}`;

  // Tenta extrair arquivo, linha e coluna (quando stack estiver presente)
  let fileInfo = '';
  if (err.stack) {
    const stackLine = err.stack.split('\n')[1]; // pega primeira linha depois do erro
    const match = stackLine.match(/\((.*):(\d+):(\d+)\)/);
    if (match) {
      const [_, file, line, col] = match;
      fileInfo = `${file}:${line}:${col}`;

      // Tenta mostrar o trecho da linha que deu erro
      if (fs.existsSync(file)) {
        const codeLines = fs.readFileSync(file, 'utf-8').split('\n');
        const codeSnippet = codeLines[parseInt(line) - 1].trim();
        fileInfo += ` → ${codeSnippet}`;
      }
    }
  }

  logger.group(`✗ Runtime Error in route [${route}]`);
  logger.error(`${err.name}: ${err.message}`);
  if (fileInfo) logger.error(`Location: ${fileInfo}`);

  if (process.env.NODE_ENV === 'production') {
    return res.status(500).json({
      error: 'Internal server error',
    });
  }

  return res.status(500).json({
    error: err.message,
    stack: err.stack,
    file: fileInfo || undefined,
  });
}

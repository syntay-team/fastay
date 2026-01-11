import { Request, Response, NextFunction } from "express";
/**
 * Handler de erros otimizado para Fastay
 */
export declare function errorHandler(err: any, req: Request, res: Response, next: NextFunction): void | Response<any, Record<string, any>>;
/**
 * Factory para criar error handlers customizados
 */
export declare function createErrorHandler(options?: {
    logDetails?: boolean;
    includeStack?: boolean;
    customMessages?: Record<string, string>;
}): (err: any, req: Request, res: Response, next: NextFunction) => void;
//# sourceMappingURL=error-handler.d.ts.map
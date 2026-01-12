import { Request, Response, NextFunction } from "express";
/**
 * Handler error
 */
export declare function errorHandler(err: any, req: Request, res: Response, next: NextFunction): void | Response<any, Record<string, any>>;
/**
 * Factory
 */
export declare function createErrorHandler(options?: {
    logDetails?: boolean;
    includeStack?: boolean;
    customMessages?: Record<string, string>;
}): (err: any, req: Request, res: Response, next: NextFunction) => void;
//# sourceMappingURL=error-handler.d.ts.map
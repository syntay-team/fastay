import { Request, Response, NextFunction } from 'express';
export type MiddlewareFn = (req: Request, res: Response, next: NextFunction) => any;
/**
 * Wrapper final
 */
export declare function wrapMiddleware(mw: MiddlewareFn): MiddlewareFn;

import { Application, Request, Response, NextFunction } from 'express';
type MiddlewareFn = (req: Request, res: Response, next: NextFunction) => any;
export type MiddlewareMap = Record<string, MiddlewareFn[]>;
export declare function createMiddleware(map: Record<string, MiddlewareFn[]>): (app: Application) => void;
export declare function loadFastayMiddlewares(app: Application): Promise<void>;
export {};

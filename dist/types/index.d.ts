import './express';
import { Response as ExpressResponse, NextFunction } from 'express';
export type Response = ExpressResponse;
export type Next = NextFunction;
declare global {
    type FastayResponse = {
        status?: number;
        body?: any;
        cookies?: Record<string, {
            value: string;
            options?: any;
        }>;
        headers?: Record<string, string>;
        redirect?: string;
        file?: {
            path: string;
            filename?: string;
            options?: any;
        };
        stream?: NodeJS.ReadableStream;
        raw?: Buffer | string;
    };
}
export type RouteHandler = (() => FastayResponse | any) | ((req: Request) => FastayResponse | any) | ((req: Request, res: Response) => FastayResponse | any);
//# sourceMappingURL=index.d.ts.map
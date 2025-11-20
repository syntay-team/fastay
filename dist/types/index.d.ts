import { Request as ExpressRequest, Response as ExpressResponse, NextFunction } from 'express';
import { RequestCookies } from './fastay';
export type Request = ExpressRequest;
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
export interface CookieItem {
    value: string;
}
declare module 'express-serve-static-core' {
    interface Request {
        typedCookies: RequestCookies | any;
    }
}

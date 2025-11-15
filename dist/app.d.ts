import { MiddlewareMap } from './middleware';
export type CreateAppOptions = {
    apiDir?: string;
    baseRoute?: string;
    expressOptions?: any;
    middlewares?: MiddlewareMap;
};
export declare function createApp(opts?: CreateAppOptions): Promise<import("express-serve-static-core").Express>;

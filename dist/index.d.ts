import { Application } from 'express';
export type CreateAppOptions = {
    apiDir?: string;
    baseRoute?: string;
    expressOptions?: any;
};
/**
 * Load routes from apiDir: will import each file and mount exported handlers.
 */
export declare function loadApiRoutes(app: Application, apiDir: string, baseRoute: string): Promise<void>;
/**
 * Create an express app wired with file-based API routes
 */
export declare function createApp(opts?: CreateAppOptions): Promise<import("express-serve-static-core").Express>;

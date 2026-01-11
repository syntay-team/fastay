import express from "express";
import { Server } from "node:http";
import { MiddlewareMap } from "./middleware.js";
import type { ServeStaticOptions } from "serve-static";
/**
 * Express configuration options applied automatically by Fastay
 * before internal middleware and route loading.
 */
export interface ExpressOptions {
    /**
     * Global middlewares applied to all routes.
     * Example: [cors(), helmet()]
     */
    middlewares?: express.RequestHandler[];
    /**
     * Options passed to express.json().
     * Useful for customizing JSON payload limits or behavior.
     */
    jsonOptions?: Parameters<typeof express.json>[0];
    /**
     * Options passed to express.urlencoded().
     * Useful when handling form submissions or URL-encoded bodies.
     */
    urlencodedOptions?: Parameters<typeof express.urlencoded>[0];
    /**
     * Custom global error handler.
     * If provided, Fastay will use this instead of the default one.
     */
    errorHandler?: express.ErrorRequestHandler;
    /**
     * Static file serving configuration.
     * Example:
     * {
     *   path: "public",
     *   options: { maxAge: "1d" }
     * }
     */
    static?: {
        path: string;
        options?: ServeStaticOptions;
    };
    /**
     * View engine configuration for Express.
     * Example:
     * {
     *   engine: "pug",
     *   dir: "views"
     * }
     */
    views?: {
        engine: string;
        dir: string;
    };
    /**
     * Enables or disables Express' "trust proxy" mode.
     * Typically required when using reverse proxies (Nginx, Cloudflare, etc.).
     */
    trustProxy?: boolean;
    /**
     * Local variables available to all templates and responses.
     * Fastay automatically injects them into `response.locals`.
     */
    locals?: Record<string, any>;
}
/**
 * Options applied when creating a Fastay.js application.
 */
export type CreateAppOptions = {
    /**
     * Directory where API route modules are located.
     * Default: "src/api"
     */
    apiDir?: string;
    /**
     * Base route where all API routes will be mounted.
     * Default: "/api"
     */
    baseRoute?: string;
    /**
     * Configuration to enable CORS (Cross-Origin Resource Sharing) in Fastay.
     */
    enableCors?: {
        /**
         * If true, permite requisições de qualquer origem.
         * Default: false
         */
        allowAnyOrigin?: boolean;
        /**
         * List of specific origins allowed for sending cookies.
         * Example: ["http://localhost:3000", "https://mysite.com"]
         */
        cookieOrigins?: string[];
        /**
         * If true, enables cross-origin cookie sending.
         * Default: false
         */
        credentials?: boolean;
        /**
         * List of allowed HTTP methods, separated by commas.
         * Default: "GET,POST,PUT,PATCH,DELETE,OPTIONS"
         */
        methods?: string;
        /**
         * List of headers allowed in the request.
         * Default: "Content-Type, Authorization"
         */
        headers?: string;
        /**
         * Headers displayed to the customer.
         * Example: ["X-Custom-Header"]
         */
        exposedHeaders?: string;
        /**
         * Maximum cache time for preflight requests, in seconds.
         */
        maxAge?: number;
    };
    /**
     * Port on which `.listen()` will run the server.
     * Default: 3000
     */
    port?: number;
    /**
     * Express-level configuration such as middleware, body parsers,
     * view engine, static assets, error handler, etc.
     */
    expressOptions?: ExpressOptions;
    /**
     * Internal Fastay middlewares applied after Express initialization
     * but before route mounting.
     */
    middlewares?: MiddlewareMap;
    /**
     * Controls the display of the X-Powered-By header in HTTP responses.
     *
     * **With `powered: true` (default):
     **/
    powered?: boolean;
};
export declare function createApp(opts?: CreateAppOptions): Promise<{
    app: import("express-serve-static-core").Express;
    server: Server<typeof import("http").IncomingMessage, typeof import("http").ServerResponse>;
}>;
//# sourceMappingURL=app.d.ts.map
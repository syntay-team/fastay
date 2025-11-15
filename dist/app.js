"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createApp = createApp;
const express_1 = __importDefault(require("express"));
const path_1 = __importDefault(require("path"));
const router_1 = require("./router");
const middleware_1 = require("./middleware");
const logger_1 = require("./logger");
const banner_1 = require("./banner");
async function createApp(opts) {
    const start = logger_1.logger.timeStart();
    (0, banner_1.printBanner)();
    // logger.group('Fastay');
    logger_1.logger.info('Initializing server...');
    const apiDir = opts?.apiDir ?? path_1.default.resolve(process.cwd(), 'src', 'api');
    const baseRoute = opts?.baseRoute ?? '/api';
    logger_1.logger.success(`API directory: ${apiDir}`);
    logger_1.logger.success(`Base route: ${baseRoute}`);
    logger_1.logger.success(`Local: http://localhost:${process.env.PORT || 5000}${baseRoute}`);
    const app = (0, express_1.default)();
    app.use(express_1.default.json());
    // external middlewares
    if (opts?.expressOptions?.middlewares) {
        logger_1.logger.group('Express Middlewares');
        for (const mw of opts.expressOptions.middlewares) {
            logger_1.logger.gear(`Loaded: ${mw.name || 'anonymous'}`);
            app.use(mw);
        }
    }
    // Fastay middlewares
    if (opts?.middlewares) {
        logger_1.logger.group('Fastay Middlewares');
        const apply = (0, middleware_1.createMiddleware)(opts.middlewares);
        apply(app);
    }
    // automatic middlewares
    logger_1.logger.group('Fastay Auto-Middlewares');
    await (0, middleware_1.loadFastayMiddlewares)(app);
    // health check
    app.get('/_health', (_, res) => res.json({ ok: true }));
    // load routes
    // logger.group('Routes Loaded');
    const totalRoutes = await (0, router_1.loadApiRoutes)(app, apiDir, baseRoute);
    logger_1.logger.success(`Total routes loaded: ${totalRoutes}`);
    const time = logger_1.logger.timeEnd(start);
    logger_1.logger.success(`Boot completed in ${time}ms`);
    return app;
}

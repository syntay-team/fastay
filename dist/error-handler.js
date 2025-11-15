"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = errorHandler;
const logger_1 = require("./logger");
function errorHandler(err, req, res, next) {
    const status = err?.status || 500;
    const msg = err?.message || 'Erro desconhecido';
    logger_1.logger.error(`✗ Runtime Error [${req.method} ${req.originalUrl}]: ${msg}`);
    if (process.env.NODE_ENV === 'production') {
        return res.status(status).json({ error: 'Erro interno no servidor' });
    }
    return res.status(status).json({
        error: msg,
        stack: err?.stack,
        route: `${req.method} ${req.originalUrl}`,
    });
}

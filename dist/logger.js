"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = void 0;
const pino_1 = __importDefault(require("pino"));
const pino_pretty_1 = __importDefault(require("pino-pretty"));
// stream configurado para remover INFO:, timestamps e etc
const stream = (0, pino_pretty_1.default)({
    colorize: true,
    ignore: 'pid,hostname,time,level',
    levelFirst: false,
    // Remove "INFO: " antes da msg
    messageKey: 'msg',
    // Maneira correta TS-safe
    messageFormat: (log, messageKey) => {
        const msg = log[messageKey];
        return typeof msg === 'string' ? msg : String(msg);
    },
});
const base = (0, pino_1.default)({
    level: 'info',
    timestamp: false, // remove [HH:mm:ss]
    base: undefined, // remove pid, hostname
}, stream);
// helpers para cores ANSI
const colors = {
    white: (s) => `\x1b[37m${s}\x1b[0m`,
    green: (s) => `\x1b[32m${s}\x1b[0m`,
    red: (s) => `\x1b[31m${s}\x1b[0m`,
    cyan: (s) => `\x1b[36m${s}\x1b[0m`,
    gray: (s) => `\x1b[90m${s}\x1b[0m`,
};
// emojis Fastay
const ICONS = {
    info: '○',
    success: '✓',
    error: '✗',
    gear: '⚙️',
};
exports.logger = {
    info: (msg) => base.info(` ${colors.white(ICONS.info)} ${colors.white(msg)}`),
    warn: (msg) => base.info(` ${colors.red('⚠')} ${colors.white(msg)}`),
    error: (msg) => base.info(` ${colors.red(ICONS.error)} ${colors.white(msg)}`),
    success: (msg) => base.info(` ${colors.green(ICONS.success)} ${colors.white(msg)}`),
    gear: (msg) => base.info(` ${ICONS.gear}  ${colors.white(msg)}`),
    space(lines = 1) {
        for (let i = 0; i < lines; i++)
            base.info(' ');
    },
    group(title) {
        this.space();
        base.info('');
        base.info(colors.cyan(title));
        // this.space();
    },
    raw(msg) {
        base.info(msg);
    },
    timeStart() {
        return performance.now();
    },
    timeEnd(start) {
        return (performance.now() - start).toFixed(1);
    },
};

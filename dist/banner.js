"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.printBanner = printBanner;
const logger_1 = require("./logger");
function printBanner() {
    const cyan = (s) => `\x1b[36m${s}\x1b[0m`;
    const white = (s) => `\x1b[37m${s}\x1b[0m`;
    logger_1.logger.raw('');
    logger_1.logger.raw(`${cyan('⥨ Fastay.js')} ${white('1.0.0')}`);
    logger_1.logger.raw(`  ${white('- Runtime: Node.js\n')}`);
    // logger.raw('\n');
}

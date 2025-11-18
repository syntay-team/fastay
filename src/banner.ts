import { logger } from './logger.js';

export function printBanner() {
  const cyan = (s: string) => `\x1b[36m${s}\x1b[0m`;
  const white = (s: string) => `\x1b[37m${s}\x1b[0m`;

  logger.raw('');
  logger.raw(`${cyan('⥨ Fastay.js')} ${white('1.0.0')}`);
  logger.raw(`  ${white('- Runtime: Node.js\n')}`);
  // logger.raw('\n');
}

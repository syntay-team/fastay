import pino, { LogDescriptor } from 'pino';
import pretty, { PrettyOptions } from 'pino-pretty';

// stream configurado para remover INFO:, timestamps e etc
const stream = pretty({
  colorize: true,
  ignore: 'pid,hostname,time,level',
  levelFirst: false,

  // Remove "INFO: " antes da msg
  messageKey: 'msg',

  // Maneira correta TS-safe
  messageFormat: (log: LogDescriptor, messageKey: string) => {
    const msg = log[messageKey];
    return typeof msg === 'string' ? msg : String(msg);
  },
} as PrettyOptions);

const base = pino(
  {
    level: 'info',
    timestamp: false, // remove [HH:mm:ss]
    base: undefined, // remove pid, hostname
  },
  stream
);

// helpers para cores ANSI
const colors = {
  white: (s: string) => `\x1b[37m${s}\x1b[0m`,
  green: (s: string) => `\x1b[32m${s}\x1b[0m`,
  red: (s: string) => `\x1b[31m${s}\x1b[0m`,
  cyan: (s: string) => `\x1b[36m${s}\x1b[0m`,
  gray: (s: string) => `\x1b[90m${s}\x1b[0m`,
};

// emojis Fastay
const ICONS = {
  info: '○',
  success: '✓',
  error: '✗',
  gear: '⚙️',
};

export const logger = {
  info: (msg: string) =>
    base.info(` ${colors.white(ICONS.info)} ${colors.white(msg)}`),
  warn: (msg: string) => base.info(` ${colors.red('⚠')} ${colors.white(msg)}`),
  error: (msg: string) =>
    base.info(` ${colors.red(ICONS.error)} ${colors.white(msg)}`),
  success: (msg: string) =>
    base.info(` ${colors.green(ICONS.success)} ${colors.white(msg)}`),
  gear: (msg: string) => base.info(` ${ICONS.gear}  ${colors.white(msg)}`),

  space(lines: number = 1) {
    for (let i = 0; i < lines; i++) base.info(' ');
  },

  group(title: string) {
    this.space();
    base.info('');
    base.info(colors.cyan(title));
    // this.space();
  },

  raw(msg: string) {
    base.info(msg);
  },

  timeStart() {
    return performance.now();
  },

  timeEnd(start: number) {
    return (performance.now() - start).toFixed(1);
  },
};

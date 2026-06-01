import chalk from 'chalk';

/**
 * Log level definitions with prefix and color.
 * Matches specs.md §4.1 exactly.
 */
const LEVELS = {
  info:    { prefix: 'ℹ️  [INFO]',  color: chalk.cyan },
  success: { prefix: '✅ [OK]',     color: chalk.green },
  warn:    { prefix: '⚠️  [WARN]',  color: chalk.yellow },
  error:   { prefix: '❌ [ERROR]',  color: chalk.red },
  debug:   { prefix: '🔍 [DEBUG]',  color: chalk.gray },
  step:    { prefix: '▶️  [STEP]',  color: chalk.blue },
};

/**
 * Returns the current time formatted as HH:MM:SS.
 * @returns {string} Formatted timestamp
 */
function timestamp() {
  const now = new Date();
  const hh = String(now.getHours()).padStart(2, '0');
  const mm = String(now.getMinutes()).padStart(2, '0');
  const ss = String(now.getSeconds()).padStart(2, '0');
  return `${hh}:${mm}:${ss}`;
}

/**
 * Determines whether debug logging is enabled.
 * Enabled via --debug flag or ONODECLI_DEBUG=1 env var.
 * @returns {boolean}
 */
function isDebugEnabled() {
  return process.argv.includes('--debug') || process.env.ONODECLI_DEBUG === '1';
}

/**
 * Creates a scoped logger for a specific command.
 *
 * Log format: [HH:MM:SS] <level-prefix> [<command-key>] <message>
 *
 * @param {string} commandKey - The command key used as log scope (e.g., 'app-browser')
 * @returns {Logger} Logger object with info, success, warn, error, debug, step methods
 *
 * @typedef {Object} Logger
 * @property {(msg: string) => void} info    - General status messages
 * @property {(msg: string) => void} success - Action completed successfully
 * @property {(msg: string) => void} warn    - Non-fatal issues
 * @property {(msg: string) => void} error   - Failures, exceptions
 * @property {(msg: string) => void} debug   - Verbose detail (opt-in via --debug or ONODECLI_DEBUG=1)
 * @property {(msg: string) => void} step    - Progress within a multi-step operation
 */
export function createLogger(commandKey) {
  const logger = {};

  for (const [level, { prefix, color }] of Object.entries(LEVELS)) {
    logger[level] = (message) => {
      // Skip debug messages unless debug mode is enabled
      if (level === 'debug' && !isDebugEnabled()) {
        return;
      }

      const line = `[${timestamp()}] ${prefix} [${commandKey}] ${message}`;
      // Use stderr for errors and warnings, stdout for everything else
      if (level === 'error' || level === 'warn') {
        process.stderr.write(color(line) + '\n');
      } else {
        process.stdout.write(color(line) + '\n');
      }
    };
  }

  return logger;
}

export default createLogger;

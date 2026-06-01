import { createLogger } from './logger.js';

/**
 * Determines the process exit code from an error message.
 * - "USER: ..." → exit 1 (user/input error)
 * - "SYSTEM: ..." → exit 2 (system/runtime error)
 * - All others → exit 2
 *
 * @param {Error} err - The thrown error
 * @returns {number} Exit code
 */
function resolveExitCode(err) {
  if (typeof err.message === 'string' && err.message.startsWith('USER:')) {
    return 1;
  }
  return 2;
}

/**
 * Executes a command module's run() function with error boundary.
 * Provides a scoped logger and catches all unhandled errors.
 * One command crashing MUST NOT crash the CLI shell.
 *
 * @param {string} commandKey - The command key (used for log scoping and error reporting)
 * @param {Function} runFn - The async run(args, log) function from the command module
 * @param {string[]} args - CLI args after the command key
 * @returns {Promise<void>}
 */
export async function runCommand(commandKey, runFn, args) {
  const log = createLogger(commandKey);

  try {
    await runFn(args, log);
  } catch (err) {
    const exitCode = resolveExitCode(err);
    log.error(err.message || 'Unknown error');

    if (exitCode === 1) {
      process.exitCode = 1;
    } else {
      process.exitCode = 2;
    }
  }
}

export default runCommand;

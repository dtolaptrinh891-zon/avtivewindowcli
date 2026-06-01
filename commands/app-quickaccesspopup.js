import { spawn } from 'child_process';
import path from 'path';

/**
 * Command metadata following specs.md §2.3 contract.
 */
export const meta = {
  key: 'app-quickaccesspopup',
  emoji: '⚡',
  label: 'Quick Access Popup',
  description: 'Launch or interact with QuickAccessPopup.exe or custom shortcut menus',
  args: [
    {
      name: '--launch',
      required: false,
      description: 'Launch QuickAccessPopup',
    },
    {
      name: '--path <exe-path>',
      required: false,
      description: 'Path to QuickAccessPopup.exe (overrides ONODECLI_QAP_PATH env var)',
    },
    {
      name: '--reload',
      required: false,
      description: 'Send reload signal to running QuickAccessPopup instance',
    },
  ],
  examples: [
    'onodecli app-quickaccesspopup --launch',
    'onodecli app-quickaccesspopup --launch --path "C:\\tools\\QuickAccessPopup.exe"',
    'onodecli app-quickaccesspopup --reload',
  ],
};

/**
 * Parses --path value from args array.
 * @param {string[]} args
 * @returns {string|null}
 */
function parsePathArg(args) {
  const idx = args.indexOf('--path');
  if (idx !== -1 && args[idx + 1]) {
    return args[idx + 1];
  }
  return null;
}

/**
 * Resolves the QuickAccessPopup executable path.
 * Priority: --path arg → ONODECLI_QAP_PATH env → fallback default
 * @param {string|null} argPath
 * @returns {string}
 */
function resolveExePath(argPath) {
  if (argPath) return argPath;
  if (process.env.ONODECLI_QAP_PATH) return process.env.ONODECLI_QAP_PATH;
  // Fallback common install location
  return path.win32.join(
    process.env.APPDATA || 'C:\\Users\\Default\\AppData\\Roaming',
    'QuickAccessPopup',
    'QuickAccessPopup.exe'
  );
}

/**
 * Spawns a detached process and resolves when it launches.
 * @param {string} exePath - Path to executable
 * @param {string[]} spawnArgs - Arguments
 * @returns {Promise<void>}
 */
function spawnDetached(exePath, spawnArgs) {
  return new Promise((resolve, reject) => {
    const child = spawn(exePath, spawnArgs, {
      detached: true,
      stdio: 'ignore',
      windowsHide: false,
    });

    child.on('error', (err) => {
      reject(err);
    });

    child.unref();
    resolve();
  });
}

/**
 * Runs the app-quickaccesspopup command.
 *
 * @param {string[]} args - CLI args after the command key
 * @param {import('../core/logger.js').Logger} log - Scoped logger
 * @returns {Promise<void>}
 */
export default async function run(args, log) {
  const doLaunch = args.includes('--launch');
  const doReload = args.includes('--reload');
  const argPath = parsePathArg(args);

  if (!doLaunch && !doReload) {
    throw new Error('USER: No action specified. Use --launch or --reload');
  }

  const exePath = resolveExePath(argPath);
  log.step(`Resolved executable path — ${exePath}`);

  if (doReload) {
    log.step('Sending reload signal to QuickAccessPopup');
    try {
      await spawnDetached(exePath, ['/reload']);
      log.success('Reload signal sent — QuickAccessPopup reloading');
    } catch (err) {
      throw new Error(`SYSTEM: Failed to reload QuickAccessPopup: ${err.message}`);
    }
    return;
  }

  if (doLaunch) {
    log.step('Launching QuickAccessPopup');
    try {
      await spawnDetached(exePath, []);
      log.success(`Launched popup — path: ${exePath}`);
    } catch (err) {
      throw new Error(`SYSTEM: Failed to launch QuickAccessPopup: ${err.message}`);
    }
  }
}

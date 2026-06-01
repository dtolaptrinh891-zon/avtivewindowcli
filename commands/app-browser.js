import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

/**
 * Command metadata following specs.md §2.3 contract.
 */
export const meta = {
  key: 'app-browser',
  emoji: '🌐',
  label: 'Browser Controller',
  description: 'Open URLs, focus browser, select profile',
  args: [
    {
      name: 'action',
      required: true,
      values: ['open', 'focus'],
      description: 'Action to perform: open a URL or focus existing browser window',
    },
    {
      name: '--url <url>',
      required: false,
      description: 'URL to open (required for open action)',
    },
    {
      name: '--profile <name>',
      required: false,
      description: 'Browser profile name (Chrome/Edge profile directory name)',
    },
    {
      name: '--browser <chrome|edge|firefox>',
      required: false,
      description: 'Browser to use (default: chrome)',
    },
  ],
  examples: [
    'onodecli app-browser open',
    'onodecli app-browser open --url https://example.com',
    'onodecli app-browser open --url https://example.com --profile work',
    'onodecli app-browser open --browser edge --url https://example.com',
    'onodecli app-browser focus',
    'onodecli app-browser focus --profile work',
  ],
};

/**
 * Parses a named argument value from args array.
 * @param {string[]} args
 * @param {string} flag - e.g. '--url'
 * @returns {string|null}
 */
function parseArg(args, flag) {
  const idx = args.indexOf(flag);
  if (idx !== -1 && args[idx + 1] && !args[idx + 1].startsWith('--')) {
    return args[idx + 1];
  }
  return null;
}

/**
 * Returns the Windows executable name for the given browser.
 * @param {string} browser - 'chrome' | 'edge' | 'firefox'
 * @returns {string}
 */
function getBrowserExe(browser) {
  switch (browser.toLowerCase()) {
    case 'edge':
      return 'msedge';
    case 'firefox':
      return 'firefox';
    case 'chrome':
    default:
      return 'chrome';
  }
}

/**
 * Builds browser CLI arguments for profile selection.
 * @param {string} browser
 * @param {string|null} profile
 * @returns {string}
 */
function buildProfileArg(browser, profile) {
  if (!profile) return '';
  switch (browser.toLowerCase()) {
    case 'firefox':
      return `-P "${profile}"`;
    case 'edge':
    case 'chrome':
    default:
      return `--profile-directory="${profile}"`;
  }
}

/**
 * Opens a URL using the Windows `start` command via cmd.exe.
 * @param {string} browser
 * @param {string} url
 * @param {string|null} profile
 * @returns {Promise<void>}
 */
async function openUrl(browser, url, profile) {
  const exe = getBrowserExe(browser);
  const profileArg = buildProfileArg(browser, profile);
  const cmd = profileArg
    ? `start "" "${exe}" ${profileArg} "${url}"`
    : `start "" "${exe}" "${url}"`;
  await execAsync(cmd, { shell: 'cmd.exe' });
}

/**
 * Focuses an existing browser window using PowerShell.
 * @param {string} browser
 * @returns {Promise<void>}
 */
async function focusBrowser(browser) {
  const exe = getBrowserExe(browser);
  const ps = `
$proc = Get-Process -Name "${exe}" -ErrorAction SilentlyContinue | Select-Object -First 1
if ($proc) {
  Add-Type @"
using System.Runtime.InteropServices;
public class Win32Focus {
    [DllImport("user32.dll")] public static extern bool SetForegroundWindow(System.IntPtr hWnd);
}
"@
  [Win32Focus]::SetForegroundWindow($proc.MainWindowHandle) | Out-Null
  Write-Output "focused"
} else {
  Write-Output "not-found"
}
`.trim();

  const { stdout } = await execAsync(`powershell -NoProfile -NonInteractive -Command "${ps.replace(/"/g, '\\"')}"`, {
    shell: 'cmd.exe',
  });

  if (stdout.trim() === 'not-found') {
    throw new Error(`SYSTEM: No running ${exe} process found to focus`);
  }
}

/**
 * Runs the app-browser command.
 *
 * @param {string[]} args - CLI args after the command key
 * @param {import('../core/logger.js').Logger} log - Scoped logger
 * @returns {Promise<void>}
 */
export default async function run(args, log) {
  // Remove --help since runner handles it upstream
  const filteredArgs = args.filter((a) => a !== '--help');
  const action = filteredArgs[0];

  if (!action || !['open', 'focus'].includes(action)) {
    throw new Error('USER: action is required. Values: open, focus');
  }

  const url = parseArg(filteredArgs, '--url');
  const profile = parseArg(filteredArgs, '--profile');
  const browser = parseArg(filteredArgs, '--browser') || 'chrome';

  log.step(`Action: ${action} — Browser: ${browser}`);

  if (profile) {
    log.info(`Using profile: ${profile}`);
  } else {
    log.warn('No profile specified, using default');
  }

  if (action === 'open') {
    const targetUrl = url || 'about:blank';
    log.step(`Opening URL: ${targetUrl}`);
    try {
      await openUrl(browser, targetUrl, profile);
      log.success(`Browser window opened — url: ${targetUrl}${profile ? ` — profile: ${profile}` : ''}`);
    } catch (err) {
      throw new Error(`SYSTEM: Failed to open browser: ${err.message}`);
    }
  } else if (action === 'focus') {
    log.step(`Focusing ${browser} window`);
    try {
      await focusBrowser(browser);
      log.success(`Browser focused — ${browser}${profile ? ` — profile: ${profile}` : ''}`);
    } catch (err) {
      if (err.message.startsWith('SYSTEM:')) throw err;
      throw new Error(`SYSTEM: Failed to focus browser: ${err.message}`);
    }
  }
}

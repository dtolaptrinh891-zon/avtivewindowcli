import { execFile, spawn, execSync } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import readline from 'readline';

const execFileAsync = promisify(execFile);

/**
 * Command metadata following specs.md §2.3 contract.
 */
export const meta = {
  key: 'activewin',
  emoji: '🪟',
  label: 'Active Window Inspector',
  description: 'Show info about the currently focused window (title, process, PID)',
  args: [
    {
      name: '--watch',
      required: false,
      description: 'Continuously poll every 1 second',
    },
    {
      name: '--json',
      required: false,
      description: 'Output as JSON',
    },
    {
      name: '--openurl <urls>',
      required: false,
      description: 'URL(s) to open (separated by || for multiple URLs) in running browser profiles',
    },
  ],
  examples: [
    'onodecli activewin',
    'onodecli activewin --watch',
    'onodecli activewin --json',
    'onodecli activewin --openurl="https://github.com/login"',
    'onodecli activewin --openurl="https://github.com/login||https://google.com"',
  ],
};

/**
 * PowerShell script to get active window info.
 * Returns: Title|ProcessName|Id
 */
const PS_SCRIPT = `
Add-Type @"
using System;
using System.Runtime.InteropServices;
public class Win32 {
    [DllImport("user32.dll")]
    public static extern IntPtr GetForegroundWindow();
    [DllImport("user32.dll", CharSet = CharSet.Auto)]
    public static extern int GetWindowText(IntPtr hWnd, System.Text.StringBuilder text, int count);
    [DllImport("user32.dll")]
    public static extern int GetWindowThreadProcessId(IntPtr hWnd, out int processId);
}
"@
$hwnd = [Win32]::GetForegroundWindow()
$title = New-Object System.Text.StringBuilder 256
[Win32]::GetWindowText($hwnd, $title, 256) | Out-Null
$pid = 0
[Win32]::GetWindowThreadProcessId($hwnd, [ref]$pid) | Out-Null
$proc = Get-Process -Id $pid -ErrorAction SilentlyContinue
$procName = if ($proc) { $proc.Name } else { "unknown" }
Write-Output "$($title.ToString())|$procName|$pid"
`.trim();

/**
 * Fetches active window information via PowerShell.
 * @returns {Promise<{title: string, process: string, pid: number}>}
 */
async function getActiveWindow() {
  const { stdout } = await execFileAsync(
    path.win32.join(process.env.SystemRoot || 'C:\\Windows', 'System32', 'WindowsPowerShell', 'v1.0', 'powershell.exe'),
    ['-NoProfile', '-NonInteractive', '-Command', PS_SCRIPT],
    { windowsHide: true }
  );

  const parts = stdout.trim().split('|');
  const title = parts[0] || '(no title)';
  const processName = parts[1] || 'unknown';
  const pid = parseInt(parts[2], 10) || 0;
  return { title, process: processName, pid };
}

/**
 * Parses a named argument value (supports both --name=value and --name value).
 * @param {string[]} args - The arguments array
 * @param {string} name - The name of the argument (e.g. '--openurl')
 * @returns {string|null} The argument value
 */
function getArgValue(args, name) {
  const eqPrefix = `${name}=`;
  const eqArg = args.find((a) => a.startsWith(eqPrefix));
  if (eqArg) {
    return eqArg.slice(eqPrefix.length);
  }
  const idx = args.indexOf(name);
  if (idx !== -1 && args[idx + 1] && !args[idx + 1].startsWith('--')) {
    return args[idx + 1];
  }
  return null;
}

/**
 * Extracts the user-data-dir path from a browser command line.
 * @param {string} commandLine - The raw command line string
 * @returns {string|null} The extracted path or null
 */
function extractUserDataDir(commandLine) {
  const match = commandLine.match(/--user-data-dir=["']?([^"'\s]+)["']?/i);
  return match ? match[1] : null;
}

/**
 * Normalizes backslashes and converts to lowercase for robust Windows path comparisons.
 * @param {string} p - The path to normalize
 * @returns {string} Normalized path
 */
function normalizePath(p) {
  return p.replace(/\\+/g, '\\').toLowerCase();
}

/**
 * Extracts executable path from the command line command block.
 * @param {string} cmdLine - The command line
 * @param {string} defaultPath - Fallback path if extraction fails
 * @returns {string} Executable path
 */
function extractExePath(cmdLine, defaultPath) {
  if (defaultPath) return defaultPath;
  const match = cmdLine.match(/^\s*["']?([^"']+)["']?/);
  return match ? match[1] : '';
}

/**
 * Queries Windows process command lines for all processes containing --user-data-dir.
 * @returns {Promise<Array<{Path: string, Cmd: string}>>} Array of process info objects
 */
async function getProcessesWithUserDataDir() {
  const psScript = `
$procs = Get-CimInstance Win32_Process -ErrorAction SilentlyContinue
if (-not $procs) {
  $procs = Get-WmiObject Win32_Process -ErrorAction SilentlyContinue
}
$filtered = $procs | Where-Object { $_.CommandLine -like "*--user-data-dir*" } | ForEach-Object {
  [PSCustomObject]@{
    Path = $_.ExecutablePath
    Cmd = $_.CommandLine
  }
}
ConvertTo-Json -InputObject @($filtered) -Compress
  `.trim();

  const { stdout } = await execFileAsync(
    path.win32.join(process.env.SystemRoot || 'C:\\Windows', 'System32', 'WindowsPowerShell', 'v1.0', 'powershell.exe'),
    ['-NoProfile', '-NonInteractive', '-Command', psScript],
    { windowsHide: true }
  );

  const trimmed = stdout.trim();
  if (!trimmed) {
    return [];
  }

  try {
    const data = JSON.parse(trimmed);
    return Array.isArray(data) ? data : [data];
  } catch {
    return [];
  }
}

/**
 * Prompts the user with a numbered list of running browser profiles with a 5-second timeout.
 * @param {Array<{exePath: string, name: string, userDataDir: string}>} uniqueProfiles
 * @param {number} timeoutMs - Timeout in milliseconds
 * @returns {Promise<number|string>} Returns profile index, or 'ALL' if timeout
 */
function promptWithTimeout(uniqueProfiles, timeoutMs = 5000) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    process.stdout.write('\n--- Running Browser Profiles ---\n');
    uniqueProfiles.forEach((profile, index) => {
      process.stdout.write(`[${index + 1}] ${profile.name} — Profile: ${profile.userDataDir}\n`);
    });
    process.stdout.write('--------------------------------\n');
    process.stdout.write(`Select a profile index (1-${uniqueProfiles.length}) within 5 seconds.\nIf no choice is made, all profiles will be opened automatically.\nChoice: `);

    let resolved = false;

    const timer = setTimeout(() => {
      if (!resolved) {
        resolved = true;
        rl.close();
        process.stdout.write('\nTime out! Automatically opening all profiles...\n');
        resolve('ALL');
      }
    }, timeoutMs);

    rl.on('line', (line) => {
      if (!resolved) {
        const choice = parseInt(line.trim(), 10);
        if (!isNaN(choice) && choice >= 1 && choice <= uniqueProfiles.length) {
          resolved = true;
          clearTimeout(timer);
          rl.close();
          resolve(choice - 1);
        } else {
          process.stdout.write(`Invalid choice. Enter a number between 1 and ${uniqueProfiles.length}: `);
        }
      }
    });
  });
}

/**
 * Terminates the parent terminal window/process.
 * @returns {void}
 */
function terminateParentShell() {
  try {
    process.kill(process.ppid, 'SIGTERM');
  } catch {
    try {
      execSync(`taskkill /F /PID ${process.ppid}`, { stdio: 'ignore' });
    } catch {
      process.exit(0);
    }
  }
}

/**
 * Runs the activewin command: show info about the currently focused window or open URLs in running browser profiles.
 *
 * @param {string[]} args - CLI args after the command key
 * @param {import('../core/logger.js').Logger} log - Scoped logger
 * @returns {Promise<void>}
 */
export default async function run(args, log) {
  const openurl = getArgValue(args, '--openurl');

  // If browser-opening arg is present, handle that flow
  if (openurl) {
    log.step(`Starting browser profiles URL opener — openurl: "${openurl}"`);
    log.info(`Raw CLI arguments received: ${JSON.stringify(args)}`);

    log.info('Searching for all running browser processes containing --user-data-dir...');
    let rawProcesses = [];
    try {
      rawProcesses = await getProcessesWithUserDataDir();
    } catch (err) {
      throw new Error(`SYSTEM: Failed to query running processes: ${err.message}`);
    }

    const uniqueProfiles = [];
    const seenKeys = new Set();

    for (const proc of rawProcesses) {
      const cmdLine = proc.Cmd || '';
      const rawPath = proc.Path || '';
      const exePath = extractExePath(cmdLine, rawPath);
      const userDataDir = extractUserDataDir(cmdLine);

      if (userDataDir && exePath) {
        if (normalizePath(userDataDir).includes(normalizePath('F:\\Browsers'))) {
          const key = `${normalizePath(exePath)}|${normalizePath(userDataDir)}`;
          if (!seenKeys.has(key)) {
            seenKeys.add(key);
            uniqueProfiles.push({
              exePath,
              name: path.win32.basename(exePath),
              userDataDir,
            });
          }
        }
      }
    }

    if (uniqueProfiles.length === 0) {
      log.warn('No running browser instances containing --user-data-dir were found.');
      return;
    }

    log.info(`Found ${uniqueProfiles.length} unique browser profile(s).`);

    let choice;
    if (uniqueProfiles.length === 1) {
      log.info('Only one browser profile is currently active. Opening immediately...');
      choice = 0;
    } else {
      choice = await promptWithTimeout(uniqueProfiles, 5000);
    }

    const urls = openurl.split('||').map((u) => u.trim()).filter(Boolean);
    if (urls.length === 0) {
      throw new Error('USER: --openurl contains no valid URLs');
    }

    let profilesToOpen = [];
    if (choice === 'ALL') {
      profilesToOpen = uniqueProfiles;
    } else {
      profilesToOpen = [uniqueProfiles[choice]];
    }

    for (const profile of profilesToOpen) {
      log.step(`Opening URLs in profile: ${profile.userDataDir} using ${profile.name}`);
      for (const url of urls) {
        log.info(`Opening URL: ${url}`);
        try {
          const child = spawn(profile.exePath, [`--user-data-dir=${profile.userDataDir}`, url], {
            detached: true,
            stdio: 'ignore',
          });
          child.unref();
        } catch (err) {
          log.error(`Failed to launch browser ${profile.name} for url ${url}: ${err.message}`);
        }
      }
      log.success(`URLs opened in profile: ${profile.userDataDir}`);
    }

    // Delay short time to ensure processes are spawned detached, then terminate parent shell
    log.info('Closing terminal window in 500ms...');
    setTimeout(() => {
      terminateParentShell();
    }, 500);
    return;
  }

  // Otherwise, default to Active Window Inspector flow
  const watchMode = args.includes('--watch');
  const jsonMode = args.includes('--json');

  log.step('Querying active window information');

  if (watchMode) {
    log.info('Watch mode enabled — polling every 1 second (Ctrl+C to stop)');

    const poll = async () => {
      try {
        const info = await getActiveWindow();
        if (jsonMode) {
          process.stdout.write(JSON.stringify(info) + '\n');
        } else {
          log.info(`Title: ${info.title} — Process: ${info.process} — PID: ${info.pid}`);
        }
      } catch (err) {
        log.error(`Failed to read window info: ${err.message}`);
      }
    };

    // Initial poll
    await poll();
    // Continuous polling
    const interval = setInterval(poll, 1000);

    // Keep alive until SIGINT
    await new Promise((resolve) => {
      process.once('SIGINT', () => {
        clearInterval(interval);
        resolve();
      });
    });
  } else {
    try {
      const info = await getActiveWindow();
      if (jsonMode) {
        process.stdout.write(JSON.stringify(info) + '\n');
      } else {
        log.success(`Title: ${info.title}`);
        log.info(`Process: ${info.process} — PID: ${info.pid}`);
      }
    } catch (err) {
      throw new Error(`SYSTEM: Failed to read window title: ${err.message}`);
    }
  }
}

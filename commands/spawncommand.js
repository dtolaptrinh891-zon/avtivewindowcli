import { spawn } from 'child_process';

/**
 * Command metadata following specs.md §2.3 contract.
 */
export const meta = {
  key: 'spawncommand',
  emoji: '🚀',
  label: 'Spawn Command Router',
  description: 'Spawn and execute another CLI command interactively',
  args: [
    {
      name: '<command>',
      required: true,
      description: 'The executable/command to run (e.g. ocli, gh)',
    },
    {
      name: '[args...]',
      required: false,
      description: 'Arguments to pass to the spawned command',
    },
  ],
  examples: [
    'onodecli spawncommand ocli cloudflared',
    'onodecli spawncommand gh auth login',
    'onodecli spawncommand npm install --help',
  ],
};

/**
 * Runs the spawncommand: spawns a process with stdio inherited so it is fully interactive.
 *
 * @param {string[]} args - CLI args after the command key
 * @param {import('../core/logger.js').Logger} log - Scoped logger
 * @returns {Promise<void>}
 */
export default async function run(args, log) {
  if (args.length === 0 || (args.length === 1 && args[0] === '--help')) {
    log.info('Usage: onodecli spawncommand <command> [args...]');
    return;
  }

  const cmd = args[0];
  const cmdArgs = args.slice(1);

  log.step(`Spawning command: ${cmd} ${cmdArgs.join(' ')}`);

  try {
    const child = spawn(cmd, cmdArgs, {
      stdio: 'inherit',
      shell: true,
    });

    await new Promise((resolve, reject) => {
      child.on('error', (err) => {
        reject(new Error(`SYSTEM: Failed to spawn command: ${err.message}`));
      });

      child.on('close', (code) => {
        if (code !== 0) {
          reject(new Error(`SYSTEM: Command exited with code ${code}`));
        } else {
          resolve();
        }
      });
    });

    log.success(`Command completed successfully: ${cmd}`);
  } catch (err) {
    if (err.message.startsWith('SYSTEM:')) {
      throw err;
    }
    throw new Error(`SYSTEM: Error running spawn command: ${err.message}`);
  }
}

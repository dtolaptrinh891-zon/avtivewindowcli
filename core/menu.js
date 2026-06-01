import inquirer from 'inquirer';
import chalk from 'chalk';

/**
 * Renders the onodecli banner to stdout.
 * @returns {void}
 */
function printBanner() {
  process.stdout.write('\n');
  process.stdout.write(chalk.cyan('╔══════════════════════════════════╗') + '\n');
  process.stdout.write(chalk.cyan('║') + chalk.bold('         🛠️  onodecli             ') + chalk.cyan('║') + '\n');
  process.stdout.write(chalk.cyan('║') + chalk.dim('   Personal Automation Toolkit    ') + chalk.cyan('║') + '\n');
  process.stdout.write(chalk.cyan('╚══════════════════════════════════╝') + '\n');
  process.stdout.write('\n');
}

/**
 * Displays the interactive main menu and returns the selected command key.
 * Includes all registered commands plus Help and Exit options.
 *
 * @param {Array<{key: string, emoji: string, label: string, description: string}>} commands
 *   Array of command registry entries from commands/index.js
 * @returns {Promise<string|null>} The selected command key, 'help', or null (exit)
 */
export async function showMenu(commands) {
  printBanner();

  const choices = [
    ...commands.map((cmd) => ({
      name: `${cmd.emoji}  ${cmd.label}`,
      value: cmd.key,
    })),
    new inquirer.Separator('────────────────────'),
    { name: '📖  Help', value: '__help__' },
    { name: '❌  Exit', value: '__exit__' },
  ];

  const { selection } = await inquirer.prompt([
    {
      type: 'list',
      name: 'selection',
      message: 'Select a command:',
      choices,
      pageSize: 15,
    },
  ]);

  if (selection === '__exit__') {
    return null;
  }
  if (selection === '__help__') {
    return '__help__';
  }

  return selection;
}

/**
 * Prompts the user with a secondary menu for sub-options of the selected command.
 *
 * @param {string} commandKey - The command key (e.g. 'activewin')
 * @returns {Promise<string[]>} Array of CLI-equivalent arguments based on user choices
 */
export async function promptCommandArgs(commandKey) {
  const args = [];

  switch (commandKey) {
    case 'activewin': {
      const answers = await inquirer.prompt([
        {
          type: 'list',
          name: 'mode',
          message: 'Select execution mode:',
          choices: [
            { name: '📄 Show active window once', value: 'once' },
            { name: '👁️  Watch active window (continuous poll)', value: 'watch' },
          ],
        },
        {
          type: 'list',
          name: 'format',
          message: 'Select output format:',
          choices: [
            { name: '📝 Standard log lines', value: 'log' },
            { name: '💻 JSON format', value: 'json' },
          ],
        },
      ]);

      if (answers.mode === 'watch') args.push('--watch');
      if (answers.format === 'json') args.push('--json');
      break;
    }

    case 'app-quickaccesspopup': {
      const answers = await inquirer.prompt([
        {
          type: 'list',
          name: 'action',
          message: 'Select action:',
          choices: [
            { name: '🚀 Launch Quick Access Popup', value: 'launch' },
            { name: '🔄 Send reload signal to running instance', value: 'reload' },
          ],
        },
        {
          type: 'input',
          name: 'path',
          message: 'Custom executable path (optional, press Enter to use default):',
        },
      ]);

      if (answers.action === 'launch') args.push('--launch');
      if (answers.action === 'reload') args.push('--reload');
      if (answers.path.trim()) {
        args.push('--path', answers.path.trim());
      }
      break;
    }

    case 'app-browser': {
      const answers = await inquirer.prompt([
        {
          type: 'list',
          name: 'action',
          message: 'Select action:',
          choices: [
            { name: '🌐 Open URL', value: 'open' },
            { name: '🔍 Focus existing browser window', value: 'focus' },
          ],
        },
        {
          type: 'input',
          name: 'url',
          message: 'URL to open (optional):',
          default: 'https://google.com',
          when: (ans) => ans.action === 'open',
        },
        {
          type: 'list',
          name: 'browser',
          message: 'Select browser:',
          choices: [
            { name: 'Chrome', value: 'chrome' },
            { name: 'Edge', value: 'edge' },
            { name: 'Firefox', value: 'firefox' },
          ],
        },
        {
          type: 'input',
          name: 'profile',
          message: 'Browser profile name (optional, press Enter to use default):',
        },
      ]);

      args.push(answers.action);
      if (answers.action === 'open' && answers.url) {
        args.push('--url', answers.url.trim());
      }
      if (answers.browser) {
        args.push('--browser', answers.browser);
      }
      if (answers.profile.trim()) {
        args.push('--profile', answers.profile.trim());
      }
      break;
    }

    case 'spawncommand': {
      const answers = await inquirer.prompt([
        {
          type: 'input',
          name: 'command',
          message: 'Enter command to run (e.g. gh, ocli):',
          validate: (val) => val.trim().length > 0 || 'Command cannot be empty',
        },
        {
          type: 'input',
          name: 'args',
          message: 'Enter arguments (optional, separated by space):',
        },
      ]);
      args.push(answers.command.trim());
      if (answers.args.trim()) {
        const parsedArgs = answers.args.match(/(?:[^\s"']+|"[^"]*"|'[^']*')+/g) || [];
        args.push(...parsedArgs.map(arg => arg.replace(/^["']|["']$/g, '')));
      }
      break;
    }

    default:
      break;
  }

  return args;
}

export default showMenu;


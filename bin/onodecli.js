#!/usr/bin/env node

/**
 * bin/onodecli.js — Entry point for onodecli CLI
 *
 * Routing logic:
 *  - no args          → interactive menu
 *  - --help           → list all commands
 *  - --version        → print version
 *  - <command>        → run command directly
 *  - <command> --help → show command help
 */

import path from 'path';
import { createRequire } from 'module';
import { fileURLToPath } from 'url';

import chalk from 'chalk';
import { COMMANDS } from '../commands/index.js';
import { showMenu, promptCommandArgs } from '../core/menu.js';
import { runCommand } from '../core/runner.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);

/** Load version from package.json */
const pkg = require(path.join(__dirname, '..', 'package.json'));

/**
 * Prints usage/help for all registered commands.
 * @returns {void}
 */
function printHelp() {
  process.stdout.write('\n');
  process.stdout.write(chalk.bold('onodecli') + chalk.dim(` v${pkg.version}`) + '\n');
  process.stdout.write(chalk.dim('Personal Automation Toolkit for Windows 11') + '\n');
  process.stdout.write('\n');
  process.stdout.write(chalk.bold('Usage:') + '\n');
  process.stdout.write('  onodecli                  Open interactive menu\n');
  process.stdout.write('  onodecli <command>         Run a command directly\n');
  process.stdout.write('  onodecli <command> --help  Show help for a command\n');
  process.stdout.write('  onodecli --help            Show this help\n');
  process.stdout.write('  onodecli --version         Show version\n');
  process.stdout.write('\n');
  process.stdout.write(chalk.bold('Commands:') + '\n');
  for (const cmd of COMMANDS) {
    const key = cmd.key.padEnd(25);
    process.stdout.write(`  ${cmd.emoji}  ${chalk.cyan(key)} ${cmd.description}\n`);
  }
  process.stdout.write('\n');
}

/**
 * Prints help for a specific command using its meta export.
 * @param {object} meta - The command's meta object
 * @returns {void}
 */
function printCommandHelp(meta) {
  process.stdout.write('\n');
  process.stdout.write(`${meta.emoji}  ${chalk.bold(meta.label)}\n`);
  process.stdout.write(chalk.dim(meta.description) + '\n');
  process.stdout.write('\n');
  process.stdout.write(chalk.bold('Usage:') + '\n');
  process.stdout.write(`  onodecli ${meta.key} [args...]\n`);
  process.stdout.write('\n');

  if (meta.args && meta.args.length > 0) {
    process.stdout.write(chalk.bold('Arguments:') + '\n');
    for (const arg of meta.args) {
      const name = arg.name.padEnd(30);
      const req = arg.required ? chalk.red('required') : chalk.dim('optional');
      const vals = arg.values ? `  Values: ${arg.values.join(', ')}` : '';
      process.stdout.write(`  ${chalk.cyan(name)} [${req}] ${arg.description}${vals}\n`);
    }
    process.stdout.write('\n');
  }

  if (meta.examples && meta.examples.length > 0) {
    process.stdout.write(chalk.bold('Examples:') + '\n');
    for (const ex of meta.examples) {
      process.stdout.write(`  ${chalk.dim('$')} ${ex}\n`);
    }
    process.stdout.write('\n');
  }
}

/**
 * Dynamically imports a command module by its registry entry.
 * @param {{module: string}} cmdEntry
 * @returns {Promise<{default: Function, meta: object}>}
 */
async function loadCommandModule(cmdEntry) {
  const modulePath = new URL(cmdEntry.module, new URL('../commands/', import.meta.url)).href;
  return import(modulePath);
}

/**
 * Handles a single command by key and remaining args.
 * @param {string} key - Command key
 * @param {string[]} args - Remaining args
 * @returns {Promise<void>}
 */
async function handleCommand(key, args) {
  const cmdEntry = COMMANDS.find((c) => c.key === key);
  if (!cmdEntry) {
    process.stderr.write(chalk.red(`Unknown command: ${key}\n`));
    process.stderr.write(`Run ${chalk.cyan('onodecli --help')} to see available commands.\n`);
    process.exitCode = 1;
    return;
  }

  const mod = await loadCommandModule(cmdEntry);

  if (args.includes('--help')) {
    printCommandHelp(mod.meta);
    return;
  }

  await runCommand(key, mod.default, args);
}

/**
 * Main entry point.
 * @returns {Promise<void>}
 */
async function main() {
  const [, , ...argv] = process.argv;

  // --version
  if (argv.includes('--version') || argv.includes('-v')) {
    process.stdout.write(`onodecli v${pkg.version}\n`);
    return;
  }

  // --help with no command
  if (argv.includes('--help') || argv.includes('-h')) {
    if (argv[0] === '--help' || argv[0] === '-h') {
      printHelp();
      return;
    }
  }

  // Direct command invocation: onodecli <command> [args...]
  if (argv.length > 0 && !argv[0].startsWith('--')) {
    const key = argv[0];
    const args = argv.slice(1);
    await handleCommand(key, args);
    return;
  }

  // No args → interactive menu
  let running = true;
  while (running) {
    const selection = await showMenu(COMMANDS);

    if (selection === null) {
      // Exit selected
      process.stdout.write(chalk.dim('Goodbye! 👋\n'));
      running = false;
    } else if (selection === '__help__') {
      printHelp();
    } else {
      const commandArgs = await promptCommandArgs(selection);
      await handleCommand(selection, commandArgs);
      // After running, loop back to menu
    }
  }
}

main().catch((err) => {
  process.stderr.write(chalk.red(`Fatal error: ${err.message}\n`));
  process.exitCode = 2;
});

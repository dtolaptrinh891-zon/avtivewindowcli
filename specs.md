# 📋 onodecli — Project Specification

> Version: 1.0.0 | Platform: Windows 11 | Runtime: Node.js ≥ 20 LTS | Language: JavaScript (ESM)

---

## 1. 🎯 Project Goals

Build a personal, extensible Node.js CLI tool for Windows 11 that:
- Presents an interactive main menu with emoji-labeled options
- Supports direct sub-command invocation with arguments (`onodecli <command> [args]`)
- Is modular — each sub-command lives in its own isolated file
- Has structured logging per command
- Is fully documented and easily extended without touching existing code

---

## 2. 🏗️ Architecture

### 2.1 Directory Structure

```
onodecli/
├── bin/
│   └── onodecli.js              # Entry point — shebang, arg routing, interactive menu
├── commands/
│   ├── index.js                 # Command registry — exports COMMANDS map
│   ├── activewin.js             # 🪟 Active window inspector
│   ├── app-quickaccesspopup.js  # ⚡ Quick Access Popup launcher
│   └── app-browser.js           # 🌐 Browser controller
├── core/
│   ├── logger.js                # Structured logger (levels: info, warn, error, debug, success)
│   ├── menu.js                  # Interactive menu renderer (inquirer)
│   └── runner.js                # Command executor with error boundary
├── docs/
│   ├── README.md                # Project overview and usage
│   ├── CONTRIBUTING.md          # How to add new commands
│   └── commands/
│       ├── activewin.md
│       ├── app-quickaccesspopup.md
│       └── app-browser.md
├── TASK_TEMPLATE.md             # Template for adding new commands
├── AGENTS_RULES.md              # Rules for AI agents working on this project
├── specs.md                     # This file
├── package.json
└── .eslintrc.json
```

### 2.2 Command Registry

All commands are registered in `commands/index.js`. Each entry defines:

```js
{
  key: 'app-browser',          // CLI key used in direct invocation
  emoji: '🌐',                 // Emoji shown in menu
  label: 'Browser Controller', // Human-readable label
  description: 'Open, focus, or control browser windows', // One-line description
  module: './app-browser.js',  // Relative path to command module
}
```

**Rule:** Adding a new command = adding one entry here + one new file in `commands/`. No other files change.

### 2.3 Command Module Contract

Every file in `commands/` MUST export a default async function with this signature:

```js
/**
 * @param {string[]} args - CLI args after the command key
 * @param {import('../core/logger.js').Logger} log - Scoped logger
 * @returns {Promise<void>}
 */
export default async function run(args, log) { ... }
```

And MUST export metadata:

```js
export const meta = {
  key: 'app-browser',
  emoji: '🌐',
  label: 'Browser Controller',
  description: 'Open, focus, or control browser windows',
  args: [
    { name: 'action', required: true, values: ['open', 'focus', 'close'], description: 'Action to perform' },
    { name: '--profile', required: false, description: 'Browser profile name' },
  ],
  examples: [
    'onodecli app-browser open',
    'onodecli app-browser focus --profile work',
  ],
};
```

---

## 3. 🖥️ CLI Behavior

### 3.1 Interactive Mode

Running `onodecli` with no arguments opens the main menu:

```
╔══════════════════════════════════╗
║         🛠️  onodecli             ║
║   Personal Automation Toolkit    ║
╚══════════════════════════════════╝

? Select a command:
  🪟  Active Window Inspector
  ⚡  Quick Access Popup
  🌐  Browser Controller
  ────────────────────
  📖  Help
  ❌  Exit
```

After selecting a command that requires sub-options, a secondary menu appears.

### 3.2 Direct Invocation

```bash
onodecli <command> [args...]

# Examples:
onodecli activewin
onodecli app-quickaccesspopup --launch
onodecli app-browser open --profile work
onodecli --help
onodecli --version
```

### 3.3 Help System

- `onodecli --help` → lists all commands with emoji, key, and description
- `onodecli <command> --help` → shows that command's args and examples
- `onodecli --version` → prints version from package.json

---

## 4. 📝 Logging

All log output uses the scoped logger from `core/logger.js`.

### 4.1 Log Levels

| Level     | Prefix         | Color   | Use when                         |
|-----------|----------------|---------|----------------------------------|
| `info`    | `ℹ️  [INFO]`   | cyan    | General status messages          |
| `success` | `✅ [OK]`      | green   | Action completed successfully    |
| `warn`    | `⚠️  [WARN]`   | yellow  | Non-fatal issues                 |
| `error`   | `❌ [ERROR]`   | red     | Failures, exceptions             |
| `debug`   | `🔍 [DEBUG]`   | gray    | Verbose detail (opt-in via flag) |
| `step`    | `▶️  [STEP]`   | blue    | Progress within a multi-step op  |

### 4.2 Log Format

```
[HH:MM:SS] ✅ [OK]    [app-browser] Browser window focused — profile: work
[HH:MM:SS] ❌ [ERROR] [activewin]   Failed to read window title: Access denied
```

Format: `[timestamp] <level-prefix> [<command-key>] <message>`

### 4.3 Debug Mode

Enable with `--debug` flag or `ONODECLI_DEBUG=1` env var. Shows `debug` level logs.

---

## 5. 📦 package.json

```json
{
  "name": "onodecli",
  "version": "1.0.0",
  "description": "Personal automation CLI for Windows 11",
  "type": "module",
  "bin": {
    "onodecli": "./bin/onodecli.js"
  },
  "scripts": {
    "start": "node bin/onodecli.js",
    "dev": "node --watch bin/onodecli.js",
    "help": "node bin/onodecli.js --help",
    "lint": "eslint .",
    "test": "node --test",
    "link": "npm link"
  },
  "dependencies": {
    "inquirer": "^9.x",
    "chalk": "^5.x",
    "commander": "^12.x"
  },
  "devDependencies": {
    "eslint": "^9.x"
  },
  "engines": {
    "node": ">=20.0.0"
  }
}
```

**After `npm link`:** `onodecli` becomes available as a global command on Windows 11.

---

## 6. 🪟 Initial Commands Specification

### 6.1 `activewin` — 🪟 Active Window Inspector
- **Purpose:** Show info about the currently focused window (title, process, PID)
- **Args:** `--watch` (continuous poll every 1s), `--json` (output as JSON)
- **Implementation:** Use `active-win` npm package or Windows PowerShell `Get-Process | where MainWindowTitle`

### 6.2 `app-quickaccesspopup` — ⚡ Quick Access Popup
- **Purpose:** Launch or interact with QuickAccessPopup.exe or custom shortcut menus
- **Args:** `--launch`, `--path <exe-path>`, `--reload`
- **Implementation:** `child_process.spawn` to launch the exe; configurable path via env or arg

### 6.3 `app-browser` — 🌐 Browser Controller
- **Purpose:** Open URLs, focus browser, select profile
- **Args:** `open <url>`, `focus`, `--profile <name>`, `--browser <chrome|edge|firefox>`
- **Implementation:** Windows `start` command via `child_process`; profile via browser CLI flags

---

## 7. 🔒 Non-Functional Requirements

| Requirement         | Constraint                                                    |
|---------------------|---------------------------------------------------------------|
| Platform            | Windows 11 — use `path.win32` where paths are constructed    |
| Node version        | ≥ 20 LTS (ESM, `--watch`, built-in test runner)              |
| No global state     | Each command module is stateless and side-effect-free on import |
| Error isolation     | One command crashing MUST NOT crash the CLI shell             |
| Exit codes          | `0` = success, `1` = user error, `2` = system/runtime error  |
| No hardcoded paths  | All paths via args, env vars, or config file                  |
| Inline JSDoc        | Every exported function MUST have JSDoc with `@param` + `@returns` |

---

## 8. 🔮 Extension Points (Future)

These are planned but NOT in v1.0 scope:
- `config.json` per-user config file with defaults
- Plugin system (auto-discover commands from `~/.onodecli/plugins/`)
- Output piping (`--json` flag on all commands for scripting)
- Command aliases (short keys)
- Command history / last-run replay

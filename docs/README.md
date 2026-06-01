# 🛠️ onodecli — Personal Automation Toolkit for Windows 11

> Version: 1.0.0 | Platform: Windows 11 | Runtime: Node.js ≥ 20 LTS | Language: JavaScript (ESM)

---

## Overview

**onodecli** is a personal, extensible CLI tool for Windows 11 automation tasks.  
It features an interactive emoji-labeled menu and supports direct sub-command invocation.

---

## Installation

```bash
# Clone/copy project to a directory
cd path\to\onodecli

# Install dependencies
npm install

# Link globally (makes `onodecli` available as a Windows command)
npm link
```

---

## Usage

```bash
# Open interactive menu
onodecli

# Run a command directly
onodecli <command> [args...]

# Show all commands
onodecli --help

# Show help for a specific command
onodecli <command> --help

# Show version
onodecli --version
```

---

## Available Commands

| Emoji | Key | Description |
|-------|-----|-------------|
| 🪟 | `activewin` | Show info about the currently focused window |
| ⚡ | `app-quickaccesspopup` | Launch or interact with QuickAccessPopup.exe |
| 🌐 | `app-browser` | Open URLs, focus browser, select profile |

---

## Log Format

All output follows the structured format:

```
[HH:MM:SS] ✅ [OK]    [app-browser] Browser window focused — profile: work
[HH:MM:SS] ❌ [ERROR] [activewin]   Failed to read window title: Access denied
```

Enable debug logs: `--debug` flag or `ONODECLI_DEBUG=1` env var.

---

## Adding New Commands

See [CONTRIBUTING.md](./CONTRIBUTING.md) for step-by-step instructions.

---

## Development

```bash
# Watch mode (auto-restart on file changes)
npm run dev

# Lint
npm run lint

# Run tests
npm test
```

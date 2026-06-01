# 🚀 spawncommand — Spawn Command Router

> Command key: `spawncommand` | Emoji: 🚀

---

## Description

Spawns and executes another CLI tool or command interactively within the `onodecli` session.\
It routes stdin, stdout, and stderr from the parent terminal to the child process, allowing you to run interactive commands like `gh` auth flows, `npm` selection menus, or any other interactive CLI.

---

## Usage

```bash
onodecli spawncommand <command> [args...]
```

---

## Arguments

| Name | Required | Description |
| --- | --- | --- |
| `<command>` | **Yes** | The executable/tool to run (e.g. `ocli`, `gh`, `npm`) |
| `[args...]` | No | Arguments to pass directly to the spawned command |

---

## Examples

```bash
# Run cloudflared via ocli
onodecli spawncommand ocli cloudflared

# Log in to GitHub CLI interactively
onodecli spawncommand gh auth login

# Run npm install with options
onodecli spawncommand npm install --help
```

---

## Exit Codes

| Code | Meaning |
| --- | --- |
| `0` | Success (spawned command completed with code 0) |
| `2` | System error (failed to spawn child process, or spawned command returned non-zero code) |

---

## Error Messages

| Message | Cause |
| --- | --- |
| `SYSTEM: Failed to spawn command: ...` | Child process failed to execute (command not found on PATH or permission denied) |
| `SYSTEM: Command exited with code <code>` | The executed command returned a non-zero exit code |

---

## Implementation Notes

- Uses Node's `child_process.spawn` with `{ stdio: 'inherit', shell: true }`.
- Inherits stdin/stdout/stderr to support full keyboard interactions and prompt rendering inside the terminal.
- Uses `shell: true` for cross-platform batch script and global command resolution on Windows 11.
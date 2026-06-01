# 🤖 AGENTS_RULES.md — Rules for All AI Agents

> **MANDATORY.** Every AI agent (Claude Code, Cursor, Cline, Copilot, etc.) working on this project MUST read and follow ALL rules in this file before writing any code.

---

## ⛔ ABSOLUTE RULES — Never Violate

1. **NEVER modify `specs.md`** — it is the source of truth. Read it, don't rewrite it.
2. **NEVER change the Command Module Contract** — every command file MUST export `default async function run(args, log)` and `export const meta = {...}`.
3. **NEVER change `core/logger.js` API** — log levels and format are locked in specs.md §4.
4. **NEVER add dependencies without explicit user approval** — stop and ask first.
5. **NEVER modify existing command files** when adding a new command — only ADD new files.
6. **NEVER use `console.log` or `console.error` directly** — always use the scoped `log` injected via `run(args, log)`.
7. **NEVER use `process.exit()` inside a command module** — throw an Error instead; the runner handles exit codes.
8. **NEVER hardcode file paths** — use args, environment variables, or prompt the user.
9. **NEVER silently swallow errors** — every catch block MUST call `log.error(...)`.
10. **NEVER create files outside the defined directory structure** without user confirmation.

---

## ✅ REQUIRED Actions for Every Task

Before writing any code, the agent MUST:

- [ ] Read `specs.md` fully
- [ ] Read `TASK_TEMPLATE.md` for the specific task being worked on
- [ ] Read `commands/index.js` to understand the current command registry
- [ ] Read `core/logger.js` to understand the logger API
- [ ] Confirm: does this task require any new dependency? → Stop and ask if yes.

---

## 📁 File Scope Rules

| File / Directory          | Agent may READ | Agent may WRITE | Notes                                      |
|---------------------------|---------------|-----------------|---------------------------------------------|
| `specs.md`                | ✅             | ❌              | Source of truth — never modify             |
| `AGENTS_RULES.md`         | ✅             | ❌              | Never modify                               |
| `TASK_TEMPLATE.md`        | ✅             | ❌              | User edits this; agent reads it            |
| `commands/index.js`       | ✅             | ✅              | Only APPEND new entries, never remove/edit existing |
| `commands/*.js`           | ✅             | ✅ (new files)  | Never edit existing command files unless task explicitly says to |
| `core/*.js`               | ✅             | ⚠️ Ask first   | Core changes affect all commands           |
| `bin/onodecli.js`         | ✅             | ⚠️ Ask first   | Entry point changes are high-impact        |
| `docs/`                   | ✅             | ✅              | Always update docs when adding commands    |
| `package.json`            | ✅             | ⚠️ Ask first   | Only update `version` and `scripts` freely; deps require approval |

---

## 🧱 Adding a New Command — Checklist

When a task says "add command `<key>`", the agent MUST:

1. **Read** the task section in `TASK_TEMPLATE.md` for that command
2. **Create** `commands/<key>.js` following the Command Module Contract (specs.md §2.3)
3. **Register** the command in `commands/index.js` (append only)
4. **Create** `docs/commands/<key>.md` with usage, args, examples
5. **Test** by running `onodecli <key> --help` and verifying output format
6. **Log** every meaningful step using the injected `log` object
7. **Handle errors** — wrap external calls in try/catch, call `log.error()`
8. **Verify exit** — the command must resolve cleanly (no hanging processes)

**Done when:** `onodecli <key>` runs without error, `--help` shows correct output, docs file exists.

---

## 📝 Logging Rules

All log calls inside command modules MUST follow this pattern:

```js
// ✅ Correct
log.info('Starting browser focus operation');
log.step('Resolving browser executable path');
log.success(`Browser focused — profile: ${profile}`);
log.warn('No profile specified, using default');
log.error(`Failed to spawn process: ${err.message}`);

// ❌ Wrong — never do these
console.log('done');
log.info({ status: 'ok' });  // objects not allowed — always string messages
```

Message format: `<verb> <noun> — <detail>` (e.g., `"Launched popup — path: C:\tools\qap.exe"`)

---

## 🔢 Exit Code Rules

The runner in `core/runner.js` handles exit codes. Commands signal failure by throwing:

```js
// User/input error (exit code 1)
throw new Error('USER: --profile argument is required');

// System/runtime error (exit code 2)
throw new Error('SYSTEM: Cannot find executable at path');

// Strings starting with "USER:" → exit 1
// Strings starting with "SYSTEM:" → exit 2
// All others → exit 2
```

---

## 🔄 Stop Conditions

The agent MUST stop and ask the user before:

- Installing any new npm package
- Modifying `core/logger.js`, `core/runner.js`, or `core/menu.js`
- Modifying `bin/onodecli.js`
- Deleting any file
- Changing the Command Module Contract signature
- Any operation that affects more than the files listed in the current task

---

## 📣 Progress Reporting

After completing each file, the agent MUST output:

```
✅ Created: commands/app-browser.js
✅ Updated: commands/index.js (appended app-browser entry)
✅ Created: docs/commands/app-browser.md
▶️  Next: running onodecli app-browser --help to verify
```

Do not complete a task silently. Every created or modified file must be reported.

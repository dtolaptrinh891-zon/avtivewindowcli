# 📋 TASK_TEMPLATE.md — Task Definitions for onodecli

> **HOW TO USE THIS FILE:**
> - This is the ONLY file you need to edit when you want to add, improve, or fix a command.
> - Fill in the relevant task section below and give this file to the agent.
> - The agent reads `specs.md` and `AGENTS_RULES.md` automatically — you don't need to repeat those rules here.
> - One task per agent session. Don't stack multiple tasks in one session.

---

## 🧭 Active Task

> **Fill in one task at a time. Delete or comment out the others.**

```
ACTIVE_TASK: SCAFFOLD_PROJECT
```

---

## 📦 Task: SCAFFOLD_PROJECT

**Goal:** Scaffold the full onodecli project from scratch.

**Starting state:** Empty directory. Node.js ≥ 20 installed. npm available.

**Target state:** A working CLI where:
- `npm link` installs `onodecli` globally
- `onodecli` shows the interactive menu with emoji
- `onodecli activewin` runs the active window inspector
- `onodecli app-quickaccesspopup` runs the popup launcher
- `onodecli app-browser` runs the browser controller
- `onodecli --help` lists all commands
- `onodecli --version` prints the version

**Files to create:** All files defined in `specs.md §2.1 Directory Structure`.

**Acceptance criteria:**
- [ ] `onodecli` opens interactive menu with emoji labels
- [ ] `onodecli activewin --help` shows args and examples
- [ ] `onodecli app-browser open --help` shows args and examples
- [ ] `onodecli app-quickaccesspopup --help` shows args and examples
- [ ] All log output uses the format defined in `specs.md §4.2`
- [ ] `commands/index.js` uses the registry format from `specs.md §2.2`
- [ ] Every command file exports `meta` and `default async function run(args, log)`
- [ ] `npm run lint` passes with no errors
- [ ] `docs/commands/*.md` exists for each command

**Stop and ask before:** Installing any dependency not listed in `specs.md §5`.

---

## ➕ Task: ADD_COMMAND

**Goal:** Add a new sub-command to the CLI.

**Command definition:**
```
key:         <fill-in>           # e.g. app-clipboard
emoji:       <fill-in>           # e.g. 📋
label:       <fill-in>           # e.g. Clipboard Manager
description: <fill-in>           # e.g. Read, write, or clear clipboard content
```

**Arguments:**

| Name | Required | Values / Type | Description |
|------|----------|---------------|-------------|
| `<fill-in>` | yes/no | `<fill-in>` | `<fill-in>` |

**Business logic:**
```
<Describe what the command does, step by step.>
<Reference any external tool, exe, API, or Windows feature it uses.>
<Describe expected output on success and on failure.>
```

**Examples:**
```bash
onodecli <key>
onodecli <key> <arg1>
onodecli <key> <arg1> --flag value
```

**Files the agent will create:**
- `commands/<key>.js`
- `docs/commands/<key>.md`

**Files the agent will update:**
- `commands/index.js` (append entry only)

**Acceptance criteria:**
- [ ] `onodecli <key>` runs without error
- [ ] `onodecli <key> --help` shows correct args and examples
- [ ] All steps logged via `log.step()` / `log.success()` / `log.error()`
- [ ] Errors thrown as `"USER: ..."` or `"SYSTEM: ..."` strings (see AGENTS_RULES.md)
- [ ] `docs/commands/<key>.md` created and complete

---

## 🔧 Task: FIX_COMMAND

**Goal:** Fix a bug or improve behavior in an existing command.

**Command key:** `<fill-in>`

**File to modify:** `commands/<key>.js`

**Current behavior (bug):**
```
<Describe exactly what is wrong. Be specific — what input triggers it, what output is wrong.>
```

**Expected behavior:**
```
<Describe what should happen instead.>
```

**Do NOT change:**
- The `meta` export structure
- The `run(args, log)` signature
- Any other command files

**Acceptance criteria:**
- [ ] The bug is fixed
- [ ] Existing `--help` output is unchanged (unless the fix requires updating args)
- [ ] No new dependencies added

---

## 📝 Task: UPDATE_DOCS

**Goal:** Update documentation for one or more commands.

**Scope:** `docs/commands/<key>.md` only.

**Commands to document:** `<fill-in>`

**What to add/fix:**
```
<Describe what's missing or wrong in the current docs.>
```

**Acceptance criteria:**
- [ ] Each doc file covers: description, all args, all examples, exit codes, error messages

---

## ⚙️ Task: UPDATE_CORE

**Goal:** Modify core infrastructure (logger, menu, runner).

> ⚠️ HIGH IMPACT — changes here affect all commands. The agent MUST stop and confirm the scope with the user before writing any code.

**File to modify:** `core/<fill-in>.js`

**Change description:**
```
<Be very specific. What behavior changes? What stays the same?>
```

**Must not break:**
- [ ] Command Module Contract (`run(args, log)` signature)
- [ ] Log format defined in `specs.md §4.2`
- [ ] Exit code behavior defined in `AGENTS_RULES.md`

---

## 🗒️ Task Notes (Optional)

> Add any extra context here that the agent should know for this specific task.
> Examples: environment details, related issues, prior failed attempts.

```
<Optional notes>
```

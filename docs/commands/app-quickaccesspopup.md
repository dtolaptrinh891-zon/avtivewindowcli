# ⚡ app-quickaccesspopup — Quick Access Popup

> Command key: `app-quickaccesspopup` | Emoji: ⚡

---

## Description

Launches or interacts with [QuickAccessPopup](https://www.quickaccesspopup.com/) (QAP) — a Windows popup menu tool for fast navigation.

Uses `child_process.spawn` in detached mode so the spawned process outlives the CLI.

---

## Usage

```bash
onodecli app-quickaccesspopup <action> [options]
```

---

## Arguments

| Name | Required | Description |
|------|----------|-------------|
| `--launch` | No* | Launch QuickAccessPopup.exe |
| `--reload` | No* | Send reload signal to a running QAP instance |
| `--path <exe-path>` | No | Full path to QuickAccessPopup.exe |

*At least one of `--launch` or `--reload` is required.

---

## Exe Path Resolution

The executable path is resolved in this order:

1. `--path <exe-path>` argument
2. `ONODECLI_QAP_PATH` environment variable
3. Default: `%APPDATA%\QuickAccessPopup\QuickAccessPopup.exe`

---

## Examples

```bash
# Launch QuickAccessPopup from default location
onodecli app-quickaccesspopup --launch

# Launch from a custom path
onodecli app-quickaccesspopup --launch --path "C:\tools\QuickAccessPopup.exe"

# Use env var for path
$env:ONODECLI_QAP_PATH = "C:\tools\QuickAccessPopup.exe"
onodecli app-quickaccesspopup --launch

# Reload QAP (re-reads config)
onodecli app-quickaccesspopup --reload
```

---

## Output Format

```
[09:30:15] ▶️  [STEP]  [app-quickaccesspopup] Resolved executable path — C:\tools\QuickAccessPopup.exe
[09:30:15] ▶️  [STEP]  [app-quickaccesspopup] Launching QuickAccessPopup
[09:30:15] ✅ [OK]    [app-quickaccesspopup] Launched popup — path: C:\tools\QuickAccessPopup.exe
```

---

## Exit Codes

| Code | Meaning |
|------|---------|
| `0` | Success |
| `1` | User error (no action flag specified) |
| `2` | System error (executable not found, spawn failed) |

---

## Error Messages

| Message | Cause |
|---------|-------|
| `USER: No action specified. Use --launch or --reload` | Neither `--launch` nor `--reload` was passed |
| `SYSTEM: Failed to launch QuickAccessPopup: ...` | spawn() failed (exe not found, permission denied) |
| `SYSTEM: Failed to reload QuickAccessPopup: ...` | /reload signal spawn failed |

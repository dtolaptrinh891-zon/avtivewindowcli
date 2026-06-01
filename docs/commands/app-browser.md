# 🌐 app-browser — Browser Controller

> Command key: `app-browser` | Emoji: 🌐

---

## Description

Opens URLs in a browser or focuses an existing browser window on Windows 11.

Uses the Windows `start` command (via `cmd.exe`) to open URLs, and PowerShell to focus existing windows.

---

## Usage

```bash
onodecli app-browser <action> [options]
```

---

## Arguments

| Name | Required | Values | Description |
|------|----------|--------|-------------|
| `action` | **Yes** | `open`, `focus` | Action to perform |
| `--url <url>` | No | Any URL | URL to open (used with `open` action) |
| `--profile <name>` | No | Profile dir name | Browser profile (Chrome/Edge: directory name, Firefox: profile name) |
| `--browser <name>` | No | `chrome`, `edge`, `firefox` | Browser to use (default: `chrome`) |

---

## Examples

```bash
# Open default browser with blank tab
onodecli app-browser open

# Open a specific URL
onodecli app-browser open --url https://example.com

# Open URL in Edge with a work profile
onodecli app-browser open --browser edge --url https://example.com --profile "Profile 2"

# Open URL in Chrome with a named profile
onodecli app-browser open --url https://github.com --profile work

# Focus the currently open Chrome window
onodecli app-browser focus

# Focus Edge
onodecli app-browser focus --browser edge
```

---

## Output Format

```
[09:30:15] ▶️  [STEP]  [app-browser] Action: open — Browser: chrome
[09:30:15] ℹ️  [INFO]  [app-browser] Using profile: work
[09:30:15] ▶️  [STEP]  [app-browser] Opening URL: https://example.com
[09:30:15] ✅ [OK]    [app-browser] Browser window opened — url: https://example.com — profile: work
```

---

## Exit Codes

| Code | Meaning |
|------|---------|
| `0` | Success |
| `1` | User error (missing action, invalid action value) |
| `2` | System error (spawn/exec failed, browser process not found) |

---

## Error Messages

| Message | Cause |
|---------|-------|
| `USER: action is required. Values: open, focus` | No action argument provided |
| `SYSTEM: Failed to open browser: ...` | `start` command failed |
| `SYSTEM: No running <browser> process found to focus` | No matching browser process is running |
| `SYSTEM: Failed to focus browser: ...` | PowerShell focus operation failed |

---

## Implementation Notes

- **Open**: Uses `start "" "<browser>" "<url>"` via `cmd.exe`
- **Focus**: Uses PowerShell `Get-Process` + `SetForegroundWindow` P/Invoke
- **Profiles**: Chrome/Edge use `--profile-directory="<name>"`, Firefox uses `-P "<name>"`
- Browser executables: `chrome`, `msedge`, `firefox`

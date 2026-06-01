# 🪟 activewin — Active Window Inspector

> Command key: `activewin` | Emoji: 🪟

---

## Description

Shows information about the currently focused (foreground) window on Windows 11.\
Retrieves window title, process name, and PID using a Windows PowerShell script via `child_process`.

---

## Usage

```bash
onodecli activewin [options]
```

---

## Arguments

| Name | Required | Description |
| --- | --- | --- |
| `--watch` | No | Continuously poll every 1 second (Ctrl+C to stop) |
| `--json` | No | Output as JSON instead of log lines |
| `--debug` | No | Enable debug-level logging |
| `--openurl <urls>` | No | URL(s) to open (separate multiple URLs with `||`). Prompts for profile selection with a 5s auto-select timeout, and closes the terminal on completion. |

---

## Examples

```bash
# Show current active window info once
onodecli activewin

# Continuously watch active window changes
onodecli activewin --watch

# Output as JSON (useful for scripting)
onodecli activewin --json

# Open a URL in a selected running browser profile (or all profiles after 5s)
onodecli activewin --openurl="https://github.com/login"

# Open multiple URLs in browser profiles
onodecli activewin --openurl="https://github.com/login||https://google.com"
```

---

## Output Format

### Default (log format)

```
[09:30:15] ✅ [OK]   [activewin] Title: Visual Studio Code
[09:30:15] ℹ️  [INFO] [activewin] Process: Code — PID: 12345
```

### JSON format (`--json`)

```json
{"title":"Visual Studio Code","process":"Code","pid":12345}
```

### Browser Opener Mode logs

```
[09:30:15] ▶️  [STEP]  [activewin] Starting browser profiles URL opener
[09:30:15] ℹ️  [INFO]  [activewin] Searching for all running browser processes containing --user-data-dir...
[09:30:15] ℹ️  [INFO]  [activewin] Found 2 unique browser profile(s).

--- Running Browser Profiles ---
[1] chrome.exe — Profile: F:\Browsers\Chrome\Profile1
[2] msedge.exe — Profile: F:\Browsers\Edge\Profile2
--------------------------------
Select a profile index (1-2) within 5 seconds.
If no choice is made, all profiles will be opened automatically.
Choice: 1

[09:30:18] ▶️  [STEP]  [activewin] Opening URLs in profile: F:\Browsers\Chrome\Profile1 using chrome.exe
[09:30:18] ℹ️  [INFO]  [activewin] Opening URL: https://github.com/login
[09:30:18] ✅ [OK]    [activewin] URLs opened in profile: F:\Browsers\Chrome\Profile1
[09:30:18] ℹ️  [INFO]  [activewin] Closing terminal window in 500ms...
```

---

## Exit Codes

| Code | Meaning |
| --- | --- |
| `0` | Success |
| `2` | System error (e.g., PowerShell unavailable, access denied) |

---

## Error Messages

| Message | Cause |
| --- | --- |
| `SYSTEM: Failed to read window title: ...` | PowerShell failed to execute or access was denied |
| `SYSTEM: Failed to query running processes: ...` | Querying WMI/CIM via PowerShell failed |
| `USER: --openurl contains no valid URLs` | Empty or whitespace-only URL passed |

---

## Implementation Notes

- Uses a PowerShell inline script with P/Invoke (`GetForegroundWindow`, `GetWindowThreadProcessId`) for the active window inspector.
- Uses `Get-CimInstance Win32_Process` (with fallback to `Get-WmiObject`) in PowerShell to query all processes containing `--user-data-dir` arguments.
- Spawns browser processes detached and terminates the parent shell (`process.ppid`) to close the terminal window on completion.
- PowerShell path resolved via `%SystemRoot%\System32\WindowsPowerShell\v1.0\powershell.exe`
- No npm packages required — pure Node.js built-ins
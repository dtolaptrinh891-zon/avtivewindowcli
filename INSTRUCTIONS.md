# 📖 INSTRUCTIONS.md — onodecli Developer Guide

> **onodecli** | Personal Automation Toolkit for Windows 11 Node.js ≥ 20 LTS | ESM | Platform: Windows 11

---

## 1. Tổng quan dự án

**onodecli** là một CLI cá nhân, có thể mở rộng, chạy trên Windows 11. Nó cung cấp:

- **Interactive menu** dạng emoji để chọn và chạy command
- **Direct invocation** qua `onodecli <command> [args]`
- **Modular architecture** — mỗi command là một file độc lập
- **Structured logging** với timestamp, level, và scope theo command

---

## 2. Cài đặt & chạy

```bash
# Cài dependencies
npm install

# Chạy trực tiếp (không cần link)
node bin/onodecli.js

# Link toàn cục để dùng lệnh `onodecli` ở mọi nơi
npm link

# Chế độ dev (auto-restart khi thay đổi file)
npm run dev
```

---

## 3. Cấu trúc thư mục

```
onodecli/
├── bin/
│   └── onodecli.js              # Entry point — routing, menu, arg parsing
├── commands/
│   ├── index.js                 # Registry — danh sách tất cả commands
│   ├── activewin.js             # 🪟 Active window inspector
│   ├── app-quickaccesspopup.js  # ⚡ Quick Access Popup launcher
│   ├── app-browser.js           # 🌐 Browser controller
│   └── spawncommand.js          # 🚀 Spawn Command Router
├── core/
│   ├── logger.js                # Structured logger (6 levels)
│   ├── menu.js                  # Interactive menu (inquirer)
│   └── runner.js                # Command executor + error boundary
├── docs/
│   ├── README.md
│   ├── CONTRIBUTING.md
│   └── commands/                # Một file .md cho mỗi command
├── tasks/                       # Task definitions cho từng feature mới
├── specs.md                     # Source of truth — đọc trước khi code
├── AGENTS_RULES.md              # Rules cho AI agents
├── TASK_TEMPLATE.md             # Template để thêm command mới
└── INSTRUCTIONS.md              # File này
```

---

## 4. Các lệnh CLI có sẵn

| Emoji | Key | Mô tả |
| --- | --- | --- |
| 🪟 | `activewin` | Xem thông tin cửa sổ đang được focus (title, process, PID) |
| ⚡ | `app-quickaccesspopup` | Launch hoặc reload QuickAccessPopup.exe |
| 🌐 | `app-browser` | Mở URL, focus browser, chọn profile |
| 🚀 | `spawncommand` | Spawn và chạy một CLI command khác (interactive) |

---

## 5. Cách sử dụng

```bash
# Mở interactive menu
onodecli

# Chạy command trực tiếp
onodecli <command> [args...]

# Xem help toàn bộ commands
onodecli --help

# Xem help của một command cụ thể
onodecli <command> --help

# Xem version
onodecli --version
```

### Ví dụ từng command

```bash
# Xem cửa sổ đang active (một lần)
onodecli activewin

# Theo dõi liên tục, output JSON
onodecli activewin --watch --json

# Mở URL trong browser profiles đang chạy
onodecli activewin --openurl="https://github.com/login||https://google.com"

# Launch QuickAccessPopup
onodecli app-quickaccesspopup --launch

# Launch từ path tùy chỉnh
onodecli app-quickaccesspopup --launch --path "C:\tools\QuickAccessPopup.exe"

# Reload QAP
onodecli app-quickaccesspopup --reload

# Mở URL trong Chrome
onodecli app-browser open --url https://example.com

# Mở URL trong Edge với profile cụ thể
onodecli app-browser open --browser edge --url https://example.com --profile "Profile 2"

# Focus Chrome window đang chạy
onodecli app-browser focus

# Spawn một CLI khác (interactive, stdin/stdout được kế thừa)
onodecli spawncommand gh auth login
onodecli spawncommand ocli cloudflared
onodecli spawncommand npm install --help
```

---

## 6. Command Module Contract

Mọi file trong `commands/` **bắt buộc** tuân theo contract sau:

### 6.1 Default export — `run(args, log)`

```js
/**
 * @param {string[]} args - CLI args sau command key
 * @param {import('../core/logger.js').Logger} log - Scoped logger
 * @returns {Promise<void>}
 */
export default async function run(args, log) {
  // Implement logic ở đây
}
```

### 6.2 Named export — `meta`

```js
export const meta = {
  key: 'my-command',           // CLI key
  emoji: '🔧',                 // Emoji trên menu
  label: 'My Command',         // Label hiển thị
  description: 'Mô tả ngắn',  // Hiển thị trong --help
  args: [
    {
      name: '--flag',
      required: false,
      description: 'Mô tả flag',
    },
  ],
  examples: [
    'onodecli my-command',
    'onodecli my-command --flag value',
  ],
};
```

### 6.3 Quy tắc bắt buộc trong command module

| Quy tắc | Đúng ✅ | Sai ❌ |
| --- | --- | --- |
| Logging | `log.info('message')` | `console.log('message')` |
| Exit khi lỗi | `throw new Error('USER: ...')` | `process.exit(1)` |
| Path | Dùng args/env var | Hardcode path |
| Lỗi không im lặng | Luôn `log.error()` trong catch | Bỏ qua lỗi |

---

## 7. Error Handling & Exit Codes

Commands báo lỗi bằng cách **throw Error** với prefix chuẩn:

```js
// Lỗi do người dùng nhập sai (exit code 1)
throw new Error('USER: --profile argument is required');

// Lỗi do hệ thống/runtime (exit code 2)
throw new Error('SYSTEM: Cannot find executable at path');
```

Runner (`core/runner.js`) tự động:

- Bắt error, gọi `log.error()`, và set `process.exitCode`
- Không crash toàn bộ CLI shell khi một command lỗi

| Prefix | Exit Code | Ý nghĩa |
| --- | --- | --- |
| `USER: ...` | `1` | User nhập sai args |
| `SYSTEM: ...` | `2` | Lỗi runtime/system |
| (khác) | `2` | Lỗi không xác định |

---

## 8. Logging API

Tất cả log **phải** dùng object `log` được inject qua `run(args, log)`:

```js
log.info('General status message');         // ℹ️  [INFO]  — cyan
log.success('Action completed');            // ✅ [OK]    — green
log.warn('Non-fatal issue');                // ⚠️  [WARN]  — yellow
log.error('Failure description');           // ❌ [ERROR] — red
log.debug('Verbose detail');                // 🔍 [DEBUG] — gray (opt-in)
log.step('Progress trong multi-step op');   // ▶️  [STEP]  — blue
```

**Format output:**

```
[HH:MM:SS] ✅ [OK]    [app-browser] Browser opened — url: https://example.com
[HH:MM:SS] ❌ [ERROR] [activewin]   Failed to read window title: Access denied
```

**Quy tắc message:** `<verb> <noun> — <detail>` Ví dụ: `"Launched popup — path: C:\tools\qap.exe"`

**Bật debug logs:**

```bash
onodecli activewin --debug
# hoặc
ONODECLI_DEBUG=1 onodecli activewin
```

---

## 9. Thêm command mới (step-by-step)

### Bước 1: Tạo file command

```bash
# Tạo file mới
commands/my-command.js
```

Nội dung theo template:

```js
export const meta = {
  key: 'my-command',
  emoji: '🔧',
  label: 'My Command',
  description: 'Mô tả ngắn',
  args: [...],
  examples: [...],
};

export default async function run(args, log) {
  log.step('Starting my-command');
  // logic ở đây
  log.success('Done');
}
```

### Bước 2: Đăng ký trong registry

Mở `commands/index.js` và **append** entry mới (không xóa/sửa entries cũ):

```js
{
  key: 'my-command',
  emoji: '🔧',
  label: 'My Command',
  description: 'Mô tả ngắn',
  module: './my-command.js',
},
```

### Bước 3: Thêm interactive sub-menu (nếu cần)

Trong `core/menu.js`, thêm case vào hàm `promptCommandArgs()`:

```js
case 'my-command': {
  const answers = await inquirer.prompt([...]);
  // push args dựa trên answers
  break;
}
```

> ⚠️ Chỉ sửa `core/menu.js` khi command cần sub-menu trong interactive mode.

### Bước 4: Viết docs

Tạo `docs/commands/my-command.md` bao gồm: Description, Usage, Arguments, Examples, Exit Codes, Error Messages.

### Bước 5: Verify

```bash
onodecli my-command --help   # phải hiển thị đúng args và examples
onodecli my-command          # phải chạy không lỗi
npm run lint                 # phải pass
```

---

## 10. Command Registry (`commands/index.js`)

```js
export const COMMANDS = [
  {
    key: 'activewin',
    emoji: '🪟',
    label: 'Active Window Inspector',
    description: 'Show info about the currently focused window',
    module: './activewin.js',
  },
  // ... thêm entry mới ở cuối, không sửa entries cũ
];
```

**Quy tắc:**

- Chỉ **APPEND** — không xóa hoặc sửa entries hiện có
- `module` là relative path từ thư mục `commands/`

---

## 11. Environment Variables

| Biến | Dùng bởi | Mô tả |
| --- | --- | --- |
| `ONODECLI_QAP_PATH` | `app-quickaccesspopup` | Path tới QuickAccessPopup.exe |
| `ONODECLI_DEBUG` | logger | Set `=1` để bật debug logs |
| `APPDATA` | `app-quickaccesspopup` | Windows APPDATA (auto-set by Windows) |
| `SystemRoot` | `activewin` | Windows system root (auto-set by Windows) |

---

## 12. Linting

```bash
npm run lint
```

ESLint được cấu hình trong `eslint.config.js` với các rule chính:

- `no-console: error` — không dùng `console.log/error` trực tiếp
- `prefer-const: error` — luôn dùng `const` thay `var/let` khi có thể
- `no-var: error` — không dùng `var`
- `no-unused-vars: warn` — cảnh báo biến không dùng

---

## 13. Khi làm việc với AI Agent

Dự án này có quy tắc nghiêm ngặt cho AI agents (xem `AGENTS_RULES.md`). Tóm tắt:

**Không bao giờ:**

- Sửa `specs.md` (source of truth)
- Thêm npm dependency mà không hỏi
- Dùng `console.log` hay `process.exit()` trong command module
- Hardcode đường dẫn file

**Luôn phải:**

- Đọc `specs.md` và `AGENTS_RULES.md` trước khi code
- Dùng `log` object để log, throw Error để báo lỗi
- Wrap external calls trong try/catch với `log.error()`
- Tạo/cập nhật docs khi thêm command mới

**Điền task vào** `TASK_TEMPLATE.md` trước khi giao cho agent.

---

## 14. Troubleshooting

| Vấn đề | Nguyên nhân | Cách sửa |
| --- | --- | --- |
| `onodecli` không nhận diện sau `npm link` | Node.js PATH chưa có global bin | Thêm npm global bin vào PATH Windows |
| `SYSTEM: Failed to spawn command` | Executable không tìm thấy | Kiểm tra command có trong PATH không |
| PowerShell script lỗi | Execution Policy bị chặn | Chạy `Set-ExecutionPolicy RemoteSigned -Scope CurrentUser` |
| Spawn process không thoát | Process không đóng sau `child.unref()` | Kiểm tra `detached: true` và `stdio: 'ignore'` |
| Log không hiện debug | Debug mode chưa bật | Dùng `--debug` hoặc `ONODECLI_DEBUG=1` |

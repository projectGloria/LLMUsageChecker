# AI Usage Limits Monitor

A lightweight desktop dashboard and terminal CLI application for tracking live usage limits and reset countdowns across **Google Antigravity**, **ChatGPT Codex**, and **Claude Code**.

---

## Features

- ⚡ **All-In-One Quota Dashboard**: Monitor your session and weekly capacity for Antigravity, Codex, and Claude Code side-by-side.
- ⏱ **Live Reset Countdown Clocks**: Real-time ticking timers showing exactly when your limits refresh down to the second.
- 🎨 **Visual Progress Bars & Gauges**: Color-coded limit meters (Green for safe, Yellow for warning, Red for high usage).
- 🖥 **Native Desktop App Feel**: Launches in standalone Edge/Chrome App Mode (`--app`), looking and feeling like a native Windows application without browser tabs or address bars.
- 📟 **Instant CLI Companion**: Run `node cli.js` or `npm run cli` directly in PowerShell/Windows Terminal for a fast, colorful console report.
- 🚀 **1-Click Terminal Launchers**: Open interactive terminal sessions for each tool (`agy`, `codex`, `claude`) with one click.
- 🔄 **Auto-Refresh**: Configurable background polling (Off, 30s, 1m, 5m, 15m) or on-demand instant refresh.

---

## How to Run

### 1. Launch the Desktop App (GUI)
Double-click **`run-app.bat`** or run in your terminal:
```bash
npm start
```
This automatically starts the local server and opens the desktop dashboard window.

### 2. Terminal CLI Mode
If you prefer checking your limits directly inside your command line:
```bash
npm run cli
# or
node cli.js
```

### 3. Server Only
To run just the local background HTTP server:
```bash
npm run server
```
Then visit `http://localhost:3883` in any browser.

---

## How It Connects to Each Tool

1. **Google Antigravity**:
   - Queries `agy.exe -p "/usage" --output-format json`.
   - Tracks Gemini Models (Weekly & 5-Hour limits) and 3rd-party models (Claude & GPT weekly & 5-Hour limits).

2. **ChatGPT Codex**:
   - Uses your stored ChatGPT authentication tokens from `~/.codex/auth.json`.
   - Directly queries `https://chatgpt.com/backend-api/wham/usage` to get exact 5-hour rolling limits, 7-day weekly limits, model reserves (e.g. `gpt-5.6-luna`), and rate limit reset credits.

3. **Claude Code**:
   - Uses `claude auth status` to check your connection status.
   - Reads `~/.claude.json` for cached utilization metrics and plan information, with a 1-click button to run `claude auth login` in terminal if your session expires.

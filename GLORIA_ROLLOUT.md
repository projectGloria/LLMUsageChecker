# Gloria rollout notes

## Please check

- **No native exe existed.** This is a Node.js app started by `launch.js` (via `run-app.bat`). The workflow bundles
  `launch.js` with esbuild and turns it into `LLMUsageChecker.exe` with Node's single-executable support (SEA), so
  users need no Node install. `public/` is shipped next to the exe. This build was not run locally; please test the
  first tag build. A console window will show while the app runs, because Node's exe is a console program.
- **Version:** `gloria.toml` says 1.0.0 (from `package.json`), but the catalog lists 0.2.0. The tag decides the packed
  version, so tag what you want released.
- **Icon:** there is no `.ico`, so `assets/icon.png` (512x512, already used by the project) is used.
- **data_folders is empty:** the app stores nothing itself. It only reads `~/.claude.json` and `~/.codex/auth.json`,
  which belong to other tools and must not be removed on uninstall.
- **Signing secrets** `WINDOWS_PFX_BASE64` and `WINDOWS_PFX_PASSWORD` must exist, or the setup is unsigned.
- `cli.js` is not shipped; only the dashboard exe is.

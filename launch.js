const { spawn, exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const { server, PORT } = require('./server');

function getAppBrowserPath() {
  const candidates = [
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe'
  ];

  for (const p of candidates) {
    if (fs.existsSync(p)) return p;
  }
  return null;
}

function openDesktopWindow(url) {
  const browserPath = getAppBrowserPath();

  if (browserPath) {
    console.log(`Opening standalone Desktop App via ${path.basename(browserPath)}...`);
    spawn(browserPath, [
      `--app=${url}`,
      '--window-size=1200,860',
      '--window-position=120,60'
    ], {
      detached: true,
      stdio: 'ignore',
      windowsHide: false
    }).unref();
  } else {
    console.log(`Opening in browser: ${url}`);
    exec(`powershell.exe -NoProfile -Command "Start-Process '${url}'"`, { windowsHide: true });
  }
}

server.listen(PORT, () => {
  const appUrl = `http://localhost:${PORT}`;
  console.log('\n======================================================');
  console.log('       ⚡ AI USAGE LIMITS MONITOR DASHBOARD ⚡        ');
  console.log('======================================================');
  console.log(` Server is live at: ${appUrl}`);
  console.log(' Press Ctrl+C in this terminal to stop the application.');
  console.log('======================================================\n');

  openDesktopWindow(appUrl);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.log(`Port ${PORT} is already in use. Opening existing dashboard...`);
    openDesktopWindow(`http://localhost:${PORT}`);
  } else {
    console.error('Server error:', err);
  }
});

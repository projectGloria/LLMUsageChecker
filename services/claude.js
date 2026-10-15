const fs = require('fs');
const path = require('path');
const os = require('os');
const { execFile } = require('child_process');

function checkClaudeAuth() {
  return new Promise((resolve) => {
    execFile('claude.exe', ['auth', 'status'], { timeout: 8000, windowsHide: true }, (err, stdout) => {
      if (stdout) {
        try {
          const parsed = JSON.parse(stdout);
          return resolve(parsed);
        } catch (e) {
          // ignore
        }
      }
      resolve({ loggedIn: false });
    });
  });
}

async function fetchClaudeUsage() {
  const authStatus = await checkClaudeAuth();
  const claudeConfigPath = path.join(os.homedir(), '.claude.json');

  let configData = null;
  if (fs.existsSync(claudeConfigPath)) {
    try {
      configData = JSON.parse(fs.readFileSync(claudeConfigPath, 'utf8'));
    } catch (e) {
      // ignore
    }
  }

  const oauth = configData?.oauthAccount || {};
  const cached = configData?.cachedUsageUtilization;
  const planTier = oauth.seatTier || oauth.userRateLimitTier || 'Pro / Subscription';

  const windows = [];

  if (cached?.utilization) {
    const u = cached.utilization;

    // 5-Hour limit
    if (u.five_hour) {
      const used = typeof u.five_hour.utilization === 'number' ? u.five_hour.utilization : 0;
      windows.push({
        id: 'claude-5h',
        name: '5-Hour Session Limit',
        window: '5h',
        usedPercent: Math.min(100, Math.max(0, Math.round(used * 10) / 10)),
        remainingPercent: Math.min(100, Math.max(0, Math.round((100 - used) * 10) / 10)),
        resetAt: u.five_hour.resets_at || null,
        description: 'Session rolling limit for Claude Code'
      });
    }

    // 7-Day limit
    if (u.seven_day) {
      const used = typeof u.seven_day.utilization === 'number' ? u.seven_day.utilization : 0;
      windows.push({
        id: 'claude-7d',
        name: 'Weekly Limit (All Models)',
        window: '7d',
        usedPercent: Math.min(100, Math.max(0, Math.round(used * 10) / 10)),
        remainingPercent: Math.min(100, Math.max(0, Math.round((100 - used) * 10) / 10)),
        resetAt: u.seven_day.resets_at || null,
        description: 'Weekly account-wide limit across Claude models'
      });
    }

    // Sonnet specific limit if present
    if (u.seven_day_sonnet) {
      const used = typeof u.seven_day_sonnet.utilization === 'number' ? u.seven_day_sonnet.utilization : 0;
      windows.push({
        id: 'claude-sonnet',
        name: 'Weekly Limit (Sonnet)',
        window: '7d',
        usedPercent: Math.min(100, Math.max(0, Math.round(used * 10) / 10)),
        remainingPercent: Math.min(100, Math.max(0, Math.round((100 - used) * 10) / 10)),
        resetAt: u.seven_day_sonnet.resets_at || null,
        description: 'Weekly limit for Claude Sonnet'
      });
    }
  }

  const fetchedAt = cached?.fetchedAtMs ? new Date(cached.fetchedAtMs).toISOString() : null;

  return {
    status: 'ok',
    provider: 'Claude Code',
    loggedIn: authStatus.loggedIn || false,
    email: oauth.emailAddress || null,
    plan: planTier,
    organization: oauth.organizationName || null,
    cachedAt: fetchedAt,
    lastUpdated: new Date().toISOString(),
    authNotice: !authStatus.loggedIn 
      ? 'Claude session is currently signed out. Run "claude auth login" in your terminal to refresh live limits.' 
      : null,
    windows
  };
}

module.exports = { fetchClaudeUsage };

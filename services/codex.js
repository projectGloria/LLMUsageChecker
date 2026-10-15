const fs = require('fs');
const path = require('path');
const os = require('os');

async function fetchCodexUsage() {
  const codexAuthPath = path.join(os.homedir(), '.codex', 'auth.json');
  
  if (!fs.existsSync(codexAuthPath)) {
    return {
      status: 'unauthenticated',
      provider: 'ChatGPT Codex',
      error: 'No Codex auth configuration found (~/.codex/auth.json)',
      lastUpdated: new Date().toISOString(),
      plan: 'Unknown',
      windows: []
    };
  }

  let authData;
  try {
    const raw = fs.readFileSync(codexAuthPath, 'utf8');
    authData = JSON.parse(raw);
  } catch (e) {
    return {
      status: 'error',
      provider: 'ChatGPT Codex',
      error: `Failed to read ~/.codex/auth.json: ${e.message}`,
      lastUpdated: new Date().toISOString(),
      plan: 'Unknown',
      windows: []
    };
  }

  const token = authData.tokens?.access_token;
  const accountId = authData.tokens?.account_id;

  if (!token) {
    return {
      status: 'unauthenticated',
      provider: 'ChatGPT Codex',
      error: 'No ChatGPT access token found in ~/.codex/auth.json. Run "codex login" to sign in.',
      lastUpdated: new Date().toISOString(),
      plan: 'Unknown',
      windows: []
    };
  }

  try {
    const headers = {
      'Authorization': `Bearer ${token}`,
      'User-Agent': 'codex/0.153.2',
      'Accept': 'application/json'
    };
    if (accountId) {
      headers['ChatGPT-Account-Id'] = accountId;
    }

    const res = await fetch('https://chatgpt.com/backend-api/wham/usage', {
      headers,
      signal: AbortSignal.timeout(10000)
    });

    if (res.status === 401) {
      return {
        status: 'unauthenticated',
        provider: 'ChatGPT Codex',
        error: 'ChatGPT session token has expired. Please launch Codex or run "codex login" to refresh.',
        lastUpdated: new Date().toISOString(),
        plan: authData.tokens?.plan_type || 'Unknown',
        windows: []
      };
    }

    if (!res.ok) {
      return {
        status: 'error',
        provider: 'ChatGPT Codex',
        error: `HTTP ${res.status}: ${res.statusText}`,
        lastUpdated: new Date().toISOString(),
        plan: 'Unknown',
        windows: []
      };
    }

    const data = await res.json();
    return normalizeCodexData(data);
  } catch (e) {
    return {
      status: 'error',
      provider: 'ChatGPT Codex',
      error: `Connection error: ${e.message}`,
      lastUpdated: new Date().toISOString(),
      plan: 'Unknown',
      windows: []
    };
  }
}

function normalizeCodexData(data) {
  const windows = [];

  // Primary window (usually 5-hour limit)
  if (data.rate_limit?.primary_window) {
    const pw = data.rate_limit.primary_window;
    const windowHours = Math.round((pw.limit_window_seconds || 18000) / 3600);
    const used = Math.min(100, Math.max(0, pw.used_percent || 0));
    windows.push({
      id: 'codex-primary',
      name: `${windowHours}-Hour Session Limit`,
      window: `${windowHours}h`,
      usedPercent: used,
      remainingPercent: Math.round((100 - used) * 10) / 10,
      resetAt: pw.reset_at ? new Date(pw.reset_at * 1000).toISOString() : null,
      resetAfterSeconds: pw.reset_after_seconds || null,
      description: `Rolling ${windowHours}-hour usage window`
    });
  }

  // Secondary window (usually weekly limit)
  if (data.rate_limit?.secondary_window) {
    const sw = data.rate_limit.secondary_window;
    const windowDays = Math.round((sw.limit_window_seconds || 604800) / 86400);
    const used = Math.min(100, Math.max(0, sw.used_percent || 0));
    windows.push({
      id: 'codex-secondary',
      name: `Weekly Limit (${windowDays} Days)`,
      window: `${windowDays}d`,
      usedPercent: used,
      remainingPercent: Math.round((100 - used) * 10) / 10,
      resetAt: sw.reset_at ? new Date(sw.reset_at * 1000).toISOString() : null,
      resetAfterSeconds: sw.reset_after_seconds || null,
      description: `Weekly account usage limit`
    });
  }

  // Additional rate limits (e.g. gpt-reserve / gpt-5.6-luna)
  if (Array.isArray(data.additional_rate_limits)) {
    for (const arl of data.additional_rate_limits) {
      if (arl.rate_limit?.primary_window) {
        const apw = arl.rate_limit.primary_window;
        const used = Math.min(100, Math.max(0, apw.used_percent || 0));
        const modelName = arl.normal_model_slug || arl.limit_name || 'Additional Model';
        windows.push({
          id: `codex-model-${arl.limit_name}`,
          name: `${modelName} Reserve Limit`,
          window: 'weekly',
          usedPercent: used,
          remainingPercent: Math.round((100 - used) * 10) / 10,
          resetAt: apw.reset_at ? new Date(apw.reset_at * 1000).toISOString() : null,
          resetAfterSeconds: apw.reset_after_seconds || null,
          description: `Specific quota for ${modelName}`
        });
      }
    }
  }

  return {
    status: 'ok',
    provider: 'ChatGPT Codex',
    plan: (data.plan_type || 'Plus').toUpperCase(),
    email: data.email || null,
    resetCredits: data.rate_limit_reset_credits?.available_count || 0,
    hasCredits: data.credits?.has_credits || false,
    creditBalance: data.credits?.balance || '0',
    lastUpdated: new Date().toISOString(),
    windows
  };
}

module.exports = { fetchCodexUsage };

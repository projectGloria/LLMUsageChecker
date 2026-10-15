// ==========================================
// AI Usage Monitor - Frontend Application
// ==========================================

let currentData = null;
let autoRefreshTimer = null;
let countdownElements = [];

// DOM Reference
const btnRefresh = document.getElementById('btn-refresh');
const refreshIcon = document.getElementById('refresh-icon');
const btnCopySummary = document.getElementById('btn-copy-summary');
const lastSyncLabel = document.getElementById('last-sync-label');
const autoRefreshSelect = document.getElementById('auto-refresh-select');
const toastContainer = document.getElementById('toast-container');

// Overview Elements
const overviewAgyVal = document.getElementById('overview-agy-val');
const overviewAgySub = document.getElementById('overview-agy-sub');
const overviewCodexVal = document.getElementById('overview-codex-val');
const overviewCodexSub = document.getElementById('overview-codex-sub');
const overviewClaudeVal = document.getElementById('overview-claude-val');
const overviewClaudeSub = document.getElementById('overview-claude-sub');
const overviewNextReset = document.getElementById('overview-next-reset');
const overviewNextTarget = document.getElementById('overview-next-target');

// Card Bodies & Badges
const agyBody = document.getElementById('agy-body');
const agyBadge = document.getElementById('agy-badge');

const codexBody = document.getElementById('codex-body');
const codexPlanBadge = document.getElementById('codex-plan-badge');
const codexEmailLabel = document.getElementById('codex-email-label');

const claudeBody = document.getElementById('claude-body');
const claudeBadge = document.getElementById('claude-badge');
const claudeProfileLabel = document.getElementById('claude-profile-label');
const claudeLoginBtn = document.getElementById('claude-login-btn');

// ==========================================
// Data Fetching
// ==========================================
async function loadUsage(force = false) {
  btnRefresh.disabled = true;
  refreshIcon.classList.add('spinning');
  lastSyncLabel.textContent = 'Syncing...';

  try {
    const url = force ? '/api/usage?force=true' : '/api/usage';
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    currentData = data;
    renderDashboard(data);

    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    lastSyncLabel.textContent = `Synced ${timeStr}`;
    if (force) showToast('Usage data refreshed successfully', '✓');
  } catch (err) {
    console.error('Failed to load usage data:', err);
    lastSyncLabel.textContent = 'Sync failed';
    showToast('Failed to connect to usage server', '⚠');
  } finally {
    btnRefresh.disabled = false;
    refreshIcon.classList.remove('spinning');
  }
}

// ==========================================
// Render Dashboard
// ==========================================
function renderDashboard(data) {
  countdownElements = [];
  const p = data.providers || {};

  renderOverview(p);
  renderAntigravity(p.antigravity);
  renderCodex(p.codex);
  renderClaude(p.claude);
  updateNextResetClock();
}

// ==========================================
// 1. Overview Strip
// ==========================================
function renderOverview(p) {
  // Antigravity Overview
  if (p.antigravity?.groups?.length) {
    const g0 = p.antigravity.groups[0];
    const b5h = g0?.buckets?.find(b => b.window === '5h') || g0?.buckets?.[1];
    if (b5h) {
      overviewAgyVal.textContent = `${b5h.remainingPercent}%`;
      overviewAgySub.textContent = `${b5h.usedPercent}% used (Gemini 5h)`;
    }
  } else {
    overviewAgyVal.textContent = '--';
  }

  // Codex Overview
  if (p.codex?.windows?.length) {
    const w5h = p.codex.windows.find(w => w.window === '5h') || p.codex.windows[0];
    if (w5h) {
      overviewCodexVal.textContent = `${w5h.usedPercent}%`;
      overviewCodexSub.textContent = `${w5h.remainingPercent}% left (Session)`;
    }
  } else {
    overviewCodexVal.textContent = '--';
  }

  // Claude Overview
  if (p.claude?.windows?.length) {
    const wWeek = p.claude.windows.find(w => w.window === '7d') || p.claude.windows[0];
    overviewClaudeVal.textContent = p.claude.loggedIn ? `${wWeek.usedPercent}%` : 'Signed Out';
    overviewClaudeSub.textContent = p.claude.loggedIn ? `${wWeek.remainingPercent}% left` : 'Login needed';
  } else {
    overviewClaudeVal.textContent = p.claude?.loggedIn ? 'Active' : 'Signed Out';
    overviewClaudeSub.textContent = p.claude?.loggedIn ? 'No cached limits' : 'Login needed';
  }
}

// Update Next Reset Clock
function updateNextResetClock() {
  const now = Date.now();
  let nearestMs = Infinity;
  let nearestLabel = '--';

  for (const item of countdownElements) {
    const targetMs = new Date(item.target).getTime();
    const diff = targetMs - now;
    if (diff > 0 && diff < (nearestMs - now)) {
      nearestMs = targetMs;
      nearestLabel = item.label || 'Quota limit';
    }
  }

  if (nearestMs !== Infinity) {
    overviewNextReset.textContent = formatDuration(nearestMs - now);
    overviewNextTarget.textContent = nearestLabel;
  } else {
    overviewNextReset.textContent = 'All Reset';
    overviewNextTarget.textContent = 'No upcoming refresh';
  }
}

// ==========================================
// 2. Google Antigravity Panel
// ==========================================
function renderAntigravity(agy) {
  if (!agy || agy.status !== 'ok') {
    agyBadge.className = 'status-badge badge-danger';
    agyBadge.textContent = 'Error';
    agyBody.innerHTML = `
      <div class="notice-box notice-warning">
        <strong>Antigravity Offline</strong>
        <span>${escapeHtml(agy?.error || 'Unable to execute agy CLI')}</span>
      </div>
    `;
    return;
  }

  agyBadge.className = 'status-badge badge-active';
  agyBadge.textContent = 'Connected';

  let html = '';
  for (const group of agy.groups || []) {
    html += `
      <div class="bucket-section">
        <div class="bucket-section-title">
          <span>${escapeHtml(group.name)}</span>
          <span class="bucket-badge-tag">${group.name.includes('Gemini') ? 'Flash & Pro' : '3rd-Party Models'}</span>
        </div>
    `;

    for (const b of group.buckets || []) {
      const cdId = `agy-cd-${Math.random().toString(36).substring(2, 8)}`;
      if (b.resetTime) {
        countdownElements.push({
          id: cdId,
          target: b.resetTime,
          label: `${group.name} (${b.window === '5h' ? '5h' : 'Week'})`
        });
      }

      const meterClass = getMeterClass(b.usedPercent);

      html += `
        <div class="quota-box">
          <div class="quota-box-header">
            <span class="quota-box-title">${escapeHtml(b.name)}</span>
            <div class="quota-box-metrics">
              <span class="quota-pct-used">${b.usedPercent}% used</span>
              <span class="quota-pct-left">(${b.remainingPercent}% left)</span>
            </div>
          </div>

          <div class="meter-container">
            <div class="meter-fill ${meterClass}" style="width: ${b.usedPercent}%"></div>
          </div>

          <div class="quota-box-footer">
            <span class="quota-window-name">${b.window === '5h' ? '5-Hour Rolling Limit' : 'Weekly Quota'}</span>
            <span class="countdown-pill" id="${cdId}" title="Reset timestamp: ${escapeHtml(b.resetTime || '')}">
              <svg class="countdown-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
              <span>${formatCountdown(b.resetTime)}</span>
            </span>
          </div>
        </div>
      `;
    }

    html += `</div>`;
  }

  agyBody.innerHTML = html;
}

// ==========================================
// 3. ChatGPT Codex Panel
// ==========================================
function renderCodex(codex) {
  if (!codex || codex.status === 'unauthenticated') {
    codexPlanBadge.textContent = 'NEEDS LOGIN';
    codexPlanBadge.style.color = '#fbbf24';
    codexEmailLabel.textContent = 'Token missing or expired';
    codexBody.innerHTML = `
      <div class="notice-box notice-warning">
        <strong>Session Sign-In Needed</strong>
        <span>${escapeHtml(codex?.error || 'Run "codex login" in your terminal to authenticate.')}</span>
      </div>
    `;
    return;
  }

  if (codex.status !== 'ok') {
    codexPlanBadge.textContent = 'ERROR';
    codexBody.innerHTML = `
      <div class="notice-box notice-warning">
        <strong>Codex API Error</strong>
        <span>${escapeHtml(codex.error || 'Failed to fetch Codex usage data.')}</span>
      </div>
    `;
    return;
  }

  codexPlanBadge.textContent = codex.plan || 'PLUS';
  codexEmailLabel.textContent = codex.email ? codex.email : 'Active Account';

  let html = '';

  // Rate limit reset credits card
  if (codex.resetCredits > 0) {
    html += `
      <div class="credit-highlight-card">
        <div class="credit-highlight-info">
          <span class="credit-star">★</span>
          <span class="credit-highlight-text">${codex.resetCredits} Reset Credit${codex.resetCredits > 1 ? 's' : ''} Available</span>
        </div>
        <span class="credit-tag">Use via /usage in CLI</span>
      </div>
    `;
  }

  for (const w of codex.windows || []) {
    const cdId = `codex-cd-${Math.random().toString(36).substring(2, 8)}`;
    if (w.resetAt) {
      countdownElements.push({
        id: cdId,
        target: w.resetAt,
        label: `Codex ${w.name}`
      });
    }

    const meterClass = getMeterClass(w.usedPercent);

    html += `
      <div class="quota-box">
        <div class="quota-box-header">
          <span class="quota-box-title">${escapeHtml(w.name)}</span>
          <div class="quota-box-metrics">
            <span class="quota-pct-used">${w.usedPercent}% used</span>
            <span class="quota-pct-left">(${w.remainingPercent}% left)</span>
          </div>
        </div>

        <div class="meter-container">
          <div class="meter-fill ${meterClass}" style="width: ${w.usedPercent}%"></div>
        </div>

        <div class="quota-box-footer">
          <span class="quota-window-name">${escapeHtml(w.description || '')}</span>
          <span class="countdown-pill" id="${cdId}" title="Reset timestamp: ${escapeHtml(w.resetAt || '')}">
            <svg class="countdown-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
            <span>${formatCountdown(w.resetAt)}</span>
          </span>
        </div>
      </div>
    `;
  }

  codexBody.innerHTML = html;
}

// ==========================================
// 4. Claude Code Panel
// ==========================================
function renderClaude(claude) {
  if (!claude) {
    claudeBadge.className = 'status-badge badge-danger';
    claudeBadge.textContent = 'Offline';
    claudeBody.innerHTML = '<div class="notice-box notice-warning">Claude service unavailable</div>';
    return;
  }

  if (claude.loggedIn) {
    claudeBadge.className = 'status-badge badge-active';
    claudeBadge.textContent = 'Signed In';
    claudeLoginBtn.style.display = 'none';
  } else {
    claudeBadge.className = 'status-badge badge-warning';
    claudeBadge.textContent = 'Signed Out';
    claudeLoginBtn.style.display = 'inline-flex';
  }

  claudeProfileLabel.textContent = claude.email ? `${claude.plan} • ${claude.email}` : claude.plan;

  let html = '';

  if (claude.authNotice) {
    html += `
      <div class="notice-box notice-warning">
        <strong>Authentication Notice</strong>
        <span>${escapeHtml(claude.authNotice)}</span>
      </div>
    `;
  }

  if (claude.cachedAt) {
    const formatted = new Date(claude.cachedAt).toLocaleString();
    html += `
      <div class="snapshot-timestamp">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
        <span>Snapshot: ${formatted}</span>
      </div>
    `;
  }

  if (claude.windows && claude.windows.length > 0) {
    for (const w of claude.windows) {
      const cdId = `claude-cd-${Math.random().toString(36).substring(2, 8)}`;
      if (w.resetAt) {
        countdownElements.push({
          id: cdId,
          target: w.resetAt,
          label: `Claude ${w.name}`
        });
      }

      const meterClass = getMeterClass(w.usedPercent);

      html += `
        <div class="quota-box">
          <div class="quota-box-header">
            <span class="quota-box-title">${escapeHtml(w.name)}</span>
            <div class="quota-box-metrics">
              <span class="quota-pct-used">${w.usedPercent}% used</span>
              <span class="quota-pct-left">(${w.remainingPercent}% left)</span>
            </div>
          </div>

          <div class="meter-container">
            <div class="meter-fill ${meterClass}" style="width: ${w.usedPercent}%"></div>
          </div>

          <div class="quota-box-footer">
            <span class="quota-window-name">${escapeHtml(w.description || '')}</span>
            <span class="countdown-pill" id="${cdId}" title="Reset timestamp: ${escapeHtml(w.resetAt || '')}">
              <svg class="countdown-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
              <span>${formatCountdown(w.resetAt)}</span>
            </span>
          </div>
        </div>
      `;
    }
  } else {
    html += `
      <div class="notice-box notice-info">
        <strong>Session Limits Idle</strong>
        <span>Limits refresh automatically as you prompt in Claude Code sessions.</span>
      </div>
    `;
  }

  claudeBody.innerHTML = html;
}

// ==========================================
// Formatting & Meter Color Calculation
// ==========================================
function getMeterClass(usedPercent) {
  if (usedPercent >= 80) return 'meter-danger';
  if (usedPercent >= 55) return 'meter-warn';
  return 'meter-safe';
}

function formatCountdown(targetDate) {
  if (!targetDate) return 'N/A';
  const now = Date.now();
  const resetMs = new Date(targetDate).getTime();
  const diffSec = Math.round((resetMs - now) / 1000);

  if (diffSec <= 0) return '✓ Ready / Reset';

  return formatDuration(diffSec * 1000);
}

function formatDuration(diffMs) {
  const diffSec = Math.max(0, Math.floor(diffMs / 1000));
  const days = Math.floor(diffSec / 86400);
  const hours = Math.floor((diffSec % 86400) / 3600);
  const minutes = Math.floor((diffSec % 3600) / 60);
  const seconds = diffSec % 60;

  const parts = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0 || days > 0) parts.push(`${hours}h`);
  parts.push(`${minutes}m`);
  parts.push(`${seconds}s`);

  return parts.join(' ');
}

// ==========================================
// Live 1-Second Timer Ticker
// ==========================================
setInterval(() => {
  for (const item of countdownElements) {
    const el = document.getElementById(item.id);
    if (el) {
      const text = formatCountdown(item.target);
      const isReady = text.includes('Ready');
      el.className = isReady ? 'countdown-pill ready' : 'countdown-pill';
      el.innerHTML = `
        <svg class="countdown-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
        <span>${text}</span>
      `;
    }
  }
  updateNextResetClock();
}, 1000);

// ==========================================
// Terminal Launcher Action
// ==========================================
async function launchTerminal(tool) {
  const names = {
    'agy': 'Google Antigravity (/usage)',
    'codex': 'ChatGPT Codex',
    'claude': 'Claude Code',
    'claude-login': 'Claude Auth Login'
  };

  showToast(`Launching ${names[tool] || tool} in Terminal...`, '⚡');

  try {
    const res = await fetch('/api/launch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tool })
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
  } catch (e) {
    console.error('Failed to launch terminal:', e);
    showToast('Failed to open terminal window', '✗');
  }
}

// ==========================================
// Copy Summary to Clipboard
// ==========================================
function copySummaryToClipboard() {
  if (!currentData?.providers) {
    showToast('No data available to copy', '⚠');
    return;
  }

  const p = currentData.providers;
  const lines = [
    `# ⚡ AI Usage Limits Report (${new Date().toLocaleString()})`,
    '',
    '## Google Antigravity',
    ...(p.antigravity?.groups || []).flatMap(g => [
      `### ${g.name}`,
      ...(g.buckets || []).map(b => `- ${b.name}: ${b.usedPercent}% used (${b.remainingPercent}% left) | Reset: ${b.resetTime || 'N/A'}`)
    ]),
    '',
    '## ChatGPT Codex',
    `- Plan: ${p.codex?.plan || 'Plus'} (${p.codex?.email || 'Active'})`,
    `- Reset Credits: ${p.codex?.resetCredits || 0}`,
    ...(p.codex?.windows || []).map(w => `- ${w.name}: ${w.usedPercent}% used (${w.remainingPercent}% left) | Reset: ${w.resetAt || 'N/A'}`),
    '',
    '## Claude Code',
    `- Status: ${p.claude?.loggedIn ? 'Signed In' : 'Signed Out'} (${p.claude?.plan || 'Pro'})`,
    ...(p.claude?.windows || []).map(w => `- ${w.name}: ${w.usedPercent}% used (${w.remainingPercent}% left) | Reset: ${w.resetAt || 'N/A'}`),
    ''
  ];

  navigator.clipboard.writeText(lines.join('\n')).then(() => {
    showToast('Usage summary copied to clipboard!', '📋');
  }).catch(() => {
    showToast('Could not copy to clipboard', '⚠');
  });
}

// ==========================================
// Toast Notification System
// ==========================================
function showToast(message, icon = '•') {
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.innerHTML = `<span>${icon}</span><span>${escapeHtml(message)}</span>`;
  toastContainer.appendChild(toast);

  setTimeout(() => {
    toast.remove();
  }, 3800);
}

// ==========================================
// Auto-Refresh Setup
// ==========================================
function setupAutoRefresh() {
  if (autoRefreshTimer) clearInterval(autoRefreshTimer);

  const seconds = parseInt(autoRefreshSelect.value, 10);
  if (seconds > 0) {
    autoRefreshTimer = setInterval(() => {
      loadUsage(false);
    }, seconds * 1000);
  }
}

autoRefreshSelect.addEventListener('change', setupAutoRefresh);
btnRefresh.addEventListener('click', () => loadUsage(true));
btnCopySummary.addEventListener('click', copySummaryToClipboard);

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// Initialize
loadUsage();
setupAutoRefresh();

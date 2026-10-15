#!/usr/bin/env node

const { fetchAntigravityUsage } = require('./services/antigravity');
const { fetchCodexUsage } = require('./services/codex');
const { fetchClaudeUsage } = require('./services/claude');

// ANSI Colors
const C = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  cyan: '\x1b[36m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  magenta: '\x1b[35m',
  blue: '\x1b[34m',
  gray: '\x1b[90m',
  bgBlue: '\x1b[44m',
  white: '\x1b[37m'
};

function renderBar(pctUsed, width = 20) {
  const filled = Math.round((pctUsed / 100) * width);
  const empty = width - filled;
  let color = C.green;
  if (pctUsed >= 80) color = C.red;
  else if (pctUsed >= 50) color = C.yellow;

  const bar = '█'.repeat(filled) + '░'.repeat(Math.max(0, empty));
  return `${color}${bar}${C.reset} ${pctUsed.toFixed(1)}% used (${(100 - pctUsed).toFixed(1)}% left)`;
}

function formatCountdown(targetDate) {
  if (!targetDate) return `${C.gray}N/A${C.reset}`;
  const now = Date.now();
  const resetMs = new Date(targetDate).getTime();
  const diffSec = Math.round((resetMs - now) / 1000);

  if (diffSec <= 0) return `${C.green}Ready / Reset${C.reset}`;

  const days = Math.floor(diffSec / 86400);
  const hours = Math.floor((diffSec % 86400) / 3600);
  const minutes = Math.floor((diffSec % 3600) / 60);

  const parts = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0 || days > 0) parts.push(`${hours}h`);
  parts.push(`${minutes}m`);

  return `${C.cyan}in ${parts.join(' ')}${C.reset}`;
}

async function main() {
  console.log(`\n${C.bold}${C.cyan}====================================================${C.reset}`);
  console.log(`${C.bold}${C.white}           ⚡ AI USAGE LIMITS MONITOR ⚡           ${C.reset}`);
  console.log(`${C.bold}${C.cyan}====================================================${C.reset}\n`);

  console.log(`${C.gray}Fetching live usage data...${C.reset}\n`);

  const [antigravity, codex, claude] = await Promise.all([
    fetchAntigravityUsage(),
    fetchCodexUsage(),
    fetchClaudeUsage()
  ]);

  // 1. Google Antigravity
  console.log(`${C.bold}${C.blue}▶ GOOGLE ANTIGRAVITY${C.reset} ${C.gray}(via agy CLI)${C.reset}`);
  if (antigravity.status === 'ok') {
    for (const group of antigravity.groups) {
      console.log(`  ${C.bold}${C.cyan}• ${group.name}${C.reset}`);
      for (const bucket of group.buckets) {
        const bar = renderBar(bucket.usedPercent);
        const resetStr = formatCountdown(bucket.resetTime);
        console.log(`    - ${bucket.name.padEnd(26)} [${bar}]  Reset: ${resetStr}`);
      }
    }
  } else {
    console.log(`  ${C.red}✗ Error: ${antigravity.error || 'Failed to fetch'}${C.reset}`);
  }
  console.log();

  // 2. ChatGPT Codex
  console.log(`${C.bold}${C.green}▶ CHATGPT CODEX${C.reset} ${C.gray}[Plan: ${codex.plan || 'Plus'}]${C.reset}`);
  if (codex.status === 'ok') {
    if (codex.resetCredits > 0) {
      console.log(`  ${C.magenta}★ Rate Limit Reset Credits: ${codex.resetCredits} available${C.reset}`);
    }
    for (const w of codex.windows) {
      const bar = renderBar(w.usedPercent);
      const resetStr = formatCountdown(w.resetAt);
      console.log(`  - ${w.name.padEnd(28)} [${bar}]  Reset: ${resetStr}`);
    }
  } else if (codex.status === 'unauthenticated') {
    console.log(`  ${C.yellow}⚠ ${codex.error}${C.reset}`);
  } else {
    console.log(`  ${C.red}✗ Error: ${codex.error || 'Failed to fetch'}${C.reset}`);
  }
  console.log();

  // 3. Claude Code
  console.log(`${C.bold}${C.magenta}▶ CLAUDE CODE${C.reset} ${C.gray}[Plan: ${claude.plan || 'Pro'}]${C.reset}`);
  if (claude.authNotice) {
    console.log(`  ${C.yellow}⚠ ${claude.authNotice}${C.reset}`);
  }
  if (claude.windows && claude.windows.length > 0) {
    if (claude.cachedAt) {
      console.log(`  ${C.gray}Last recorded snapshot: ${new Date(claude.cachedAt).toLocaleString()}${C.reset}`);
    }
    for (const w of claude.windows) {
      const bar = renderBar(w.usedPercent);
      const resetStr = formatCountdown(w.resetAt);
      console.log(`  - ${w.name.padEnd(28)} [${bar}]  Reset: ${resetStr}`);
    }
  } else {
    console.log(`  ${C.gray}No cached usage recorded. Run Claude Code to populate limits.${C.reset}`);
  }

  console.log(`\n${C.bold}${C.cyan}====================================================${C.reset}`);
  console.log(`${C.gray}To launch the Desktop GUI: npm start${C.reset}\n`);
}

main().catch((err) => {
  console.error(`${C.red}Fatal Error: ${err.message}${C.reset}`);
  process.exit(1);
});

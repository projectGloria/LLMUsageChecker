const { execFile } = require('child_process');

function fetchAntigravityUsage() {
  return new Promise((resolve) => {
    // Try JSON output first with windowsHide: true
    execFile(
      'agy.exe',
      ['-p', '/usage', '--output-format', 'json'],
      { timeout: 15000, windowsHide: true },
      (err, stdout, stderr) => {
        if (!err && stdout) {
          try {
            const parsed = JSON.parse(stdout);
            const usageData = parsed?.command?.data;
            if (usageData && Array.isArray(usageData.groups)) {
              return resolve(normalizeJsonData(usageData));
            }
          } catch (e) {
            // fall through to text parsing
          }
        }

        // Fallback: plain text with windowsHide: true
        execFile(
          'agy.exe',
          ['-p', '/usage'],
          { timeout: 15000, windowsHide: true },
          (err2, stdout2, stderr2) => {
            if (err2 || !stdout2) {
              return resolve({
                status: 'error',
                provider: 'Google Antigravity',
                error: err2 ? err2.message : (stderr2 || 'Failed to retrieve usage from agy CLI'),
                lastUpdated: new Date().toISOString(),
                groups: []
              });
            }
            return resolve(parseTextData(stdout2));
          }
        );
      }
    );
  });
}

function normalizeJsonData(data) {
  const groups = (data.groups || []).map(g => ({
    name: g.name,
    description: g.description || '',
    buckets: (g.buckets || []).map(b => {
      const remainingFrac = typeof b.remaining_fraction === 'number' ? b.remaining_fraction : 1;
      const remainingPercent = Math.round(remainingFrac * 1000) / 10;
      const usedPercent = Math.round((1 - remainingFrac) * 1000) / 10;
      return {
        id: b.id,
        name: b.name,
        window: b.window,
        description: b.description || '',
        remainingPercent: Math.max(0, Math.min(100, remainingPercent)),
        usedPercent: Math.max(0, Math.min(100, usedPercent)),
        resetTime: b.reset_time
      };
    })
  }));

  return {
    status: 'ok',
    provider: 'Google Antigravity',
    description: data.description || '',
    lastUpdated: new Date().toISOString(),
    groups
  };
}

function parseTextData(text) {
  const lines = text.trim().split(/\r?\n/).filter(Boolean);
  const groupMap = new Map();

  for (const line of lines) {
    const parts = line.split('\t').map(s => s.trim());
    if (parts.length >= 3) {
      const groupName = parts[0];
      const bucketName = parts[1];
      const pctStr = parts[2].replace('%', '');
      const remainingPercent = parseFloat(pctStr) || 0;
      const resetTime = parts[3] || null;

      if (!groupMap.has(groupName)) {
        groupMap.set(groupName, {
          name: groupName,
          description: '',
          buckets: []
        });
      }

      groupMap.get(groupName).buckets.push({
        name: bucketName,
        window: bucketName.toLowerCase().includes('five') ? '5h' : 'weekly',
        description: '',
        remainingPercent: remainingPercent,
        usedPercent: Math.round((100 - remainingPercent) * 10) / 10,
        resetTime: resetTime
      });
    }
  }

  return {
    status: 'ok',
    provider: 'Google Antigravity',
    description: 'Usage quotas parsed from agy CLI',
    lastUpdated: new Date().toISOString(),
    groups: Array.from(groupMap.values())
  };
}

module.exports = { fetchAntigravityUsage };

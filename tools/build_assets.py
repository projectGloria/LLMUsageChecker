import os
from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter

ASSETS = Path("assets")
ASSETS.mkdir(exist_ok=True)

# 1. ICON.SVG
icon_svg = """<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256" viewBox="0 0 256 256" fill="none">
  <defs>
    <linearGradient id="iconBg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#181e2b" />
      <stop offset="50%" stop-color="#0e121a" />
      <stop offset="100%" stop-color="#080a0f" />
    </linearGradient>
    <linearGradient id="borderGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#38bdf8" />
      <stop offset="50%" stop-color="#10b981" />
      <stop offset="100%" stop-color="#6366f1" />
    </linearGradient>
    <linearGradient id="boltGrad" x1="20%" y1="0%" x2="80%" y2="100%">
      <stop offset="0%" stop-color="#ffffff" />
      <stop offset="40%" stop-color="#e0f2fe" />
      <stop offset="100%" stop-color="#38bdf8" />
    </linearGradient>
    <filter id="boltGlow" x="-30%" y="-30%" width="160%" height="160%">
      <feGaussianBlur stdDeviation="6" result="blur" />
      <feMerge>
        <feMergeNode in="blur" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>
    <radialGradient id="coreGlow" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#38bdf8" stop-opacity="0.28" />
      <stop offset="60%" stop-color="#10b981" stop-opacity="0.10" />
      <stop offset="100%" stop-color="#000000" stop-opacity="0" />
    </radialGradient>
  </defs>

  <rect x="8" y="8" width="240" height="240" rx="56" fill="url(#iconBg)" stroke="url(#borderGrad)" stroke-width="3" />
  <rect x="11" y="11" width="234" height="234" rx="53" fill="none" stroke="#ffffff" stroke-opacity="0.06" stroke-width="1.5" />
  <circle cx="128" cy="128" r="96" fill="url(#coreGlow)" />

  <circle cx="128" cy="128" r="76" stroke="#1e293b" stroke-width="8" stroke-linecap="round" stroke-dasharray="380 100" transform="rotate(135 128 128)" />
  <circle cx="128" cy="128" r="76" stroke="#38bdf8" stroke-width="8" stroke-linecap="round" stroke-dasharray="110 370" stroke-dashoffset="0" transform="rotate(135 128 128)" />
  <circle cx="128" cy="128" r="76" stroke="#10b981" stroke-width="8" stroke-linecap="round" stroke-dasharray="110 370" stroke-dashoffset="-130" transform="rotate(135 128 128)" />
  <circle cx="128" cy="128" r="76" stroke="#f97316" stroke-width="8" stroke-linecap="round" stroke-dasharray="90 390" stroke-dashoffset="-260" transform="rotate(135 128 128)" />

  <circle cx="66" cy="82" r="5.5" fill="#38bdf8" filter="url(#boltGlow)" />
  <circle cx="188" cy="82" r="5.5" fill="#10b981" filter="url(#boltGlow)" />
  <circle cx="128" cy="204" r="5.5" fill="#f97316" filter="url(#boltGlow)" />

  <g filter="url(#boltGlow)">
    <polygon points="134 48 88 124 126 124 116 208 174 112 134 112 146 48" fill="url(#boltGrad)" />
  </g>
</svg>"""

with open(ASSETS / "icon.svg", "w", encoding="utf-8") as f:
    f.write(icon_svg)
print("Wrote assets/icon.svg")

# 2. GENERATE CRISP SUPERSAMPLED ICON.PNG
S = 1024
img = Image.new("RGBA", (S, S), (0, 0, 0, 0))
pad = 32
rad = 220

base = Image.new("RGBA", (S, S), (0, 0, 0, 0))
bdraw = ImageDraw.Draw(base)
for y in range(pad, S - pad):
    t = (y - pad) / (S - 2 * pad)
    r = int(24 * (1 - t) + 8 * t)
    g = int(30 * (1 - t) + 10 * t)
    b = int(43 * (1 - t) + 15 * t)
    bdraw.line([(pad, y), (S - pad, y)], fill=(r, g, b, 255))

mask = Image.new("L", (S, S), 0)
mdraw = ImageDraw.Draw(mask)
mdraw.rounded_rectangle([pad, pad, S - pad, S - pad], radius=rad, fill=255)

glow = Image.new("RGBA", (S, S), (0, 0, 0, 0))
gdraw = ImageDraw.Draw(glow)
gdraw.rounded_rectangle([pad - 10, pad - 10, S - pad + 10, S - pad + 10], radius=rad + 10, fill=(56, 189, 248, 80))
glow = glow.filter(ImageFilter.GaussianBlur(30))
img.paste(glow, (0, 0), glow)
img.paste(base, (0, 0), mask)

idraw = ImageDraw.Draw(img)
idraw.rounded_rectangle([pad, pad, S - pad, S - pad], radius=rad, outline=(56, 189, 248, 140), width=8)
idraw.rounded_rectangle([pad + 8, pad + 8, S - pad - 8, S - pad - 8], radius=rad - 8, outline=(255, 255, 255, 20), width=3)

arc_box = [220, 220, S - 220, S - 220]
idraw.arc(arc_box, start=135, end=405, fill=(30, 41, 59, 255), width=28)
idraw.arc(arc_box, start=135, end=215, fill=(56, 189, 248, 255), width=28)
idraw.arc(arc_box, start=225, end=305, fill=(16, 185, 129, 255), width=28)
idraw.arc(arc_box, start=315, end=395, fill=(249, 115, 22, 255), width=28)

cx, cy = S // 2, S // 2
bolt = [
    (cx + 18, cy - 160),
    (cx - 104, cy + 20),
    (cx - 4, cy + 20),
    (cx - 28, cy + 165),
    (cx + 104, cy - 16),
    (cx + 4, cy - 16),
]
idraw.polygon(bolt, fill=(255, 255, 255, 255))

for x, y, col in [
    (cx - 150, cy - 110, (56, 189, 248, 255)),
    (cx + 150, cy - 110, (16, 185, 129, 255)),
    (cx, cy + 180, (249, 115, 22, 255)),
]:
    idraw.ellipse([x - 16, y - 16, x + 16, y + 16], fill=col)

final_icon = img.resize((512, 512), Image.Resampling.LANCZOS)
final_icon.save(ASSETS / "icon.png", optimize=True)
print("Generated assets/icon.png")

# 3. HERO-PREVIEW.SVG (High-Fidelity Desktop GUI Preview)
hero_svg = """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1080 680" width="100%" height="100%">
  <defs>
    <!-- Background Gradient -->
    <radialGradient id="bgGlow" cx="50%" cy="20%" r="70%">
      <stop offset="0%" stop-color="#162035" />
      <stop offset="50%" stop-color="#0b0e17" />
      <stop offset="100%" stop-color="#05070a" />
    </radialGradient>
    <filter id="winShadow" x="-5%" y="-5%" width="110%" height="115%">
      <feDropShadow dx="0" dy="25" stdDeviation="30" flood-color="#000000" flood-opacity="0.8" />
      <feDropShadow dx="0" dy="4" stdDeviation="8" flood-color="#38bdf8" flood-opacity="0.12" />
    </filter>
    <linearGradient id="cardGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#121624" />
      <stop offset="100%" stop-color="#0e111a" />
    </linearGradient>
    <linearGradient id="agyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#38bdf8" />
      <stop offset="100%" stop-color="#6366f1" />
    </linearGradient>
    <linearGradient id="codexGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#10b981" />
      <stop offset="100%" stop-color="#06b6d4" />
    </linearGradient>
    <linearGradient id="claudeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#f97316" />
      <stop offset="100%" stop-color="#fbbf24" />
    </linearGradient>
  </defs>

  <style>
    .mono { font-family: 'JetBrains Mono', Consolas, monospace; }
    .sans { font-family: 'Plus Jakarta Sans', Segoe UI, system-ui, sans-serif; }
  </style>

  <!-- Ambient Backdrop -->
  <rect width="1080" height="680" fill="url(#bgGlow)" />

  <!-- Ambient Accent Orbs -->
  <circle cx="220" cy="120" r="180" fill="#38bdf8" opacity="0.12" filter="blur(60px)" />
  <circle cx="860" cy="240" r="220" fill="#10b981" opacity="0.09" filter="blur(70px)" />
  <circle cx="500" cy="600" r="240" fill="#6366f1" opacity="0.08" filter="blur(80px)" />

  <!-- Window Container -->
  <g transform="translate(30, 25)" filter="url(#winShadow)">
    <!-- Window Frame -->
    <rect width="1020" height="630" rx="14" fill="#090b12" stroke="#252d42" stroke-width="1.2" />

    <!-- Window Titlebar -->
    <rect width="1020" height="38" rx="14" fill="#0e121d" />
    <rect y="24" width="1020" height="14" fill="#0e121d" />
    <line x1="0" y1="38" x2="1020" y2="38" stroke="#1c2333" stroke-width="1" />

    <!-- Window Controls (Edge/Windows 11 style) -->
    <circle cx="24" cy="19" r="5" fill="#f43f5e" />
    <circle cx="42" cy="19" r="5" fill="#f59e0b" />
    <circle cx="60" cy="19" r="5" fill="#10b981" />
    <text x="510" y="24" text-anchor="middle" class="sans" font-size="12" fill="#718096" font-weight="500">AI Usage Limits Monitor — Desktop Standalone</text>

    <!-- Top App Header -->
    <g transform="translate(24, 52)">
      <!-- App Brand Icon -->
      <rect width="36" height="36" rx="8" fill="url(#agyGrad)" />
      <polygon points="20 7 11 19 18 19 16 29 27 15 20 15 20 7" fill="#ffffff" />

      <!-- App Titles -->
      <text x="46" y="19" class="sans" font-size="16" font-weight="700" fill="#ffffff">AI Usage Monitor</text>
      <rect x="180" y="7" width="34" height="17" rx="4" fill="#1e293b" />
      <text x="197" y="19" text-anchor="middle" class="mono" font-size="10" font-weight="600" fill="#38bdf8">v1.1</text>
      <text x="46" y="32" class="sans" font-size="11" fill="#64748b">Unified limit tracker for Google Antigravity, ChatGPT Codex &amp; Claude Code</text>

      <!-- Top Right Controls -->
      <!-- Sync Pill -->
      <rect x="610" y="5" width="105" height="26" rx="13" fill="#0f172a" stroke="#1e293b" />
      <circle cx="624" cy="18" r="4" fill="#10b981" />
      <text x="635" y="22" class="mono" font-size="10" fill="#94a3b8">Synced 4s ago</text>

      <!-- Interval Selector -->
      <rect x="725" y="5" width="95" height="26" rx="6" fill="#141a29" stroke="#232d42" />
      <text x="735" y="22" class="sans" font-size="11" fill="#94a3b8">1 min auto ▾</text>

      <!-- Refresh Button -->
      <rect x="830" y="4" width="75" height="28" rx="6" fill="url(#agyGrad)" />
      <text x="867" y="22" text-anchor="middle" class="sans" font-size="11" font-weight="600" fill="#ffffff">⚡ Refresh</text>

      <!-- Copy Summary Button -->
      <rect x="915" y="4" width="80" height="28" rx="6" fill="#1c2438" stroke="#2e3a59" />
      <text x="955" y="22" text-anchor="middle" class="sans" font-size="11" font-weight="600" fill="#94a3b8">📋 Summary</text>
    </g>

    <!-- Overview Strip (4 Stat Cards) -->
    <g transform="translate(24, 106)">
      <!-- Stat 1: Antigravity -->
      <rect x="0" y="0" width="232" height="66" rx="10" fill="url(#cardGrad)" stroke="#1e263b" />
      <circle cx="28" cy="33" r="16" fill="#38bdf8" fill-opacity="0.12" />
      <circle cx="28" cy="33" r="8" fill="none" stroke="#38bdf8" stroke-width="2" />
      <text x="56" y="26" class="sans" font-size="11" fill="#94a3b8">Google Antigravity</text>
      <text x="56" y="47" class="mono" font-size="16" font-weight="700" fill="#38bdf8">85.9% <tspan font-size="11" fill="#64748b" font-weight="400">Gemini 5h</tspan></text>

      <!-- Stat 2: Codex -->
      <rect x="246" y="0" width="232" height="66" rx="10" fill="url(#cardGrad)" stroke="#1e263b" />
      <circle cx="274" cy="33" r="16" fill="#10b981" fill-opacity="0.12" />
      <rect x="268" y="27" width="12" height="12" rx="2" fill="none" stroke="#10b981" stroke-width="2" />
      <text x="302" y="26" class="sans" font-size="11" fill="#94a3b8">ChatGPT Codex</text>
      <text x="302" y="47" class="mono" font-size="16" font-weight="700" fill="#10b981">100.0% <tspan font-size="11" fill="#64748b" font-weight="400">Session 5h</tspan></text>

      <!-- Stat 3: Claude Code -->
      <rect x="492" y="0" width="232" height="66" rx="10" fill="url(#cardGrad)" stroke="#1e263b" />
      <circle cx="520" cy="33" r="16" fill="#f97316" fill-opacity="0.12" />
      <polygon points="520 25 528 37 512 37" fill="none" stroke="#f97316" stroke-width="2" />
      <text x="548" y="26" class="sans" font-size="11" fill="#94a3b8">Claude Code</text>
      <text x="548" y="47" class="mono" font-size="15" font-weight="700" fill="#f59e0b">Pro / Ready <tspan font-size="11" fill="#64748b" font-weight="400">Active</tspan></text>

      <!-- Stat 4: Next Refresh Clock -->
      <rect x="738" y="0" width="234" height="66" rx="10" fill="url(#cardGrad)" stroke="#38bdf8" stroke-opacity="0.3" />
      <circle cx="766" cy="33" r="16" fill="#38bdf8" fill-opacity="0.15" />
      <circle cx="766" cy="33" r="8" fill="none" stroke="#38bdf8" stroke-width="1.8" />
      <line x1="766" y1="33" x2="766" y2="28" stroke="#38bdf8" stroke-width="1.8" />
      <line x1="766" y1="33" x2="771" y2="33" stroke="#38bdf8" stroke-width="1.8" />
      <text x="794" y="26" class="sans" font-size="11" fill="#94a3b8">Next Limit Refresh</text>
      <text x="794" y="48" class="mono" font-size="16" font-weight="700" fill="#38bdf8">01h 07m 48s <tspan font-size="10" fill="#64748b" font-weight="400">agy 5h</tspan></text>
    </g>

    <!-- Main Grid (3 Columns) -->
    <g transform="translate(24, 186)">
      <!-- Panel 1: Google Antigravity -->
      <rect x="0" y="0" width="314" height="420" rx="12" fill="url(#cardGrad)" stroke="#1e263b" />
      <!-- Header -->
      <rect x="14" y="14" width="28" height="28" rx="6" fill="#38bdf8" fill-opacity="0.15" />
      <circle cx="28" cy="28" r="7" fill="none" stroke="#38bdf8" stroke-width="2" />
      <text x="50" y="28" class="sans" font-size="14" font-weight="700" fill="#ffffff">Google Antigravity</text>
      <rect x="235" y="16" width="50" height="18" rx="4" fill="#064e3b" />
      <text x="260" y="29" text-anchor="middle" class="mono" font-size="9" font-weight="700" fill="#34d399">ACTIVE</text>
      <text x="50" y="40" class="mono" font-size="10" fill="#64748b">CLI Binary: agy.exe</text>

      <!-- Group 1: Gemini Models -->
      <g transform="translate(14, 58)">
        <rect width="286" height="122" rx="8" fill="#141a29" stroke="#1f273d" />
        <text x="12" y="20" class="sans" font-size="12" font-weight="600" fill="#38bdf8">Gemini Models</text>

        <!-- Metric 1: 5-Hour Limit -->
        <text x="12" y="42" class="sans" font-size="11" fill="#cbd5e1">Five Hour Limit Remaining</text>
        <text x="274" y="42" text-anchor="end" class="mono" font-size="11" font-weight="600" fill="#10b981">61.9% left</text>
        <rect x="12" y="48" width="262" height="7" rx="3.5" fill="#1e293b" />
        <rect x="12" y="48" width="100" height="7" rx="3.5" fill="#10b981" />
        <text x="12" y="68" class="mono" font-size="10" fill="#64748b">Resets: <tspan fill="#38bdf8">in 1h 7m 48s</tspan></text>

        <!-- Metric 2: Weekly Limit -->
        <text x="12" y="88" class="sans" font-size="11" fill="#cbd5e1">Weekly Limit Remaining</text>
        <text x="274" y="88" text-anchor="end" class="mono" font-size="11" font-weight="600" fill="#10b981">85.9% left</text>
        <rect x="12" y="94" width="262" height="7" rx="3.5" fill="#1e293b" />
        <rect x="12" y="94" width="37" height="7" rx="3.5" fill="#10b981" />
        <text x="12" y="114" class="mono" font-size="10" fill="#64748b">Resets: <tspan fill="#38bdf8">in 6d 3h 35m</tspan></text>
      </g>

      <!-- Group 2: Gemini 4 Argon -->
      <g transform="translate(14, 192)">
        <rect width="286" height="80" rx="8" fill="#141a29" stroke="#1f273d" />
        <text x="12" y="20" class="sans" font-size="12" font-weight="600" fill="#818cf8">Gemini 4 Argon</text>
        <text x="12" y="42" class="sans" font-size="11" fill="#cbd5e1">Weekly Quota Remaining</text>
        <text x="274" y="42" text-anchor="end" class="mono" font-size="11" font-weight="600" fill="#f59e0b">23.4% left</text>
        <rect x="12" y="48" width="262" height="7" rx="3.5" fill="#1e293b" />
        <rect x="12" y="48" width="200" height="7" rx="3.5" fill="#f59e0b" />
        <text x="12" y="68" class="mono" font-size="10" fill="#64748b">Resets: <tspan fill="#38bdf8">in 5d 12h 25m</tspan></text>
      </g>

      <!-- Group 3: Claude & GPT models -->
      <g transform="translate(14, 284)">
        <rect width="286" height="72" rx="8" fill="#141a29" stroke="#1f273d" />
        <text x="12" y="20" class="sans" font-size="12" font-weight="600" fill="#a78bfa">Claude &amp; GPT Models</text>
        <text x="12" y="40" class="sans" font-size="11" fill="#cbd5e1">5-Hour Window</text>
        <text x="274" y="40" text-anchor="end" class="mono" font-size="11" font-weight="600" fill="#10b981">100% left</text>
        <rect x="12" y="46" width="262" height="7" rx="3.5" fill="#1e293b" />
        <rect x="12" y="46" width="0" height="7" rx="3.5" fill="#10b981" />
        <text x="12" y="64" class="mono" font-size="10" fill="#64748b">Resets: <tspan fill="#38bdf8">in 5h 0m</tspan></text>
      </g>

      <!-- Footer Button -->
      <rect x="14" y="368" width="286" height="38" rx="7" fill="#161f33" stroke="#253556" />
      <text x="157" y="392" text-anchor="middle" class="sans" font-size="12" font-weight="600" fill="#38bdf8">▶ Launch agy (/usage)</text>

      <!-- Panel 2: ChatGPT Codex -->
      <g transform="translate(328, 0)">
        <rect x="0" y="0" width="314" height="420" rx="12" fill="url(#cardGrad)" stroke="#1e263b" />
        <rect x="14" y="14" width="28" height="28" rx="6" fill="#10b981" fill-opacity="0.15" />
        <rect x="22" y="22" width="12" height="12" rx="2" fill="none" stroke="#10b981" stroke-width="2" />
        <text x="50" y="28" class="sans" font-size="14" font-weight="700" fill="#ffffff">ChatGPT Codex</text>
        <rect x="240" y="16" width="45" height="18" rx="4" fill="#064e3b" />
        <text x="262" y="29" text-anchor="middle" class="mono" font-size="9" font-weight="700" fill="#34d399">PLUS</text>
        <text x="50" y="40" class="mono" font-size="10" fill="#64748b">Token: ~/.codex/auth.json</text>

        <!-- Metric 1: 5-Hour Session -->
        <g transform="translate(14, 58)">
          <rect width="286" height="90" rx="8" fill="#141a29" stroke="#1f273d" />
          <text x="12" y="22" class="sans" font-size="12" font-weight="600" fill="#10b981">5-Hour Session Limit</text>
          <text x="274" y="22" text-anchor="end" class="mono" font-size="11" font-weight="600" fill="#10b981">100.0% left</text>
          <rect x="12" y="32" width="262" height="8" rx="4" fill="#1e293b" />
          <rect x="12" y="32" width="0" height="8" rx="4" fill="#10b981" />
          <text x="12" y="58" class="sans" font-size="11" fill="#94a3b8">Active Window Usage</text>
          <text x="274" y="58" text-anchor="end" class="mono" font-size="11" fill="#cbd5e1">0 / 100 requests</text>
          <text x="12" y="78" class="mono" font-size="10" fill="#64748b">Resets: <tspan fill="#38bdf8">in 4h 59m</tspan></text>
        </g>

        <!-- Metric 2: Weekly Quota -->
        <g transform="translate(14, 160)">
          <rect width="286" height="90" rx="8" fill="#141a29" stroke="#1f273d" />
          <text x="12" y="22" class="sans" font-size="12" font-weight="600" fill="#34d399">Weekly Limit (7 Days)</text>
          <text x="274" y="22" text-anchor="end" class="mono" font-size="11" font-weight="600" fill="#10b981">100.0% left</text>
          <rect x="12" y="32" width="262" height="8" rx="4" fill="#1e293b" />
          <rect x="12" y="32" width="0" height="8" rx="4" fill="#10b981" />
          <text x="12" y="58" class="sans" font-size="11" fill="#94a3b8">7-Day Rolling Capacity</text>
          <text x="274" y="58" text-anchor="end" class="mono" font-size="11" fill="#cbd5e1">0% consumed</text>
          <text x="12" y="78" class="mono" font-size="10" fill="#64748b">Resets: <tspan fill="#38bdf8">in 6d 23h 59m</tspan></text>
        </g>

        <!-- Rate Limit Reset Credits -->
        <g transform="translate(14, 262)">
          <rect width="286" height="94" rx="8" fill="#141a29" stroke="#1f273d" />
          <text x="12" y="22" class="sans" font-size="12" font-weight="600" fill="#c084fc">★ Rate Limit Reset Credits</text>
          <text x="12" y="44" class="sans" font-size="11" fill="#94a3b8">Instant quota resets available:</text>
          <text x="274" y="44" text-anchor="end" class="mono" font-size="12" font-weight="700" fill="#38bdf8">Active</text>
          <text x="12" y="66" class="sans" font-size="11" fill="#94a3b8">Direct Backend Route:</text>
          <text x="274" y="66" text-anchor="end" class="mono" font-size="10" fill="#64748b">/wham/usage</text>
          <text x="12" y="84" class="mono" font-size="10" fill="#10b981">✓ Stored token authorized</text>
        </g>

        <!-- Footer Button -->
        <rect x="14" y="368" width="286" height="38" rx="7" fill="#122822" stroke="#1a4d3e" />
        <text x="157" y="392" text-anchor="middle" class="sans" font-size="12" font-weight="600" fill="#10b981">▶ Launch Codex CLI</text>
      </g>

      <!-- Panel 3: Claude Code -->
      <g transform="translate(656, 0)">
        <rect x="0" y="0" width="314" height="420" rx="12" fill="url(#cardGrad)" stroke="#1e263b" />
        <rect x="14" y="14" width="28" height="28" rx="6" fill="#f97316" fill-opacity="0.15" />
        <polygon points="28 20 34 32 22 32" fill="none" stroke="#f97316" stroke-width="2" />
        <text x="50" y="28" class="sans" font-size="14" font-weight="700" fill="#ffffff">Claude Code</text>
        <rect x="220" y="16" width="65" height="18" rx="4" fill="#451a03" />
        <text x="252" y="29" text-anchor="middle" class="mono" font-size="9" font-weight="700" fill="#fb923c">AUTH OK</text>
        <text x="50" y="40" class="mono" font-size="10" fill="#64748b">State: ~/.claude.json</text>

        <!-- Status Card -->
        <g transform="translate(14, 58)">
          <rect width="286" height="96" rx="8" fill="#141a29" stroke="#1f273d" />
          <text x="12" y="22" class="sans" font-size="12" font-weight="600" fill="#f97316">Session &amp; Subscription</text>
          <text x="12" y="44" class="sans" font-size="11" fill="#94a3b8">Plan Tier:</text>
          <text x="274" y="44" text-anchor="end" class="mono" font-size="11" font-weight="600" fill="#ffffff">Pro / Max</text>
          <text x="12" y="66" class="sans" font-size="11" fill="#94a3b8">Live Auth Status:</text>
          <text x="274" y="66" text-anchor="end" class="mono" font-size="11" font-weight="600" fill="#10b981">Authenticated</text>
          <text x="12" y="86" class="mono" font-size="10" fill="#64748b">Tool CLI: <tspan fill="#38bdf8">claude.exe</tspan></text>
        </g>

        <!-- Quota Tracking Card -->
        <g transform="translate(14, 166)">
          <rect width="286" height="110" rx="8" fill="#141a29" stroke="#1f273d" />
          <text x="12" y="22" class="sans" font-size="12" font-weight="600" fill="#fbbf24">Token &amp; Rate Utilization</text>
          <text x="12" y="44" class="sans" font-size="11" fill="#cbd5e1">Weekly Rolling Budget</text>
          <text x="274" y="44" text-anchor="end" class="mono" font-size="11" font-weight="600" fill="#10b981">92.4% left</text>
          <rect x="12" y="52" width="262" height="8" rx="4" fill="#1e293b" />
          <rect x="12" y="52" width="20" height="8" rx="4" fill="#10b981" />
          <text x="12" y="78" class="sans" font-size="11" fill="#94a3b8">Countdown Clock</text>
          <text x="274" y="78" text-anchor="end" class="mono" font-size="11" fill="#38bdf8">in 4d 18h</text>
          <text x="12" y="98" class="mono" font-size="10" fill="#10b981">● Ready for interactive coding</text>
        </g>

        <!-- 1-Click Login Helper Box -->
        <g transform="translate(14, 288)">
          <rect width="286" height="68" rx="8" fill="#181412" stroke="#451a03" />
          <text x="12" y="22" class="sans" font-size="11" font-weight="600" fill="#f97316">Terminal Helper Action</text>
          <text x="12" y="40" class="sans" font-size="10" fill="#94a3b8">If your Anthropic session ever expires, 1-click</text>
          <text x="12" y="54" class="mono" font-size="10" fill="#cbd5e1">claude auth login <tspan fill="#64748b">spawns automatically</tspan></text>
        </g>

        <!-- Footer Button -->
        <rect x="14" y="368" width="286" height="38" rx="7" fill="#2d170a" stroke="#612809" />
        <text x="157" y="392" text-anchor="middle" class="sans" font-size="12" font-weight="600" fill="#f97316">▶ Launch Claude Code</text>
      </g>
    </g>
  </g>
</svg>"""

with open(ASSETS / "hero-preview.svg", "w", encoding="utf-8") as f:
    f.write(hero_svg)
print("Wrote assets/hero-preview.svg")

# 4. TOUR-CLI.SVG (Terminal CLI Showcase)
tour_cli_svg = """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 920 540" width="100%" height="100%">
  <defs>
    <filter id="termShadow" x="-5%" y="-5%" width="110%" height="115%">
      <feDropShadow dx="0" dy="20" stdDeviation="25" flood-color="#000000" flood-opacity="0.85" />
      <feDropShadow dx="0" dy="2" stdDeviation="6" flood-color="#38bdf8" flood-opacity="0.15" />
    </filter>
  </defs>
  <style>
    .t-mono { font-family: 'JetBrains Mono', Consolas, monospace; font-size: 13px; }
  </style>

  <rect width="920" height="540" fill="#08090e" />

  <g transform="translate(25, 20)" filter="url(#termShadow)">
    <!-- Terminal Window Frame -->
    <rect width="870" height="495" rx="10" fill="#0c1017" stroke="#1f293d" stroke-width="1.2" />

    <!-- Terminal Header Bar -->
    <rect width="870" height="34" rx="10" fill="#141a24" />
    <rect y="22" width="870" height="12" fill="#141a24" />
    <line x1="0" y1="34" x2="870" y2="34" stroke="#1f293d" stroke-width="1" />

    <!-- Window Dots -->
    <circle cx="20" cy="17" r="5" fill="#f43f5e" />
    <circle cx="36" cy="17" r="5" fill="#f59e0b" />
    <circle cx="52" cy="17" r="5" fill="#10b981" />
    <text x="435" y="22" text-anchor="middle" font-family="'Plus Jakarta Sans', Segoe UI, sans-serif" font-size="12" fill="#64748b">PowerShell — node cli.js</text>

    <!-- Terminal Output -->
    <g transform="translate(24, 60)" class="t-mono">
      <!-- Prompt Command -->
      <text x="0" y="0" fill="#10b981">PS C:\\Users\\Developer\\LLMUsageChecker&gt; <tspan fill="#ffffff">npm run cli</tspan></text>

      <!-- Banner -->
      <text x="0" y="30" fill="#38bdf8" font-weight="bold">====================================================</text>
      <text x="0" y="50" fill="#ffffff" font-weight="bold">           ⚡ AI USAGE LIMITS MONITOR ⚡           </text>
      <text x="0" y="70" fill="#38bdf8" font-weight="bold">====================================================</text>

      <text x="0" y="100" fill="#64748b">Fetching live usage data from local binaries and sessions...</text>

      <!-- Google Antigravity Section -->
      <text x="0" y="130" fill="#38bdf8" font-weight="bold">▶ GOOGLE ANTIGRAVITY <tspan fill="#64748b" font-weight="normal">(via agy CLI)</tspan></text>
      <text x="16" y="152" fill="#38bdf8">• Gemini Models</text>
      <text x="32" y="174" fill="#cbd5e1">- Weekly Limit Remaining     <tspan fill="#10b981">[███░░░░░░░░░░░░░░░░░ 14.1% used (85.9% left)]</tspan>  Reset: <tspan fill="#38bdf8">in 6d 3h 35m</tspan></text>
      <text x="32" y="196" fill="#cbd5e1">- Five Hour Limit Remaining  <tspan fill="#10b981">[████████░░░░░░░░░░░░ 38.1% used (61.9% left)]</tspan>  Reset: <tspan fill="#38bdf8">in 1h 8m</tspan></text>
      <text x="16" y="218" fill="#818cf8">• Gemini 4 Argon</text>
      <text x="32" y="240" fill="#cbd5e1">- Gemini 4 Argon Weekly      <tspan fill="#f59e0b">[███████████████░░░░░ 76.6% used (23.4% left)]</tspan>  Reset: <tspan fill="#38bdf8">in 5d 12h 25m</tspan></text>
      <text x="16" y="262" fill="#a78bfa">• Claude and GPT models</text>
      <text x="32" y="284" fill="#cbd5e1">- Five Hour Limit Remaining  <tspan fill="#10b981">[░░░░░░░░░░░░░░░░░░░░  0.0% used (100.0% left)]</tspan>  Reset: <tspan fill="#38bdf8">in 5h 0m</tspan></text>

      <!-- ChatGPT Codex Section -->
      <text x="0" y="316" fill="#10b981" font-weight="bold">▶ CHATGPT CODEX <tspan fill="#64748b" font-weight="normal">[Plan: PLUS]</tspan></text>
      <text x="16" y="338" fill="#cbd5e1">- 5-Hour Session Limit         <tspan fill="#10b981">[░░░░░░░░░░░░░░░░░░░░  0.0% used (100.0% left)]</tspan>  Reset: <tspan fill="#38bdf8">in 4h 59m</tspan></text>
      <text x="16" y="360" fill="#cbd5e1">- Weekly Limit (7 Days)        <tspan fill="#10b981">[░░░░░░░░░░░░░░░░░░░░  0.0% used (100.0% left)]</tspan>  Reset: <tspan fill="#38bdf8">in 6d 23h 59m</tspan></text>

      <!-- Claude Code Section -->
      <text x="0" y="392" fill="#f97316" font-weight="bold">▶ CLAUDE CODE <tspan fill="#64748b" font-weight="normal">[Plan: Pro / Subscription]</tspan></text>
      <text x="16" y="414" fill="#10b981">✓ Claude CLI session authenticated (~/.claude.json)</text>

      <!-- Bottom Hint -->
      <text x="0" y="446" fill="#38bdf8" font-weight="bold">====================================================</text>
      <text x="0" y="466" fill="#94a3b8">To launch the Standalone Desktop GUI: <tspan fill="#38bdf8">npm start</tspan></text>
    </g>
  </g>
</svg>"""

with open(ASSETS / "tour-cli.svg", "w", encoding="utf-8") as f:
    f.write(tour_cli_svg)
print("Wrote assets/tour-cli.svg")

# 5. TOUR-DASHBOARD.SVG (Feature Focus: Live Countdowns & Meters)
tour_dash_svg = """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 920 400" width="100%" height="100%">
  <defs>
    <filter id="panelGlow" x="-5%" y="-5%" width="110%" height="115%">
      <feDropShadow dx="0" dy="15" stdDeviation="18" flood-color="#000000" flood-opacity="0.7" />
    </filter>
    <linearGradient id="meterGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#10b981" />
      <stop offset="65%" stop-color="#f59e0b" />
      <stop offset="90%" stop-color="#f43f5e" />
    </linearGradient>
  </defs>
  <style>
    .mono { font-family: 'JetBrains Mono', Consolas, monospace; }
    .sans { font-family: 'Plus Jakarta Sans', Segoe UI, system-ui, sans-serif; }
  </style>

  <rect width="920" height="400" fill="#090c14" />

  <!-- Feature Comparison Cards -->
  <g transform="translate(30, 25)" filter="url(#panelGlow)">
    <!-- Card 1: Live Ticking Countdown Engine -->
    <rect x="0" y="0" width="415" height="350" rx="12" fill="#111622" stroke="#1e273b" />
    <circle cx="36" cy="36" r="16" fill="#38bdf8" fill-opacity="0.15" />
    <text x="36" y="41" text-anchor="middle" font-size="16">⏱️</text>
    <text x="64" y="34" class="sans" font-size="15" font-weight="700" fill="#ffffff">Live Reset Countdown Clocks</text>
    <text x="64" y="50" class="sans" font-size="11" fill="#64748b">Real-time local second tickers without API spam</text>

    <!-- Sub-elements -->
    <g transform="translate(20, 75)">
      <!-- Clock Item 1 -->
      <rect width="375" height="74" rx="8" fill="#161c2d" stroke="#222b40" />
      <text x="14" y="24" class="sans" font-size="12" font-weight="600" fill="#94a3b8">Antigravity 5-Hour Rolling Limit</text>
      <text x="14" y="52" class="mono" font-size="20" font-weight="700" fill="#38bdf8">01h 07m 48s</text>
      <text x="360" y="52" text-anchor="end" class="mono" font-size="11" fill="#10b981">61.9% Capacity Left</text>

      <!-- Clock Item 2 -->
      <g transform="translate(0, 86)">
        <rect width="375" height="74" rx="8" fill="#161c2d" stroke="#222b40" />
        <text x="14" y="24" class="sans" font-size="12" font-weight="600" fill="#94a3b8">Codex 7-Day Rolling Window</text>
        <text x="14" y="52" class="mono" font-size="20" font-weight="700" fill="#10b981">06d 23h 59s</text>
        <text x="360" y="52" text-anchor="end" class="mono" font-size="11" fill="#10b981">100.0% Fresh</text>
      </g>

      <!-- Clock Item 3 -->
      <g transform="translate(0, 172)">
        <rect width="375" height="74" rx="8" fill="#161c2d" stroke="#222b40" />
        <text x="14" y="24" class="sans" font-size="12" font-weight="600" fill="#94a3b8">Gemini 4 Argon Weekly Reset</text>
        <text x="14" y="52" class="mono" font-size="20" font-weight="700" fill="#f59e0b">05d 12h 25s</text>
        <text x="360" y="52" text-anchor="end" class="mono" font-size="11" fill="#f59e0b">23.4% Capacity Left</text>
      </g>
    </g>

    <!-- Card 2: Visual Gauge Thresholds & 1-Click Launchers -->
    <g transform="translate(445, 0)">
      <rect x="0" y="0" width="415" height="350" rx="12" fill="#111622" stroke="#1e273b" />
      <circle cx="36" cy="36" r="16" fill="#10b981" fill-opacity="0.15" />
      <text x="36" y="41" text-anchor="middle" font-size="16">🎨</text>
      <text x="64" y="34" class="sans" font-size="15" font-weight="700" fill="#ffffff">Adaptive Health Meters &amp; Launchers</text>
      <text x="64" y="50" class="sans" font-size="11" fill="#64748b">Instant status recognition &amp; direct CLI triggers</text>

      <g transform="translate(20, 75)">
        <!-- Threshold Bar Examples -->
        <rect width="375" height="110" rx="8" fill="#161c2d" stroke="#222b40" />
        <text x="14" y="22" class="sans" font-size="11" font-weight="600" fill="#cbd5e1">Dynamic Color States</text>
        
        <!-- Safe State -->
        <text x="14" y="44" class="mono" font-size="10" fill="#10b981">SAFE (&lt;50% used)</text>
        <rect x="150" y="36" width="210" height="9" rx="4.5" fill="#1e293b" />
        <rect x="150" y="36" width="55" height="9" rx="4.5" fill="#10b981" />

        <!-- Warning State -->
        <text x="14" y="68" class="mono" font-size="10" fill="#f59e0b">WARNING (50-79%)</text>
        <rect x="150" y="60" width="210" height="9" rx="4.5" fill="#1e293b" />
        <rect x="150" y="60" width="140" height="9" rx="4.5" fill="#f59e0b" />

        <!-- Critical State -->
        <text x="14" y="92" class="mono" font-size="10" fill="#f43f5e">CRITICAL (&gt;=80%)</text>
        <rect x="150" y="84" width="210" height="9" rx="4.5" fill="#1e293b" />
        <rect x="150" y="84" width="195" height="9" rx="4.5" fill="#f43f5e" />

        <!-- 1-Click Launchers Demonstration -->
        <g transform="translate(0, 122)">
          <rect width="375" height="124" rx="8" fill="#161c2d" stroke="#222b40" />
          <text x="14" y="24" class="sans" font-size="12" font-weight="600" fill="#cbd5e1">1-Click Interactive Terminal Spawners</text>
          <text x="14" y="40" class="sans" font-size="10" fill="#64748b">Spawns native terminal windows directly from the dashboard</text>
          
          <rect x="14" y="54" width="108" height="28" rx="6" fill="#162238" stroke="#38bdf8" stroke-opacity="0.4" />
          <text x="68" y="72" text-anchor="middle" class="mono" font-size="10" fill="#38bdf8">▶ agy /usage</text>

          <rect x="134" y="54" width="108" height="28" rx="6" fill="#122822" stroke="#10b981" stroke-opacity="0.4" />
          <text x="188" y="72" text-anchor="middle" class="mono" font-size="10" fill="#10b981">▶ codex CLI</text>

          <rect x="254" y="54" width="108" height="28" rx="6" fill="#2d170a" stroke="#f97316" stroke-opacity="0.4" />
          <text x="308" y="72" text-anchor="middle" class="mono" font-size="10" fill="#f97316">▶ claude login</text>

          <text x="14" y="108" class="mono" font-size="10" fill="#94a3b8">📋 Copy Summary: Instant Markdown Export</text>
        </g>
      </g>
    </g>
  </g>
</svg>"""

with open(ASSETS / "tour-dashboard.svg", "w", encoding="utf-8") as f:
    f.write(tour_dash_svg)
print("Wrote assets/tour-dashboard.svg")

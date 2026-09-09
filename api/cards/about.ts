import type { VercelRequest, VercelResponse } from '@vercel/node';

function esc(s: string) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

const FF = "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif";
const BG = '#060609';
const BORDER = 'rgba(255,255,255,0.08)';
const TEXT = '#e7e7ec';
const TEXT_SOFT = '#cbd5e1';
const MUTED = '#6b7280';
const W = 880;
const H = 236;

const BIO =
  'I\u2019m a full\u2011stack developer who enjoys building reliable systems, modern dashboards, and Discord bots with a focus on clean design and a great user experience. I work across automation tools, bot infrastructure, and full\u2011stack applications \u2014 always aiming to make things stable, intuitive, and enjoyable to use.';

const HIGHLIGHTS: Array<{ label: string; value: string; accent: string; icon: string }> = [
  {
    label: 'Currently building',
    value: 'Discord bots, automation tools, and full\u2011stack dashboards',
    accent: '#4f7cff',
    // lucide: hammer — stroke, viewBox 0 0 24 24
    icon: `<path d="m3 21 8-8"/><path d="M14.5 9.5a2 2 0 0 1 0 2.83l-1.5 1.5a2 2 0 0 1-2.83 0L3 6.66a2 2 0 0 1 0-2.83L6.17 1a2 2 0 0 1 2.83 0L14.5 6.5"/><path d="m12 12 4 4"/><path d="m16 16 2 2"/>`,
  },
  {
    label: 'Learning',
    value: 'AI automation integrations',
    accent: '#a78bfa',
    // lucide: sparkles
    icon: `<path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063A2 2 0 0 0 14.063 15.5l-1.582 6.135a.5.5 0 0 1-.963 0z"/><path d="M20 3v4"/><path d="M22 5h-4"/><path d="M4 17v5"/><path d="M5 19H2"/>`,
  },
  {
    label: 'Open to',
    value: 'Collaborations, coding requests, and small freelance tasks',
    accent: '#22c55e',
    // lucide: handshake — simplified to render cleanly at 16px
    icon: `<path d="M11 17 5.5 11.5a2 2 0 0 1 0-2.83L8 6.17a2 2 0 0 1 2.83 0L13 8.37"/><path d="M13 8.37 18.5 13.9a2 2 0 0 1 0 2.83L16 19.17a2 2 0 0 1-2.83 0L11 17"/><path d="M8 12 13 17"/><path d="M16 8 8 16"/>`,
  },
];

function aboutSvg(usernameClean: string) {
  const handle = `@${usernameClean}`;
  const badge = 'About';
  const CHA = 7.2;
  const pw = Math.round(20 + handle.length * CHA + 10 + badge.length * CHA + 20);

  // Word-wrap BIO into 2 centered lines (fixed width so card stays H=236)
  const bioLines = (() => {
    const words = BIO.split(/\s+/);
    const lines: string[] = [];
    let cur = '';
    const approx = 86;
    for (const w of words) {
      const cand = cur ? `${cur} ${w}` : w;
      if (cand.length > approx && cur) { lines.push(cur); cur = w; }
      else cur = cand;
    }
    if (cur) lines.push(cur);
    // Keep exactly 2 lines; truncate second with ellipsis if needed
    const out = lines.slice(0, 2);
    if (lines.length > 2) out[1] = `${out[1].trimEnd()}…`;
    return out;
  })();

  const bioX = W / 2;
  const bioY0 = 80;
  const bioSvg = bioLines
    .map((ln, i) => `<text x="${bioX}" y="${bioY0 + i * 16}" text-anchor="middle" font-family="${FF}" font-size="11" fill="${TEXT_SOFT}">${esc(ln)}</text>`)
    .join('\n');

  // Highlight cards sit below the bio with clear gap
  const pad = 16;
  const gapX = 10;
  const cardW = Math.floor((W - pad * 2 - gapX * 2) / 3);
  const cardH = 84;
  const topY = 108; // 80 + 2*16 + 12 gap after bio

  const inner = HIGHLIGHTS.map((h, i) => {
    const x = pad + i * (cardW + gapX);
    const wrap = (() => {
      const words = h.value.split(/\s+/);
      const lines: string[] = [];
      let cur = '';
      for (const w of words) {
        const cand = cur ? `${cur} ${w}` : w;
        if (cand.length > 30 && cur) { lines.push(cur); cur = w; }
        else cur = cand;
      }
      if (cur) lines.push(cur);
      return lines.slice(0, 2);
    })();
    const valueSvg = wrap.map((ln, li) => `<text x="14" y="${52 + li * 13}" font-family="${FF}" font-size="10.5" font-weight="600" fill="${TEXT}">${esc(ln)}</text>`).join('\n');
    return `<g transform="translate(${x}, ${topY})">
      <rect width="${cardW}" height="${cardH}" rx="14" fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.08)" stroke-width="1"/>
      <g transform="translate(14, 12)">
        <circle cx="14" cy="14" r="14" fill="${h.accent}1F"/>
        <svg x="6" y="6" width="16" height="16" viewBox="0 0 24 24" overflow="visible" xmlns="http://www.w3.org/2000/svg">
          <g fill="none" stroke="${h.accent}" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">${h.icon}</g>
        </svg>
      </g>
      <text x="48" y="26" dominant-baseline="middle" font-family="${FF}" font-size="10" font-weight="600" letter-spacing="1.2" fill="${MUTED}">${esc(h.label.toUpperCase())}</text>
      ${valueSvg}
    </g>`;
  }).join('\n');

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <radialGradient id="glowA" cx="0.25" cy="0.35" r="0.8" gradientUnits="objectBoundingBox"><stop offset="0" stop-color="#4f7cff" stop-opacity="0.14"/><stop offset="1" stop-color="#040407" stop-opacity="0"/></radialGradient>
    <radialGradient id="glowB" cx="0.75" cy="0.75" r="0.6" gradientUnits="objectBoundingBox"><stop offset="0" stop-color="#7c5cff" stop-opacity="0.12"/><stop offset="1" stop-color="#040407" stop-opacity="0"/></radialGradient>
  </defs>
  <rect width="${W}" height="${H}" rx="18" fill="${BG}"/><rect width="${W}" height="${H}" rx="18" fill="url(#glowA)"/><rect width="${W}" height="${H}" rx="18" fill="url(#glowB)"/><rect x="0.5" y="0.5" width="${W - 1}" height="${H - 1}" rx="18" fill="none" stroke="${BORDER}" stroke-width="1"/>
  <rect width="${W}" height="52" rx="18" fill="rgba(255,255,255,0.02)"/><rect width="${W}" height="52" rx="18" fill="rgba(79,124,255,0.04)"/>
  <text x="20" y="36" font-family="${FF}" font-size="13" font-weight="700" fill="${TEXT}">About</text>
  <g transform="translate(${W - pw - 16}, 18)"><rect width="${pw}" height="24" rx="12" fill="rgba(79,124,255,0.12)"/><text x="12" y="16" font-family="${FF}" font-size="11" fill="#4f7cff">${esc(handle)}</text><text x="${12 + handle.length * 6.2 + 4}" y="16" font-family="${FF}" font-size="11" fill="#7da4ff">·</text><text x="${12 + handle.length * 6.2 + 14}" y="16" font-family="${FF}" font-size="11" fill="#4f7cff">${esc(badge)}</text></g>
  <line x1="16" y1="52" x2="${W - 16}" y2="52" stroke="${BORDER}" stroke-width="1"/>
  ${bioSvg}
  ${inner}
  <text x="20" y="${H - 10}" font-family="${FF}" font-size="9" fill="${MUTED}">Self-hosted · sorenthedev.indevs.in/api/cards/about</text>
  <text x="${W - 16}" y="${H - 10}" text-anchor="end" font-family="${FF}" font-size="9" fill="${MUTED}">Full‑stack · Discord bots · Automation · Dashboards</text>
</svg>`;
}

function errSvg(msg: string) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"><rect width="${W}" height="${H}" rx="18" fill="${BG}"/><text x="${W / 2}" y="${H / 2 + 6}" text-anchor="middle" font-family="${FF}" font-size="13" fill="${MUTED}">${esc(msg)}</text></svg>`;
}

export default function handler(req: VercelRequest, res: VercelResponse) {
  const origin = req.headers.origin as string | undefined;
  res.setHeader('Access-Control-Allow-Origin', origin || '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'GET') return res.status(405).end();
  const username = String(req.query.username ?? 'developer51709').trim() || 'developer51709';
  if (!/^(?!-)[a-zA-Z0-9-]{1,39}(?<!-)$/.test(username)) {
    return res.status(400).setHeader('Content-Type', 'image/svg+xml').send(errSvg('Invalid username'));
  }
  res.setHeader('Content-Type', 'image/svg+xml');
  res.setHeader('Cache-Control', 'public, max-age=1800');
  return res.send(aboutSvg(username));
}

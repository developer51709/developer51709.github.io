import type { VercelRequest, VercelResponse } from '@vercel/node';

function esc(s: string) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

const FF = "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif";
const BG = '#060609';
const BORDER = 'rgba(255,255,255,0.08)';
const TEXT = '#e7e7ec';
const MUTED = '#6b7280';
const W = 880;
const H = 206;

const CONTACT = {
  discord: 'sorenthedev',
  email: 'developer51709@proton.me',
  phone: '+1 (762) 435-4135',
  website: 'sorenthedev.indevs.in',
};

function contactSvg(usernameClean: string) {
  const handle = `@${usernameClean}`;
  const badge = 'Contact';
  const CHA = 7.2;
  const pw = Math.round(20 + handle.length * CHA + 10 + badge.length * CHA + 20);

  const pad = 16;
  const gapX = 10;
  const cardW = Math.floor((W - pad * 2 - gapX * 2) / 3);
  const cardH = 96;
  const topY = 62;

  const cards: Array<{ label: string; value: string; sub: string; accent: string; icon: string; href: string }> = [
    {
      label: 'Discord',
      value: CONTACT.discord,
      sub: 'Quickest reply — usually within hours',
      accent: '#5865F2',
      href: `https://discord.com/users/1052690741874401360`,
      icon: 'M19.7 4.3a.5.5 0 0 0-.5-.3h-.2a15 15 0 0 0-3.6-.9l-.2 0-.1.2a11 11 0 0 0-2.1.6 13 13 0 0 0-2.1-.6l-.1-.2h-.2A15 15 0 0 0 6.9 4l-.2 0a.5.5 0 0 0-.5.3 12 12 0 0 0-.7 4.2c0 3 1.8 5.4 4.1 5.4.7 0 1.4-.3 1.9-.8l-.6-.7a3 3 0 0 1-1.3.6 3 3 0 0 1-2.2-1.1c-.2-.2-.3-.5-.3-.8a8 8 0 0 1 .2-1.2l.1-.3.3 0a7 7 0 0 1 1.7-.4l.4 0 .2.3c.1.2.3.4.5.6a3 3 0 0 0 2.2 1 3 3 0 0 0 2.2-1c.2-.2.4-.4.5-.6l.2-.3.4 0a7 7 0 0 1 1.7.4l.3 0 .1.3a8 8 0 0 1 .2 1.2c0 .3-.1.6-.3.8a3 3 0 0 1-2.2 1.1 3 3 0 0 1-1.3-.6l-.6.7c.5.5 1.2.8 1.9.8 2.3 0 4.1-2.4 4.1-5.4A12 12 0 0 0 19.7 4.3Z M9.2 12.2c-.7 0-1.3-.6-1.3-1.4s.6-1.4 1.3-1.4 1.3.6 1.3 1.4-.6 1.4-1.3 1.4Zm5.6 0c-.7 0-1.3-.6-1.3-1.4s.6-1.4 1.3-1.4 1.3.6 1.3 1.4-.6 1.4-1.3 1.4Z',
    },
    {
      label: 'Email',
      value: CONTACT.email,
      sub: 'For commissions & longer threads',
      accent: '#4f7cff',
      href: `mailto:${CONTACT.email}`,
      icon: 'M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2Zm0 4-8 5L4 8V6l8 5 8-5v2Z',
    },
    {
      label: 'Phone',
      value: CONTACT.phone,
      sub: 'Text preferred · ET (UTC-4/UTC-5)',
      accent: '#22c55e',
      href: `tel:${CONTACT.phone.replace(/[^+\\d]/g, '')}`,
      icon: 'M6.6 2.5c-.3 0-.6.2-.7.5L4.2 7.2c-.2.5 0 1 .4 1.3l2.2 1.6c-.4 1-1 1.9-1.7 2.7l-1.6-2.2c-.3-.4-.8-.6-1.3-.4L1 11.9c-.3.1-.5.4-.5.7v3.8c0 .4.3.7.7.7 5.4 0 9.8-4.4 9.8-9.8 0-.4-.3-.7-.7-.7H6.6Z M17.5 10.5h-2c0 2.5-2 4.5-4.5 4.5v2c3.6 0 6.5-2.9 6.5-6.5Z M17.5 6.5h-2c0 1.4-1.1 2.5-2.5 2.5v2c2.5 0 4.5-2 4.5-4.5Z',
    },
  ];

  const inner = cards
    .map((c, i) => {
      const x = pad + i * (cardW + gapX);
      const isDiscord = c.label === 'Discord';
      return `<g transform="translate(${x}, ${topY})">
      <rect width="${cardW}" height="${cardH}" rx="14" fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.08)" stroke-width="1"/>
      ${isDiscord ? `<rect x="${cardW - 74}" y="10" width="62" height="18" rx="9" fill="rgba(88,101,242,0.18)"/><text x="${cardW - 43}" y="23" text-anchor="middle" font-family="${FF}" font-size="9" font-weight="700" letter-spacing="0.6" fill="#a5b4fc">QUICKEST</text>` : ''}
      <g transform="translate(14, 14)">
        <circle cx="14" cy="14" r="14" fill="${c.accent}1F"/>
        <g transform="translate(2, 2) scale(0.5)"><path d="${c.icon}" fill="${c.accent}"/></g>
      </g>
      <text x="48" y="23" font-family="${FF}" font-size="10" font-weight="600" letter-spacing="1.4" fill="${MUTED}">${esc(c.label.toUpperCase())}</text>
      <text x="14" y="52" font-family="${FF}" font-size="${c.label === 'Email' ? '11' : '13'}" font-weight="600" fill="${TEXT}">${esc(c.value)}</text>
      <text x="14" y="70" font-family="${FF}" font-size="10" fill="${MUTED}">${esc(c.sub)}</text>
      <text x="14" y="86" font-family="${FF}" font-size="9" fill="${c.accent}">${esc(c.href.replace(/^https?:\/\//, ''))}</text>
    </g>`;
    })
    .join('');

  const sub = 'Fastest reply on Discord · I usually respond within a few hours';

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <radialGradient id="glowA" cx="0.25" cy="0.35" r="0.8" gradientUnits="objectBoundingBox"><stop offset="0" stop-color="#4f7cff" stop-opacity="0.14"/><stop offset="1" stop-color="#040407" stop-opacity="0"/></radialGradient>
    <radialGradient id="glowB" cx="0.75" cy="0.75" r="0.6" gradientUnits="objectBoundingBox"><stop offset="0" stop-color="#7c5cff" stop-opacity="0.12"/><stop offset="1" stop-color="#040407" stop-opacity="0"/></radialGradient>
  </defs>
  <rect width="${W}" height="${H}" rx="18" fill="${BG}"/><rect width="${W}" height="${H}" rx="18" fill="url(#glowA)"/><rect width="${W}" height="${H}" rx="18" fill="url(#glowB)"/><rect x="0.5" y="0.5" width="${W - 1}" height="${H - 1}" rx="18" fill="none" stroke="${BORDER}" stroke-width="1"/>
  <rect width="${W}" height="52" rx="18" fill="rgba(255,255,255,0.02)"/><rect width="${W}" height="52" rx="18" fill="rgba(79,124,255,0.04)"/>
  <text x="20" y="36" font-family="${FF}" font-size="13" font-weight="700" fill="${TEXT}">Contact</text>
  <g transform="translate(${W - pw - 16}, 18)"><rect width="${pw}" height="24" rx="12" fill="rgba(79,124,255,0.12)"/><text x="12" y="16" font-family="${FF}" font-size="11" fill="#4f7cff">${esc(handle)}</text><text x="${12 + handle.length * 6.2 + 4}" y="16" font-family="${FF}" font-size="11" fill="#7da4ff">·</text><text x="${12 + handle.length * 6.2 + 14}" y="16" font-family="${FF}" font-size="11" fill="#4f7cff">${esc(badge)}</text></g>
  <line x1="16" y1="52" x2="${W - 16}" y2="52" stroke="${BORDER}" stroke-width="1"/>
  ${inner}
  <text x="20" y="${H - 10}" font-family="${FF}" font-size="9" fill="${MUTED}">Self-hosted · sorenthedev.indevs.in/api/cards/contact</text>
  <text x="${W - 16}" y="${H - 10}" text-anchor="end" font-family="${FF}" font-size="9" fill="${MUTED}">${esc(sub)}</text>
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
  return res.send(contactSvg(username));
}

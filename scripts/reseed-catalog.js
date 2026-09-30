#!/usr/bin/env node
/**
 * Generates anime-merch style SVG product artwork (character busts, big
 * typography, vertical kanji strips) into public/products/ and reseeds
 * the catalog via the running gateway API.
 *
 * Run: node scripts/reseed-catalog.js
 */
const fs = require('fs')
const path = require('path')
const http = require('http')

const ROOT = path.join(__dirname, '..')
const OUT_DIR = path.join(ROOT, 'frontend', 'public', 'products')
const API = process.env.API_URL || 'http://localhost:8000'

/* =============================== SVG helpers ============================== */

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

const KFONT = "'Hiragino Mincho ProN','Yu Mincho','Noto Serif JP',serif"
const LFONT = "'Arial Black','Helvetica Neue',Arial,sans-serif"

/** Spiky fan (hair). Angles in degrees, -90 = up. */
function star(cx, cy, ri, ro, n, fill, a0 = -200, a1 = 20) {
  const pts = []
  const steps = n * 2
  for (let i = 0; i < steps; i++) {
    const t = i / (steps - 1)
    const ang = ((a0 + (a1 - a0) * t) * Math.PI) / 180
    const r = i % 2 === 0 ? ro : ri
    pts.push(`${(cx + r * Math.cos(ang)).toFixed(1)},${(cy + r * Math.sin(ang)).toFixed(1)}`)
  }
  return `<polygon points="${pts.join(' ')}" fill="${fill}"/>`
}

const head = (cx, cy, r, skin) => `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${skin}"/>`

const neck = (cx, y, w, h, skin) => `<rect x="${cx - w / 2}" y="${y}" width="${w}" height="${h}" fill="${skin}"/>`

const torso = (cx, top, w, h, fill) =>
  `<path d="M ${cx - w / 2} ${top + h} L ${cx - w / 2} ${top + 26} Q ${cx} ${top - 8} ${cx + w / 2} ${top + 26} L ${cx + w / 2} ${top + h} Z" fill="${fill}"/>`

/** Vertical kanji strip (tategaki). */
function vtext(str, x, y, size, fill, gap) {
  const chars = [...String(str)]
  return chars
    .map(
      (c, i) =>
        `<text x="${x}" y="${y + i * (gap || size + 6)}" text-anchor="middle" font-family=${JSON.stringify(KFONT)} font-size="${size}" font-weight="700" fill="${fill}">${esc(c)}</text>`
    )
    .join('\n  ')
}

const line = (x1, y1, x2, y2, stroke, w = 2) =>
  `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${stroke}" stroke-width="${w}" stroke-linecap="round"/>`

/* ============================ Character artwork ============================ */
/* Head center (300,210) r62 · neck y268 · torso top 284 */

const SKIN = '#F2CFAE'

const ART = {
  gojo: `
  ${torso(300, 284, 200, 130, '#111827')}
  <rect x="258" y="266" width="84" height="20" rx="6" fill="#1F2937"/>
  ${neck(300, 264, 38, 22, SKIN)}
  ${head(300, 210, 62, SKIN)}
  ${star(300, 208, 58, 112, 12, '#F1F5F9', -198, 18)}
  <path d="M 240 196 Q 300 182 360 196 L 360 218 Q 300 232 240 218 Z" fill="#0B0A09"/>
  <path d="M 252 176 Q 268 160 288 168" stroke="#E2E8F0" stroke-width="5" fill="none" stroke-linecap="round"/>`,

  itadori: `
  <ellipse cx="300" cy="224" rx="96" ry="92" fill="#292524"/>
  ${torso(300, 296, 196, 122, '#292524')}
  <rect x="262" y="282" width="76" height="18" rx="6" fill="#1C1917"/>
  ${neck(300, 266, 38, 20, SKIN)}
  ${head(300, 212, 60, '#F6D7B8')}
  ${star(300, 210, 56, 98, 11, '#EC4899', -196, 16)}`,

  sukuna: `
  ${torso(300, 288, 204, 128, '#1C1917')}
  <path d="M 262 288 L 300 316 L 338 288 L 338 272 L 262 272 Z" fill="#0C0A09"/>
  ${neck(300, 264, 38, 22, SKIN)}
  ${head(300, 210, 62, SKIN)}
  ${star(300, 206, 58, 104, 12, '#F472B6', -198, 18)}
  ${line(252, 236, 274, 236, '#4C0519', 3)}
  ${line(326, 236, 348, 236, '#4C0519', 3)}
  ${line(258, 246, 270, 246, '#4C0519', 2.5)}
  ${line(330, 246, 342, 246, '#4C0519', 2.5)}`,

  naruto: `
  ${torso(300, 290, 200, 126, '#EA580C')}
  <rect x="258" y="278" width="84" height="16" rx="6" fill="#1E3A8A"/>
  ${neck(300, 266, 38, 20, SKIN)}
  ${head(300, 212, 60, SKIN)}
  ${star(300, 208, 56, 102, 12, '#FBBF24', -198, 18)}
  <rect x="238" y="184" width="124" height="24" rx="4" fill="#1E3A8A"/>
  <rect x="280" y="186" width="40" height="20" rx="3" fill="#CBD5E1"/>
  <circle cx="300" cy="196" r="7" fill="none" stroke="#475569" stroke-width="2.5"/>
  ${line(244, 232, 262, 232, '#B45309', 2)}
  ${line(242, 240, 260, 240, '#B45309', 2)}
  ${line(338, 232, 356, 232, '#B45309', 2)}
  ${line(340, 240, 358, 240, '#B45309', 2)}`,

  luffy: `
  ${torso(300, 292, 196, 124, '#DC2626')}
  <path d="M 262 296 L 300 358 L 338 296 Z" fill="${SKIN}"/>
  ${neck(300, 266, 38, 22, SKIN)}
  ${head(300, 214, 58, SKIN)}
  <ellipse cx="300" cy="152" rx="102" ry="24" fill="#EAB308"/>
  <path d="M 226 150 Q 234 96 300 92 Q 366 96 374 150 Z" fill="#FACC15"/>
  <rect x="222" y="140" width="156" height="14" rx="6" fill="#B91C1C"/>
  <path d="M 244 210 Q 238 236 248 258" stroke="#0B0A09" stroke-width="10" fill="none"/>
  <path d="M 356 210 Q 362 236 352 258" stroke="#0B0A09" stroke-width="10" fill="none"/>
  ${line(332, 238, 344, 248, '#92400E', 2)}
  ${line(344, 238, 332, 248, '#92400E', 2)}`,

  zoro: `
  ${torso(300, 290, 200, 126, '#E7E5E4')}
  <rect x="254" y="304" width="92" height="30" fill="#166534"/>
  ${neck(300, 266, 38, 22, SKIN)}
  ${head(300, 212, 60, SKIN)}
  ${star(300, 206, 56, 92, 10, '#16A34A', -192, 12)}
  <circle cx="354" cy="252" r="4" fill="#FCD34D"/>
  <circle cx="354" cy="264" r="4" fill="#FCD34D"/>
  <circle cx="354" cy="276" r="4" fill="#FCD34D"/>`,

  ichigo: `
  ${torso(300, 288, 202, 128, '#0B0A09')}
  <path d="M 268 292 L 300 322 L 332 292" stroke="#E7E5E4" stroke-width="5" fill="none"/>
  ${neck(300, 266, 38, 20, SKIN)}
  ${head(300, 212, 60, SKIN)}
  ${star(300, 208, 56, 102, 11, '#F97316', -198, 18)}`,

  levi: `
  <path d="M 196 420 Q 210 300 300 292 Q 390 300 404 420 Z" fill="#14532D"/>
  ${torso(300, 296, 186, 120, '#3F3F46')}
  <path d="M 268 300 L 300 344 L 332 300 L 332 286 L 268 286 Z" fill="#F5F5F4"/>
  ${neck(300, 268, 36, 18, SKIN)}
  ${head(300, 212, 60, SKIN)}
  <path d="M 242 178 Q 300 152 358 178 L 358 210 Q 300 196 242 210 Z" fill="#0B0A09"/>
  <path d="M 258 168 Q 300 150 342 168 L 342 150 Q 300 138 258 150 Z" fill="#0B0A09"/>`,

  goku: `
  ${torso(300, 292, 200, 124, '#EA580C')}
  <rect x="256" y="288" width="88" height="20" fill="#1D4ED8"/>
  <rect x="284" y="356" width="32" height="18" fill="#1D4ED8"/>
  ${neck(300, 268, 38, 22, SKIN)}
  ${head(300, 214, 60, SKIN)}
  ${star(300, 204, 56, 122, 11, '#0B0A09', -212, 32)}`,

  tanjiro: `
  ${torso(300, 292, 202, 124, '#0F172A')}
  <rect x="238" y="296" width="52" height="26" fill="#166534"/><rect x="290" y="296" width="52" height="26" fill="#0B0A09"/>
  <rect x="264" y="322" width="52" height="26" fill="#0B0A09"/><rect x="238" y="322" width="26" height="26" fill="#0B0A09"/><rect x="316" y="322" width="26" height="26" fill="#166534"/>
  <rect x="238" y="348" width="52" height="26" fill="#166534"/><rect x="290" y="348" width="52" height="26" fill="#0B0A09"/>
  ${neck(300, 268, 38, 22, SKIN)}
  ${head(300, 212, 60, SKIN)}
  ${star(300, 208, 56, 96, 11, '#7F1D1D', -196, 16)}
  <path d="M 258 172 L 266 162 L 272 172 L 280 162" stroke="#DC2626" stroke-width="4" fill="none" stroke-linecap="round"/>`,

  eren: `
  <path d="M 192 420 Q 208 296 300 288 Q 392 296 408 420 Z" fill="#14532D"/>
  ${torso(300, 296, 190, 120, '#57534E')}
  ${line(252, 302, 348, 380, '#B45309', 7)}
  ${line(348, 302, 252, 380, '#B45309', 7)}
  ${neck(300, 268, 38, 22, SKIN)}
  ${head(300, 212, 60, SKIN)}
  ${star(300, 206, 58, 100, 12, '#78350F', -198, 18)}`,

  /* ------------------------------ Crest art ------------------------------- */

  spider: `
  <circle cx="300" cy="220" r="46" fill="#0B0A09"/>
  <circle cx="300" cy="164" r="26" fill="#0B0A09"/>
  ${[...Array(4)].map((_, i) => `
    <path d="M ${272 - i * 4} ${196 - i * 4} Q ${196 - i * 14} ${160 + i * 24} ${176 - i * 10} ${108 + i * 30}" stroke="#0B0A09" stroke-width="9" fill="none" stroke-linecap="round"/>
    <path d="M ${328 + i * 4} ${196 - i * 4} Q ${404 + i * 14} ${160 + i * 24} ${424 + i * 10} ${108 + i * 30}" stroke="#0B0A09" stroke-width="9" fill="none" stroke-linecap="round"/>`).join('')}
  <circle cx="288" cy="156" r="5" fill="#DC2626"/><circle cx="312" cy="156" r="5" fill="#DC2626"/>`,

  wings: `
  <path d="M 292 140 Q 208 170 176 260 Q 244 250 282 296 Z" fill="#E7E5E4"/>
  <path d="M 308 140 Q 392 170 424 260 Q 356 250 318 296 Z" fill="#1E3A8A"/>
  <path d="M 292 168 Q 240 190 220 244 Q 262 232 288 268 Z" fill="#1E3A8A"/>
  <path d="M 308 168 Q 360 190 380 244 Q 338 232 312 268 Z" fill="#E7E5E4"/>
  <path d="M 300 150 L 300 320" stroke="#94A3B8" stroke-width="6" stroke-linecap="round"/>`,

  kabuto: `
  <path d="M 210 240 Q 300 120 390 240 Z" fill="#1C1917"/>
  <path d="M 222 236 Q 300 156 378 236" stroke="#C9A227" stroke-width="6" fill="none"/>
  <path d="M 300 128 Q 340 84 384 96 Q 352 112 344 148 Q 322 132 300 138 Z" fill="#C9A227"/>
  <rect x="206" y="238" width="188" height="16" rx="6" fill="#C9A227"/>
  <path d="M 216 262 Q 180 300 186 348" stroke="#1C1917" stroke-width="12" fill="none" stroke-linecap="round"/>
  <path d="M 384 262 Q 420 300 414 348" stroke="#1C1917" stroke-width="12" fill="none" stroke-linecap="round"/>
  <circle cx="262" cy="212" r="10" fill="#DC2626"/><circle cx="338" cy="212" r="10" fill="#DC2626"/>`,

  seal: `
  <circle cx="300" cy="220" r="86" fill="none" stroke="#F59E0B" stroke-width="6"/>
  <circle cx="300" cy="220" r="66" fill="none" stroke="#F59E0B" stroke-width="3"/>
  <path d="M 300 220 m 0 -52 a 52 52 0 1 1 -36 90 a 40 40 0 1 0 30 -78" stroke="#F59E0B" stroke-width="7" fill="none" stroke-linecap="round"/>
  <circle cx="300" cy="220" r="10" fill="#F59E0B"/>`,

  fang: `
  <path d="M 252 130 Q 268 240 300 330 Q 292 220 282 130 Z" fill="#F97316"/>
  <path d="M 348 130 Q 332 240 300 330 Q 308 220 318 130 Z" fill="#FCD34D"/>
  <path d="M 252 130 Q 300 108 348 130" stroke="#F97316" stroke-width="8" fill="none"/>`,

  scroll: `
  <rect x="216" y="140" width="168" height="180" rx="10" fill="#E7E5E4"/>
  <rect x="200" y="132" width="26" height="196" rx="12" fill="#B45309"/>
  <rect x="374" y="132" width="26" height="196" rx="12" fill="#B45309"/>
  <text x="300" y="248" text-anchor="middle" font-family=${JSON.stringify(KFONT)} font-size="92" font-weight="900" fill="#1C1917">封</text>
  <path d="M 240 292 Q 300 312 360 292" stroke="#DC2626" stroke-width="5" fill="none"/>`,
}

/* ============================== Card builder ============================== */

function card({ art, accent, showJp, nameEn, nameJp, sub, theme = 'dark' }) {
  const artwork = ART[art]
  if (!artwork) throw new Error(`Unknown art key: ${art}`)
  const bg1 = theme === 'dark' ? '#16130F' : '#1E1B18'
  const bg2 = '#0B0A09'
  return `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="600" viewBox="0 0 600 600">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${bg1}"/><stop offset="1" stop-color="${bg2}"/>
    </linearGradient>
    <radialGradient id="glow" cx="0.5" cy="0.38" r="0.6">
      <stop offset="0" stop-color="${accent}" stop-opacity="0.28"/><stop offset="1" stop-color="${accent}" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="600" height="600" fill="url(#bg)"/>
  <rect width="600" height="600" fill="url(#glow)"/>
  <g opacity="0.5">
    <rect x="-80" y="120" width="760" height="26" fill="${accent}" opacity="0.05" transform="rotate(-14 300 300)"/>
    <rect x="-80" y="330" width="760" height="14" fill="${accent}" opacity="0.05" transform="rotate(-14 300 300)"/>
  </g>
  <rect x="26" y="26" width="548" height="548" fill="none" stroke="${accent}" stroke-opacity="0.35" stroke-width="2"/>
  ${vtext(showJp, 548, 118, 22, accent, 30)}
  <g>${artwork}</g>
  <text x="288" y="462" text-anchor="middle" font-family=${JSON.stringify(LFONT)} font-size="46" font-weight="900" letter-spacing="4" fill="#F5F5F4">${esc(nameEn)}</text>
  <text x="288" y="500" text-anchor="middle" font-family=${JSON.stringify(KFONT)} font-size="24" font-weight="700" fill="${accent}">${esc(nameJp)}</text>
  <text x="288" y="530" text-anchor="middle" font-family="Arial, sans-serif" font-size="12" font-weight="700" letter-spacing="4" fill="#A8A29E">${esc(sub)}</text>
  <text x="288" y="566" text-anchor="middle" font-family="Arial, sans-serif" font-size="11" font-weight="700" letter-spacing="5" fill="${accent}" opacity="0.8">ANIMETHREADS · 武士道</text>
</svg>`
}

/* ================================ Catalog ================================= */

const CATALOG = [
  // ---- T-Shirts ----
  { sku: 'AT-GK-001', category: 'T-Shirts', price: 34.99, art: 'gojo',
    name: 'Gojo Satoru — Honored One Tee', nameEn: 'SATORU', nameJp: '五条悟', sub: 'THROUGHOUT HEAVEN AND EARTH', showJp: '呪術廻戦', accent: '#38BDF8',
    description: 'The strongest, immortalized: blindfolded silhouette with white spike hair and sky-blue foil accents on heavyweight cotton.' },
  { sku: 'AT-GK-002', category: 'T-Shirts', price: 32.99, art: 'itadori',
    name: 'Itadori Yuji — Vessel Tee', nameEn: 'ITADORI', nameJp: '虎杖悠仁', sub: 'FLESH OF THE VESSEL', showJp: '呪術廻戦', accent: '#F472B6',
    description: 'Hood up, fists ready — the vessel of Sukuna in pink-spike detail with dusty-rose glow print.' },
  { sku: 'AT-GK-003', category: 'T-Shirts', price: 36.99, art: 'sukuna',
    name: 'Ryomen Sukuna — King of Curses Tee', nameEn: 'SUKUNA', nameJp: '両面宿儺', sub: 'KING OF CURSES', showJp: '呪術廻戦', accent: '#EF4444',
    description: 'Curse markings, spiked rose hair, absolute menace. Blood-red accents on washed black.' },
  { sku: 'AT-GK-004', category: 'T-Shirts', price: 32.99, art: 'naruto',
    name: 'Naruto Uzumaki — Ninja Way Tee', nameEn: 'NARUTO', nameJp: 'うずまきナルト', sub: 'NEVER GO BACK ON YOUR WORD', showJp: 'ナルト', accent: '#F59E0B',
    description: 'Number one hyperactive ninja: golden spikes, Hidden Leaf headband and whisker marks in sunset orange.' },
  { sku: 'AT-GK-005', category: 'T-Shirts', price: 33.99, art: 'luffy',
    name: 'Monkey D. Luffy — Straw Hat Tee', nameEn: 'LUFFY', nameJp: '麦わらのルフィ', sub: 'KING OF THE PIRATES', showJp: 'ワンピース', accent: '#FACC15',
    description: 'Straw hat tipped low, grin locked in. Treasure-gold print honoring the future Pirate King.' },
  { sku: 'AT-GK-006', category: 'T-Shirts', price: 31.99, art: 'zoro',
    name: 'Roronoa Zoro — Three Swords Tee', nameEn: 'ZORO', nameJp: 'ロロノア・ゾロ', sub: 'THREE SWORD STYLE', showJp: 'ワンピース', accent: '#22C55E',
    description: 'Green-haired first mate with triple gold earrings — for those who never lose their way.' },
  { sku: 'AT-GK-007', category: 'T-Shirts', price: 32.99, art: 'ichigo',
    name: 'Ichigo Kurosaki — Soul Reaper Tee', nameEn: 'ICHIGO', nameJp: '黒崎一護', sub: 'SUBSTITUTE SOUL REAPER', showJp: 'ブリーチ', accent: '#FB923C',
    description: 'Orange hair, black shihakusho, white blade-trim V. Substitute reaper energy in every fiber.' },
  { sku: 'AT-GK-008', category: 'T-Shirts', price: 34.99, art: 'levi',
    name: 'Levi Ackerman — Captain Tee', nameEn: 'LEVI', nameJp: 'リヴァイ', sub: 'HUMANITY\'S STRONGEST', showJp: '進撃の巨人', accent: '#4ADE80',
    description: 'Humanity\'s strongest soldier — undercut, cravat and scout cape in military green.' },
  { sku: 'AT-GK-009', category: 'T-Shirts', price: 33.99, art: 'eren',
    name: 'Eren Yeager — Freedom Tee', nameEn: 'EREN', nameJp: 'エレン・イェーガー', sub: 'ON THAT DAY', showJp: '進撃の巨人', accent: '#34D399',
    description: 'Green cape crossed with recon straps — a tee for those who keep moving forward.' },

  // ---- Hoodies ----
  { sku: 'AT-HD-001', category: 'Hoodies', price: 64.99, art: 'gojo',
    name: 'Gojo Unlimited Hoodie', nameEn: 'UNLIMITED', nameJp: '無量空処', sub: 'DOMAIN EXPANSION', showJp: '呪術廻戦', accent: '#22D3EE',
    description: '480 GSM brushed fleece with infinity-cyan embroidery — the strongest hoodie in the rotation.' },
  { sku: 'AT-HD-002', category: 'Hoodies', price: 62.99, art: 'goku',
    name: 'Saiyan Legend Hoodie', nameEn: 'SAIYAN', nameJp: '超サイヤ人', sub: 'POWER LEVEL OVER 9000', showJp: 'ドラゴンボール', accent: '#FACC15',
    description: 'Black spike silhouette over golden aura print. Training-arc approved heavyweight fleece.' },
  { sku: 'AT-HD-003', category: 'Hoodies', price: 59.99, art: 'naruto',
    name: 'Ninja Way Hoodie', nameEn: 'NINJA WAY', nameJp: '忍の道', sub: 'THAT IS MY NINJA WAY', showJp: 'ナルト', accent: '#FF8C42',
    description: 'Hidden Leaf headband embroidered over the heart. Orange swirl drawcord tips.' },
  { sku: 'AT-HD-004', category: 'Hoodies', price: 66.99, art: 'ichigo',
    name: 'Soul Reaper Hoodie', nameEn: 'SOUL REAPER', nameJp: '死神', sub: 'BANKAI', showJp: 'ブリーチ', accent: '#EF4444',
    description: 'Shihakusho-black fleece with crimson inner lining and blade-trim hood.' },
  { sku: 'AT-HD-005', category: 'Hoodies', price: 63.99, art: 'tanjiro',
    name: 'Demon Slayer Hoodie', nameEn: 'DEMON SLAYER', nameJp: '鬼滅の刃', sub: 'TOTAL CONCENTRATION BREATHING', showJp: '鬼滅の刃', accent: '#4ADE80',
    description: 'Checkered haori paneling, hanafuda-inspired cuff prints, flame-scar embroidery.' },
  { sku: 'AT-HD-006', category: 'Hoodies', price: 61.99, art: 'wings',
    name: 'Wings of Freedom Hoodie', nameEn: 'FREEDOM', nameJp: '自由の翼', sub: 'DEDICATE YOUR HEART', showJp: '進撃の巨人', accent: '#22C55E',
    description: 'Two-tone wings spanning the back — blue and white over scout green.' },

  // ---- Jackets ----
  { sku: 'AT-JK-001', category: 'Jackets', price: 119.99, art: 'kabuto',
    name: 'Ronin Bomber Jacket', nameEn: 'RONIN', nameJp: '浪人', sub: 'ONE CUT, ONE LIFE', showJp: '武士道', accent: '#E5C158',
    description: 'Satin bomber with gold kabuto-crest embroidery and kanji-lined inner shell.' },
  { sku: 'AT-JK-002', category: 'Jackets', price: 124.99, art: 'spider',
    name: 'Phantom Troupe Varsity', nameEn: 'PHANTOM', nameJp: '幻影旅団', sub: 'NUMBER YOURS', showJp: 'ハンター×ハンター', accent: '#DC2626',
    description: 'Wool-body varsity with leather sleeves and the spider crest. Pick your number.' },
  { sku: 'AT-JK-003', category: 'Jackets', price: 129.99, art: 'wings',
    name: 'Titan Recon Jacket', nameEn: 'RECON', nameJp: '調査兵団', sub: 'BEYOND THE WALLS', showJp: '進撃の巨人', accent: '#84CC16',
    description: 'Military canvas with wings-of-freedom patch set and bronze hardware.' },
  { sku: 'AT-JK-004', category: 'Jackets', price: 114.99, art: 'seal',
    name: 'Cursed Energy Coach Jacket', nameEn: 'CURSED', nameJp: '呪力', sub: 'DOMAIN READY', showJp: '呪術廻戦', accent: '#A78BFA',
    description: 'Water-resistant shell, violet-lined hood, seal-motif back print.' },

  // ---- Accessories ----
  { sku: 'AT-AC-001', category: 'Accessories', price: 28.99, art: 'seal',
    name: 'Chakra Seal Snapback', nameEn: 'SEAL', nameJp: '封印', sub: 'LOCKED AND LOADED', showJp: 'ナルト', accent: '#F59E0B',
    description: 'Structured cap with geometric seal embroidery and metal buckle.' },
  { sku: 'AT-AC-002', category: 'Accessories', price: 24.99, art: 'fang',
    name: 'Guild Emblem Beanie', nameEn: 'GUILD', nameJp: '牙', sub: 'WORN BY THE BRAVE', showJp: 'フェアリーテイル', accent: '#F97316',
    description: 'Ribbed cuffed beanie with woven fang-emblem patch.' },
  { sku: 'AT-AC-003', category: 'Accessories', price: 22.99, art: 'scroll',
    name: 'Kanji Tote of Holding', nameEn: 'SCROLL', nameJp: '巻物', sub: 'INFINITE STORAGE', showJp: '巻物', accent: '#C9A227',
    description: '16oz canvas tote with a scroll-seal print. Carries groceries, manga hauls, hidden weapons.' },
]

/* ================================ Execution ================================ */

const slug = (sku) => sku.toLowerCase().replace(/[^a-z0-9]+/g, '-')

function apiCall(method, urlPath, body, headers = {}) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null
    const req = http.request(
      `${API}${urlPath}`,
      {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(data ? { 'Content-Length': Buffer.byteLength(data) } : {}),
          ...headers,
        },
      },
      (res) => {
        let raw = ''
        res.on('data', (c) => (raw += c))
        res.on('end', () => {
          try { resolve({ status: res.statusCode, data: JSON.parse(raw) }) }
          catch { resolve({ status: res.statusCode, data: raw }) }
        })
      }
    )
    req.on('error', reject)
    if (data) req.write(data)
    req.end()
  })
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true })

  // Auth (login, fall back to signup)
  let token
  const login = await apiCall('POST', '/auth/login', {
    email: 'admin@animethreads.dev', password: 'bushido-admin',
  })
  if (login.status === 200 && login.data.token) {
    token = login.data.token
    console.log('Logged in as admin@animethreads.dev')
  } else {
    const signup = await apiCall('POST', '/auth/signup', {
      email: 'admin@animethreads.dev', password: 'bushido-admin', name: 'Dojo Admin',
    })
    if (signup.status !== 201) { console.error('Auth failed:', signup.data); process.exit(1) }
    token = signup.data.token
    console.log('Created admin@animethreads.dev')
  }
  const auth = { Authorization: `Bearer ${token}` }

  // Wipe old products
  const existing = await apiCall('GET', '/products?limit=100')
  for (const p of existing.data?.items || []) {
    await apiCall('DELETE', `/products/${p.id}`, null, auth)
    const oldFile = path.join(OUT_DIR, path.basename(p.imageUrl || ''))
    if (fs.existsSync(oldFile)) fs.unlinkSync(oldFile)
  }
  console.log(`Deleted ${existing.data?.items?.length || 0} old products`)

  // Generate artwork + create products
  let ok = 0
  for (const p of CATALOG) {
    const file = path.join(OUT_DIR, `${slug(p.sku)}.svg`)
    fs.writeFileSync(file, card(p))
    const res = await apiCall('POST', '/products', {
      name: p.name,
      description: p.description,
      price: p.price,
      category: p.category,
      sku: p.sku,
      imageUrl: `/products/${slug(p.sku)}.svg`,
    }, auth)
    if (res.status === 201) ok++
    else console.error(`  failed: ${p.name} ->`, res.status, JSON.stringify(res.data).slice(0, 140))
  }
  console.log(`Seeded ${ok}/${CATALOG.length} products with generated merch art`)

  const check = await apiCall('GET', '/products?limit=100')
  const cats = check.data?.items ? [...new Set(check.data.items.map((i) => i.category))].join(', ') : '?'
  console.log(`Catalog now holds ${check.data?.total ?? '?'} products · categories: ${cats}`)
}

main().catch((err) => { console.error(err); process.exit(1) })

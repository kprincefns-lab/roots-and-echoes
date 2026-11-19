/**
 * Generates museum-grade, era-tinted archival portrait plates as inline SVG data URIs.
 * Zero external network dependencies, crisp at any DPR, and cohesive with the
 * obsidian-forest & bioluminescent gold aesthetic.
 */

export type PortraitStyle =
  | "patriarch"
  | "matriarch"
  | "scholar"
  | "artist"
  | "architect"
  | "botanist"
  | "youth";

interface PortraitConfig {
  initials: string;
  eraLabel: string;
  palette: [string, string, string]; // [deepBg, midGlow, accentGold]
  style: PortraitStyle;
}

function getSilhouettePath(style: PortraitStyle): string {
  switch (style) {
    case "patriarch":
      return `
        <path d="M100 112 C126 112 146 130 154 166 L154 200 L46 200 L46 166 C54 130 74 112 100 112 Z" fill="url(#sil)" opacity="0.92"/>
        <ellipse cx="100" cy="78" rx="23" ry="27" fill="url(#sil)" opacity="0.95"/>
        <path d="M77 70 C79 50 121 50 123 70 C115 62 85 62 77 70 Z" fill="#090D0B" opacity="0.55"/>
        <path d="M84 115 L100 138 L116 115" stroke="#D4A359" stroke-width="1.4" fill="none" opacity="0.65"/>
      `;
    case "matriarch":
      return `
        <path d="M100 114 C124 114 144 132 152 168 L152 200 L48 200 L48 168 C56 132 76 114 100 114 Z" fill="url(#sil)" opacity="0.92"/>
        <circle cx="100" cy="64" r="24" fill="url(#sil)" opacity="0.88"/>
        <ellipse cx="100" cy="80" rx="21" ry="25" fill="url(#sil)" opacity="0.96"/>
        <path d="M82 118 Q100 132 118 118" stroke="#E6C385" stroke-width="1.5" fill="none" opacity="0.7"/>
        <circle cx="100" cy="127" r="2.2" fill="#E6C385" opacity="0.8"/>
      `;
    case "scholar":
      return `
        <path d="M100 112 C125 112 145 128 153 166 L153 200 L47 200 L47 166 C55 128 75 112 100 112 Z" fill="url(#sil)" opacity="0.92"/>
        <ellipse cx="100" cy="79" rx="22" ry="26" fill="url(#sil)" opacity="0.95"/>
        <circle cx="91" cy="78" r="6" stroke="#E6C385" stroke-width="1.2" fill="none" opacity="0.65"/>
        <circle cx="109" cy="78" r="6" stroke="#E6C385" stroke-width="1.2" fill="none" opacity="0.65"/>
        <line x1="97" y1="78" x2="103" y2="78" stroke="#E6C385" stroke-width="1.2" opacity="0.65"/>
      `;
    case "artist":
      return `
        <path d="M100 114 C126 114 146 134 154 168 L154 200 L46 200 L46 168 C54 134 74 114 100 114 Z" fill="url(#sil)" opacity="0.92"/>
        <path d="M72 88 C70 52 130 52 128 88 C126 106 118 112 114 112 L86 112 C82 112 74 106 72 88 Z" fill="url(#sil)" opacity="0.88"/>
        <ellipse cx="100" cy="80" rx="20" ry="24" fill="url(#sil)" opacity="0.96"/>
        <path d="M76 130 Q100 144 124 130" stroke="#D4A359" stroke-width="1.3" fill="none" opacity="0.55"/>
      `;
    case "architect":
      return `
        <path d="M100 113 C128 113 148 131 155 167 L155 200 L45 200 L45 167 C52 131 72 113 100 113 Z" fill="url(#sil)" opacity="0.92"/>
        <ellipse cx="100" cy="78" rx="22" ry="26" fill="url(#sil)" opacity="0.96"/>
        <path d="M88 114 L100 128 L112 114" stroke="#E6C385" stroke-width="1.4" fill="none" opacity="0.6"/>
      `;
    case "botanist":
      return `
        <path d="M100 115 C124 115 144 133 151 168 L151 200 L49 200 L49 168 C56 133 76 115 100 115 Z" fill="url(#sil)" opacity="0.92"/>
        <path d="M74 82 C74 52 126 52 126 82 C126 98 118 106 114 108 L86 108 C82 106 74 98 74 82 Z" fill="url(#sil)" opacity="0.9"/>
        <ellipse cx="100" cy="81" rx="20" ry="24" fill="url(#sil)" opacity="0.96"/>
        <path d="M62 42 Q74 56 68 72" stroke="#D4A359" stroke-width="1" fill="none" opacity="0.45"/>
        <path d="M138 42 Q126 56 132 72" stroke="#D4A359" stroke-width="1" fill="none" opacity="0.45"/>
      `;
    case "youth":
    default:
      return `
        <path d="M100 118 C122 118 140 135 148 168 L148 200 L52 200 L52 168 C60 135 78 118 100 118 Z" fill="url(#sil)" opacity="0.92"/>
        <ellipse cx="100" cy="82" rx="20" ry="23" fill="url(#sil)" opacity="0.96"/>
        <circle cx="100" cy="82" r="32" stroke="#D4A359" stroke-width="0.7" fill="none" opacity="0.35" stroke-dasharray="3 4"/>
      `;
  }
}

export function createArchivalPortrait({
  initials,
  eraLabel,
  palette,
  style,
}: PortraitConfig): string {
  const [deepBg, midGlow, accentGold] = palette;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="400" height="400">
    <defs>
      <radialGradient id="bg" cx="50%" cy="38%" r="65%">
        <stop offset="0%" stop-color="${midGlow}"/>
        <stop offset="55%" stop-color="${deepBg}"/>
        <stop offset="100%" stop-color="#070A08"/>
      </radialGradient>
      <linearGradient id="sil" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="${accentGold}" stop-opacity="0.34"/>
        <stop offset="50%" stop-color="#1E2822" stop-opacity="0.96"/>
        <stop offset="100%" stop-color="#0B110E" stop-opacity="1"/>
      </linearGradient>
      <radialGradient id="halo" cx="50%" cy="40%" r="42%">
        <stop offset="0%" stop-color="${accentGold}" stop-opacity="0.28"/>
        <stop offset="100%" stop-color="${accentGold}" stop-opacity="0"/>
      </radialGradient>
    </defs>
    <rect width="200" height="200" fill="url(#bg)"/>
    <circle cx="100" cy="82" r="78" fill="url(#halo)"/>
    <circle cx="100" cy="100" r="88" fill="none" stroke="${accentGold}" stroke-width="0.8" stroke-opacity="0.28"/>
    <circle cx="100" cy="100" r="82" fill="none" stroke="${accentGold}" stroke-width="0.4" stroke-opacity="0.18" stroke-dasharray="2 4"/>
    ${getSilhouettePath(style)}
    <text x="100" y="176" text-anchor="middle" font-family="Georgia, serif" font-size="14" letter-spacing="3" fill="#F5F2EB" fill-opacity="0.88">${initials}</text>
    <text x="100" y="190" text-anchor="middle" font-family="sans-serif" font-size="7.5" letter-spacing="2.2" fill="${accentGold}" fill-opacity="0.72">${eraLabel}</text>
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export function createArchivalMemoryPlate(
  title: string,
  year: number,
  motif: "horizon" | "garden" | "harbor" | "studio" | "mountains" | "stars"
): string {
  let art = "";
  switch (motif) {
    case "harbor":
      art = `
        <path d="M0 165 Q90 152 180 165 T360 162 L360 240 L0 240 Z" fill="#121C17"/>
        <path d="M0 185 Q100 175 200 188 T360 182 L360 240 L0 240 Z" fill="#0B120F"/>
        <circle cx="255" cy="84" r="28" fill="#D4A359" opacity="0.24"/>
        <circle cx="255" cy="84" r="14" fill="#E6C385" opacity="0.55"/>
        <path d="M120 162 L140 108 L152 162 Z" fill="#D4A359" opacity="0.35"/>
      `;
      break;
    case "garden":
      art = `
        <path d="M40 240 Q120 140 180 175 T320 120 L360 240 Z" fill="#16231B"/>
        <circle cx="110" cy="110" r="42" fill="#D4A359" opacity="0.16"/>
        <circle cx="235" cy="92" r="52" fill="#8BA888" opacity="0.14"/>
        <path d="M180 240 C175 180 190 130 220 90" stroke="#D4A359" stroke-width="2" fill="none" opacity="0.5"/>
        <path d="M180 195 C150 170 130 150 115 120" stroke="#D4A359" stroke-width="1.5" fill="none" opacity="0.4"/>
      `;
      break;
    case "mountains":
      art = `
        <polygon points="0,240 95,105 185,240" fill="#15201A"/>
        <polygon points="120,240 235,78 360,240" fill="#1B2820"/>
        <circle cx="95" cy="68" r="22" fill="#E6C385" opacity="0.35"/>
      `;
      break;
    case "studio":
      art = `
        <rect x="65" y="48" width="230" height="140" rx="4" fill="none" stroke="#D4A359" stroke-opacity="0.35" stroke-width="1.2"/>
        <line x1="65" y1="118" x2="295" y2="118" stroke="#D4A359" stroke-opacity="0.2" stroke-width="1"/>
        <circle cx="180" cy="118" r="44" fill="#D4A359" opacity="0.16"/>
        <path d="M110 170 Q180 95 250 165" stroke="#E6C385" stroke-width="1.6" fill="none" opacity="0.5"/>
      `;
      break;
    case "stars":
      art = `
        <circle cx="80" cy="65" r="2" fill="#E6C385" opacity="0.9"/>
        <circle cx="145" cy="48" r="1.5" fill="#F5F2EB" opacity="0.7"/>
        <circle cx="220" cy="76" r="2.5" fill="#D4A359" opacity="0.85"/>
        <circle cx="285" cy="54" r="1.8" fill="#E6C385" opacity="0.75"/>
        <circle cx="180" cy="112" r="46" fill="#D4A359" opacity="0.12"/>
        <path d="M80 65 L145 48 L220 76 L285 54" stroke="#D4A359" stroke-width="0.7" stroke-opacity="0.35" fill="none"/>
      `;
      break;
    case "horizon":
    default:
      art = `
        <rect x="0" y="150" width="360" height="90" fill="#101813"/>
        <circle cx="180" cy="150" r="56" fill="#D4A359" opacity="0.22"/>
        <line x1="0" y1="150" x2="360" y2="150" stroke="#D4A359" stroke-opacity="0.4" stroke-width="1"/>
      `;
      break;
  }

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 240" width="720" height="480">
    <defs>
      <linearGradient id="sky" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="#1A241E"/>
        <stop offset="60%" stop-color="#111914"/>
        <stop offset="100%" stop-color="#090D0B"/>
      </linearGradient>
    </defs>
    <rect width="360" height="240" fill="url(#sky)"/>
    ${art}
    <rect x="14" y="14" width="332" height="212" fill="none" stroke="#D4A359" stroke-opacity="0.22" stroke-width="0.8"/>
    <text x="26" y="208" font-family="Georgia, serif" font-size="13" fill="#F5F2EB" fill-opacity="0.88">${title.replace(/&/g, "&amp;")}</text>
    <text x="334" y="208" text-anchor="end" font-family="sans-serif" font-size="10" letter-spacing="2" fill="#D4A359" fill-opacity="0.78">${year}</text>
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

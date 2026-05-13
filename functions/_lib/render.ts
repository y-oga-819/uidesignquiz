// HTML template for the OGP image. Rendered by workers-og (Satori) so the
// supported CSS is the @vercel/og subset: flex layout only, inline styles,
// no media queries / pseudos, limited transform support.

import {
  clampDisplay,
  formatDateLabel,
  formatDurationSec,
  type SharePayload,
} from '../../src/share/payload'

type Tone = {
  bg: string
  ring: string
  eyebrow: string
  headline: string
}

const PALETTE = {
  good: {
    bg: 'rgba(16, 185, 129, 0.10)',
    ring: 'rgba(16, 185, 129, 0.40)',
    eyebrow: '#6ee7b7',
  },
  ok: {
    bg: 'rgba(99, 102, 241, 0.10)',
    ring: 'rgba(99, 102, 241, 0.40)',
    eyebrow: '#a5b4fc',
  },
  retry: {
    bg: 'rgba(245, 158, 11, 0.10)',
    ring: 'rgba(245, 158, 11, 0.40)',
    eyebrow: '#fcd34d',
  },
} as const

const toneFor = (p: SharePayload): Tone => {
  if (p.m === 'e') return { ...PALETTE.ok, headline: 'いっぱい解いた！' }
  const acc = Math.round((p.s / p.t) * 100)
  if (acc >= 90) return { ...PALETTE.good, headline: 'お見事！' }
  if (acc >= 70) return { ...PALETTE.ok, headline: 'いい調子！' }
  return { ...PALETTE.retry, headline: 'もう一回いこう' }
}

const renderEyebrow = (p: SharePayload): string => {
  if (p.m === 's') return `${p.t}問チャレンジ`
  if (p.m === 'd') return `今日のクイズ ${formatDateLabel(p.dt)}`
  return 'エンドレスモード'
}

const renderBadges = (p: SharePayload): string[] => {
  if (p.m === 's' && p.b) {
    const out: string[] = []
    if (p.b.includes('a')) out.push('★ ベスト更新')
    if (p.b.includes('b')) out.push('⚡ 最速更新')
    return out
  }
  return []
}

const escapeHtml = (s: string): string =>
  s.replace(/[&<>"']/g, (c) =>
    c === '&'
      ? '&amp;'
      : c === '<'
        ? '&lt;'
        : c === '>'
          ? '&gt;'
          : c === '"'
            ? '&quot;'
            : '&#39;',
  )

export const renderOgHtml = (p: SharePayload): string => {
  const tone = toneFor(p)
  const eyebrow = renderEyebrow(p)
  const badges = renderBadges(p)
  const isEndless = p.m === 'e'
  const correct = clampDisplay(p.s)
  const total = clampDisplay(p.t)
  const time = formatDurationSec(p.d)

  const badgesHtml =
    badges.length === 0
      ? ''
      : `<div style="display:flex;gap:12px;margin-top:4px;">${badges
          .map(
            (b) =>
              `<div style="display:flex;align-items:center;padding:6px 16px;border-radius:9999px;background:rgba(251,191,36,0.18);color:#fcd34d;font-size:24px;font-weight:700;border:2px solid rgba(251,191,36,0.40);">${escapeHtml(
                b,
              )}</div>`,
          )
          .join('')}</div>`

  // NOTE: every leaf <div> must declare display:flex even when it only
  // contains text. workers-og's parseHtml uses HTMLRewriter, which streams
  // text() events in chunks (especially across multi-byte boundaries), and
  // each chunk lands in Satori as a separate child. A "single-text" div can
  // therefore arrive at Satori with multiple children — and Satori rejects
  // multi-child divs that don't have an explicit display.

  // Right-side hero: the score on a single baseline row so the big number
  // sits closer to the optical center of the card and the supporting glyphs
  // visually orbit it. Endless swaps "/N" for "問".
  const hero = isEndless
    ? `
      <div style="display:flex;align-items:baseline;color:#ffffff;font-weight:800;">
        <div style="display:flex;font-size:260px;line-height:1;letter-spacing:-6px;">${correct.value}${correct.suffix}</div>
        <div style="display:flex;font-size:72px;color:#cbd5e1;margin-left:16px;">問</div>
        <div style="display:flex;font-size:44px;color:#cbd5e1;font-weight:400;margin-left:24px;">正解</div>
      </div>
    `
    : `
      <div style="display:flex;align-items:baseline;color:#ffffff;font-weight:800;">
        <div style="display:flex;font-size:260px;line-height:1;letter-spacing:-6px;">${correct.value}${correct.suffix}</div>
        <div style="display:flex;font-size:96px;color:#94a3b8;margin-left:8px;">/${total.value}${total.suffix}</div>
        <div style="display:flex;font-size:44px;color:#cbd5e1;font-weight:400;margin-left:24px;">正解</div>
      </div>
    `

  // Left-bottom meta block: stopwatch time, plus the attempt count for
  // endless mode where the right-hero number already shows "correct" only.
  // The first line shares the bottom row with the hero so its baseline
  // lines up with the big number.
  const meta = isEndless
    ? `
      <div style="display:flex;flex-direction:column;gap:8px;color:#cbd5e1;font-size:36px;">
        <div style="display:flex;align-items:center;gap:10px;">⏱ ${escapeHtml(time)}</div>
        <div style="display:flex;">挑戦 ${total.value}${total.suffix}問</div>
      </div>
    `
    : `
      <div style="display:flex;align-items:center;gap:10px;color:#cbd5e1;font-size:36px;">⏱ ${escapeHtml(time)}</div>
    `

  // Body splits into a top stack (eyebrow / headline / badges) and a
  // bottom row that places the meta block and the hero on a shared
  // baseline. align-items: baseline on the bottom row is what gets the
  // "8" and "1:12" to land on the same text-bottom — otherwise the
  // descender depth of the big font pushes the number visually higher
  // than the small meta line, even if both containers are flush-bottom.
  const template = `
<div style="display:flex;width:1200px;height:630px;background:#0b1020;padding:48px;font-family:'Noto Sans JP';color:#e2e8f0;">
  <div style="display:flex;flex-direction:column;box-sizing:border-box;width:100%;height:100%;padding:48px 64px;border-radius:32px;background:${tone.bg};border:2px solid ${tone.ring};">
    <div style="display:flex;flex-direction:column;flex:1 1 0%;justify-content:space-between;gap:24px;">
      <div style="display:flex;flex-direction:column;gap:8px;">
        <div style="display:flex;font-size:30px;font-weight:700;color:${tone.eyebrow};letter-spacing:1px;">${escapeHtml(eyebrow)}</div>
        <div style="display:flex;color:#ffffff;font-size:64px;font-weight:700;line-height:1.1;">${escapeHtml(tone.headline)}</div>
        ${badgesHtml}
      </div>
      <div style="display:flex;align-items:baseline;justify-content:space-between;gap:32px;">
        ${meta}
        ${hero}
      </div>
    </div>
    <div style="display:flex;align-items:center;justify-content:space-between;color:#94a3b8;font-size:30px;border-top:2px solid rgba(148,163,184,0.20);padding-top:20px;margin-top:24px;">
      <div style="display:flex;font-weight:700;color:#e2e8f0;">UI Design Quiz</div>
      <div style="display:flex;font-size:22px;">UIパーツの名前を覚えるクイズ</div>
    </div>
  </div>
</div>
  `
  // Strip whitespace between tags. workers-og's HTMLRewriter-based parser
  // emits every text node (including inter-tag indentation) as a Satori
  // child, so the original indented source ends up looking like
  // [ws, <div>, ws] to flexbox — which breaks justify-content and other
  // distributions. Collapsing the source to a single line removes those
  // stray whitespace children without sacrificing readability of the
  // template above.
  return template.replace(/>\s+</g, '><').trim()
}

// Fixed character set used to subset Noto Sans JP via Google Fonts. Kept
// stable across requests so Cloudflare can cache the font response — every
// distinct `text` param produces a different Google Fonts URL.
export const FONT_TEXT = [
  '0123456789',
  '/:()+！',
  'お見事いい調子もう一回いこう',
  'いっぱい解いた',
  '完了問正解所要時間ベスト連続日チャレンジ',
  '今日のクイズエンドレスモード終了',
  '最速更新挑戦',
  '日月火水木金土',
  'UIDesignQuiz',
  'パーツ名前を覚えるクイズアプリ',
].join('')

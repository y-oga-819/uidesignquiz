// Share payload utilities. The Base64URL-encoded JSON blob carried in the
// share URL must be readable by both the SPA (for the /r view) and the
// Cloudflare Pages Functions (/og, /r meta-tag injection), so keep this
// module dependency-free.

export type SessionPayload = {
  m: 's'
  s: number
  t: number
  d: number
  b?: string // 'a' | 'b' | 'ab'
}

export type DailyPayload = {
  m: 'd'
  s: number
  t: number
  d: number
  dt: string
  b?: string
}

export type EndlessPayload = {
  m: 'e'
  s: number
  t: number
  d: number
}

export type SharePayload = SessionPayload | DailyPayload | EndlessPayload

const utf8Encode = (s: string): Uint8Array => new TextEncoder().encode(s)
const utf8Decode = (b: Uint8Array): string => new TextDecoder().decode(b)

// btoa/atob are available in browsers and Cloudflare Workers. The shared
// payload module is used in both, so no Node Buffer fallback needed.
const toBase64Url = (bytes: Uint8Array): string => {
  let bin = ''
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i])
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

const fromBase64Url = (s: string): Uint8Array => {
  let b64 = s.replace(/-/g, '+').replace(/_/g, '/')
  while (b64.length % 4) b64 += '='
  const bin = atob(b64)
  const out = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i)
  return out
}

export const encodePayload = (p: SharePayload): string =>
  toBase64Url(utf8Encode(JSON.stringify(p)))

export const decodePayload = (encoded: string): SharePayload | null => {
  try {
    const json = utf8Decode(fromBase64Url(encoded))
    const parsed: unknown = JSON.parse(json)
    return isValidPayload(parsed) ? parsed : null
  } catch {
    return null
  }
}

const isFiniteNonNegative = (n: unknown): n is number =>
  typeof n === 'number' && Number.isFinite(n) && n >= 0

const isValidPayload = (p: unknown): p is SharePayload => {
  if (!p || typeof p !== 'object') return false
  const o = p as Record<string, unknown>
  if (!isFiniteNonNegative(o.s) || !isFiniteNonNegative(o.t) || !isFiniteNonNegative(o.d)) {
    return false
  }
  if (o.t === 0) return false
  if (o.s > o.t) return false
  if (o.b !== undefined && typeof o.b !== 'string') return false
  if (o.m === 's') return true
  if (o.m === 'd') return typeof o.dt === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(o.dt)
  if (o.m === 'e') return o.b === undefined
  return false
}

// "5/13(火)" style formatter from "YYYY-MM-DD" string. Independent of locale
// so the result is consistent between client (where user is in JST) and
// Cloudflare Functions edge (where the runtime locale is unknown).
const DOW = ['日', '月', '火', '水', '木', '金', '土'] as const

export const formatDateLabel = (dateStr: string): string => {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateStr)
  if (!m) return dateStr
  const year = Number(m[1])
  const month = Number(m[2])
  const day = Number(m[3])
  // Use UTC to avoid TZ drift; the date string is a calendar date, not a moment.
  const dow = DOW[new Date(Date.UTC(year, month - 1, day)).getUTCDay()]
  return `${month}/${day}(${dow})`
}

// Format duration in seconds. Up to 99:59 → "M:SS" / "MM:SS"; beyond → "H:MM:SS".
export const formatDurationSec = (sec: number): string => {
  const total = Math.max(0, Math.floor(sec))
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60
  if (h === 0 && m < 100) {
    return `${m}:${s.toString().padStart(2, '0')}`
  }
  return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
}

// Cap a number for display when it would overflow the OGP layout. The URL
// payload carries the true number; only the rendered figure clamps.
export const clampDisplay = (n: number, max = 999): { value: number; suffix: string } =>
  n > max ? { value: max, suffix: '+' } : { value: n, suffix: '' }

// ---- Share text construction ----

const ORIGIN_ASSUMED_LENGTH = 30 // rough budget; X auto-shortens URLs anyway.
void ORIGIN_ASSUMED_LENGTH

export type ShareTextParts = {
  eyebrow: string
  scoreLine: string
  timeLine: string
  badges: string[] // already rendered like "★ベスト更新" "🔥連続3日"
}

export const buildShareTextParts = (p: SharePayload, badges: string[] = []): ShareTextParts => {
  const timeLine = `⏱ ${formatDurationSec(p.d)}`
  if (p.m === 's') {
    return {
      eyebrow: `${p.t}問チャレンジ`,
      scoreLine: `${p.s}/${p.t} 正解`,
      timeLine,
      badges,
    }
  }
  if (p.m === 'd') {
    return {
      eyebrow: `今日のクイズ ${formatDateLabel(p.dt)}`,
      scoreLine: `${p.s}/${p.t} 正解`,
      timeLine,
      badges,
    }
  }
  return {
    eyebrow: 'エンドレスモード',
    scoreLine: `${p.s}問 正解`,
    timeLine: `${timeLine}  挑戦 ${p.t}問`,
    badges,
  }
}

export const buildShareText = (p: SharePayload, badges: string[] = []): string => {
  const parts = buildShareTextParts(p, badges)
  const head = `${parts.eyebrow}  ${parts.scoreLine}  ${parts.timeLine}`
  const tail = badges.length > 0 ? `\n${badges.join(' ')}` : ''
  return `${head}${tail}\n#UIDesignQuiz`
}

export const buildShareUrl = (origin: string, p: SharePayload): string =>
  `${origin}/r?d=${encodePayload(p)}`

export const buildXIntent = (text: string, url: string): string => {
  const params = new URLSearchParams({ text: `${text}\n`, url })
  return `https://x.com/intent/post?${params.toString()}`
}

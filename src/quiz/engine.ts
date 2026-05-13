import type { Part, PartCategory } from '../parts/types'

export type Mode = 'name-to-ui' | 'ui-to-name' | 'input-name'

export type Question =
  | {
      mode: 'name-to-ui'
      part: Part
      choices: Part[]
    }
  | {
      mode: 'ui-to-name'
      part: Part
      choices: Part[]
    }
  | {
      mode: 'input-name'
      part: Part
    }

export type SessionLength = 10 | 20 | 'infinite'

export type Settings = {
  modes: Mode[]
  categories: PartCategory[] | 'all'
  sessionLength: SessionLength
  reviewMode: boolean
}

export type PartStat = {
  attempts: number
  correct: number
  streak: number
  needsReview: boolean
}

export type PartStats = Record<string, PartStat>

// Parts must be answered correctly this many times in a row to leave the
// review pool (after having been wrong at least once).
export const MASTERY_STREAK = 2

export const initialPartStats: PartStats = {}

export const updatePartStats = (
  stats: PartStats,
  partId: string,
  correct: boolean,
): PartStats => {
  const prev = stats[partId] ?? { attempts: 0, correct: 0, streak: 0, needsReview: false }
  const newStreak = correct ? prev.streak + 1 : 0
  const needsReview = correct ? prev.needsReview && newStreak < MASTERY_STREAK : true
  return {
    ...stats,
    [partId]: {
      attempts: prev.attempts + 1,
      correct: prev.correct + (correct ? 1 : 0),
      streak: newStreak,
      needsReview,
    },
  }
}

export const reviewPoolIds = (stats: PartStats): Set<string> => {
  const out = new Set<string>()
  for (const [id, s] of Object.entries(stats)) {
    if (s.needsReview) out.add(id)
  }
  return out
}

export type MasteryStatus = 'untouched' | 'learning' | 'mastered'

export const partStatus = (stats: PartStats, partId: string): MasteryStatus => {
  const s = stats[partId]
  if (!s || s.attempts === 0) return 'untouched'
  return s.streak >= MASTERY_STREAK ? 'mastered' : 'learning'
}

export type Stats = {
  total: number
  correct: number
  streak: number
  bestStreak: number
}

export type Session = {
  length: SessionLength
  answered: number
  correct: number
  startedAt: number
}

const rand = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)]

const sample = <T,>(arr: T[], n: number): T[] => {
  const copy = [...arr]
  const out: T[] = []
  while (out.length < n && copy.length > 0) {
    const i = Math.floor(Math.random() * copy.length)
    out.push(copy.splice(i, 1)[0])
  }
  return out
}

const shuffle = <T,>(arr: T[]): T[] => {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// Mulberry32 — small deterministic PRNG used for the daily challenge.
const mulberry32 = (seed: number) => () => {
  let t = (seed = (seed + 0x6d2b79f5) | 0)
  t = Math.imul(t ^ (t >>> 15), t | 1)
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296
}

const hashString = (s: string): number => {
  let h = 0
  for (let i = 0; i < s.length; i++) {
    h = (Math.imul(31, h) + s.charCodeAt(i)) | 0
  }
  return h >>> 0
}

const sampleWith = <T,>(arr: T[], n: number, rng: () => number): T[] => {
  const copy = [...arr]
  const out: T[] = []
  while (out.length < n && copy.length > 0) {
    const i = Math.floor(rng() * copy.length)
    out.push(copy.splice(i, 1)[0])
  }
  return out
}

const shuffleWith = <T,>(arr: T[], rng: () => number): T[] => {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

const filterParts = (parts: Part[], settings: Settings) =>
  settings.categories === 'all'
    ? parts
    : parts.filter((p) => (settings.categories as PartCategory[]).includes(p.category))

export const buildQuestion = (
  parts: Part[],
  settings: Settings,
  recentIds: string[] = [],
): Question => {
  const pool = filterParts(parts, settings)
  if (pool.length === 0) throw new Error('問題プールが空です')

  const candidate = pool.filter((p) => !recentIds.includes(p.id))
  const part = rand(candidate.length > 0 ? candidate : pool)

  const mode = rand(settings.modes)

  if (mode === 'input-name') {
    return { mode, part }
  }

  // need 3 distractors of distinct ids and names
  const distractorPool = pool.filter((p) => p.id !== part.id)
  const distractors = sample(distractorPool, Math.min(3, distractorPool.length))
  const choices = shuffle([part, ...distractors])
  return { mode, part, choices }
}

const normalize = (s: string): string =>
  s
    .toLowerCase()
    .replace(/[\s\u3000\-_/]/g, '')
    .replace(/[ァ-ン]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0x60)) // カナ→ひら
    .normalize('NFKC')

export const isCorrectInput = (input: string, part: Part): boolean => {
  const target = normalize(input)
  if (!target) return false
  return [part.name, part.kana, ...part.aliases].some((a) => normalize(a) === target)
}

export const updateStats = (stats: Stats, correct: boolean): Stats => {
  const streak = correct ? stats.streak + 1 : 0
  return {
    total: stats.total + 1,
    correct: stats.correct + (correct ? 1 : 0),
    streak,
    bestStreak: Math.max(stats.bestStreak, streak),
  }
}

export const initialStats: Stats = { total: 0, correct: 0, streak: 0, bestStreak: 0 }

export const initialSession = (length: SessionLength): Session => ({
  length,
  answered: 0,
  correct: 0,
  startedAt: Date.now(),
})

export const updateSession = (s: Session, correct: boolean): Session => ({
  ...s,
  answered: s.answered + 1,
  correct: s.correct + (correct ? 1 : 0),
})

export const isSessionComplete = (s: Session): boolean =>
  s.length !== 'infinite' && s.answered >= s.length

export const buildDailyQuestions = (
  parts: Part[],
  modes: Mode[],
  dateStr: string,
  length: number,
): Question[] => {
  const rng = mulberry32(hashString(dateStr))
  const usableModes = modes.length > 0 ? modes : (['name-to-ui'] as Mode[])
  const selected = sampleWith(parts, Math.min(length, parts.length), rng)
  return selected.map((part) => {
    const mode = usableModes[Math.floor(rng() * usableModes.length)]
    if (mode === 'input-name') return { mode, part }
    const distractorPool = parts.filter((p) => p.id !== part.id)
    const distractors = sampleWith(distractorPool, Math.min(3, distractorPool.length), rng)
    return { mode, part, choices: shuffleWith([part, ...distractors], rng) }
  })
}

export const todayString = (now: Date = new Date()): string => {
  const y = now.getFullYear()
  const m = (now.getMonth() + 1).toString().padStart(2, '0')
  const d = now.getDate().toString().padStart(2, '0')
  return `${y}-${m}-${d}`
}

export const previousDateString = (dateStr: string): string => {
  const d = new Date(`${dateStr}T00:00:00`)
  d.setDate(d.getDate() - 1)
  return todayString(d)
}

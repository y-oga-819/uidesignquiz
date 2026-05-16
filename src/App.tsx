import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { PARTS, CATEGORY_LABEL } from './parts/catalog'
import type { PartCategory } from './parts/types'
import {
  buildDailyQuestions,
  buildQuestion,
  initialPartStats,
  initialSession,
  initialStats,
  isCorrectInput,
  partStatus,
  previousDateString,
  reviewPoolIds,
  todayString,
  updatePartStats,
  updateSession,
  updateStats,
  type Mode,
  type PartStats,
  type Question,
  type Session,
  type SessionLength,
  type Settings,
  type Stats,
} from './quiz/engine'
import type { Part } from './parts/types'
import {
  buildShareText,
  buildShareUrl,
  buildXIntent,
  type SharePayload,
} from './share/payload'

type Phase = 'answering' | 'reveal' | 'result'
type AppMode = 'normal' | 'daily'
type Screen = 'home' | 'setup' | 'playing'
type SetupKind = 'challenge' | 'endless'

const ALL_MODES: Mode[] = ['name-to-ui', 'ui-to-name', 'input-name']

const DAILY_LENGTH = 10

const MODE_LABEL: Record<Mode, string> = {
  'name-to-ui': '名前→UI',
  'ui-to-name': 'UI→名前',
  'input-name': '名前を入力',
}

// Slider bounds for the challenge setup. Min is 10, max is the parts pool
// size, step is 5 — so 10, 15, 20, ... up to PARTS.length.
const CHALLENGE_MIN = 10
const CHALLENGE_STEP = 5

type BestRecord = { accuracy: number; fastestMs?: number }
// Bests are tracked per challenge length (10, 15, 20, ... up to the parts
// pool size). Endless sessions don't record a best.
type Bests = Partial<Record<number, BestRecord>>

type DailyRecord = {
  date: string
  correct: number
  total: number
  durationMs: number
}

type DailyState = {
  lastCompleted: DailyRecord | null
  streak: number
}

type SessionResultBase = {
  correct: number
  total: number
  accuracy: number
  durationMs: number
}

type SessionResult =
  | (SessionResultBase & {
      kind: 'session'
      length: number
      isBest: boolean
      isBestTime: boolean
      prevBest?: number
      prevFastestMs?: number
    })
  | (SessionResultBase & {
      kind: 'daily'
      date: string
      alreadyDone: boolean
      newStreak: number
      prevStreak: number
    })
  | (SessionResultBase & {
      kind: 'endless'
    })

const STORAGE_KEY = 'uidq.v1'

type Persisted = {
  settings: Settings
  stats: Stats
  bests: Bests
  daily: DailyState
  partStats: PartStats
}

const DEFAULT_SETTINGS: Settings = {
  modes: ['name-to-ui', 'ui-to-name', 'input-name'],
  categories: 'all',
  sessionLength: 10,
  reviewMode: false,
}

const DEFAULT_DAILY: DailyState = { lastCompleted: null, streak: 0 }

// Migrate legacy `bests: { 10: 80 }` (accuracy-only number) into the new
// record shape `{ 10: { accuracy: 80 } }` on load. Accepts any positive
// integer length key (10, 15, 20, ...).
const normalizeBests = (raw: unknown): Bests => {
  if (!raw || typeof raw !== 'object') return {}
  const out: Bests = {}
  for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
    const length = Number(k)
    if (!Number.isInteger(length) || length <= 0) continue
    if (typeof v === 'number') {
      out[length] = { accuracy: v }
    } else if (v && typeof v === 'object') {
      const obj = v as Record<string, unknown>
      const accuracy = typeof obj.accuracy === 'number' ? obj.accuracy : undefined
      if (accuracy === undefined) continue
      const fastestMs = typeof obj.fastestMs === 'number' ? obj.fastestMs : undefined
      out[length] = fastestMs === undefined ? { accuracy } : { accuracy, fastestMs }
    }
  }
  return out
}

const loadPersisted = (): Persisted => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) throw new Error('empty')
    const parsed = JSON.parse(raw) as Partial<Persisted>
    if (!parsed.settings?.modes?.length) throw new Error('invalid')
    return {
      settings: { ...DEFAULT_SETTINGS, ...parsed.settings },
      stats: parsed.stats ?? initialStats,
      bests: normalizeBests(parsed.bests),
      daily: parsed.daily ?? DEFAULT_DAILY,
      partStats: parsed.partStats ?? initialPartStats,
    }
  } catch {
    return {
      settings: DEFAULT_SETTINGS,
      stats: initialStats,
      bests: {},
      daily: DEFAULT_DAILY,
      partStats: initialPartStats,
    }
  }
}

const computeStreak = (date: string, daily: DailyState): number => {
  const last = daily.lastCompleted?.date
  if (last === date) return daily.streak
  if (last === previousDateString(date)) return daily.streak + 1
  return 1
}

const isDailyStreakLive = (date: string, daily: DailyState): boolean => {
  const last = daily.lastCompleted?.date
  return last === date || last === previousDateString(date)
}

const formatDuration = (ms: number): string => {
  const total = Math.max(0, Math.floor(ms / 1000))
  const m = Math.floor(total / 60)
  const s = total % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

export default function App() {
  const [{ settings, stats, bests, daily, partStats }, setState] = useState<Persisted>(loadPersisted)
  const [question, setQuestion] = useState<Question | null>(null)
  const [phase, setPhase] = useState<Phase>('answering')
  const [picked, setPicked] = useState<string | null>(null)
  const [input, setInput] = useState('')
  const [lastCorrect, setLastCorrect] = useState<boolean | null>(null)
  const [showProgress, setShowProgress] = useState(false)
  const [session, setSession] = useState<Session>(() => initialSession(settings.sessionLength))
  const [lastResult, setLastResult] = useState<SessionResult | null>(null)
  const [appMode, setAppMode] = useState<AppMode>('normal')
  const [screen, setScreen] = useState<Screen>('home')
  const [setupKind, setSetupKind] = useState<SetupKind>('challenge')
  const [dailyQuestions, setDailyQuestions] = useState<Question[]>([])
  const [dailyAlreadyDone, setDailyAlreadyDone] = useState(false)
  const recentIdsRef = useRef<string[]>([])
  const inputRef = useRef<HTMLInputElement>(null)

  const today = todayString()

  const reviewIds = useMemo(() => reviewPoolIds(partStats), [partStats])
  // Held in a ref so `next` can read the latest pool without depending on
  // partStats (which would re-fire the load-question effect after every answer).
  const reviewIdsRef = useRef(reviewIds)
  useEffect(() => {
    reviewIdsRef.current = reviewIds
  }, [reviewIds])

  const next = useCallback(() => {
    const basePool = settings.reviewMode
      ? PARTS.filter((p) => reviewIdsRef.current.has(p.id))
      : PARTS
    if (basePool.length === 0) {
      setQuestion(null)
      setPhase('answering')
      return
    }
    try {
      const q = buildQuestion(basePool, settings, recentIdsRef.current)
      recentIdsRef.current = [q.part.id, ...recentIdsRef.current].slice(0, 8)
      setQuestion(q)
      setPhase('answering')
      setPicked(null)
      setInput('')
      setLastCorrect(null)
    } catch {
      // pool became empty after applying category filter inside buildQuestion
      setQuestion(null)
      setPhase('answering')
    }
  }, [settings])

  const showQuestion = useCallback((q: Question) => {
    setQuestion(q)
    setPhase('answering')
    setPicked(null)
    setInput('')
    setLastCorrect(null)
  }, [])

  // Reset transient session state on settings change (and on initial render
  // this is a no-op because lastSettings starts equal to settings).
  // See https://react.dev/learn/you-might-not-need-an-effect#adjusting-some-state-when-a-prop-changes
  const [lastSettings, setLastSettings] = useState(settings)
  if (appMode === 'normal' && lastSettings !== settings) {
    setLastSettings(settings)
    setSession(initialSession(settings.sessionLength))
    setLastResult(null)
  }

  // Load first question whenever a normal-mode play session starts (or settings
  // change mid-play). Home screen never auto-loads — the user picks a quiz
  // from HomeView, which flips `screen` to 'playing'.
  useEffect(() => {
    if (appMode !== 'normal' || screen !== 'playing') return
    recentIdsRef.current = []
    next()
  }, [next, appMode, screen])

  const restartSession = useCallback(() => {
    if (appMode === 'daily') {
      const questions =
        dailyQuestions.length > 0
          ? dailyQuestions
          : buildDailyQuestions(PARTS, ALL_MODES, today, DAILY_LENGTH)
      if (dailyQuestions.length === 0) setDailyQuestions(questions)
      setDailyAlreadyDone(daily.lastCompleted?.date === today)
      setSession({
        length: DAILY_LENGTH,
        answered: 0,
        correct: 0,
        startedAt: Date.now(),
      })
      setLastResult(null)
      showQuestion(questions[0])
      return
    }
    setSession(initialSession(settings.sessionLength))
    setLastResult(null)
    recentIdsRef.current = []
    next()
  }, [
    appMode,
    dailyQuestions,
    daily.lastCompleted,
    today,
    next,
    settings.sessionLength,
    showQuestion,
  ])

  const startDaily = useCallback(() => {
    const questions = buildDailyQuestions(PARTS, ALL_MODES, today, DAILY_LENGTH)
    setAppMode('daily')
    setDailyQuestions(questions)
    setDailyAlreadyDone(daily.lastCompleted?.date === today)
    setSession({
      length: DAILY_LENGTH,
      answered: 0,
      correct: 0,
      startedAt: Date.now(),
    })
    setLastResult(null)
    setScreen('playing')
    showQuestion(questions[0])
  }, [today, daily.lastCompleted, showQuestion])

  const startChallenge = useCallback((length: SessionLength) => {
    setState((s) => ({
      ...s,
      settings: { ...s.settings, sessionLength: length, reviewMode: false },
    }))
    setAppMode('normal')
    setDailyQuestions([])
    setDailyAlreadyDone(false)
    setSession(initialSession(length))
    setLastResult(null)
    recentIdsRef.current = []
    setScreen('playing')
  }, [])

  // Setup screen: opened from the Challenge or Endless home cards. The screen
  // edits modes/categories/sessionLength on `settings` directly (so the
  // filters persist as defaults for next time), then dispatches into
  // startChallenge on "スタート".
  const openSetup = useCallback((kind: SetupKind) => {
    setSetupKind(kind)
    // Endless ignores the slider — pin sessionLength so the slider's
    // last-used value doesn't leak into an endless session.
    if (kind === 'endless') {
      setState((s) => ({ ...s, settings: { ...s.settings, sessionLength: 'infinite' } }))
    } else if (settings.sessionLength === 'infinite') {
      // Coming back from endless: fall back to the canonical length so the
      // slider shows a sensible initial value.
      setState((s) => ({ ...s, settings: { ...s.settings, sessionLength: CHALLENGE_MIN } }))
    }
    setScreen('setup')
  }, [settings.sessionLength])

  const startFromSetup = useCallback(() => {
    const length =
      setupKind === 'endless'
        ? ('infinite' as const)
        : settings.sessionLength === 'infinite'
          ? CHALLENGE_MIN
          : settings.sessionLength
    startChallenge(length)
  }, [setupKind, settings.sessionLength, startChallenge])

  const startReview = useCallback(() => {
    setState((s) => ({
      ...s,
      settings: { ...s.settings, reviewMode: true, sessionLength: 10 },
    }))
    setAppMode('normal')
    setDailyQuestions([])
    setDailyAlreadyDone(false)
    setSession(initialSession(10))
    setLastResult(null)
    recentIdsRef.current = []
    setScreen('playing')
  }, [])

  const navigateHome = useCallback(() => {
    setAppMode('normal')
    setDailyQuestions([])
    setDailyAlreadyDone(false)
    setLastResult(null)
    setQuestion(null)
    setPhase('answering')
    setScreen('home')
  }, [])

  useEffect(() => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ settings, stats, bests, daily, partStats }),
    )
  }, [settings, stats, bests, daily, partStats])

  // Handle `?start=` on first mount. Used by the SharedScoreView CTA to drop
  // a viewer straight into the appropriate mode after they tap "挑戦してみる".
  // The setState-in-effect rule fires here, but the dispatch is a legitimate
  // one-shot mount action (URL params are external state we read into React).
  const autostartRef = useRef(false)
  useEffect(() => {
    if (autostartRef.current) return
    autostartRef.current = true
    if (typeof window === 'undefined') return
    const params = new URLSearchParams(window.location.search)
    const start = params.get('start')
    if (!start) return
    window.history.replaceState({}, '', window.location.pathname)
    if (start === 'daily') {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      startDaily()
    } else if (start === 'infinite') {
      startChallenge('infinite')
    } else {
      const n = Number(start)
      // Accept any positive integer length so legacy share URLs (?start=20)
      // and any future lengths continue to work without a redirect.
      if (Number.isInteger(n) && n > 0) {
        startChallenge(n)
      }
    }
  }, [startDaily, startChallenge])

  // focus input when input mode comes up — only on devices with a fine pointer
  // (desktop). On touch devices this would force the on-screen keyboard up
  // before the user has had a chance to read the question.
  useEffect(() => {
    if (question?.mode !== 'input-name' || phase !== 'answering') return
    if (typeof window === 'undefined') return
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return
    inputRef.current?.focus()
  }, [question, phase])

  const reveal = useCallback(
    (correct: boolean, pickedId?: string | null) => {
      setLastCorrect(correct)
      if (pickedId !== undefined) setPicked(pickedId)
      setPhase('reveal')
      const partId = question?.part.id
      setState((s) => ({
        ...s,
        stats: updateStats(s.stats, correct),
        partStats: partId ? updatePartStats(s.partStats, partId, correct) : s.partStats,
      }))
      setSession((s) => updateSession(s, correct))
    },
    [question],
  )

  const goNext = useCallback(() => {
    if (appMode === 'daily') {
      if (session.answered >= dailyQuestions.length) {
        const total = dailyQuestions.length
        const correct = session.correct
        const accuracy = Math.round((correct / total) * 100)
        const durationMs = Date.now() - session.startedAt
        const prevStreak = daily.streak
        const newStreak = computeStreak(today, daily)
        if (!dailyAlreadyDone) {
          setState((s) => ({
            ...s,
            daily: {
              lastCompleted: { date: today, correct, total, durationMs },
              streak: newStreak,
            },
          }))
        }
        setLastResult({
          kind: 'daily',
          date: today,
          correct,
          total,
          accuracy,
          durationMs,
          alreadyDone: dailyAlreadyDone,
          newStreak: dailyAlreadyDone ? prevStreak : newStreak,
          prevStreak,
        })
        setPhase('result')
        return
      }
      showQuestion(dailyQuestions[session.answered])
      return
    }

    if (session.length !== 'infinite' && session.answered >= session.length) {
      const total = session.length
      const correct = session.correct
      const accuracy = Math.round((correct / total) * 100)
      const durationMs = Date.now() - session.startedAt
      const prev = bests[total]
      const prevBest = prev?.accuracy
      const prevFastestMs = prev?.fastestMs
      const isBest = prevBest === undefined || accuracy > prevBest
      const isPerfect = accuracy === 100
      const isBestTime =
        isPerfect && (prevFastestMs === undefined || durationMs < prevFastestMs)
      if (isBest || isBestTime) {
        const nextRecord: BestRecord = {
          accuracy: isBest ? accuracy : (prevBest ?? accuracy),
          fastestMs: isBestTime ? durationMs : prevFastestMs,
        }
        if (nextRecord.fastestMs === undefined) delete nextRecord.fastestMs
        setState((s) => ({ ...s, bests: { ...s.bests, [total]: nextRecord } }))
      }
      setLastResult({
        kind: 'session',
        length: total,
        correct,
        total,
        accuracy,
        durationMs,
        isBest,
        isBestTime,
        prevBest,
        prevFastestMs,
      })
      setPhase('result')
      return
    }
    next()
  }, [appMode, dailyQuestions, dailyAlreadyDone, session, bests, daily, today, next, showQuestion])

  // End an endless session early and show the result/share screen. We never
  // reach this branch from goNext (endless never auto-completes), so it lives
  // as its own callback bound to a UI button in QuestionView.
  const finishEndless = useCallback(() => {
    if (session.length !== 'infinite') return
    const correct = session.correct
    const total = session.answered
    if (total === 0) return // nothing to share
    const accuracy = Math.round((correct / total) * 100)
    const durationMs = Date.now() - session.startedAt
    setLastResult({
      kind: 'endless',
      correct,
      total,
      accuracy,
      durationMs,
    })
    setPhase('result')
  }, [session])

  const handleChoice = useCallback(
    (id: string) => {
      if (!question || phase !== 'answering' || question.mode === 'input-name') return
      reveal(id === question.part.id, id)
    },
    [question, phase, reveal],
  )

  const submitInput = useCallback(() => {
    if (!question || phase !== 'answering' || question.mode !== 'input-name') return
    if (!input.trim()) return
    reveal(isCorrectInput(input, question.part))
  }, [input, question, phase, reveal])

  const skip = useCallback(() => {
    if (!question || phase !== 'answering') return
    reveal(false)
  }, [question, phase, reveal])

  // keyboard: 1-4 choices, Enter advance, Space reveal/next, Esc skip
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (screen !== 'playing') return
      const tag = (e.target as HTMLElement | null)?.tagName
      const isTyping = tag === 'INPUT' || tag === 'TEXTAREA'

      if (phase === 'result') {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          restartSession()
        }
        return
      }

      if (phase === 'reveal') {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          goNext()
        }
        return
      }

      if (!question) return

      if (question.mode === 'input-name') {
        if (e.key === 'Enter') {
          e.preventDefault()
          submitInput()
        } else if (e.key === 'Escape') {
          e.preventDefault()
          skip()
        }
        return
      }

      if (isTyping) return

      const idx = ['1', '2', '3', '4'].indexOf(e.key)
      if (idx >= 0 && question.choices[idx]) {
        e.preventDefault()
        handleChoice(question.choices[idx].id)
      } else if (e.key === 'Escape') {
        e.preventDefault()
        skip()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [phase, question, goNext, restartSession, handleChoice, submitInput, skip, screen])

  const accuracy = stats.total === 0 ? 0 : Math.round((stats.correct / stats.total) * 100)

  const dailyStreakLive = isDailyStreakLive(today, daily)
  const dailyDoneToday = daily.lastCompleted?.date === today
  const reviewCount = reviewIds.size

  return (
    <div className="min-h-full bg-slate-950 text-slate-100">
      <div className="mx-auto flex min-h-screen max-w-3xl flex-col px-4 py-6">
        <Header
          stats={stats}
          accuracy={accuracy}
          screen={screen}
          onProgress={() => setShowProgress(true)}
          onReset={() =>
            setState((s) => ({ ...s, stats: initialStats }))
          }
        />

        <main className="mt-6 flex flex-1 flex-col gap-5">
          {screen === 'home' ? (
            <HomeView
              dailyStreak={daily.streak}
              dailyStreakLive={dailyStreakLive}
              dailyDoneToday={dailyDoneToday}
              reviewCount={reviewCount}
              onStartDaily={startDaily}
              onOpenSetup={openSetup}
              onStartReview={startReview}
            />
          ) : screen === 'setup' ? (
            <SetupScreen
              kind={setupKind}
              settings={settings}
              maxLength={PARTS.length}
              onChange={(s) => setState((prev) => ({ ...prev, settings: s }))}
              onStart={startFromSetup}
              onBack={navigateHome}
            />
          ) : (
            <>
              {appMode === 'daily' && phase !== 'result' && (
                <DailyBanner alreadyDone={dailyAlreadyDone} date={today} />
              )}

              {phase !== 'result' && session.length !== 'infinite' && (
                <SessionProgress session={session} />
              )}

              {phase !== 'result' &&
                session.length === 'infinite' &&
                session.answered > 0 && (
                  <EndlessControls
                    answered={session.answered}
                    correct={session.correct}
                    onFinish={finishEndless}
                  />
                )}

              {phase === 'result' && lastResult ? (
                <ResultView
                  result={lastResult}
                  onRestart={restartSession}
                  onHome={navigateHome}
                />
              ) : question ? (
                <QuestionView
                  question={question}
                  phase={phase}
                  picked={picked}
                  input={input}
                  onInputChange={setInput}
                  onChoice={handleChoice}
                  onSubmit={submitInput}
                  onSkip={skip}
                  onNext={goNext}
                  lastCorrect={lastCorrect}
                  inputRef={inputRef}
                />
              ) : appMode === 'normal' && settings.reviewMode ? (
                <EmptyReview onHome={navigateHome} />
              ) : null}
            </>
          )}
        </main>

        <Footer />
      </div>

      {showProgress && (
        <ProgressModal partStats={partStats} onClose={() => setShowProgress(false)} />
      )}
    </div>
  )
}

function ProgressModal({
  partStats,
  onClose,
}: {
  partStats: PartStats
  onClose: () => void
}) {
  const grouped = useMemo(() => {
    const map = new Map<Part['category'], Part[]>()
    for (const p of PARTS) {
      const arr = map.get(p.category) ?? []
      arr.push(p)
      map.set(p.category, arr)
    }
    return Array.from(map.entries())
  }, [])

  const totals = useMemo(() => {
    let mastered = 0
    let learning = 0
    let untouched = 0
    for (const p of PARTS) {
      const status = partStatus(partStats, p.id)
      if (status === 'mastered') mastered++
      else if (status === 'learning') learning++
      else untouched++
    }
    return { mastered, learning, untouched, total: PARTS.length }
  }, [partStats])

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-slate-950/70 p-4"
      onClick={onClose}
    >
      <div
        className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-slate-900 p-5 ring-1 ring-slate-800"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold text-white">学習の進捗</h2>
          <button onClick={onClose} className="text-sm text-slate-400 hover:text-white">
            閉じる
          </button>
        </div>

        <div className="mb-5 rounded-xl bg-slate-950/50 p-4 ring-1 ring-slate-800">
          <div className="flex items-end gap-2">
            <div className="text-3xl font-bold tabular-nums text-white">
              {totals.mastered}
              <span className="text-base text-slate-400">/{totals.total}</span>
            </div>
            <div className="pb-1 text-xs text-slate-300">マスター</div>
          </div>
          <div className="mt-3 flex h-1.5 overflow-hidden rounded-full bg-slate-800">
            <div
              className="h-full bg-emerald-500"
              style={{ width: `${(totals.mastered / totals.total) * 100}%` }}
            />
            <div
              className="h-full bg-indigo-500/60"
              style={{ width: `${(totals.learning / totals.total) * 100}%` }}
            />
          </div>
          <div className="mt-2 flex flex-wrap gap-3 text-[11px] text-slate-400">
            <LegendDot color="bg-emerald-500" label={`マスター ${totals.mastered}`} />
            <LegendDot color="bg-indigo-500/60" label={`学習中 ${totals.learning}`} />
            <LegendDot color="bg-slate-700" label={`未出題 ${totals.untouched}`} />
          </div>
          <p className="mt-2 text-[11px] text-slate-500">
            連続2回正解でマスター扱いになります。
          </p>
        </div>

        <div className="flex flex-col gap-4">
          {grouped.map(([category, parts]) => {
            const m = parts.filter((p) => partStatus(partStats, p.id) === 'mastered').length
            const l = parts.filter((p) => partStatus(partStats, p.id) === 'learning').length
            const ratio = parts.length === 0 ? 0 : m / parts.length
            return (
              <section key={category}>
                <div className="mb-1 flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-200">
                    {CATEGORY_LABEL[category]}
                  </span>
                  <span className="tabular-nums text-slate-400">
                    {m}/{parts.length}
                  </span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-slate-800">
                  <div
                    className="h-full bg-emerald-500 transition-all"
                    style={{ width: `${ratio * 100}%` }}
                  />
                </div>
                <div className="mt-2 flex flex-wrap gap-1">
                  {parts.map((p) => {
                    const status = partStatus(partStats, p.id)
                    const dot =
                      status === 'mastered'
                        ? 'bg-emerald-500 text-emerald-50'
                        : status === 'learning'
                          ? 'bg-indigo-500/60 text-indigo-50'
                          : 'bg-slate-700 text-slate-300'
                    return (
                      <span
                        key={p.id}
                        title={`${p.name}（${
                          status === 'mastered' ? 'マスター' : status === 'learning' ? '学習中' : '未出題'
                        }）`}
                        className={`rounded-full px-2 py-0.5 text-[10px] ${dot}`}
                      >
                        {p.name}
                      </span>
                    )
                  })}
                </div>
                {l > 0 && (
                  <div className="mt-1 text-[10px] text-slate-500">学習中 {l}問</div>
                )}
              </section>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1">
      <span className={`inline-block size-2 rounded-full ${color}`} />
      {label}
    </span>
  )
}

function HomeView({
  dailyStreak,
  dailyStreakLive,
  dailyDoneToday,
  reviewCount,
  onStartDaily,
  onOpenSetup,
  onStartReview,
}: {
  dailyStreak: number
  dailyStreakLive: boolean
  dailyDoneToday: boolean
  reviewCount: number
  onStartDaily: () => void
  onOpenSetup: (kind: SetupKind) => void
  onStartReview: () => void
}) {
  const streakBadge =
    dailyStreakLive && dailyStreak > 0 ? `🔥 ${dailyStreak}日連続` : null

  return (
    <div className="flex flex-col gap-4">
      <button
        onClick={onStartDaily}
        className="group flex flex-col items-start gap-2 rounded-2xl bg-amber-500/10 p-5 text-left ring-1 ring-amber-500/30 transition hover:bg-amber-500/15"
      >
        <div className="flex w-full items-center justify-between gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-amber-300">
            毎日 / {DAILY_LENGTH}問
          </span>
          {streakBadge && (
            <span className="rounded-full bg-amber-500/20 px-2.5 py-0.5 text-[11px] font-semibold text-amber-200 ring-1 ring-amber-500/40">
              {streakBadge}
            </span>
          )}
        </div>
        <div className="text-xl font-semibold text-white">
          {dailyDoneToday ? '今日のクイズ（達成済み）' : '今日のクイズに挑戦'}
        </div>
        <div className="text-sm text-amber-100/80">
          {dailyDoneToday
            ? '記録は更新されませんが、もう一度遊べます。'
            : '日替わりの10問。連続記録を伸ばそう。'}
        </div>
      </button>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <HomeCard
          title="チャレンジ"
          description="問題数とカテゴリを選んで正答率を競う。"
          accent="indigo"
          onClick={() => onOpenSetup('challenge')}
        />
        <HomeCard
          title="エンドレスモード"
          description="気が済むまで連続出題。途中で集計可。"
          accent="slate"
          onClick={() => onOpenSetup('endless')}
        />
      </div>

      {reviewCount > 0 && (
        <button
          onClick={onStartReview}
          className="flex items-center justify-between gap-3 rounded-xl bg-rose-500/10 px-4 py-3 text-left ring-1 ring-rose-500/30 transition hover:bg-rose-500/15"
        >
          <div>
            <div className="text-sm font-semibold text-rose-100">復習モード</div>
            <div className="text-xs text-rose-200/80">
              間違えた問題だけを10問出題。
            </div>
          </div>
          <span className="rounded-full bg-rose-500/20 px-2.5 py-1 text-xs font-semibold text-rose-100 ring-1 ring-rose-500/40">
            {reviewCount}問
          </span>
        </button>
      )}
    </div>
  )
}

function HomeCard({
  title,
  description,
  accent,
  onClick,
}: {
  title: string
  description: string
  accent: 'indigo' | 'slate'
  onClick: () => void
}) {
  const styles =
    accent === 'indigo'
      ? 'bg-indigo-500/10 ring-indigo-500/30 hover:bg-indigo-500/15 text-indigo-100'
      : 'bg-slate-900 ring-slate-800 hover:bg-slate-800 text-slate-100'
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-start gap-1 rounded-xl p-4 text-left ring-1 transition ${styles}`}
    >
      <div className="text-base font-semibold text-white">{title}</div>
      <div className="text-xs text-slate-300/80">{description}</div>
    </button>
  )
}

function EmptyReview({ onHome }: { onHome: () => void }) {
  return (
    <div className="rounded-2xl bg-emerald-500/10 p-6 text-center ring-1 ring-emerald-500/30">
      <div className="text-3xl">🎉</div>
      <div className="mt-2 text-lg font-semibold text-white">弱点なし！</div>
      <p className="mt-1 text-sm text-emerald-100/80">
        復習対象の問題はもうありません。ホームから別のクイズを始めましょう。
      </p>
      <button
        onClick={onHome}
        className="mt-4 rounded-md bg-white px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-100"
      >
        ホームへ戻る
      </button>
    </div>
  )
}

function DailyBanner({ alreadyDone, date }: { alreadyDone: boolean; date: string }) {
  return (
    <div className="flex items-center gap-2 rounded-xl bg-amber-500/10 px-3 py-2 text-xs text-amber-200 ring-1 ring-amber-500/30">
      <span className="text-base">🔥</span>
      <div className="flex-1">
        <div className="font-semibold">今日のクイズ ({date})</div>
        <div className="text-[11px] text-amber-200/70">
          {alreadyDone
            ? '本日達成済み。再挑戦は記録に影響しません。'
            : `${DAILY_LENGTH}問解いて連続記録を伸ばそう。`}
        </div>
      </div>
    </div>
  )
}

function SessionProgress({ session }: { session: Session }) {
  if (session.length === 'infinite') return null
  const ratio = Math.min(session.answered / session.length, 1)
  return (
    <div className="flex items-center gap-2 text-xs text-slate-400">
      <span className="tabular-nums">
        {Math.min(session.answered, session.length)}/{session.length}
      </span>
      <div className="h-1 flex-1 overflow-hidden rounded-full bg-slate-800">
        <div
          className="h-full rounded-full bg-indigo-500 transition-all"
          style={{ width: `${ratio * 100}%` }}
        />
      </div>
    </div>
  )
}

function ResultView({
  result,
  onRestart,
  onHome,
}: {
  result: SessionResult
  onRestart: () => void
  onHome: () => void
}) {
  const tone =
    result.accuracy >= 90
      ? { ring: 'ring-emerald-500/40', bg: 'bg-emerald-500/10', text: 'text-emerald-300', headline: 'お見事！' }
      : result.accuracy >= 70
        ? { ring: 'ring-indigo-500/40', bg: 'bg-indigo-500/10', text: 'text-indigo-300', headline: 'いい調子！' }
        : { ring: 'ring-amber-500/40', bg: 'bg-amber-500/10', text: 'text-amber-300', headline: 'もう一回いこう' }

  const eyebrow =
    result.kind === 'daily'
      ? `今日のクイズ (${result.date}) 完了`
      : result.kind === 'endless'
        ? 'エンドレスモード 終了'
        : `${result.length}問チャレンジ 完了`

  const sharePayload = buildResultPayload(result)
  const badgeLabels = collectBadges(result)

  return (
    <div className="flex flex-col gap-5">
      <div className={`rounded-2xl p-6 ring-1 ${tone.bg} ${tone.ring}`}>
        <div className={`text-xs font-semibold uppercase tracking-wider ${tone.text}`}>
          {eyebrow}
        </div>
        <div className="mt-1 text-2xl font-semibold text-white">{tone.headline}</div>
        <div className="mt-4 flex items-end gap-3">
          <div className="text-5xl font-bold tabular-nums text-white">
            {result.correct}
            <span className="text-2xl text-slate-400">/{result.total}</span>
          </div>
          <div className="pb-1 text-sm text-slate-300">正解</div>
          {badgeLabels.length > 0 && (
            <div className="ml-auto flex flex-wrap items-center justify-end gap-1.5">
              {badgeLabels.map((label) => (
                <span
                  key={label}
                  className="rounded-full bg-amber-400/20 px-3 py-1 text-xs font-semibold text-amber-300 ring-1 ring-amber-400/40"
                >
                  {label}
                </span>
              ))}
            </div>
          )}
          {result.kind === 'daily' && result.alreadyDone && (
            <span className="ml-auto rounded-full bg-slate-700/40 px-3 py-1 text-xs font-medium text-slate-300 ring-1 ring-slate-600/40">
              再挑戦（記録なし）
            </span>
          )}
        </div>
        <div className="mt-4 grid grid-cols-3 gap-2 text-center">
          <ResultStat label="正答率" value={`${result.accuracy}%`} />
          <ResultStat label="所要時間" value={formatDuration(result.durationMs)} />
          {result.kind === 'session' ? (
            <ResultStat
              label="ベスト"
              value={
                result.isBest
                  ? `${result.accuracy}%`
                  : result.prevBest !== undefined
                    ? `${result.prevBest}%`
                    : '—'
              }
            />
          ) : result.kind === 'daily' ? (
            <ResultStat label="連続日数" value={`${result.newStreak}日`} />
          ) : (
            <ResultStat label="挑戦数" value={`${result.total}問`} />
          )}
        </div>
        {result.kind === 'daily' && !result.alreadyDone && (
          <p className="mt-3 text-xs text-slate-300">明日もまた挑戦してね。</p>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          onClick={onRestart}
          className="flex-1 rounded-xl bg-white px-4 py-3 text-sm font-semibold text-slate-900 hover:bg-slate-100"
        >
          もう一回 ↵
        </button>
        {sharePayload && (
          <ShareButton payload={sharePayload} badges={badgeLabels} />
        )}
        <button
          onClick={onHome}
          className="flex-1 rounded-xl bg-slate-800 px-4 py-3 text-sm font-semibold text-slate-200 ring-1 ring-slate-700 hover:bg-slate-700"
        >
          ホームへ戻る
        </button>
      </div>
    </div>
  )
}

// Map a SessionResult into the share payload shape. Returns null for
// nothing-to-share (e.g. endless with 0 answers).
function buildResultPayload(result: SessionResult): SharePayload | null {
  const durationSec = Math.round(result.durationMs / 1000)
  if (result.kind === 'session') {
    let b = ''
    if (result.isBest) b += 'a'
    if (result.isBestTime) b += 'b'
    return {
      m: 's',
      s: result.correct,
      t: result.total,
      d: durationSec,
      ...(b ? { b } : {}),
    }
  }
  if (result.kind === 'daily') {
    return {
      m: 'd',
      s: result.correct,
      t: result.total,
      d: durationSec,
      dt: result.date,
    }
  }
  if (result.total === 0) return null
  return {
    m: 'e',
    s: result.correct,
    t: result.total,
    d: durationSec,
  }
}

function collectBadges(result: SessionResult): string[] {
  const out: string[] = []
  if (result.kind === 'session') {
    if (result.isBest) out.push('★ ベスト更新')
    if (result.isBestTime) out.push('⚡ 最速更新')
  } else if (result.kind === 'daily') {
    if (!result.alreadyDone && result.newStreak > result.prevStreak) {
      out.push(`🔥 連続 ${result.newStreak}日`)
    }
  }
  return out
}

function ShareButton({ payload, badges }: { payload: SharePayload; badges: string[] }) {
  // An anchor navigation survives mobile popup blockers and in-app browsers
  // (X / LINE / Instagram WebViews) where window.open is silently blocked.
  const href = useMemo(() => {
    const origin = typeof window !== 'undefined' ? window.location.origin : ''
    const url = buildShareUrl(origin, payload)
    const text = buildShareText(payload, badges)
    return buildXIntent(text, url)
  }, [payload, badges])
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="flex flex-1 items-center justify-center rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-slate-100 ring-1 ring-slate-700 hover:bg-slate-800"
      title="X (旧Twitter) で結果をシェア"
    >
      𝕏 でシェア
    </a>
  )
}

function EndlessControls({
  answered,
  correct,
  onFinish,
}: {
  answered: number
  correct: number
  onFinish: () => void
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl bg-slate-900 px-3 py-2 ring-1 ring-slate-800">
      <div className="flex items-baseline gap-2 text-xs text-slate-300">
        <span className="tabular-nums text-base font-semibold text-white">{correct}</span>
        <span className="text-slate-400">/ {answered} 正解</span>
      </div>
      <button
        onClick={onFinish}
        className="rounded-md bg-slate-800 px-2.5 py-1.5 text-xs font-semibold text-slate-200 ring-1 ring-slate-700 hover:bg-slate-700"
      >
        終了してシェア
      </button>
    </div>
  )
}

function ResultStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-slate-950/40 px-3 py-2 ring-1 ring-slate-800">
      <div className="text-[10px] uppercase tracking-wide text-slate-400">{label}</div>
      <div className="mt-0.5 text-base font-semibold text-white tabular-nums">{value}</div>
    </div>
  )
}

function Header({
  stats,
  accuracy,
  screen,
  onReset,
  onProgress,
}: {
  stats: Stats
  accuracy: number
  screen: Screen
  onReset: () => void
  onProgress: () => void
}) {
  const isPlaying = screen === 'playing'
  const isHome = screen === 'home'

  return (
    <header className="flex items-center justify-between gap-3">
      <div>
        <h1 className="text-lg font-semibold tracking-tight text-white">
          UI Design Quiz
        </h1>
        <p className="text-xs text-slate-400">UIパーツの名前を暗記カード式で覚える</p>
      </div>
      <div className="flex items-center gap-2">
        {isPlaying && (
          <>
            <Stat label="正答率" value={`${accuracy}%`} />
            <Stat label="連続正解" value={stats.streak.toString()} highlight={stats.streak >= 5} />
            <Stat label="出題数" value={stats.total.toString()} />
          </>
        )}
        <button
          onClick={onProgress}
          className="rounded-md bg-slate-800 px-2.5 py-1.5 text-xs text-slate-200 ring-1 ring-slate-700 hover:bg-slate-700"
          title="学習の進捗"
        >
          📊 進捗
        </button>
        {isHome && (
          <button
            onClick={onReset}
            className="rounded-md px-2 py-1.5 text-xs text-slate-400 hover:text-slate-200"
            title="統計をリセット"
          >
            ↺
          </button>
        )}
      </div>
    </header>
  )
}

function Stat({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div
      className={
        'rounded-md px-2.5 py-1 text-center ring-1 ' +
        (highlight
          ? 'bg-amber-500/10 text-amber-300 ring-amber-500/40'
          : 'bg-slate-900 text-slate-200 ring-slate-800')
      }
    >
      <div className="text-[9px] uppercase tracking-wide text-slate-400">{label}</div>
      <div className="text-sm font-semibold">{value}</div>
    </div>
  )
}

function QuestionView({
  question,
  phase,
  picked,
  input,
  onInputChange,
  onChoice,
  onSubmit,
  onSkip,
  onNext,
  lastCorrect,
  inputRef,
}: {
  question: Question
  phase: Phase
  picked: string | null
  input: string
  onInputChange: (s: string) => void
  onChoice: (id: string) => void
  onSubmit: () => void
  onSkip: () => void
  onNext: () => void
  lastCorrect: boolean | null
  inputRef: React.RefObject<HTMLInputElement | null>
}) {
  const { mode, part } = question
  const promptText =
    mode === 'name-to-ui'
      ? 'このUIパーツはどれ？'
      : mode === 'ui-to-name'
        ? 'これは何というパーツ？'
        : 'このUIパーツの名前は？'

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <span className="rounded-full bg-indigo-500/15 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-indigo-300 ring-1 ring-indigo-500/30">
          {MODE_LABEL[mode]}
        </span>
        <button
          onClick={onSkip}
          disabled={phase === 'reveal'}
          className="text-xs text-slate-400 hover:text-slate-200 disabled:opacity-30"
        >
          スキップ (Esc)
        </button>
      </div>

      {/* Prompt */}
      <div className="rounded-2xl bg-slate-900 p-5 ring-1 ring-slate-800">
        <div className="mb-3 text-xs text-slate-400">{promptText}</div>

        {mode === 'name-to-ui' ? (
          <div className="text-2xl font-semibold tracking-tight text-white">
            {part.name}
            <span className="ml-2 text-base font-normal text-slate-400">{part.kana}</span>
          </div>
        ) : (
          <div className="aspect-[16/10] w-full">
            <part.Preview />
          </div>
        )}
      </div>

      {/* Answer area */}
      {mode === 'input-name' ? (
        <InputAnswer
          input={input}
          onChange={onInputChange}
          onSubmit={onSubmit}
          phase={phase}
          inputRef={inputRef}
          correct={lastCorrect ?? false}
        />
      ) : (
        <ChoiceGrid
          question={question}
          phase={phase}
          picked={picked}
          onChoice={onChoice}
        />
      )}

      {/* Reveal */}
      {phase === 'reveal' && (
        <Reveal part={part} correct={lastCorrect ?? false} onNext={onNext} />
      )}
    </div>
  )
}

function ChoiceGrid({
  question,
  phase,
  picked,
  onChoice,
}: {
  question: Extract<Question, { mode: 'name-to-ui' | 'ui-to-name' }>
  phase: Phase
  picked: string | null
  onChoice: (id: string) => void
}) {
  const isUi = question.mode === 'name-to-ui'
  return (
    <div className={isUi ? 'grid grid-cols-2 gap-3' : 'grid grid-cols-2 gap-3 sm:grid-cols-2'}>
      {question.choices.map((c, i) => {
        const isCorrect = c.id === question.part.id
        const isPicked = c.id === picked
        const reveal = phase === 'reveal'
        const ringClass = !reveal
          ? 'ring-slate-800 hover:ring-indigo-400'
          : isCorrect
            ? 'ring-emerald-500'
            : isPicked
              ? 'ring-rose-500'
              : 'ring-slate-800 opacity-50'
        return (
          <button
            key={c.id}
            disabled={reveal}
            onClick={() => onChoice(c.id)}
            className={
              'group relative flex flex-col gap-2 rounded-xl bg-slate-900 p-3 text-left ring-1 transition disabled:cursor-default ' +
              ringClass
            }
          >
            <div className="flex items-center gap-2">
              <span className="grid size-6 place-items-center rounded-md bg-slate-800 text-xs font-mono text-slate-300">
                {i + 1}
              </span>
              {!isUi && (
                <span className="text-sm font-medium text-white">
                  {c.name}
                  <span className="ml-2 text-[11px] text-slate-400">{c.kana}</span>
                </span>
              )}
              {reveal && isCorrect && (
                <span className="ml-auto text-xs text-emerald-400">✓ 正解</span>
              )}
              {reveal && !isCorrect && isPicked && (
                <span className="ml-auto text-xs text-rose-400">× 不正解</span>
              )}
            </div>
            {isUi && (
              <div className="aspect-[16/10] w-full overflow-hidden rounded-md">
                <c.Preview />
              </div>
            )}
          </button>
        )
      })}
    </div>
  )
}

function InputAnswer({
  input,
  onChange,
  onSubmit,
  phase,
  inputRef,
  correct,
}: {
  input: string
  onChange: (s: string) => void
  onSubmit: () => void
  phase: Phase
  inputRef: React.RefObject<HTMLInputElement | null>
  correct: boolean
}) {
  return (
    <div className="rounded-xl bg-slate-900 p-3 ring-1 ring-slate-800">
      <div className="flex items-center gap-2">
        <input
          ref={inputRef}
          value={input}
          onChange={(e) => onChange(e.target.value)}
          disabled={phase === 'reveal'}
          placeholder="例: Toast / トースト / toast"
          className={
            'flex-1 rounded-md bg-slate-950 px-3 py-2 text-base text-white outline-none ring-1 ' +
            (phase === 'reveal'
              ? correct
                ? 'ring-emerald-500'
                : 'ring-rose-500'
              : 'ring-slate-700 focus:ring-indigo-400')
          }
        />
        <button
          onClick={onSubmit}
          disabled={phase === 'reveal' || !input.trim()}
          className="rounded-md bg-indigo-500 px-3 py-2 text-sm font-medium text-white disabled:opacity-40"
        >
          回答 (Enter)
        </button>
      </div>
      <div className="mt-2 text-[11px] text-slate-500">
        英語名・カナ・別名（例: Snackbar / スナックバー）どれでもOK。大文字小文字や空白は無視。
      </div>
    </div>
  )
}

function Reveal({
  part,
  correct,
  onNext,
}: {
  part: import('./parts/types').Part
  correct: boolean
  onNext: () => void
}) {
  return (
    <div
      className={
        'rounded-xl p-4 ring-1 ' +
        (correct
          ? 'bg-emerald-500/10 ring-emerald-500/30'
          : 'bg-rose-500/10 ring-rose-500/30')
      }
    >
      <div className="flex items-start gap-3">
        <div
          className={
            'grid size-9 shrink-0 place-items-center rounded-full text-white ' +
            (correct ? 'bg-emerald-500' : 'bg-rose-500')
          }
        >
          {correct ? '✓' : '×'}
        </div>
        <div className="flex-1">
          <div className="text-sm font-semibold text-white">
            {part.name}
            <span className="ml-2 text-xs font-normal text-slate-400">{part.kana}</span>
            <span className="ml-2 rounded-full bg-slate-800 px-2 py-0.5 text-[10px] text-slate-300">
              {CATEGORY_LABEL[part.category]}
            </span>
          </div>
          <p className="mt-1 text-sm leading-relaxed text-slate-200">{part.description}</p>
          {part.aliases.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1 text-[10px]">
              {part.aliases.map((a) => (
                <span
                  key={a}
                  className="rounded-full bg-slate-800 px-2 py-0.5 text-slate-300"
                >
                  {a}
                </span>
              ))}
            </div>
          )}
        </div>
        <button
          onClick={onNext}
          className="self-start rounded-md bg-white px-3 py-1.5 text-xs font-semibold text-slate-900 hover:bg-slate-100"
        >
          次へ ↵
        </button>
      </div>
    </div>
  )
}

function SetupScreen({
  kind,
  settings,
  maxLength,
  onChange,
  onStart,
  onBack,
}: {
  kind: SetupKind
  settings: Settings
  maxLength: number
  onChange: (s: Settings) => void
  onStart: () => void
  onBack: () => void
}) {
  const allModes: Mode[] = ['name-to-ui', 'ui-to-name', 'input-name']
  const allCategories = useMemo(
    () => Array.from(new Set(PARTS.map((p) => p.category))),
    [],
  )

  // Slider values: 10, 15, 20, ..., up to the max that fits in the pool.
  const sliderMax = Math.max(
    CHALLENGE_MIN,
    Math.floor(maxLength / CHALLENGE_STEP) * CHALLENGE_STEP,
  )
  const currentLength =
    typeof settings.sessionLength === 'number'
      ? Math.min(Math.max(settings.sessionLength, CHALLENGE_MIN), sliderMax)
      : CHALLENGE_MIN

  const toggleMode = (m: Mode) => {
    const next = settings.modes.includes(m)
      ? settings.modes.filter((x) => x !== m)
      : [...settings.modes, m]
    if (next.length === 0) return
    onChange({ ...settings, modes: next })
  }

  const toggleCategory = (c: PartCategory) => {
    const current =
      settings.categories === 'all' ? allCategories : settings.categories
    const next = current.includes(c)
      ? current.filter((x) => x !== c)
      : [...current, c]
    if (next.length === 0) return
    onChange({
      ...settings,
      categories: next.length === allCategories.length ? 'all' : next,
    })
  }

  const isCategoryActive = (c: PartCategory) =>
    settings.categories === 'all' || settings.categories.includes(c)

  const title = kind === 'challenge' ? 'チャレンジ' : 'エンドレスモード'
  const subtitle =
    kind === 'challenge'
      ? '問題数とカテゴリを選んでスタート。'
      : '気が済むまで連続出題。出題範囲だけ選んでね。'

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center gap-2">
        <button
          onClick={onBack}
          className="rounded-md bg-slate-800 px-2.5 py-1.5 text-xs text-slate-200 ring-1 ring-slate-700 hover:bg-slate-700"
        >
          ← 戻る
        </button>
        <div>
          <h2 className="text-lg font-semibold text-white">{title}</h2>
          <p className="text-xs text-slate-400">{subtitle}</p>
        </div>
      </div>

      {kind === 'challenge' && (
        <section className="rounded-2xl bg-slate-900 p-4 ring-1 ring-slate-800">
          <div className="mb-2 flex items-baseline justify-between">
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              問題数
            </div>
            <div className="text-2xl font-bold tabular-nums text-white">
              {currentLength}
              <span className="ml-1 text-sm text-slate-400">問</span>
            </div>
          </div>
          <input
            type="range"
            min={CHALLENGE_MIN}
            max={sliderMax}
            step={CHALLENGE_STEP}
            value={currentLength}
            onChange={(e) => onChange({ ...settings, sessionLength: Number(e.target.value) })}
            className="w-full accent-indigo-500"
          />
          <div className="mt-1 flex justify-between text-[11px] text-slate-500">
            <span>{CHALLENGE_MIN}</span>
            <span>{sliderMax}</span>
          </div>
        </section>
      )}

      <section>
        <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
          出題モード
        </div>
        <div className="grid grid-cols-1 gap-2">
          {allModes.map((m) => (
            <label
              key={m}
              className="flex cursor-pointer items-center gap-2 rounded-md bg-slate-900 px-3 py-2 text-sm ring-1 ring-slate-800"
            >
              <input
                type="checkbox"
                checked={settings.modes.includes(m)}
                onChange={() => toggleMode(m)}
                className="size-4 accent-indigo-500"
              />
              {MODE_LABEL[m]}
            </label>
          ))}
        </div>
      </section>

      <section>
        <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
          出題カテゴリ
        </div>
        <div className="flex flex-wrap gap-1.5">
          {allCategories.map((c) => (
            <button
              key={c}
              onClick={() => toggleCategory(c)}
              className={
                'rounded-full px-3 py-1 text-xs ring-1 transition ' +
                (isCategoryActive(c)
                  ? 'bg-indigo-500/20 text-indigo-200 ring-indigo-500/40'
                  : 'bg-slate-900 text-slate-400 ring-slate-800')
              }
            >
              {CATEGORY_LABEL[c]}
            </button>
          ))}
        </div>
      </section>

      <button
        onClick={onStart}
        className="mt-2 rounded-xl bg-white px-4 py-3 text-sm font-semibold text-slate-900 hover:bg-slate-100"
      >
        スタート
      </button>
    </div>
  )
}

function Footer() {
  return (
    <footer className="mt-8 flex items-center justify-between gap-2 text-[11px] text-slate-500">
      <div>
        <kbd className="rounded bg-slate-800 px-1.5 py-0.5 text-slate-300">1〜4</kbd>{' '}
        選択 ・ <kbd className="rounded bg-slate-800 px-1.5 py-0.5 text-slate-300">Enter</kbd>{' '}
        次へ ・ <kbd className="rounded bg-slate-800 px-1.5 py-0.5 text-slate-300">Esc</kbd>{' '}
        スキップ
      </div>
      <div>{PARTS.length}パーツ収録</div>
    </footer>
  )
}

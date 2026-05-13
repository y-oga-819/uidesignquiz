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

type Phase = 'answering' | 'reveal' | 'result'
type AppMode = 'normal' | 'daily'

const ALL_MODES: Mode[] = ['name-to-ui', 'ui-to-name', 'input-name']

const DAILY_LENGTH = 20

const MODE_LABEL: Record<Mode, string> = {
  'name-to-ui': '名前→UI',
  'ui-to-name': 'UI→名前',
  'input-name': '名前を入力',
}

const SESSION_LENGTH_OPTIONS: { value: SessionLength; label: string }[] = [
  { value: 10, label: '10問' },
  { value: 20, label: '20問' },
  { value: 'infinite', label: '無限' },
]

type Bests = Partial<Record<10 | 20, number>>

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
      length: 10 | 20
      isBest: boolean
      prevBest?: number
    })
  | (SessionResultBase & {
      kind: 'daily'
      date: string
      alreadyDone: boolean
      newStreak: number
      prevStreak: number
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

const loadPersisted = (): Persisted => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) throw new Error('empty')
    const parsed = JSON.parse(raw) as Partial<Persisted>
    if (!parsed.settings?.modes?.length) throw new Error('invalid')
    return {
      settings: { ...DEFAULT_SETTINGS, ...parsed.settings },
      stats: parsed.stats ?? initialStats,
      bests: parsed.bests ?? {},
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
  const [showSettings, setShowSettings] = useState(false)
  const [session, setSession] = useState<Session>(() => initialSession(settings.sessionLength))
  const [lastResult, setLastResult] = useState<SessionResult | null>(null)
  const [appMode, setAppMode] = useState<AppMode>('normal')
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

  // Load first question on mount and whenever settings change (normal mode only).
  useEffect(() => {
    if (appMode !== 'normal') return
    recentIdsRef.current = []
    next()
  }, [next, appMode])

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
    showQuestion(questions[0])
  }, [today, daily.lastCompleted, showQuestion])

  const exitDaily = useCallback(() => {
    setAppMode('normal')
    setDailyQuestions([])
    setDailyAlreadyDone(false)
    setSession(initialSession(settings.sessionLength))
    setLastResult(null)
    // recent-ids reset and first question are handled by the load-question effect
    // when it observes appMode flipping back to 'normal'.
  }, [settings.sessionLength])

  useEffect(() => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ settings, stats, bests, daily, partStats }),
    )
  }, [settings, stats, bests, daily, partStats])

  // focus input when input mode comes up
  useEffect(() => {
    if (question?.mode === 'input-name' && phase === 'answering') {
      inputRef.current?.focus()
    }
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
      const prevBest = bests[total]
      const isBest = prevBest === undefined || accuracy > prevBest
      if (isBest) {
        setState((s) => ({ ...s, bests: { ...s.bests, [total]: accuracy } }))
      }
      setLastResult({
        kind: 'session',
        length: total,
        correct,
        total,
        accuracy,
        durationMs,
        isBest,
        prevBest,
      })
      setPhase('result')
      return
    }
    next()
  }, [appMode, dailyQuestions, dailyAlreadyDone, session, bests, daily, today, next, showQuestion])

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
      if (showSettings) return
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
  }, [phase, question, goNext, restartSession, handleChoice, submitInput, skip, showSettings])

  const accuracy = stats.total === 0 ? 0 : Math.round((stats.correct / stats.total) * 100)

  const dailyStreakLive = isDailyStreakLive(today, daily)
  const dailyDoneToday = daily.lastCompleted?.date === today
  const reviewCount = reviewIds.size

  const toggleReviewMode = useCallback(() => {
    setState((s) => ({ ...s, settings: { ...s.settings, reviewMode: !s.settings.reviewMode } }))
  }, [])

  return (
    <div className="min-h-full bg-slate-950 text-slate-100">
      <div className="mx-auto flex min-h-screen max-w-3xl flex-col px-4 py-6">
        <Header
          stats={stats}
          accuracy={accuracy}
          appMode={appMode}
          dailyStreak={daily.streak}
          dailyStreakLive={dailyStreakLive}
          dailyDoneToday={dailyDoneToday}
          reviewMode={settings.reviewMode}
          reviewCount={reviewCount}
          onToggleReview={toggleReviewMode}
          onStartDaily={startDaily}
          onExitDaily={exitDaily}
          onSettings={() => setShowSettings(true)}
          onReset={() =>
            setState((s) => ({ ...s, stats: initialStats }))
          }
        />

        <main className="mt-6 flex flex-1 flex-col gap-5">
          {appMode === 'daily' && phase !== 'result' && (
            <DailyBanner alreadyDone={dailyAlreadyDone} date={today} />
          )}

          {phase !== 'result' && session.length !== 'infinite' && (
            <SessionProgress session={session} />
          )}

          {phase === 'result' && lastResult ? (
            <ResultView
              result={lastResult}
              onRestart={restartSession}
              onChangeSettings={() => setShowSettings(true)}
              onExitDaily={exitDaily}
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
            <EmptyReview
              onExit={() =>
                setState((s) => ({ ...s, settings: { ...s.settings, reviewMode: false } }))
              }
            />
          ) : null}
        </main>

        <Footer />
      </div>

      {showSettings && (
        <SettingsModal
          settings={settings}
          onClose={() => setShowSettings(false)}
          onChange={(s) => setState((prev) => ({ ...prev, settings: s }))}
        />
      )}
    </div>
  )
}

function EmptyReview({ onExit }: { onExit: () => void }) {
  return (
    <div className="rounded-2xl bg-emerald-500/10 p-6 text-center ring-1 ring-emerald-500/30">
      <div className="text-3xl">🎉</div>
      <div className="mt-2 text-lg font-semibold text-white">弱点なし！</div>
      <p className="mt-1 text-sm text-emerald-100/80">
        復習対象の問題はもうありません。通常モードに戻りましょう。
      </p>
      <button
        onClick={onExit}
        className="mt-4 rounded-md bg-white px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-100"
      >
        通常モードに戻る
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
  onChangeSettings,
  onExitDaily,
}: {
  result: SessionResult
  onRestart: () => void
  onChangeSettings: () => void
  onExitDaily: () => void
}) {
  const tone =
    result.accuracy >= 90
      ? { ring: 'ring-emerald-500/40', bg: 'bg-emerald-500/10', text: 'text-emerald-300', headline: 'お見事！' }
      : result.accuracy >= 70
        ? { ring: 'ring-indigo-500/40', bg: 'bg-indigo-500/10', text: 'text-indigo-300', headline: 'いい調子！' }
        : { ring: 'ring-amber-500/40', bg: 'bg-amber-500/10', text: 'text-amber-300', headline: 'もう一回いこう' }

  const isDaily = result.kind === 'daily'
  const eyebrow = isDaily ? `今日のクイズ (${result.date}) 完了` : `${result.length}問チャレンジ 完了`

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
          {result.kind === 'session' && result.isBest && (
            <span className="ml-auto rounded-full bg-amber-400/20 px-3 py-1 text-xs font-semibold text-amber-300 ring-1 ring-amber-400/40">
              ★ ベスト更新
            </span>
          )}
          {result.kind === 'daily' && !result.alreadyDone && result.newStreak > result.prevStreak && (
            <span className="ml-auto rounded-full bg-amber-400/20 px-3 py-1 text-xs font-semibold text-amber-300 ring-1 ring-amber-400/40">
              🔥 連続+1
            </span>
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
          ) : (
            <ResultStat label="連続日数" value={`${result.newStreak}日`} />
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
        {result.kind === 'daily' ? (
          <button
            onClick={onExitDaily}
            className="flex-1 rounded-xl bg-slate-800 px-4 py-3 text-sm font-semibold text-slate-200 ring-1 ring-slate-700 hover:bg-slate-700"
          >
            通常モードへ戻る
          </button>
        ) : (
          <button
            onClick={onChangeSettings}
            className="flex-1 rounded-xl bg-slate-800 px-4 py-3 text-sm font-semibold text-slate-200 ring-1 ring-slate-700 hover:bg-slate-700"
          >
            設定を変える
          </button>
        )}
      </div>
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
  onSettings,
  onReset,
  appMode,
  dailyStreak,
  dailyStreakLive,
  dailyDoneToday,
  reviewMode,
  reviewCount,
  onToggleReview,
  onStartDaily,
  onExitDaily,
}: {
  stats: Stats
  accuracy: number
  onSettings: () => void
  onReset: () => void
  appMode: AppMode
  dailyStreak: number
  dailyStreakLive: boolean
  dailyDoneToday: boolean
  reviewMode: boolean
  reviewCount: number
  onToggleReview: () => void
  onStartDaily: () => void
  onExitDaily: () => void
}) {
  const isDaily = appMode === 'daily'
  const dailyLabel = dailyDoneToday ? '🔥 今日クリア済' : '🔥 今日のクイズ'
  const streakBadge =
    dailyStreakLive && dailyStreak > 0 ? `${dailyStreak}日連続` : null
  const showReviewToggle = !isDaily && (reviewMode || reviewCount > 0)

  return (
    <header className="flex items-center justify-between gap-3">
      <div>
        <h1 className="text-lg font-semibold tracking-tight text-white">
          UI Design Quiz
        </h1>
        <p className="text-xs text-slate-400">UIパーツの名前を暗記カード式で覚える</p>
      </div>
      <div className="flex items-center gap-2">
        <Stat label="正答率" value={`${accuracy}%`} />
        <Stat label="連続正解" value={stats.streak.toString()} highlight={stats.streak >= 5} />
        <Stat label="出題数" value={stats.total.toString()} />
        {isDaily ? (
          <button
            onClick={onExitDaily}
            className="rounded-md bg-slate-800 px-2.5 py-1.5 text-xs text-slate-200 ring-1 ring-slate-700 hover:bg-slate-700"
            title="通常モードに戻る"
          >
            ← 通常モード
          </button>
        ) : (
          <>
            {showReviewToggle && (
              <button
                onClick={onToggleReview}
                className={
                  'rounded-md px-2.5 py-1.5 text-xs ring-1 ' +
                  (reviewMode
                    ? 'bg-rose-500/20 text-rose-200 ring-rose-500/40 hover:bg-rose-500/30'
                    : 'bg-slate-900 text-slate-300 ring-slate-700 hover:bg-slate-800')
                }
                title={reviewMode ? '通常モードに戻る' : '間違えた問題だけを出題'}
              >
                {reviewMode ? '✓ 復習中' : '🔄 復習'}
                <span className="ml-1 rounded-full bg-slate-800 px-1.5 py-0.5 text-[10px] font-semibold text-slate-200">
                  {reviewCount}
                </span>
              </button>
            )}
            <button
              onClick={onStartDaily}
              className={
                'rounded-md px-2.5 py-1.5 text-xs ring-1 ' +
                (dailyDoneToday
                  ? 'bg-slate-900 text-slate-300 ring-slate-700 hover:bg-slate-800'
                  : 'bg-amber-500/15 text-amber-200 ring-amber-500/40 hover:bg-amber-500/25')
              }
              title="今日のクイズを始める"
            >
              {dailyLabel}
              {streakBadge && (
                <span className="ml-1 rounded-full bg-amber-500/30 px-1.5 py-0.5 text-[10px] font-semibold text-amber-100">
                  {streakBadge}
                </span>
              )}
            </button>
          </>
        )}
        <button
          onClick={onSettings}
          disabled={isDaily}
          className="rounded-md bg-slate-800 px-2.5 py-1.5 text-xs text-slate-200 ring-1 ring-slate-700 hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
          title={isDaily ? 'デイリー中は設定変更不可' : '設定'}
        >
          ⚙ 設定
        </button>
        <button
          onClick={onReset}
          className="rounded-md px-2 py-1.5 text-xs text-slate-400 hover:text-slate-200"
          title="統計をリセット"
        >
          ↺
        </button>
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
            'flex-1 rounded-md bg-slate-950 px-3 py-2 text-sm text-white outline-none ring-1 ' +
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

function SettingsModal({
  settings,
  onClose,
  onChange,
}: {
  settings: Settings
  onClose: () => void
  onChange: (s: Settings) => void
}) {
  const allModes: Mode[] = ['name-to-ui', 'ui-to-name', 'input-name']
  const allCategories = useMemo(
    () => Array.from(new Set(PARTS.map((p) => p.category))),
    [],
  )

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

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-slate-950/70 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl bg-slate-900 p-5 ring-1 ring-slate-800"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold text-white">設定</h2>
          <button onClick={onClose} className="text-sm text-slate-400 hover:text-white">
            閉じる
          </button>
        </div>

        <section className="mb-4">
          <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
            セッション長
          </div>
          <div className="grid grid-cols-3 gap-2">
            {SESSION_LENGTH_OPTIONS.map((opt) => {
              const active = settings.sessionLength === opt.value
              return (
                <button
                  key={String(opt.value)}
                  onClick={() => onChange({ ...settings, sessionLength: opt.value })}
                  className={
                    'rounded-md px-3 py-2 text-sm ring-1 transition ' +
                    (active
                      ? 'bg-indigo-500/20 text-indigo-200 ring-indigo-500/40'
                      : 'bg-slate-950 text-slate-300 ring-slate-800 hover:text-white')
                  }
                >
                  {opt.label}
                </button>
              )
            })}
          </div>
          <p className="mt-2 text-[11px] text-slate-500">
            10問・20問はリザルト画面で正答率とベストを表示します。
          </p>
        </section>

        <section className="mb-4">
          <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
            出題モード
          </div>
          <div className="grid grid-cols-1 gap-2">
            {allModes.map((m) => (
              <label
                key={m}
                className="flex cursor-pointer items-center gap-2 rounded-md bg-slate-950 px-3 py-2 text-sm ring-1 ring-slate-800"
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
                    : 'bg-slate-950 text-slate-400 ring-slate-800')
                }
              >
                {CATEGORY_LABEL[c]}
              </button>
            ))}
          </div>
        </section>
      </div>
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

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { PARTS, CATEGORY_LABEL } from './parts/catalog'
import type { PartCategory } from './parts/types'
import {
  buildQuestion,
  initialStats,
  isCorrectInput,
  updateStats,
  type Mode,
  type Question,
  type Settings,
  type Stats,
} from './quiz/engine'

type Phase = 'answering' | 'reveal'

const MODE_LABEL: Record<Mode, string> = {
  'name-to-ui': '名前→UI',
  'ui-to-name': 'UI→名前',
  'input-name': '名前を入力',
}

const STORAGE_KEY = 'uidq.v1'

type Persisted = {
  settings: Settings
  stats: Stats
}

const loadPersisted = (): Persisted => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) throw new Error('empty')
    const parsed = JSON.parse(raw) as Persisted
    if (!parsed.settings?.modes?.length) throw new Error('invalid')
    return parsed
  } catch {
    return {
      settings: { modes: ['name-to-ui', 'ui-to-name', 'input-name'], categories: 'all' },
      stats: initialStats,
    }
  }
}

export default function App() {
  const [{ settings, stats }, setState] = useState<Persisted>(loadPersisted)
  const [question, setQuestion] = useState<Question | null>(null)
  const [phase, setPhase] = useState<Phase>('answering')
  const [picked, setPicked] = useState<string | null>(null)
  const [input, setInput] = useState('')
  const [lastCorrect, setLastCorrect] = useState<boolean | null>(null)
  const [showSettings, setShowSettings] = useState(false)
  const recentIdsRef = useRef<string[]>([])
  const inputRef = useRef<HTMLInputElement>(null)

  const next = useCallback(() => {
    const q = buildQuestion(PARTS, settings, recentIdsRef.current)
    recentIdsRef.current = [q.part.id, ...recentIdsRef.current].slice(0, 8)
    setQuestion(q)
    setPhase('answering')
    setPicked(null)
    setInput('')
    setLastCorrect(null)
  }, [settings])

  useEffect(() => {
    next()
  }, [next])

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ settings, stats }))
  }, [settings, stats])

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
      setState((s) => ({ ...s, stats: updateStats(s.stats, correct) }))
    },
    [],
  )

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

      if (phase === 'reveal') {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          next()
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
  }, [phase, question, next, handleChoice, submitInput, skip, showSettings])

  const accuracy = stats.total === 0 ? 0 : Math.round((stats.correct / stats.total) * 100)

  return (
    <div className="min-h-full bg-slate-950 text-slate-100">
      <div className="mx-auto flex min-h-screen max-w-3xl flex-col px-4 py-6">
        <Header
          stats={stats}
          accuracy={accuracy}
          onSettings={() => setShowSettings(true)}
          onReset={() =>
            setState((s) => ({ ...s, stats: initialStats }))
          }
        />

        <main className="mt-6 flex-1">
          {question && (
            <QuestionView
              question={question}
              phase={phase}
              picked={picked}
              input={input}
              onInputChange={setInput}
              onChoice={handleChoice}
              onSubmit={submitInput}
              onSkip={skip}
              onNext={next}
              lastCorrect={lastCorrect}
              inputRef={inputRef}
            />
          )}
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

function Header({
  stats,
  accuracy,
  onSettings,
  onReset,
}: {
  stats: Stats
  accuracy: number
  onSettings: () => void
  onReset: () => void
}) {
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
        <button
          onClick={onSettings}
          className="rounded-md bg-slate-800 px-2.5 py-1.5 text-xs text-slate-200 ring-1 ring-slate-700 hover:bg-slate-700"
          title="設定"
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

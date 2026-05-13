import { useMemo } from 'react'
import {
  decodePayload,
  formatDateLabel,
  formatDurationSec,
  clampDisplay,
  type SharePayload,
} from './payload'

const buildStartHref = (p: SharePayload): string => {
  if (p.m === 's') return `/?start=${p.t === 20 ? '20' : '10'}`
  if (p.m === 'd') return '/?start=daily'
  return '/?start=infinite'
}

const toneFor = (accuracy: number) =>
  accuracy >= 90
    ? {
        ring: 'ring-emerald-500/40',
        bg: 'bg-emerald-500/10',
        text: 'text-emerald-300',
        headline: 'お見事！',
      }
    : accuracy >= 70
      ? {
          ring: 'ring-indigo-500/40',
          bg: 'bg-indigo-500/10',
          text: 'text-indigo-300',
          headline: 'いい調子！',
        }
      : {
          ring: 'ring-amber-500/40',
          bg: 'bg-amber-500/10',
          text: 'text-amber-300',
          headline: 'もう一回いこう',
        }

const renderEyebrow = (p: SharePayload): string => {
  if (p.m === 's') return `${p.t}問チャレンジ`
  if (p.m === 'd') return `今日のクイズ ${formatDateLabel(p.dt)}`
  return 'エンドレスモード'
}

const renderBadges = (p: SharePayload): string[] => {
  if (p.m !== 's' || !p.b) return []
  const out: string[] = []
  if (p.b.includes('a')) out.push('★ ベスト更新')
  if (p.b.includes('b')) out.push('⚡ 最速更新')
  return out
}

export default function SharedScoreView() {
  const payload = useMemo<SharePayload | null>(() => {
    if (typeof window === 'undefined') return null
    const params = new URLSearchParams(window.location.search)
    const d = params.get('d')
    return d ? decodePayload(d) : null
  }, [])

  if (!payload) {
    return (
      <div className="min-h-full bg-slate-950 text-slate-100">
        <div className="mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center px-4 py-6">
          <div className="rounded-2xl bg-slate-900 p-6 text-center ring-1 ring-slate-800">
            <div className="text-lg font-semibold text-white">スコアを読み込めませんでした</div>
            <p className="mt-1 text-sm text-slate-400">
              URLが壊れているかもしれません。
            </p>
            <a
              href="/"
              className="mt-4 inline-block rounded-xl bg-white px-4 py-3 text-sm font-semibold text-slate-900 hover:bg-slate-100"
            >
              UI Design Quiz をはじめる
            </a>
          </div>
        </div>
      </div>
    )
  }

  const accuracy = Math.round((payload.s / payload.t) * 100)
  const tone = toneFor(accuracy)
  const eyebrow = renderEyebrow(payload)
  const badges = renderBadges(payload)
  const isEndless = payload.m === 'e'

  const correctDisplay = clampDisplay(payload.s)
  const totalDisplay = clampDisplay(payload.t)

  return (
    <div className="min-h-full bg-slate-950 text-slate-100">
      <div className="mx-auto flex min-h-screen max-w-3xl flex-col px-4 py-6">
        <header className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-lg font-semibold tracking-tight text-white">
              UI Design Quiz
            </h1>
            <p className="text-xs text-slate-400">UIパーツの名前を暗記カード式で覚える</p>
          </div>
        </header>

        <main className="mt-6 flex flex-1 flex-col gap-5">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            シェアされたスコア
          </div>

          <div className={`rounded-2xl p-6 ring-1 ${tone.bg} ${tone.ring}`}>
            <div className={`text-xs font-semibold uppercase tracking-wider ${tone.text}`}>
              {eyebrow}
            </div>
            <div className="mt-1 text-2xl font-semibold text-white">{tone.headline}</div>

            <div className="mt-4 flex items-end gap-3">
              {isEndless ? (
                <>
                  <div className="text-5xl font-bold tabular-nums text-white">
                    {correctDisplay.value}
                    {correctDisplay.suffix}
                    <span className="ml-1 text-2xl text-slate-400">問</span>
                  </div>
                  <div className="pb-1 text-sm text-slate-300">正解</div>
                </>
              ) : (
                <>
                  <div className="text-5xl font-bold tabular-nums text-white">
                    {correctDisplay.value}
                    {correctDisplay.suffix}
                    <span className="text-2xl text-slate-400">
                      /{totalDisplay.value}
                      {totalDisplay.suffix}
                    </span>
                  </div>
                  <div className="pb-1 text-sm text-slate-300">正解</div>
                </>
              )}
              {badges.length > 0 && (
                <div className="ml-auto flex flex-wrap items-center justify-end gap-1.5">
                  {badges.map((label) => (
                    <span
                      key={label}
                      className="rounded-full bg-amber-400/20 px-3 py-1 text-xs font-semibold text-amber-300 ring-1 ring-amber-400/40"
                    >
                      {label}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="mt-4 flex flex-wrap gap-3 text-xs text-slate-300">
              <span className="rounded-md bg-slate-950/40 px-3 py-2 ring-1 ring-slate-800">
                <span className="mr-1 text-[10px] uppercase tracking-wide text-slate-400">
                  所要時間
                </span>
                <span className="text-sm font-semibold tabular-nums text-white">
                  ⏱ {formatDurationSec(payload.d)}
                </span>
              </span>
              {isEndless && (
                <span className="rounded-md bg-slate-950/40 px-3 py-2 ring-1 ring-slate-800">
                  <span className="mr-1 text-[10px] uppercase tracking-wide text-slate-400">
                    挑戦数
                  </span>
                  <span className="text-sm font-semibold tabular-nums text-white">
                    {totalDisplay.value}
                    {totalDisplay.suffix}問
                  </span>
                </span>
              )}
            </div>
          </div>

          <a
            href={buildStartHref(payload)}
            className="block rounded-xl bg-white px-4 py-4 text-center text-sm font-semibold text-slate-900 hover:bg-slate-100"
          >
            挑戦してみる →
          </a>

          <section className="rounded-2xl bg-slate-900/60 p-5 text-sm text-slate-300 ring-1 ring-slate-800">
            <h2 className="text-base font-semibold text-white">UI Design Quiz とは</h2>
            <p className="mt-2 text-xs leading-relaxed text-slate-400">
              UIパーツの名前を、英語名 ↔ カナ表記 ↔ 実際のUI で結びつけて
              暗記カード形式で覚えるクイズアプリです。
              4択モードと自由入力モードがあり、デザイナー・エンジニアの語彙整理に。
            </p>
          </section>
        </main>

        <footer className="mt-6 text-center text-[10px] text-slate-500">
          UI Design Quiz
        </footer>
      </div>
    </div>
  )
}

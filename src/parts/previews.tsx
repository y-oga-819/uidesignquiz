import type { ReactNode } from 'react'

const Frame = ({ children, className = '' }: { children: ReactNode; className?: string }) => (
  <div
    className={
      'relative h-full w-full overflow-hidden rounded-xl bg-slate-50 ring-1 ring-slate-200 ' +
      className
    }
  >
    {children}
  </div>
)

const Browser = ({ children }: { children: ReactNode }) => (
  <Frame>
    <div className="flex items-center gap-1.5 border-b border-slate-200 bg-white px-3 py-2">
      <span className="size-2 rounded-full bg-rose-400" />
      <span className="size-2 rounded-full bg-amber-400" />
      <span className="size-2 rounded-full bg-emerald-400" />
      <span className="ml-3 h-3 flex-1 rounded bg-slate-100" />
    </div>
    <div className="relative h-[calc(100%-2.25rem)] bg-white">{children}</div>
  </Frame>
)

const Phone = ({ children }: { children: ReactNode }) => (
  <Frame>
    <div className="mx-auto flex h-full w-[170px] flex-col rounded-[20px] bg-white ring-1 ring-slate-200">
      <div className="flex items-center justify-between px-3 pt-2 text-[8px] text-slate-500">
        <span>9:41</span>
        <span>●●●</span>
      </div>
      <div className="relative flex-1 overflow-hidden rounded-b-[20px]">{children}</div>
    </div>
  </Frame>
)

/* ---------- Feedback ---------- */
export const ToastPreview = () => (
  <Frame>
    <div className="absolute inset-0 grid place-items-center bg-white">
      <div className="text-xs text-slate-400">画面右上</div>
    </div>
    <div className="absolute right-3 top-3 flex items-center gap-2 rounded-lg bg-slate-900 px-3 py-2 text-xs text-white shadow-lg">
      <span className="grid size-4 place-items-center rounded-full bg-emerald-500 text-[10px]">✓</span>
      保存しました
    </div>
  </Frame>
)

export const SnackbarPreview = () => (
  <Frame>
    <div className="absolute inset-0 grid place-items-center bg-white">
      <div className="text-xs text-slate-400">画面下中央</div>
    </div>
    <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 items-center gap-3 rounded-md bg-slate-900 px-3 py-2 text-xs text-white shadow-lg">
      アーカイブしました
      <button className="font-semibold text-emerald-300">元に戻す</button>
    </div>
  </Frame>
)

export const BannerPreview = () => (
  <Frame>
    <div className="flex h-full flex-col bg-white">
      <div className="flex items-center gap-2 border-b border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
        <span>⚠</span>
        <span>メンテナンスを23:00に予定しています</span>
        <span className="ml-auto opacity-50">×</span>
      </div>
      <div className="flex-1 p-3 text-xs text-slate-400">ページ本文…</div>
    </div>
  </Frame>
)

export const AlertPreview = () => (
  <Frame>
    <div className="flex h-full items-center justify-center p-4">
      <div className="flex w-full items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800">
        <span className="grid size-5 place-items-center rounded-full bg-rose-500 text-white">!</span>
        <div>
          <div className="font-semibold">エラーが発生しました</div>
          <div className="text-rose-600/80">入力内容を確認してください</div>
        </div>
      </div>
    </div>
  </Frame>
)

export const ProgressBarPreview = () => (
  <Frame>
    <div className="flex h-full flex-col items-center justify-center gap-2 p-6">
      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
        <div className="h-full w-2/3 rounded-full bg-indigo-500" />
      </div>
      <div className="self-end text-[10px] text-slate-500">66%</div>
    </div>
  </Frame>
)

export const SpinnerPreview = () => (
  <Frame>
    <div className="grid h-full place-items-center">
      <div className="size-8 animate-spin rounded-full border-2 border-slate-200 border-t-indigo-500" />
    </div>
  </Frame>
)

export const SkeletonPreview = () => (
  <Frame>
    <div className="flex h-full flex-col gap-2 p-4">
      <div className="flex items-center gap-3">
        <div className="size-9 animate-pulse rounded-full bg-slate-200" />
        <div className="flex-1 space-y-1.5">
          <div className="h-3 w-1/2 animate-pulse rounded bg-slate-200" />
          <div className="h-2.5 w-1/3 animate-pulse rounded bg-slate-200" />
        </div>
      </div>
      <div className="h-2.5 w-full animate-pulse rounded bg-slate-200" />
      <div className="h-2.5 w-5/6 animate-pulse rounded bg-slate-200" />
      <div className="h-2.5 w-2/3 animate-pulse rounded bg-slate-200" />
    </div>
  </Frame>
)

export const BadgePreview = () => (
  <Frame>
    <div className="grid h-full place-items-center">
      <div className="relative">
        <div className="grid size-12 place-items-center rounded-2xl bg-slate-200 text-slate-700">🔔</div>
        <span className="absolute -right-1 -top-1 grid min-w-5 place-items-center rounded-full bg-rose-500 px-1 text-[10px] font-semibold text-white">
          12
        </span>
      </div>
    </div>
  </Frame>
)

export const TooltipPreview = () => (
  <Frame>
    <div className="grid h-full place-items-center">
      <div className="relative">
        <button className="rounded-md bg-slate-900 px-3 py-1.5 text-xs text-white">ボタン</button>
        <div className="absolute -top-9 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-slate-800 px-2 py-1 text-[10px] text-white shadow">
          詳しい説明
          <div className="absolute -bottom-1 left-1/2 size-2 -translate-x-1/2 rotate-45 bg-slate-800" />
        </div>
      </div>
    </div>
  </Frame>
)

/* ---------- Overlay ---------- */
export const ModalPreview = () => (
  <Frame>
    <div className="absolute inset-0 grid place-items-center bg-slate-900/50 backdrop-blur-[2px]">
      <div className="w-3/4 rounded-xl bg-white p-3 shadow-xl">
        <div className="mb-1 text-xs font-semibold text-slate-900">削除しますか？</div>
        <div className="mb-3 text-[10px] text-slate-500">この操作は取り消せません。</div>
        <div className="flex justify-end gap-1.5">
          <button className="rounded bg-slate-100 px-2 py-1 text-[10px]">キャンセル</button>
          <button className="rounded bg-rose-500 px-2 py-1 text-[10px] text-white">削除</button>
        </div>
      </div>
    </div>
  </Frame>
)

export const PopoverPreview = () => (
  <Frame>
    <div className="grid h-full place-items-center">
      <div className="relative">
        <button className="rounded-md bg-slate-900 px-3 py-1.5 text-xs text-white">＋ 追加</button>
        <div className="absolute left-1/2 top-full mt-2 w-36 -translate-x-1/2 rounded-lg bg-white p-2 text-xs text-slate-700 shadow-lg ring-1 ring-slate-200">
          <div className="rounded px-2 py-1 hover:bg-slate-100">📁 フォルダ</div>
          <div className="rounded px-2 py-1 hover:bg-slate-100">📄 ファイル</div>
          <div className="rounded px-2 py-1 hover:bg-slate-100">🔗 リンク</div>
          <div className="absolute -top-1 left-1/2 size-2 -translate-x-1/2 rotate-45 bg-white ring-1 ring-slate-200" />
        </div>
      </div>
    </div>
  </Frame>
)

export const DropdownPreview = () => (
  <Frame>
    <div className="grid h-full place-items-center">
      <div className="w-32">
        <button className="flex w-full items-center justify-between rounded-md bg-white px-2.5 py-1.5 text-xs ring-1 ring-slate-300">
          オプション ▾
        </button>
        <div className="mt-1 rounded-md bg-white text-xs shadow-lg ring-1 ring-slate-200">
          <div className="bg-indigo-50 px-2.5 py-1.5 text-indigo-700">最新順</div>
          <div className="px-2.5 py-1.5">人気順</div>
          <div className="px-2.5 py-1.5">古い順</div>
        </div>
      </div>
    </div>
  </Frame>
)

export const ContextMenuPreview = () => (
  <Frame>
    <div className="grid h-full place-items-center bg-slate-50">
      <div className="rounded-lg bg-white p-1 text-xs text-slate-700 shadow-lg ring-1 ring-slate-200">
        <div className="rounded px-3 py-1 hover:bg-slate-100">コピー <span className="ml-4 text-slate-400">⌘C</span></div>
        <div className="rounded px-3 py-1 hover:bg-slate-100">貼り付け <span className="ml-4 text-slate-400">⌘V</span></div>
        <div className="my-1 border-t border-slate-100" />
        <div className="rounded px-3 py-1 text-rose-600 hover:bg-rose-50">削除</div>
      </div>
    </div>
  </Frame>
)

export const DrawerPreview = () => (
  <Frame>
    <div className="absolute inset-0 bg-slate-900/40" />
    <div className="absolute inset-y-0 left-0 w-2/3 bg-white p-3 shadow-xl">
      <div className="mb-3 text-xs font-semibold text-slate-900">メニュー</div>
      <div className="space-y-2 text-xs text-slate-700">
        <div>🏠 ホーム</div>
        <div>📊 ダッシュボード</div>
        <div>⚙️ 設定</div>
      </div>
    </div>
  </Frame>
)

export const BottomSheetPreview = () => (
  <Phone>
    <div className="absolute inset-0 bg-slate-900/40" />
    <div className="absolute inset-x-0 bottom-0 rounded-t-2xl bg-white p-3">
      <div className="mx-auto mb-2 h-1 w-8 rounded-full bg-slate-300" />
      <div className="space-y-2 text-[10px] text-slate-700">
        <div className="flex items-center gap-2">📤 共有する</div>
        <div className="flex items-center gap-2">⭐ お気に入り</div>
        <div className="flex items-center gap-2 text-rose-500">🗑 削除</div>
      </div>
    </div>
  </Phone>
)

export const ActionSheetPreview = () => (
  <Phone>
    <div className="absolute inset-0 bg-slate-900/40" />
    <div className="absolute inset-x-2 bottom-2 space-y-1.5">
      <div className="overflow-hidden rounded-xl bg-white/95 text-center text-[11px]">
        <div className="border-b border-slate-200 py-2 text-slate-700">写真を撮る</div>
        <div className="border-b border-slate-200 py-2 text-slate-700">ライブラリから選択</div>
        <div className="py-2 text-rose-500">削除</div>
      </div>
      <div className="rounded-xl bg-white/95 py-2 text-center text-[11px] font-semibold text-blue-500">
        キャンセル
      </div>
    </div>
  </Phone>
)

export const CommandPalettePreview = () => (
  <Frame>
    <div className="absolute inset-0 bg-slate-900/40" />
    <div className="absolute left-1/2 top-1/2 w-4/5 -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-xl bg-white shadow-xl">
      <div className="flex items-center gap-2 border-b border-slate-200 px-3 py-2">
        <span className="text-slate-400">⌕</span>
        <span className="text-xs text-slate-700">コマンドを検索…</span>
        <span className="ml-auto rounded bg-slate-100 px-1.5 py-0.5 text-[9px] text-slate-500">⌘K</span>
      </div>
      <div className="space-y-0.5 p-1 text-[11px]">
        <div className="rounded bg-indigo-50 px-2 py-1 text-indigo-700">→ 新規プロジェクト</div>
        <div className="px-2 py-1 text-slate-700">→ 設定を開く</div>
        <div className="px-2 py-1 text-slate-700">→ ログアウト</div>
      </div>
    </div>
  </Frame>
)

/* ---------- Navigation ---------- */
export const TabsPreview = () => (
  <Frame>
    <div className="flex h-full flex-col bg-white">
      <div className="flex border-b border-slate-200 text-xs">
        <div className="border-b-2 border-indigo-500 px-3 py-2 font-medium text-indigo-600">概要</div>
        <div className="px-3 py-2 text-slate-500">詳細</div>
        <div className="px-3 py-2 text-slate-500">レビュー</div>
      </div>
      <div className="flex-1 p-3 text-xs text-slate-400">概要のコンテンツ…</div>
    </div>
  </Frame>
)

export const SegmentedControlPreview = () => (
  <Frame>
    <div className="grid h-full place-items-center">
      <div className="flex rounded-lg bg-slate-200 p-0.5 text-xs">
        <button className="rounded-md bg-white px-3 py-1 font-medium text-slate-900 shadow-sm">日</button>
        <button className="px-3 py-1 text-slate-600">週</button>
        <button className="px-3 py-1 text-slate-600">月</button>
      </div>
    </div>
  </Frame>
)

export const BreadcrumbPreview = () => (
  <Frame>
    <div className="grid h-full place-items-center px-4">
      <div className="flex items-center gap-1.5 text-xs text-slate-500">
        <span>ホーム</span>
        <span className="text-slate-300">/</span>
        <span>商品</span>
        <span className="text-slate-300">/</span>
        <span className="font-medium text-slate-900">スニーカー</span>
      </div>
    </div>
  </Frame>
)

export const PaginationPreview = () => (
  <Frame>
    <div className="grid h-full place-items-center">
      <div className="flex items-center gap-1 text-xs">
        <button className="size-7 rounded text-slate-500">‹</button>
        <button className="size-7 rounded text-slate-700">1</button>
        <button className="size-7 rounded bg-indigo-500 text-white">2</button>
        <button className="size-7 rounded text-slate-700">3</button>
        <span className="px-1 text-slate-400">…</span>
        <button className="size-7 rounded text-slate-700">9</button>
        <button className="size-7 rounded text-slate-500">›</button>
      </div>
    </div>
  </Frame>
)

export const StepperPreview = () => (
  <Frame>
    <div className="grid h-full place-items-center px-4">
      <div className="flex w-full items-center text-[10px]">
        <div className="flex flex-col items-center">
          <div className="grid size-6 place-items-center rounded-full bg-indigo-500 text-white">✓</div>
          <span className="mt-1 text-slate-700">入力</span>
        </div>
        <div className="mx-1 mb-3 h-0.5 flex-1 bg-indigo-500" />
        <div className="flex flex-col items-center">
          <div className="grid size-6 place-items-center rounded-full bg-indigo-500 text-white">2</div>
          <span className="mt-1 font-semibold text-indigo-600">確認</span>
        </div>
        <div className="mx-1 mb-3 h-0.5 flex-1 bg-slate-200" />
        <div className="flex flex-col items-center">
          <div className="grid size-6 place-items-center rounded-full bg-slate-200 text-slate-500">3</div>
          <span className="mt-1 text-slate-400">完了</span>
        </div>
      </div>
    </div>
  </Frame>
)

export const SidebarPreview = () => (
  <Browser>
    <div className="flex h-full">
      <div className="w-1/3 space-y-1 border-r border-slate-200 bg-slate-50 p-2 text-[10px]">
        <div className="rounded bg-indigo-100 px-2 py-1 font-medium text-indigo-700">📊 ダッシュボード</div>
        <div className="px-2 py-1 text-slate-600">📦 商品</div>
        <div className="px-2 py-1 text-slate-600">👥 顧客</div>
        <div className="px-2 py-1 text-slate-600">⚙️ 設定</div>
      </div>
      <div className="flex-1 p-3 text-[10px] text-slate-400">本文…</div>
    </div>
  </Browser>
)

export const NavbarPreview = () => (
  <Frame>
    <div className="flex h-full flex-col bg-white">
      <div className="flex items-center justify-between border-b border-slate-200 px-3 py-2">
        <div className="text-xs font-semibold text-slate-900">Logo</div>
        <div className="flex gap-3 text-[10px] text-slate-600">
          <span className="font-medium text-slate-900">ホーム</span>
          <span>料金</span>
          <span>ヘルプ</span>
        </div>
        <button className="rounded bg-indigo-500 px-2 py-1 text-[10px] text-white">ログイン</button>
      </div>
      <div className="flex-1 p-3 text-[10px] text-slate-400">本文…</div>
    </div>
  </Frame>
)

export const HamburgerMenuPreview = () => (
  <Frame>
    <div className="grid h-full place-items-center">
      <button className="grid size-10 place-items-center rounded-md ring-1 ring-slate-300">
        <div className="space-y-1">
          <div className="h-0.5 w-5 bg-slate-700" />
          <div className="h-0.5 w-5 bg-slate-700" />
          <div className="h-0.5 w-5 bg-slate-700" />
        </div>
      </button>
    </div>
  </Frame>
)

export const BottomNavigationPreview = () => (
  <Phone>
    <div className="flex h-full flex-col">
      <div className="flex-1 p-2 text-[10px] text-slate-400">画面コンテンツ…</div>
      <div className="flex border-t border-slate-200 bg-white">
        {[
          ['🏠', 'ホーム', true],
          ['🔍', '検索', false],
          ['❤', 'いいね', false],
          ['👤', '自分', false],
        ].map(([icon, label, active], i) => (
          <div key={i} className="flex flex-1 flex-col items-center py-2 text-[8px]">
            <span className={active ? 'text-indigo-500' : 'text-slate-400'}>{icon as string}</span>
            <span className={active ? 'font-medium text-indigo-500' : 'text-slate-400'}>{label as string}</span>
          </div>
        ))}
      </div>
    </div>
  </Phone>
)

export const TabBarPreview = BottomNavigationPreview

/* ---------- Input ---------- */
export const TextFieldPreview = () => (
  <Frame>
    <div className="grid h-full place-items-center px-6">
      <div className="w-full">
        <label className="mb-1 block text-[10px] text-slate-600">メールアドレス</label>
        <input
          readOnly
          value="hello@example.com"
          className="w-full rounded-md bg-white px-2.5 py-1.5 text-xs text-slate-900 ring-1 ring-slate-300 outline-none focus:ring-indigo-500"
        />
      </div>
    </div>
  </Frame>
)

export const TextAreaPreview = () => (
  <Frame>
    <div className="grid h-full place-items-center px-4">
      <textarea
        readOnly
        className="w-full resize-none rounded-md bg-white px-2.5 py-1.5 text-xs text-slate-900 ring-1 ring-slate-300"
        rows={4}
        defaultValue={'コメントを入力…\n\n複数行入力できる入力欄'}
      />
    </div>
  </Frame>
)

export const SelectPreview = () => (
  <Frame>
    <div className="grid h-full place-items-center">
      <div className="flex w-32 items-center justify-between rounded-md bg-white px-2.5 py-1.5 text-xs ring-1 ring-slate-300">
        <span className="text-slate-900">日本</span>
        <span className="text-slate-400">▾</span>
      </div>
    </div>
  </Frame>
)

export const ComboboxPreview = () => (
  <Frame>
    <div className="grid h-full place-items-center">
      <div className="w-40">
        <div className="flex items-center justify-between rounded-md bg-white px-2.5 py-1.5 text-xs ring-1 ring-slate-300">
          <span className="text-slate-900">東京</span>
          <span className="text-slate-400">▾</span>
        </div>
        <div className="mt-1 rounded-md bg-white text-xs shadow ring-1 ring-slate-200">
          <div className="px-2.5 py-1 text-[10px] text-slate-400">候補</div>
          <div className="bg-indigo-50 px-2.5 py-1 text-indigo-700">東京</div>
          <div className="px-2.5 py-1 text-slate-700">東京都中央区</div>
        </div>
      </div>
    </div>
  </Frame>
)

export const CheckboxPreview = () => (
  <Frame>
    <div className="grid h-full place-items-center">
      <div className="space-y-1.5 text-xs text-slate-700">
        <label className="flex items-center gap-2">
          <span className="grid size-4 place-items-center rounded bg-indigo-500 text-[9px] text-white">✓</span>
          利用規約に同意する
        </label>
        <label className="flex items-center gap-2">
          <span className="size-4 rounded ring-1 ring-slate-400" />
          ニュースレターを受け取る
        </label>
      </div>
    </div>
  </Frame>
)

export const RadioPreview = () => (
  <Frame>
    <div className="grid h-full place-items-center">
      <div className="space-y-1.5 text-xs text-slate-700">
        <label className="flex items-center gap-2">
          <span className="grid size-4 place-items-center rounded-full ring-2 ring-indigo-500">
            <span className="size-2 rounded-full bg-indigo-500" />
          </span>
          メール
        </label>
        <label className="flex items-center gap-2">
          <span className="size-4 rounded-full ring-1 ring-slate-400" />
          SMS
        </label>
      </div>
    </div>
  </Frame>
)

export const TogglePreview = () => (
  <Frame>
    <div className="grid h-full place-items-center">
      <div className="flex items-center gap-3">
        <div className="flex h-5 w-9 items-center rounded-full bg-indigo-500 px-0.5">
          <div className="ml-auto size-4 rounded-full bg-white shadow" />
        </div>
        <div className="flex h-5 w-9 items-center rounded-full bg-slate-300 px-0.5">
          <div className="size-4 rounded-full bg-white shadow" />
        </div>
      </div>
    </div>
  </Frame>
)

export const SliderPreview = () => (
  <Frame>
    <div className="grid h-full place-items-center px-6">
      <div className="w-full">
        <div className="relative h-1.5 rounded-full bg-slate-200">
          <div className="absolute inset-y-0 left-0 w-2/3 rounded-full bg-indigo-500" />
          <div className="absolute -top-1.5 left-2/3 size-4 -translate-x-1/2 rounded-full bg-white ring-2 ring-indigo-500" />
        </div>
      </div>
    </div>
  </Frame>
)

export const RangeSliderPreview = () => (
  <Frame>
    <div className="grid h-full place-items-center px-6">
      <div className="w-full">
        <div className="relative h-1.5 rounded-full bg-slate-200">
          <div className="absolute inset-y-0 left-1/4 right-1/4 bg-indigo-500" />
          <div className="absolute -top-1.5 left-1/4 size-4 -translate-x-1/2 rounded-full bg-white ring-2 ring-indigo-500" />
          <div className="absolute -top-1.5 right-1/4 size-4 translate-x-1/2 rounded-full bg-white ring-2 ring-indigo-500" />
        </div>
        <div className="mt-2 flex justify-between text-[10px] text-slate-500">
          <span>¥1,200</span>
          <span>¥3,800</span>
        </div>
      </div>
    </div>
  </Frame>
)

export const StepperInputPreview = () => (
  <Frame>
    <div className="grid h-full place-items-center">
      <div className="flex items-center rounded-md ring-1 ring-slate-300">
        <button className="px-2.5 py-1 text-sm text-slate-600">−</button>
        <div className="border-x border-slate-300 px-3 py-1 text-xs">3</div>
        <button className="px-2.5 py-1 text-sm text-slate-600">＋</button>
      </div>
    </div>
  </Frame>
)

export const SearchBarPreview = () => (
  <Frame>
    <div className="grid h-full place-items-center px-4">
      <div className="flex w-full items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5">
        <span className="text-slate-400">⌕</span>
        <span className="text-xs text-slate-400">キーワードで検索…</span>
      </div>
    </div>
  </Frame>
)

export const DatePickerPreview = () => (
  <Frame>
    <div className="grid h-full place-items-center">
      <div className="rounded-lg bg-white p-2 text-[9px] shadow ring-1 ring-slate-200">
        <div className="mb-1 flex items-center justify-between text-slate-700">
          <span>‹</span>
          <span className="font-semibold">2026年5月</span>
          <span>›</span>
        </div>
        <div className="grid grid-cols-7 gap-0.5 text-center text-slate-500">
          {['日', '月', '火', '水', '木', '金', '土'].map((d) => (
            <div key={d} className="py-0.5 text-[8px] text-slate-400">{d}</div>
          ))}
          {Array.from({ length: 28 }, (_, i) => i + 1).map((n) => (
            <div
              key={n}
              className={
                'grid size-4 place-items-center rounded-full ' +
                (n === 12 ? 'bg-indigo-500 text-white' : 'text-slate-700')
              }
            >
              {n}
            </div>
          ))}
        </div>
      </div>
    </div>
  </Frame>
)

export const FileUploadPreview = () => (
  <Frame>
    <div className="grid h-full place-items-center px-4">
      <div className="flex w-full flex-col items-center rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-center">
        <div className="text-lg">⬆</div>
        <div className="text-[10px] text-slate-600">クリックまたはドラッグ＆ドロップ</div>
        <div className="text-[9px] text-slate-400">最大10MBまで</div>
      </div>
    </div>
  </Frame>
)

export const ChipInputPreview = () => (
  <Frame>
    <div className="grid h-full place-items-center px-4">
      <div className="flex w-full flex-wrap items-center gap-1 rounded-md bg-white p-1.5 ring-1 ring-slate-300">
        <span className="flex items-center gap-1 rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] text-indigo-700">
          react <span>×</span>
        </span>
        <span className="flex items-center gap-1 rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] text-indigo-700">
          tailwind <span>×</span>
        </span>
        <span className="text-[10px] text-slate-400">タグを追加…</span>
      </div>
    </div>
  </Frame>
)

export const ColorPickerPreview = () => (
  <Frame>
    <div className="grid h-full place-items-center">
      <div className="rounded-lg bg-white p-2 shadow ring-1 ring-slate-200">
        <div className="h-10 w-24 rounded bg-gradient-to-br from-indigo-300 via-pink-400 to-amber-400" />
        <div className="mt-1 flex justify-between text-[9px] text-slate-500">
          <span>#FF6B9C</span>
          <span className="size-3 rounded-full bg-rose-400 ring-1 ring-slate-300" />
        </div>
      </div>
    </div>
  </Frame>
)

export const RatingPreview = () => (
  <Frame>
    <div className="grid h-full place-items-center">
      <div className="flex gap-0.5 text-lg">
        <span className="text-amber-400">★</span>
        <span className="text-amber-400">★</span>
        <span className="text-amber-400">★</span>
        <span className="text-amber-400">★</span>
        <span className="text-slate-300">★</span>
      </div>
    </div>
  </Frame>
)

/* ---------- Action ---------- */
export const ButtonPreview = () => (
  <Frame>
    <div className="grid h-full place-items-center">
      <div className="flex gap-2">
        <button className="rounded-md bg-indigo-500 px-3 py-1.5 text-xs font-medium text-white">保存</button>
        <button className="rounded-md bg-white px-3 py-1.5 text-xs font-medium text-slate-700 ring-1 ring-slate-300">キャンセル</button>
      </div>
    </div>
  </Frame>
)

export const FabPreview = () => (
  <Frame>
    <div className="absolute inset-0 bg-slate-50" />
    <button className="absolute bottom-3 right-3 grid size-12 place-items-center rounded-full bg-indigo-500 text-2xl text-white shadow-lg">
      ＋
    </button>
  </Frame>
)

export const IconButtonPreview = () => (
  <Frame>
    <div className="grid h-full place-items-center">
      <div className="flex gap-2">
        <button className="grid size-8 place-items-center rounded-full text-slate-700 hover:bg-slate-100">❤</button>
        <button className="grid size-8 place-items-center rounded-full text-slate-700 hover:bg-slate-100">↻</button>
        <button className="grid size-8 place-items-center rounded-full text-slate-700 hover:bg-slate-100">⋮</button>
      </div>
    </div>
  </Frame>
)

export const SpeedDialPreview = () => (
  <Frame>
    <div className="absolute inset-0 bg-slate-50" />
    <div className="absolute bottom-3 right-3 flex flex-col items-center gap-1.5">
      <button className="grid size-7 place-items-center rounded-full bg-white text-xs shadow ring-1 ring-slate-200">📷</button>
      <button className="grid size-7 place-items-center rounded-full bg-white text-xs shadow ring-1 ring-slate-200">📁</button>
      <button className="grid size-7 place-items-center rounded-full bg-white text-xs shadow ring-1 ring-slate-200">🔗</button>
      <button className="grid size-10 place-items-center rounded-full bg-indigo-500 text-xl text-white shadow-lg">×</button>
    </div>
  </Frame>
)

/* ---------- Data display ---------- */
export const AvatarPreview = () => (
  <Frame>
    <div className="grid h-full place-items-center">
      <div className="flex -space-x-2">
        <div className="grid size-8 place-items-center rounded-full bg-indigo-500 text-xs font-semibold text-white ring-2 ring-white">A</div>
        <div className="grid size-8 place-items-center rounded-full bg-emerald-500 text-xs font-semibold text-white ring-2 ring-white">B</div>
        <div className="grid size-8 place-items-center rounded-full bg-rose-500 text-xs font-semibold text-white ring-2 ring-white">C</div>
        <div className="grid size-8 place-items-center rounded-full bg-slate-200 text-xs font-semibold text-slate-700 ring-2 ring-white">+5</div>
      </div>
    </div>
  </Frame>
)

export const ChipPreview = () => (
  <Frame>
    <div className="grid h-full place-items-center">
      <div className="flex flex-wrap gap-1.5">
        <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs text-slate-700">React</span>
        <span className="rounded-full bg-indigo-100 px-2.5 py-0.5 text-xs text-indigo-700">TypeScript</span>
        <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs text-emerald-700">Tailwind</span>
      </div>
    </div>
  </Frame>
)

export const TagPreview = ChipPreview

export const CardPreview = () => (
  <Frame>
    <div className="grid h-full place-items-center p-3">
      <div className="w-full overflow-hidden rounded-lg bg-white shadow ring-1 ring-slate-200">
        <div className="h-10 bg-gradient-to-br from-indigo-300 to-pink-300" />
        <div className="p-2">
          <div className="text-[11px] font-semibold text-slate-900">タイトル</div>
          <div className="text-[10px] text-slate-500">本文の説明テキストが入ります</div>
        </div>
      </div>
    </div>
  </Frame>
)

export const AccordionPreview = () => (
  <Frame>
    <div className="grid h-full place-items-center px-3">
      <div className="w-full divide-y divide-slate-200 rounded-md bg-white text-xs ring-1 ring-slate-200">
        <div className="flex items-center justify-between px-3 py-2 font-medium text-slate-900">
          質問1 <span>−</span>
        </div>
        <div className="px-3 py-2 text-[10px] text-slate-500">回答が展開された状態。</div>
        <div className="flex items-center justify-between px-3 py-2 text-slate-700">
          質問2 <span>＋</span>
        </div>
      </div>
    </div>
  </Frame>
)

export const TimelinePreview = () => (
  <Frame>
    <div className="grid h-full place-items-center px-4">
      <div className="space-y-2">
        {['登録', '注文', '配送'].map((l, i) => (
          <div key={l} className="flex items-center gap-2">
            <div className={'size-3 rounded-full ' + (i < 2 ? 'bg-indigo-500' : 'bg-slate-300')} />
            <div className="text-[11px] text-slate-700">{l}</div>
          </div>
        ))}
      </div>
    </div>
  </Frame>
)

export const EmptyStatePreview = () => (
  <Frame>
    <div className="grid h-full place-items-center text-center">
      <div>
        <div className="text-3xl">📭</div>
        <div className="mt-1 text-xs font-semibold text-slate-700">まだ何もありません</div>
        <div className="text-[10px] text-slate-500">最初のアイテムを追加してみよう</div>
        <button className="mt-2 rounded bg-indigo-500 px-3 py-1 text-[10px] text-white">追加する</button>
      </div>
    </div>
  </Frame>
)

export const NotificationDotPreview = () => (
  <Frame>
    <div className="grid h-full place-items-center">
      <div className="relative">
        <div className="grid size-12 place-items-center rounded-2xl bg-slate-200 text-slate-700">✉</div>
        <span className="absolute right-1 top-1 size-2 rounded-full bg-rose-500 ring-2 ring-white" />
      </div>
    </div>
  </Frame>
)

export const DividerPreview = () => (
  <Frame>
    <div className="grid h-full place-items-center px-4">
      <div className="w-full">
        <div className="text-xs text-slate-700">セクション A</div>
        <div className="my-2 h-px w-full bg-slate-200" />
        <div className="text-xs text-slate-700">セクション B</div>
      </div>
    </div>
  </Frame>
)

export const TablePreview = () => (
  <Frame>
    <div className="h-full overflow-hidden text-[10px]">
      <div className="grid grid-cols-3 gap-2 border-b border-slate-200 bg-slate-50 px-3 py-1.5 text-slate-600">
        <span>名前</span><span>状態</span><span>金額</span>
      </div>
      {[
        ['山田', '完了', '¥1,200'],
        ['佐藤', '保留', '¥3,400'],
        ['鈴木', '完了', '¥980'],
      ].map((r) => (
        <div key={r[0]} className="grid grid-cols-3 gap-2 border-b border-slate-100 px-3 py-1.5 text-slate-700">
          {r.map((c) => <span key={c}>{c}</span>)}
        </div>
      ))}
    </div>
  </Frame>
)

export const CarouselPreview = () => (
  <Frame>
    <div className="flex h-full flex-col">
      <div className="flex flex-1 items-center justify-center bg-gradient-to-br from-indigo-300 to-pink-300 text-white text-xs">
        スライド 1 / 3
      </div>
      <div className="flex justify-center gap-1 py-1.5">
        <span className="size-1.5 rounded-full bg-indigo-500" />
        <span className="size-1.5 rounded-full bg-slate-300" />
        <span className="size-1.5 rounded-full bg-slate-300" />
      </div>
    </div>
  </Frame>
)

export const TreeViewPreview = () => (
  <Frame>
    <div className="grid h-full place-items-center px-4">
      <div className="text-[11px] text-slate-700">
        <div>📁 src</div>
        <div className="ml-3">📁 components</div>
        <div className="ml-6">📄 Button.tsx</div>
        <div className="ml-6">📄 Card.tsx</div>
        <div className="ml-3">📄 main.tsx</div>
      </div>
    </div>
  </Frame>
)

export const KanbanPreview = () => (
  <Frame>
    <div className="grid h-full grid-cols-3 gap-1.5 p-2 text-[9px]">
      {['ToDo', 'Doing', 'Done'].map((t, i) => (
        <div key={t} className="rounded bg-slate-100 p-1">
          <div className="mb-1 font-semibold text-slate-700">{t}</div>
          <div className="mb-1 rounded bg-white p-1 shadow-sm">タスク {i + 1}</div>
          {i < 2 && <div className="rounded bg-white p-1 shadow-sm">タスク {i + 4}</div>}
        </div>
      ))}
    </div>
  </Frame>
)

export const DisclosurePreview = () => (
  <Frame>
    <div className="grid h-full place-items-center px-3">
      <div className="w-full">
        <button className="flex w-full items-center justify-between rounded-md bg-white px-3 py-2 text-xs text-slate-900 ring-1 ring-slate-200">
          詳細を表示 <span>▾</span>
        </button>
      </div>
    </div>
  </Frame>
)

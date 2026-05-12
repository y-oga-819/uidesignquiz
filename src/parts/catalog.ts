import type { Part } from './types'
import * as P from './previews'

export const PARTS: Part[] = [
  /* ---------- Feedback ---------- */
  {
    id: 'toast',
    name: 'Toast',
    kana: 'トースト',
    aliases: ['toast', 'トースト'],
    category: 'feedback',
    description:
      '画面の隅に短時間表示され、自動で消える通知。操作の結果を邪魔せず伝える。Snackbarと近いが、一般にアクションを伴わず、複数同時に積み重なるのが特徴。',
    Preview: P.ToastPreview,
  },
  {
    id: 'snackbar',
    name: 'Snackbar',
    kana: 'スナックバー',
    aliases: ['snackbar', 'スナックバー'],
    category: 'feedback',
    description:
      '画面下部に表示される短い通知。「元に戻す」など1つのアクションを伴うことが多い（Material Design）。Toastより画面下中央／単発で出るのが典型。',
    Preview: P.SnackbarPreview,
  },
  {
    id: 'banner',
    name: 'Banner',
    kana: 'バナー',
    aliases: ['banner', 'バナー'],
    category: 'feedback',
    description:
      'ページ上部に固定で表示される告知領域。重要度の高いお知らせやメンテナンス情報など、ページ全体に関わる情報を載せる。',
    Preview: P.BannerPreview,
  },
  {
    id: 'alert',
    name: 'Alert',
    kana: 'アラート',
    aliases: ['alert', 'アラート', 'callout', 'コールアウト'],
    category: 'feedback',
    description:
      'コンテンツ内に置く強調メッセージ。情報・警告・エラーなどステータスを色とアイコンで示す。Toastと違い消えず、文脈の中に常駐する。',
    Preview: P.AlertPreview,
  },
  {
    id: 'progress-bar',
    name: 'Progress Bar',
    kana: 'プログレスバー',
    aliases: ['progress bar', 'プログレスバー', 'progressbar'],
    category: 'feedback',
    description:
      '処理の進捗を割合で示す横長のバー。読み込み・アップロード・ステップの完了率などに使う。所要時間が予測可能なときに使う。',
    Preview: P.ProgressBarPreview,
  },
  {
    id: 'spinner',
    name: 'Spinner',
    kana: 'スピナー',
    aliases: ['spinner', 'スピナー', 'loader', 'ローダー'],
    category: 'feedback',
    description:
      '回転するアイコンで処理中であることを示す。所要時間が読めないときに使う。Progress Barと違い割合は示さない。',
    Preview: P.SpinnerPreview,
  },
  {
    id: 'skeleton',
    name: 'Skeleton',
    kana: 'スケルトン',
    aliases: ['skeleton', 'スケルトン', 'スケルトンスクリーン', 'skeleton screen'],
    category: 'feedback',
    description:
      '読み込み中にレイアウトの形だけ灰色で表示するプレースホルダ。Spinnerより体感速度が速くなり、ガタつき（CLS）も防げる。',
    Preview: P.SkeletonPreview,
  },
  {
    id: 'badge',
    name: 'Badge',
    kana: 'バッジ',
    aliases: ['badge', 'バッジ'],
    category: 'feedback',
    description:
      'アイコンや要素の右上などに付き、件数や状態を小さく示すラベル。未読数の数字付きバッジが代表例。',
    Preview: P.BadgePreview,
  },
  {
    id: 'tooltip',
    name: 'Tooltip',
    kana: 'ツールチップ',
    aliases: ['tooltip', 'ツールチップ'],
    category: 'feedback',
    description:
      'ホバーやフォーカスで現れる、要素の補足説明。短いテキスト1〜2行向け。クリックで開く・項目を選ぶ用途はPopoverを使う。',
    Preview: P.TooltipPreview,
  },
  {
    id: 'notification-dot',
    name: 'Notification Dot',
    kana: 'ノティフィケーションドット',
    aliases: ['notification dot', 'ドット', 'red dot', 'バッジドット'],
    category: 'feedback',
    description:
      '数字を持たない小さな丸印で「何か新しいものがある」ことを示す。Badgeより控えめな表示。',
    Preview: P.NotificationDotPreview,
  },

  /* ---------- Overlay ---------- */
  {
    id: 'modal',
    name: 'Modal',
    kana: 'モーダル',
    aliases: ['modal', 'modal dialog', 'dialog', 'モーダル', 'ダイアログ'],
    category: 'overlay',
    description:
      '背景を暗くして表示する、操作をブロックする画面中央のウィンドウ。確認・編集・重要な意思決定など、必ず処理してほしい場面に使う。',
    Preview: P.ModalPreview,
  },
  {
    id: 'popover',
    name: 'Popover',
    kana: 'ポップオーバー',
    aliases: ['popover', 'ポップオーバー'],
    category: 'overlay',
    description:
      'トリガー要素に紐づいて開く、リッチな内容を表示できる小さなパネル。Tooltipと違いインタラクティブな要素を含められる。',
    Preview: P.PopoverPreview,
  },
  {
    id: 'dropdown',
    name: 'Dropdown Menu',
    kana: 'ドロップダウンメニュー',
    aliases: ['dropdown', 'dropdown menu', 'ドロップダウン', 'メニュー'],
    category: 'overlay',
    description:
      'ボタン押下で下方向に開く操作メニュー。コマンドの一覧を表示し、選んだら閉じる。フォームの選択肢はSelectを使う。',
    Preview: P.DropdownPreview,
  },
  {
    id: 'context-menu',
    name: 'Context Menu',
    kana: 'コンテキストメニュー',
    aliases: ['context menu', '右クリックメニュー', 'コンテキストメニュー'],
    category: 'overlay',
    description:
      '右クリック（またはロングプレス）で、対象に対して取れる操作を表示するメニュー。Dropdownと似るが、対象の文脈に応じて項目が変わる。',
    Preview: P.ContextMenuPreview,
  },
  {
    id: 'drawer',
    name: 'Drawer',
    kana: 'ドロワー',
    aliases: ['drawer', 'ドロワー', 'side sheet', 'サイドシート'],
    category: 'overlay',
    description:
      '画面の端からスライドインで現れるパネル。ナビゲーションや詳細表示・フォームに使う。閉じる動作で元の画面に戻る。',
    Preview: P.DrawerPreview,
  },
  {
    id: 'bottom-sheet',
    name: 'Bottom Sheet',
    kana: 'ボトムシート',
    aliases: ['bottom sheet', 'ボトムシート'],
    category: 'overlay',
    description:
      'モバイルで画面下部からせり上がるシート。スワイプで開閉できる。共有や追加アクションなどに使う。',
    Preview: P.BottomSheetPreview,
  },
  {
    id: 'action-sheet',
    name: 'Action Sheet',
    kana: 'アクションシート',
    aliases: ['action sheet', 'アクションシート'],
    category: 'overlay',
    description:
      'iOSで画面下に複数のアクションを並べて選ばせるUI。下に「キャンセル」を別ボタンで置くのが定型。',
    Preview: P.ActionSheetPreview,
  },
  {
    id: 'command-palette',
    name: 'Command Palette',
    kana: 'コマンドパレット',
    aliases: ['command palette', 'コマンドパレット', 'cmdk'],
    category: 'overlay',
    description:
      'キーボード（多くは⌘K）で開く検索可能なコマンド一覧。アプリの機能に素早くジャンプするためのUI。',
    Preview: P.CommandPalettePreview,
  },

  /* ---------- Navigation ---------- */
  {
    id: 'tabs',
    name: 'Tabs',
    kana: 'タブ',
    aliases: ['tabs', 'tab', 'タブ'],
    category: 'navigation',
    description:
      '同じ階層のコンテンツを横に切り替えるUI。ページ遷移は行わず、表示だけが切り替わる。',
    Preview: P.TabsPreview,
  },
  {
    id: 'segmented-control',
    name: 'Segmented Control',
    kana: 'セグメンテッドコントロール',
    aliases: ['segmented control', 'セグメンテッドコントロール', 'segmented'],
    category: 'navigation',
    description:
      '2〜4つの相互排他な選択肢を1つのバーに並べたコントロール。Tabsより小さい範囲で表示を切り替える用途。',
    Preview: P.SegmentedControlPreview,
  },
  {
    id: 'breadcrumb',
    name: 'Breadcrumb',
    kana: 'パンくずリスト',
    aliases: ['breadcrumb', 'breadcrumbs', 'パンくず', 'パンくずリスト'],
    category: 'navigation',
    description:
      '現在位置と上位階層を区切り文字でつないで示すナビゲーション。サイト構造の中での「いま地点」が分かる。',
    Preview: P.BreadcrumbPreview,
  },
  {
    id: 'pagination',
    name: 'Pagination',
    kana: 'ページネーション',
    aliases: ['pagination', 'ページネーション', 'ページャー', 'pager'],
    category: 'navigation',
    description:
      '長いリストを複数ページに分け、ページ番号で遷移するナビゲーション。総件数が分かるときに有効。',
    Preview: P.PaginationPreview,
  },
  {
    id: 'stepper',
    name: 'Stepper',
    kana: 'ステッパー',
    aliases: ['stepper', 'ステッパー', 'wizard', 'ウィザード', 'progress steps'],
    category: 'navigation',
    description:
      '複数ステップの手続きで現在地と進捗を示すUI。各ステップの状態（完了／進行中／未着手）を可視化する。',
    Preview: P.StepperPreview,
  },
  {
    id: 'sidebar',
    name: 'Sidebar',
    kana: 'サイドバー',
    aliases: ['sidebar', 'サイドバー', 'side nav', 'side navigation', 'rail'],
    category: 'navigation',
    description:
      '画面の左右に常駐するナビゲーション。トップレベルの行き先を一覧で示し、選択中の項目をハイライトする。',
    Preview: P.SidebarPreview,
  },
  {
    id: 'navbar',
    name: 'Navbar',
    kana: 'ナビゲーションバー',
    aliases: ['navbar', 'navigation bar', 'ヘッダーナビゲーション', 'ナビバー', 'グローバルナビ'],
    category: 'navigation',
    description:
      '画面上部に置かれる横長のナビゲーション。ロゴ・主要リンク・CTAボタンなどを並べる。',
    Preview: P.NavbarPreview,
  },
  {
    id: 'hamburger',
    name: 'Hamburger Menu',
    kana: 'ハンバーガーメニュー',
    aliases: ['hamburger', 'hamburger menu', 'ハンバーガー', 'メニューアイコン'],
    category: 'navigation',
    description:
      '横3本線のアイコンで表される、メニューを開くトリガー。狭い画面でナビゲーションを畳むのに使う。',
    Preview: P.HamburgerMenuPreview,
  },
  {
    id: 'bottom-nav',
    name: 'Bottom Navigation',
    kana: 'ボトムナビゲーション',
    aliases: ['bottom navigation', 'tab bar', 'ボトムナビ', 'タブバー'],
    category: 'navigation',
    description:
      'モバイル画面下部に並ぶアイコン付きナビゲーション。トップレベルの3〜5個の行き先を切り替える。iOSでは「タブバー」と呼ぶ。',
    Preview: P.BottomNavigationPreview,
  },

  /* ---------- Input ---------- */
  {
    id: 'text-field',
    name: 'Text Field',
    kana: 'テキストフィールド',
    aliases: ['text field', 'input', 'text input', 'テキストフィールド', '入力欄'],
    category: 'input',
    description:
      '1行のテキストを入力する欄。ラベル・プレースホルダ・補助テキスト・エラーをまとめて含むこともある。',
    Preview: P.TextFieldPreview,
  },
  {
    id: 'textarea',
    name: 'Textarea',
    kana: 'テキストエリア',
    aliases: ['textarea', 'text area', 'テキストエリア', '複数行入力'],
    category: 'input',
    description:
      '複数行のテキスト入力欄。コメント・本文・備考など、改行を含む文字列を扱う。',
    Preview: P.TextAreaPreview,
  },
  {
    id: 'select',
    name: 'Select',
    kana: 'セレクト',
    aliases: ['select', 'select box', 'セレクト', 'セレクトボックス', 'プルダウン'],
    category: 'input',
    description:
      '事前定義された選択肢から1つ（または複数）を選ぶフォーム部品。OS標準UIを使うことも多い。',
    Preview: P.SelectPreview,
  },
  {
    id: 'combobox',
    name: 'Combobox',
    kana: 'コンボボックス',
    aliases: ['combobox', 'autocomplete', 'コンボボックス', 'オートコンプリート'],
    category: 'input',
    description:
      'テキスト入力で候補を絞り込めるSelect。自由入力＋候補提示の両方ができる。',
    Preview: P.ComboboxPreview,
  },
  {
    id: 'checkbox',
    name: 'Checkbox',
    kana: 'チェックボックス',
    aliases: ['checkbox', 'チェックボックス'],
    category: 'input',
    description:
      'オンとオフを切り替える選択UI。複数項目から複数を選ぶ、あるいは単独でON/OFFを表す。',
    Preview: P.CheckboxPreview,
  },
  {
    id: 'radio',
    name: 'Radio Button',
    kana: 'ラジオボタン',
    aliases: ['radio', 'radio button', 'ラジオ', 'ラジオボタン'],
    category: 'input',
    description:
      'グループの中から1つだけを選ぶUI。選択肢が少なく一覧表示する価値があるときに使う。',
    Preview: P.RadioPreview,
  },
  {
    id: 'toggle',
    name: 'Toggle',
    kana: 'トグル',
    aliases: ['toggle', 'switch', 'トグル', 'スイッチ', 'トグルスイッチ'],
    category: 'input',
    description:
      'ON/OFFを即時に切り替えるスイッチ。設定の有効化など、保存ボタンなしで反映する場面に使う。',
    Preview: P.TogglePreview,
  },
  {
    id: 'slider',
    name: 'Slider',
    kana: 'スライダー',
    aliases: ['slider', 'スライダー'],
    category: 'input',
    description:
      'つまみをドラッグして連続値を選ぶUI。音量・明るさのような感覚で調整する値に向く。',
    Preview: P.SliderPreview,
  },
  {
    id: 'range-slider',
    name: 'Range Slider',
    kana: 'レンジスライダー',
    aliases: ['range slider', 'range', 'レンジスライダー'],
    category: 'input',
    description:
      'つまみが2つあり、値の範囲（最小〜最大）を選ぶスライダー。価格絞り込みなどで使う。',
    Preview: P.RangeSliderPreview,
  },
  {
    id: 'stepper-input',
    name: 'Stepper Input',
    kana: 'ステッパー入力',
    aliases: ['stepper input', 'number input', 'numeric stepper', '数値ステッパー'],
    category: 'input',
    description:
      '＋／−ボタンで数値を1ずつ増減できる入力UI。個数の指定など、小さな整数値に向く。',
    Preview: P.StepperInputPreview,
  },
  {
    id: 'search-bar',
    name: 'Search Bar',
    kana: '検索バー',
    aliases: ['search bar', 'search field', 'search', '検索バー', 'サーチバー'],
    category: 'input',
    description:
      '検索のための入力欄。虫眼鏡アイコンとプレースホルダを伴うのが定番。',
    Preview: P.SearchBarPreview,
  },
  {
    id: 'date-picker',
    name: 'Date Picker',
    kana: 'デイトピッカー',
    aliases: ['date picker', 'datepicker', 'カレンダー', '日付選択', 'デイトピッカー'],
    category: 'input',
    description:
      'カレンダーから日付を選ぶUI。範囲選択やタイムゾーン対応をするタイプもある。',
    Preview: P.DatePickerPreview,
  },
  {
    id: 'file-upload',
    name: 'File Upload',
    kana: 'ファイルアップロード',
    aliases: ['file upload', 'dropzone', 'uploader', 'ドロップゾーン', 'ファイルアップロード'],
    category: 'input',
    description:
      'ファイルを選択またはドラッグ＆ドロップでアップロードするUI。複数ファイル・形式制限などをガイドする。',
    Preview: P.FileUploadPreview,
  },
  {
    id: 'chip-input',
    name: 'Chip Input',
    kana: 'チップ入力',
    aliases: ['chip input', 'tag input', 'タグ入力', 'チップ入力'],
    category: 'input',
    description:
      '入力した語句をチップ（タグ）化して並べる入力欄。複数のキーワードや宛先などをまとめて扱える。',
    Preview: P.ChipInputPreview,
  },
  {
    id: 'color-picker',
    name: 'Color Picker',
    kana: 'カラーピッカー',
    aliases: ['color picker', 'カラーピッカー', '色選択'],
    category: 'input',
    description:
      '色を視覚的に選ぶUI。カラーホイール・グラデーション・スライダー・HEX入力などで構成される。',
    Preview: P.ColorPickerPreview,
  },
  {
    id: 'rating',
    name: 'Rating',
    kana: 'レーティング',
    aliases: ['rating', 'star rating', 'レーティング', '星評価'],
    category: 'input',
    description:
      '★などの記号で評価値を入力／表示するUI。半分単位や数値併記もある。',
    Preview: P.RatingPreview,
  },

  /* ---------- Action ---------- */
  {
    id: 'button',
    name: 'Button',
    kana: 'ボタン',
    aliases: ['button', 'ボタン'],
    category: 'action',
    description:
      '操作のトリガーとなる基本部品。Primary／Secondary／Tertiaryなど階層を持たせ、最重要操作を視覚的に強調する。',
    Preview: P.ButtonPreview,
  },
  {
    id: 'fab',
    name: 'FAB',
    kana: 'フローティングアクションボタン',
    aliases: ['fab', 'floating action button', 'フローティングアクションボタン'],
    category: 'action',
    description:
      '画面右下などに浮かんで表示される円形ボタン。その画面の主要アクション1つを担う（Material Design）。',
    Preview: P.FabPreview,
  },
  {
    id: 'icon-button',
    name: 'Icon Button',
    kana: 'アイコンボタン',
    aliases: ['icon button', 'アイコンボタン'],
    category: 'action',
    description:
      'アイコンだけで構成される小型のボタン。スペースを節約できる反面、意味が伝わりにくいのでTooltipと併用することが多い。',
    Preview: P.IconButtonPreview,
  },
  {
    id: 'speed-dial',
    name: 'Speed Dial',
    kana: 'スピードダイヤル',
    aliases: ['speed dial', 'スピードダイヤル'],
    category: 'action',
    description:
      'FABを押すと放射状／縦に複数のサブアクションが展開するUI。1つのFABで関連する複数操作を提供したい場面で使う。',
    Preview: P.SpeedDialPreview,
  },

  /* ---------- Data display ---------- */
  {
    id: 'avatar',
    name: 'Avatar',
    kana: 'アバター',
    aliases: ['avatar', 'アバター', 'プロフィールアイコン'],
    category: 'data-display',
    description:
      'ユーザーを表す円形（または角丸）の画像／イニシャル。複数並べる場合は重ねて表示することが多い。',
    Preview: P.AvatarPreview,
  },
  {
    id: 'chip',
    name: 'Chip',
    kana: 'チップ',
    aliases: ['chip', 'チップ'],
    category: 'data-display',
    description:
      '小さな角丸の領域に短い情報を入れるUI。フィルター・選択肢・属性表示などに使う。Tag／Pillと近い概念。',
    Preview: P.ChipPreview,
  },
  {
    id: 'tag',
    name: 'Tag',
    kana: 'タグ',
    aliases: ['tag', 'タグ', 'pill', 'ピル'],
    category: 'data-display',
    description:
      'コンテンツの分類や属性を示す小さなラベル。Chipと近いが、こちらは静的・読み取り専用の文脈で使われることが多い。',
    Preview: P.TagPreview,
  },
  {
    id: 'card',
    name: 'Card',
    kana: 'カード',
    aliases: ['card', 'カード'],
    category: 'data-display',
    description:
      '関連情報を1つのまとまりに括った長方形のコンテナ。タイトル・本文・画像・アクションを内包する。',
    Preview: P.CardPreview,
  },
  {
    id: 'accordion',
    name: 'Accordion',
    kana: 'アコーディオン',
    aliases: ['accordion', 'アコーディオン', 'collapsible'],
    category: 'data-display',
    description:
      '見出しをクリックして本文を開閉するUI。FAQやセクション一覧で、必要なものだけ展開して読ませたいときに使う。',
    Preview: P.AccordionPreview,
  },
  {
    id: 'timeline',
    name: 'Timeline',
    kana: 'タイムライン',
    aliases: ['timeline', 'タイムライン'],
    category: 'data-display',
    description:
      '出来事を時系列に並べるUI。配送状況・履歴・進捗など、順序のある一連のイベントを示す。',
    Preview: P.TimelinePreview,
  },
  {
    id: 'empty-state',
    name: 'Empty State',
    kana: 'エンプティステート',
    aliases: ['empty state', '空状態', 'エンプティステート'],
    category: 'data-display',
    description:
      'データが何もないときに表示する状態。アイコン・説明・次の一手のCTAをセットで提示する。',
    Preview: P.EmptyStatePreview,
  },
  {
    id: 'divider',
    name: 'Divider',
    kana: 'ディバイダー',
    aliases: ['divider', 'ディバイダー', 'separator', 'セパレータ', '区切り線'],
    category: 'data-display',
    description:
      'コンテンツの区切りを表す細い線。グルーピングを軽く示すときに使う。',
    Preview: P.DividerPreview,
  },
  {
    id: 'table',
    name: 'Data Table',
    kana: 'データテーブル',
    aliases: ['table', 'data table', 'テーブル', 'データテーブル'],
    category: 'data-display',
    description:
      '行列構造で大量のデータを比較・操作できるUI。列ヘッダー・並び替え・選択・ページングを伴うことが多い。',
    Preview: P.TablePreview,
  },
  {
    id: 'carousel',
    name: 'Carousel',
    kana: 'カルーセル',
    aliases: ['carousel', 'slider', 'カルーセル'],
    category: 'data-display',
    description:
      '横にスライドして複数のコンテンツを順に見せるUI。インジケーター（ドット）で何枚目かを示す。',
    Preview: P.CarouselPreview,
  },
  {
    id: 'tree-view',
    name: 'Tree View',
    kana: 'ツリービュー',
    aliases: ['tree view', 'tree', 'ツリービュー', 'ツリー'],
    category: 'data-display',
    description:
      '階層構造を折りたたみ可能なインデントで表現するUI。フォルダ／ファイル一覧などに使う。',
    Preview: P.TreeViewPreview,
  },
  {
    id: 'kanban',
    name: 'Kanban Board',
    kana: 'カンバンボード',
    aliases: ['kanban', 'kanban board', 'カンバン', 'カンバンボード'],
    category: 'data-display',
    description:
      'カードを縦の列（ステータス）に分けて並べるボード。タスク管理ツールで馴染み深い。',
    Preview: P.KanbanPreview,
  },
  {
    id: 'disclosure',
    name: 'Disclosure',
    kana: 'ディスクロージャー',
    aliases: ['disclosure', 'ディスクロージャー', '展開ボタン'],
    category: 'data-display',
    description:
      '1個の見出しと、その下の隠れたコンテンツを開閉するUI。Accordionは複数項目で構成されるが、Disclosureは単独で使う。',
    Preview: P.DisclosurePreview,
  },
]

export const PARTS_BY_ID: Record<string, Part> = Object.fromEntries(
  PARTS.map((p) => [p.id, p]),
)

export const CATEGORY_LABEL: Record<import('./types').PartCategory, string> = {
  feedback: 'フィードバック',
  overlay: 'オーバーレイ',
  navigation: 'ナビゲーション',
  input: '入力',
  'data-display': 'データ表示',
  layout: 'レイアウト',
  action: 'アクション',
}

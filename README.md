# UI Design Quiz

UIパーツの名前を暗記カード形式で覚えるためのクイズアプリ。
英語名 ↔ カナ表記 ↔ 実際のUI を結びつけて学習できる。

## 出題モード

- **名前 → UI**: 名前から正しいUIを4択で選ぶ
- **UI → 名前**: UIプレビューから名前を4択で選ぶ
- **名前を入力**: UIプレビューを見て名前を自由入力（英語/カナ/別名いずれもOK、表記揺れに寛容）

設定で出題モードとカテゴリ（フィードバック / オーバーレイ / ナビゲーション / 入力 / アクション / データ表示）を絞り込める。

## キーボード操作

- `1`〜`4`: 選択肢を選ぶ
- `Enter`: 入力モードでの回答 / 解説後の「次へ」
- `Esc`: スキップ（不正解扱い）

## 開発

```sh
npm install
npm run dev      # 開発サーバ
npm run build    # 静的ビルド (dist/)
npm run preview  # ビルド成果物を確認
```

スタック: Vite + React + TypeScript + Tailwind CSS v4。
ビルド成果物 (`dist/`) はそのまま Cloudflare Pages 等の静的ホスティングに乗せられる。

## UIパーツの追加

`src/parts/previews.tsx` にプレビュー用Reactコンポーネントを追加し、
`src/parts/catalog.ts` の `PARTS` 配列にエントリを追加する。

```ts
{
  id: 'snackbar',
  name: 'Snackbar',
  kana: 'スナックバー',
  aliases: ['snackbar', 'スナックバー'],
  category: 'feedback',
  description: '...',
  Preview: P.SnackbarPreview,
}
```

`aliases` には別名・別表記を入れておくと、入力モードの正答判定で利用される。

# Fuse Beads Assistant

[中文](./README.md) | [English](./README.en.md) | [日本語](./README.ja.md) | [한국어](./README.ko.md)

Next.js 16、React 19、shadcn/ui、`next-intl` で構築した、フューズビーズ図案作成ツールです。

主な機能は、アップロードした画像を **Mard 221** パレットに合わせたビーズ図案へ変換し、プレビュー、コード図案、色数集計、大きな書き出し表示まで行うことです。

## 主な機能

- `PNG / JPG / WEBP` 画像を読み込んでビーズ図案へ変換
- [public/Mard221.csv](/Z:/development/projects/typescript/fuse-beads-assistant/public/Mard221.csv) を色パレットとして使用
- `Preview`、`Coded Chart`、`Coded Chart with Colors`、`Source` を切り替え可能
- ボードサイズと画像エリアサイズを個別に設定
- 正方形優先ワークフローをデフォルトで有効化
- 許容値で近い色をまとめ、使用色数を削減
- `smooth` / `precise` のサンプリング方式を選択可能
- 独立した大図案書き出しページを用意
- `zh / en / ja / ko` に対応
- ライト / ダーク / システムとアクセントカラー切替に対応

## ルート

ホーム：

- `/zh`
- `/en`
- `/ja`
- `/ko`

図案スタジオ：

- `/zh/pattern`
- `/en/pattern`
- `/ja/pattern`
- `/ko/pattern`

大図案書き出し：

- `/zh/pattern/export`
- `/en/pattern/export`
- `/ja/pattern/export`
- `/ko/pattern/export`

ルート `/` はデフォルト locale へリダイレクトされます。

## 図案ワークフロー

### 1. 画像から図案へ

画像を読み込むと、次の表示を生成できます。

- `Preview`
  量子化後のビーズ風プレビュー
- `Coded Chart`
  グリッドと色コード付きの図案
- `Coded Chart with Colors`
  コード図案と色ごとの粒数一覧
- `Source`
  元画像の参照表示

### 2. ボードサイズと画像エリア

生成時には次の 2 つを分けて扱います。

- `Board Size`
  最終的なビーズ盤面のサイズ
- `Image Area Size`
  元画像を配置して変換するための領域

画像はまず画像エリア内で配置され、その後ボード全体の中央に置かれます。余白部分は `H2` で埋められます。

これにより：

- 主題を中央に保ちやすい
- 大きいボードでも自然な余白を作りやすい
- 長方形ボードでも主題位置が崩れにくい

### 3. デフォルト設定

- デフォルトのボードサイズは `52 x 52`
- 正方形優先は初期状態でオン
- プリセット：
  - `52 x 52`
  - `104 x 104`
  - `52 x 104`
  - `104 x 52`

### 4. フィットモード

- `Contain`
- `Cover`
- `Stretch`

### 5. 色変換

このアプリは：

- `Mard221.csv` から色コードと HEX 値を読み込み
- ピクセル色を比較しやすい色空間へ変換
- 最も近いパレット色へ割り当て
- 必要に応じて近い色を許容値で統合

原画像への近さや見た目の滑らかさに応じて、サンプリング方式も切り替えられます。

## 大図案書き出し

スタジオから独立した大図案ページを開けます。

書き出しページには以下が含まれます。

- スタジオ幅に収まらない大きな図案表示
- 座標ラベル
- 任意タイトル
- ボードサイズと画像エリアサイズ
- 色コード表示のオン / オフ
- 図案下の色別粒数一覧
- 画像ダウンロード

このページでは、スタジオの現在設定から再描画するため、表示結果の整合性を保ちやすくなっています。

## 状態保持

### 現在のタブ内で保持されるもの

- ボードサイズ
- 画像エリアサイズ
- フィットモード
- 正方形優先と比率ロック
- 選択中タブ
- ズーム関連設定
- 画像タイトルなどの軽量設定
- 現在読み込んでいる画像

### 保存方法

- 軽量設定は `sessionStorage`
- 画像データは `IndexedDB`
- 同一タブ内での言語切替、テーマ切替、書き出しページ往復では画像を維持

### 保持しないもの

- ページやブラウザタブを完全に閉じた後の古い画像

これにより、大きい画像データを `sessionStorage` に直接保存せずに済み、容量超過を避けやすくしています。

## 国際化

`next-intl` を使用しています。

メッセージファイル：

- [messages/zh.json](/Z:/development/projects/typescript/fuse-beads-assistant/messages/zh.json)
- [messages/en.json](/Z:/development/projects/typescript/fuse-beads-assistant/messages/en.json)
- [messages/ja.json](/Z:/development/projects/typescript/fuse-beads-assistant/messages/ja.json)
- [messages/ko.json](/Z:/development/projects/typescript/fuse-beads-assistant/messages/ko.json)

## テーマ

全体で次の切替に対応しています。

- 言語
- ライト / ダーク / システム
- アクセントカラー

現在のアクセントカラー：

- `Peach`
- `Teal`
- `Violet`
- `Amber`
- `Rose`
- `Blush`
- `Mint`
- `Sage`

## 技術スタック

- Next.js 16 App Router
- React 19
- TypeScript
- Tailwind CSS v4
- shadcn/ui
- Base UI
- `next-intl`

## ディレクトリ構成

```txt
app/
  [locale]/
    page.tsx
    pattern/page.tsx
    pattern/export/page.tsx
  layout.tsx
  page.tsx

components/
  locale-switcher.tsx
  pattern-export-viewer.tsx
  pattern-studio.tsx
  theme-switcher.tsx
  titlebar-controls.tsx
  ui/

i18n/
  navigation.ts
  request.ts
  routing.ts

lib/
  bead-pattern.ts
  pattern-image-store.ts
  pattern-studio-state.ts

messages/
  zh.json
  en.json
  ja.json
  ko.json

public/
  Mard221.csv
```

## 主要ファイル

- 図案生成ロジック：
  [lib/bead-pattern.ts](/Z:/development/projects/typescript/fuse-beads-assistant/lib/bead-pattern.ts)
- スタジオ UI：
  [components/pattern-studio.tsx](/Z:/development/projects/typescript/fuse-beads-assistant/components/pattern-studio.tsx)
- 書き出しページ：
  [components/pattern-export-viewer.tsx](/Z:/development/projects/typescript/fuse-beads-assistant/components/pattern-export-viewer.tsx)
- 軽量状態保存：
  [lib/pattern-studio-state.ts](/Z:/development/projects/typescript/fuse-beads-assistant/lib/pattern-studio-state.ts)
- 画像保存：
  [lib/pattern-image-store.ts](/Z:/development/projects/typescript/fuse-beads-assistant/lib/pattern-image-store.ts)

## ローカル開発

依存関係のインストール：

```bash
pnpm install
```

開発サーバー起動：

```bash
pnpm dev
```

既定の URL：

```txt
http://localhost:3000
```

## 本番ビルド

```bash
pnpm build
pnpm start
```

## 今後の拡張候補

- 最大使用色数の制限
- 複数ボードへの分割
- 印刷ページ分割
- JSON / CSV 図案データの書き出し
- 別ブランドのパレット対応

## 状態

現在のバージョンは本番ビルド確認済みです。

```bash
pnpm run build
```

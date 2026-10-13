# AI Games

AIと一緒につくる、無料のブラウザゲーム集。ホームと全ゲームを同じリポジトリで管理する静的モノレポです。サーバー、外部API、ランタイム依存パッケージは不要です。

公開URL: https://luft256.github.io/AI-Games/

## ゲーム

| ゲーム | パス | 操作 |
| --- | --- | --- |
| ネオンスネーク | `games/snake/` | 矢印 / WASD、スワイプ、方向ボタン |
| マージ2048 | `games/merge-2048/` | 矢印、スワイプ、方向ボタン |
| メモリーマッチ | `games/memory/` | タップ、クリック、Tab + Enter |
| ブロックブレイカー | `games/breakout/` | 左右キー、ポインター、タッチ |
| マインフィールド | `games/minesweeper/` | クリック、右クリック、旗モード、矢印 + F |
| リアクションラボ | `games/reaction/` | タップ、クリック、Space |

ホームには検索、ジャンル、お気に入り、おまかせ起動があります。最高記録とお気に入りは `localStorage` にブラウザ単位で保存します。保存を禁止した環境でもゲームは動作します。

## 開発

Node.js 22以上（CIは24）。外部パッケージのインストールは不要です。

```sh
npm run dev      # http://127.0.0.1:4173/AI-Games/
npm test         # ゲームルール、検索、記録保存のテスト
npm run check    # 構文、ローカルリンク、6つのルートを検証
npm run build    # dist/ に公開ファイルを生成
npm run preview  # ビルド後のサイトを確認
```

ポートが使用中の場合は `PORT=4273 npm run dev` のように指定できます。プレビューは `/` と GitHub Pages の `/AI-Games/` の両方をサポートします。URLは相対パスなので、別のプロジェクト名でも配置可能です。

## 構成

```text
site/
  index.html             ホーム
  assets/                カタログ、ホームUI、SVG
  shared/                共通スタイル、ナビゲーション、記録保存
  games/<game-id>/        各ゲームのHTML、CSS、JS、純粋ロジック
scripts/                 ビルド、プレビュー、検証
tests/                  共通ロジックのテスト
.github/workflows/       PRチェック・GitHub Pages公開
```

各ゲームは独立したページで、直リンクや再読み込みも動作します。ゲームはGPT-6.1 sol（high）のサブエージェントが分担して制作しました。

## 新しいゲームを追加する

1. `site/games/<game-id>/` に `index.html`、`game.css`、`game.js` を作成します。HTMLから `../../shared/base.css` を読み込み、`#game-shell` とゲーム用の `main.game-layout` を置きます。
2. ESモジュールの `game.js` から `../../shared/game-shell.js` の `mountShell` を呼びます。`title`、`english`、`description`、`accent`、`controls` を渡してください。記録には `loadBest` / `saveBest` が使えます。
3. `site/assets/catalog.js` の `games` に登録し、`site/assets/home.js` の `artwork` にカードのSVGを追加します。ホームの件数はカタログから自動更新されます。新しいジャンルの場合はホームのフィルターボタンも追加します。
4. ゲームルールのテストを `logic.test.js` に置き、`npm test`、`npm run check`、`npm run build` とPC・スマホの動作確認を行います。

## ブランチ運用

`作業ブランチ → dev → ユーザー確認 → main → GitHub Pages公開` の順に進めます。

- `dev` は開発内容を集める統合ブランチです。新しい作業ブランチは最新の `dev` から `codex/<作業名>` として作成します。
- 通常のPRは `dev` をマージ先にします。必要な検証が成功した変更は、エージェントが `dev` まで統合できます。
- `dev` の内容をユーザーが確認し、その内容を `main` に反映する明示的な承認をした後に、`dev` → `main` のPRをマージします。承認前の自動マージ・直接pushは行いません。
- `main` は公開用です。`dev` やPRではテストとビルドだけを実行し、GitHub Pagesの本番公開は `main` からだけ行います。

エージェント向けの継続ルールは [AGENTS.md](AGENTS.md) に保存しています。

## GitHub Pages

Repository Settings → Pages → Source に **GitHub Actions** を指定します。`main` へのpushでテスト・リンク検証・ビルドを実行し、`dist/` を公開します。`dev` へのpushと `dev` / `main` 宛てのPRでは検証のみを行います。手動実行でも公開は `main` に限定されます。

ワークフローはGitHub公式の [custom workflows](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages) に沿い、公開ジョブだけに `pages: write` と `id-token: write` を付与しています。

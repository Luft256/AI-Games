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
| スタックタワー | `games/stack-tower/` | タップ、クリック、Space |
| スカイホップ | `games/sky-hop/` | タップ、Space、上キー |
| オービットドッジ | `games/orbit-dodge/` | 左右キー / A D、タッチ、ドラッグ |
| ライツアウト | `games/lights-out/` | タップ、クリック、矢印 + Enter |
| スライド15 | `games/slide-puzzle/` | タップ、クリック、矢印 |
| シーケンスメモリー | `games/simon/` | タップ、クリック、1〜4キー |
| ダイス探検 | `games/dice-expedition/` | ダイスとルートを選択、帰還／続行 |
| グラビティゴルフ | `games/gravity-golf/` | ドラッグ、方向キー、パワー、Space |
| エコーヴォールト | `games/echo-vault/` | 矢印 / WASD、Space待機、Nノイズ |
| カラーカスケード | `games/color-cascade/` | 隣接記号をタップ、矢印 + Enter / Space |
| カーゴスイッチ | `games/cargo-switch/` | 1〜3キー、経路ボタン、H待避 |
| リコシェリレー | `games/ricochet-relay/` | ドラッグ、照準キー、M選択 / R鏡回転、Space |

ホームには検索、ジャンル、お気に入り、おまかせ起動があります。最高記録とお気に入りは `localStorage` にブラウザ単位で保存します。保存を禁止した環境でもゲームは動作します。

## プレイ時間

全ゲームは1プレイ最大30分です。開始ボタンや最初の有効な操作から残り時間を計測し、一時停止・別タブの間も時間が進みます。30分で進行と入力を止め、結果と再挑戦を表示します。中断後に戻った場合も、次の操作前に時間切れを確認します。

途中終了したパズルのクリア時間・手数や、5回未完了の反応測定は自己ベストとして保存しません。スネークなどのスコアアタックでは獲得済みスコア、記憶ゲームでは完了した段階を記録します。ダイス探検・ゴルフ・潜入・反射リレーのキャンペーンは自然終了または全コース完了、連鎖パズルは20手終了、物流は本番シフト終了時に記録します。2048の達成後に続ける場合も、同じ30分の上限内です。新しいプレイを始めると上限をリセットします。

## 開発

Node.js 22以上（CIは24）。外部パッケージのインストールは不要です。

```sh
npm run dev      # http://127.0.0.1:4173/AI-Games/
npm run catalog  # 各ゲームのmetadata.jsonからホームを同期
npm test         # ゲームルール、検索、記録保存のテスト
npm run check    # 構文、ローカルリンク、全ゲームのルートを検証
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
3. `mountShell` の後に `../../shared/session-limit.js` の `createGameSession` を呼び、開始・自然終了・リセット・時間切れの処理を接続します。上限は最大30分にしてください。
4. ゲームのディレクトリに `metadata.json`（id、title、english、genre、label、description、color、time、number）と `thumbnail.svg`（viewBox: `0 0 360 200`）を置きます。numberは重複しない2桁以上の文字列、genreは action / puzzle / memory / reflex です。統合担当が `npm run catalog` でカタログ、ホーム件数、JavaScript無効時の直リンクを同期します。元の6ゲームの情報とイラストは既存のカタログ・home.jsに保持します。
5. ゲームルールのテストを `logic.test.js` に置き、`npm test`、`npm run check`、`npm run build` とPC・スマホの動作確認を行います。

## プレイ評価と改善

新作は実装担当とは別の評価チャットで実際に操作し、分かりやすさ、判断、上達、手応え、再挑戦する理由を確認します。具体的な指摘を修正してから統合します。AIによる評価は人間の楽しさの実証とは区別します。手順は [ゲーム品質の方針](docs/game-quality.md)、評価・修正の記録は `docs/playtests/` に残します。毎日9時（日本時間）のCodex自動実行で1〜3本を目安に制作し、重大な問題があれば追加本数より修正を優先します。

## ブランチ運用

`作業ブランチ → dev → ユーザー確認 → main → GitHub Pages公開` の順に進めます。

- `dev` は開発内容を集める統合ブランチです。新しい作業ブランチは最新の `dev` から `codex/<作業名>` として作成します。
- 通常のPRは `dev` をマージ先にします。必要な検証が成功した変更は、エージェントが `dev` まで統合できます。ゲームを追加する際は、ゲームごとに独立したブランチとPRを作成します。
- `dev` の内容をユーザーが確認し、その内容を `main` に反映する明示的な承認をした後に、`dev` → `main` のPRをマージします。承認前の自動マージ・直接pushは行いません。
- `main` は公開用です。`dev` やPRではテストとビルドだけを実行し、GitHub Pagesの本番公開は `main` からだけ行います。

エージェント向けの継続ルールは [AGENTS.md](AGENTS.md) に保存しています。

## GitHub Pages

Repository Settings → Pages → Source に **GitHub Actions** を指定します。`main` へのpushでテスト・リンク検証・ビルドを実行し、`dist/` を公開します。`dev` へのpushと `dev` / `main` 宛てのPRでは検証のみを行います。手動実行でも公開は `main` に限定されます。

ワークフローはGitHub公式の [custom workflows](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages) に沿い、公開ジョブだけに `pages: write` と `id-token: write` を付与しています。

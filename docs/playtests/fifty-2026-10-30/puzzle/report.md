> 集約注記（2026-10-30）: 元レポートは `/Users/kamimurasora/workspace/luft256/AI-Games/artifacts/resume-puzzle-review/report.md`。本文の評価対象HEAD・実操作・補助・未評価範囲を維持した。JSONはこのフォルダの同名ファイルを参照。スクリーンショットと実行scriptは同梱せず、存在を確認できたものだけ元primaryの絶対パスへリンクした。ワイルドカード/範囲表記の画像群も未同梱。これらローカルリンクは別環境で利用できる保証がない。JSON内部の生成時パスは原記録として保持し、集約先対応は [保存元一覧](../provenance.json) を参照。

> 後続修正: crate-balanceの終了後予告は元評価後に修正された。[作者確認](crate-preview-author-verification.md) と [検証JSON](crate-fix-verification.json) を別保存。これは修正後の独立再評価を意味しない。

# Independent puzzle browser review — games 25–29

Reviewed 2026-10-30 against the exact staged PR heads below. No game source, Git branches, or integration state was changed. **No blocker observed in tested scope.** These are AI diagnostic ratings, not evidence of human enjoyment.

Scores are 理解 / 選択 / 上達 / 手応え / 再挑戦, each 1–5.

## gear-link

PR: https://github.com/Luft256/AI-Games/pull/54  
Head: `c296eaea13ec6f6655f3e163981fb0568d6a59cd`  
Scores: **4 / 4 / 4 / 3 / 3** (18/25).

Unassisted first room: 置いた曲がり部品がSへ向かず、動力0/5・未接続口4と表示。やり直して上側へ回り込む5部品を置き、5手クリア。

Observation: S→右→上→右→右→下→右の経路を、4つの曲がりと1直線で作る判断が必要。初回の不接続から向きを修正できた。

Nonblocking improvement: 部屋1で3行2列へ初期向き┌を置く→Sと接続しないが、記号だけでは開口方向を読み直す必要がある→つながる位置の理解が少し遅れる→セルの境界まで伸びる配管描画、または開口方向の矢印を加える。

## tile-quilt

PR: https://github.com/Luft256/AI-Games/pull/59  
Head: `8514f41a66aa36d33e33abe0db62acb522d95e91`  
Scores: **4 / 4 / 4 / 4 / 3** (19/25).

Unassisted first room: Aを3行4列へ置いてはみ出しの拒否を確認。やり直し後、Aを1行1列、Bを1行3列、Cを3行1列へ置き3手クリア。

Observation: 初回の基準マスと形の予告が理解を助けた。後半は5〜6ピースの向きと隙間の形を合わせる必要があり、単なる配置ボタンではない。

Nonblocking improvement: 読み込み直後に数字2/Rを押す→状態は変わらない。盤面セルへフォーカスした後は数字/Rが効く→キーボード操作を使い始める手順が分かりにくい→「盤面にフォーカスしてから」と説明し、明確な盤面フォーカス導線を付けるか、入力欄以外でショートカットを受ける。

## crate-balance

PR: https://github.com/Luft256/AI-Games/pull/60  
Head: `48079a43995968d2353fcac86776f3183336d789`  
Scores: **4 / 4 / 4 / 4 / 3** (19/25).

Unassisted first room: C重さ2を左距離3へ置き、トルク-6・許容±2で倒れる自然失敗。再開してA左2/B右2/C左1/D右1の順に置き4手クリア。

Observation: 予告トルクと安全/危険の色分けを使い、左右を打ち消しながら最後0へ戻す順番を考えた。後半は重さ5、全6箱でも実際にクリア可能。

Nonblocking improvement: 部屋1でCを左3へ置き失敗→失敗文は許容±2だが上部は「次の許容±3」と表示→停止済み状態で基準が二つ見え、どちらで倒れたかの読み取りを妨げる→失敗時は「今回の許容±2・終了」と表示し、次手予告を隠す。

## constellation

PR: https://github.com/Luft256/AI-Games/pull/61  
Head: `9c0f93e73c733b4f9593036b265ef4436dbdcbf3`  
Scores: **4 / 4 / 4 / 4 / 3** (19/25).

Unassisted first room: 1→3→4→5→3で4手後に未使用3本を残す行き止まり。やり直し後1→2→4→1→3→5→4→3で7手クリア。

Observation: 線を使い切る前にゴールへ戻ると残りが孤立する、という失敗理由が具体的。残本数と進める星の輪郭が立て直しを助けた。

Nonblocking improvement: ページを開いて数字3を押す→0手のまま。星セルへフォーカスすると番号キーで移動→説明された入力が反応しないように見える→盤面フォーカス手順を明記し、キー操作中のフォーカスを保つ。

## time-switch

PR: https://github.com/Luft256/AI-Games/pull/63  
Head: `3a2d51e39aa1c474fed65d41827776d0c8daed52`  
Scores: **4 / 5 / 4 / 4 / 4** (21/25).

Unassisted first room: 初回に影を下3手だけ録り、再生で下方向を続けて7再生手・合計11手で自然クリア。次に下/待つ/下/下/待つを録り、下5手で同じ合計11手クリア。

Observation: 影の録画と自分の移動が別段階で、待機を録ると扉通過のタイミングを変えられる。A/Bから後半のCへ拡張され、他4作と異なる計画が必要。

Nonblocking improvement: 読み込み直後に↓を押す→影は動かず再生ボタンも無効のまま。盤面にフォーカス後は↓で録画できる→キーボード説明だけを読んだ初回が止まる→フォーカス手順を説明するか、ゲーム領域の操作ボタンからも同じキー入力を受ける。

## Shared browser evidence and limits

- All 28 rooms were cleared by actual Playwright clicks against the static project-subpath routes. Room1 initial strategies were planned using UI/instructions only; subsequent rooms used exported puzzle solutions/solver/witnesses and actual UI execution. See [supplemental.json](supplemental.json) (28 clears, no page or missing-resource errors).
- All five: 320px viewport, actual `.tap()` changes moves0→1; document width320, game width280, board254. Full mobile screenshots were visually inspected. Crate beam labels are small, but larger distance buttons provide usable controls. No horizontal overflow or obscured essential control observed.
- Actual focused PC keyboard input changes moves0→1 in every game. Body-level shortcuts in constellation/time-switch initially did nothing; this is the focus finding above, not a loading error.
- Pause/resume changes labels correctly. With a started partial room and pause active, a Date.now offset of30min+1ms followed by visibilitychange yields expired status, leaves moves at1, and empty storage. An attempted post-expiry board tap cannot advance the board. Restart restores30:00.
- Each first room also clears when Storage.prototype.getItem/setItem throw SecurityError. No page errors; game remains playable.
- Next-room button moves room1→2 with moves0 and idle session. A separate return/focus check expires overdue rounds. Headless Chrome still reports document.visibilityState=`visible` when another tab is frontmost, so this is **not** evidence of genuine hidden-tab suspension. Actual OS-hidden state and physical-device touch are untested. Synthetic visibilitychange and focus events exercise return hooks.
- Time-switch: 20min elapsed in recording, then replay starts with10:00 remaining; another10min+1ms expires the same session. Separate one-wait recording followed by40 waits ends naturally at its40-turn limit.
- Timer stoppage is additionally confirmed by source inspection: shared session clears its timeout on expiry/finish; these turn-based games have no simulation loop. Real30-minute waiting was not performed.
- [first-play.mjs（未同梱）](/Users/kamimurasora/workspace/luft256/AI-Games/artifacts/resume-puzzle-review/first-play.mjs) first keyboard-only constellation/time attempt had no board focus and later hit a disabled replay-button timeout; that harness run aborted before saving its planned text log. Screenshots preserve gear/tile/crate first-play observations. [remaining-first-play.json](remaining-first-play.json) contains successful constellation and time-switch UI plays. Its time-switch phase named `actual-failure` actually cleared in7 playback turns; this label is erroneous and **must not** be counted as a failure. The later genuine40-turn failure is in [extra-checks.json](extra-checks.json) and its screenshot.
- Later rooms were browser-cleared with assistance and are not rated as unassisted discovery or timed difficulty. Human enjoyment, screen readers, and real mobile hardware remain unassessed.

Files: [summary.json](summary.json), [supplemental.json](supplemental.json), [boundaries.json](boundaries.json), [extra-checks.json](extra-checks.json), [remaining-first-play.json](remaining-first-play.json), initial/mobile/final-room and failure screenshots are not bundled here; they remain in the primary source directory identified in the archive note.

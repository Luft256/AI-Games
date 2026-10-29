> 集約注記（2026-10-30）: 元レポートは `/Users/kamimurasora/workspace/luft256/AI-Games/artifacts/resume-arcade-review/report.md`。本文の評価対象HEAD・実操作・補助・未評価範囲を維持した。JSONはこのフォルダの同名ファイルを参照。スクリーンショットと実行scriptは同梱せず、存在を確認できたものだけ元primaryの絶対パスへリンクした。ワイルドカード/範囲表記の画像群も未同梱。これらローカルリンクは別環境で利用できる保証がない。JSON内部の生成時パスは原記録として保持し、集約先対応は [保存元一覧](../provenance.json) を参照。

> 後続修正: 元評価後の表示修正の作者QAは [display-fix-qa-results.json](display-fix-qa-results.json) に別保存した。元レポートの旧HEADでの指摘・評点は履歴として残す。最新HEADへの独立再確認は統合担当の別記録を参照。期限の原始結果は今回同梱せず、訂正版 [technical-corrected.json](technical-corrected.json) を優先する。

# Independent browser playtest — games 31 and 35–40

Chrome via Playwright; first instructions-only attempts where stated, then source-assisted real browser keyboard/touch input. No hidden model mutation. All five scores are diagnostic AI observations, not evidence of human enjoyment.

All reviewed game index.html/game.js/purelogic.js/game.css match the exact PR heads in [exact-heads.json](exact-heads.json). No blocking defect found. Ratings order: 理解 / 選択 / 上達 / 手応え / 再挑戦.

## 31 grappling-garden

PR: https://github.com/Luft256/AI-Games/pull/37 · codex/game-grappling-garden · 991e9ec2e7ee0273f2a6206819313600d723f90c

Scores: 3 / 4 / 4 / 4 / 4

説明だけで開始。右を押しSpaceを100msおきに5秒間連打すると、フック1/3・0点のまま、速度532/220となり接続できず、残り1回。旧連打攻略は通らない。

表示された方向へ押し、距離200px以内で離して減速し、接続可でSpace。3・4庭の往復も含め4庭を1080点・残3回で完走（実時間約13秒）。全クリアはソース確認後のHUDフィードバック操作。

- 理解 3/5: 方向・速度・距離・充填の説明が密で、初回は閾値の扱いに学習が必要。
- 選択 4/5: 押し続ける操作は失敗し、近づいたら離す判断で成功した。
- 上達 4/5: 失敗時に距離不足・速度超過・充填中の理由が示される。
- 手応え 4/5: 接続可の文字・円の色と接続40点が入力結果を示す。
- 再挑戦 4/5: 4庭の左右反転と往復で同じ調整を試せ、もう一度ですぐ開始。

Evidence: [grapple-spam.png（未同梱）](/Users/kamimurasora/workspace/luft256/AI-Games/artifacts/resume-arcade-review/grapple-spam.png), [grapple-feedback.png（未同梱）](/Users/kamimurasora/workspace/luft256/AI-Games/artifacts/resume-arcade-review/grapple-feedback.png)

## 35 dash-circuit

PR: https://github.com/Luft256/AI-Games/pull/49 · codex/game-dash-circuit · 5c2cac18e4fbda61c4a1cd40b81198c029ec82c6

Scores: 4 / 3 / 4 / 4 / 3

操作説明を読み、初回実操作の前にpurelogicも読んだため、ソース非参照の初回評価ではない。充填750msおきにSpaceを3回押しシールド切れ・0点。

壁を避ける上下・横ノード選択と緑の安全窓を使い、6部屋2040点・シールド3を維持して完走。待機時間はソース由来の位相で計算した補助プレイ。

- 理解 4/5: 緑のみ安全とノード選択が明示され、接触理由も具体的。
- 選択 3/5: 経路は壁によりほぼ決まり、主な判断は緑の瞬間を待つこと。
- 上達 4/5: 無造作な連打失敗と安全窓成功の差が明確。
- 手応え 4/5: 赤黄緑とDASH表示、到着40点が分かりやすい。
- 再挑戦 3/5: 部屋ごとに壁が反転するが、同じ経路が繰り返される。

Evidence: [dash-assisted.png（未同梱）](/Users/kamimurasora/workspace/luft256/AI-Games/artifacts/resume-arcade-review/dash-assisted.png)

## 36 paint-sprint

PR: https://github.com/Luft256/AI-Games/pull/53 · codex/game-paint-sprint · 7fddbdbf6beac697186ae356a015b6819740bd05

Scores: 4 / 4 / 4 / 4 / 4

初回実操作の前にpurelogicも読んだ。20秒無移動では敵に当たり残2回・現在0/96。

左550ms・上450・右1200・下900・左1350・上900の輪で最大68点/現在63へ。敵による消去を観察。再試行は左700・上560・右1470・下980・左1470・上980の外周で70%達成、86点・残3回（約5秒）。

- 理解 4/5: 新しい8マス以上から戻る輪と70%目標が文章で明確。
- 選択 4/5: 敵の予告行を避けることと大きな囲いを狙う経路判断がある。
- 上達 4/5: 無移動で被弾し、輪を広げることで65%→70%超へ改善。
- 手応え 4/5: LOOP表示と面の一括塗り、敵の消去が盤面に現れる。
- 再挑戦 4/5: 短い成功と90秒上限、囲み方を変える余地がある。

Evidence: [paint-loop.png（未同梱）](/Users/kamimurasora/workspace/luft256/AI-Games/artifacts/resume-arcade-review/paint-loop.png), [paint-natural.png（未同梱）](/Users/kamimurasora/workspace/luft256/AI-Games/artifacts/resume-arcade-review/paint-natural.png)

## 37 pinball-orbit

PR: https://github.com/Luft256/AI-Games/pull/57 · codex/game-pinball-orbit · c8a47eb4f2a048bb9823c308a354630cb5796a8b

Scores: 4 / 3 / 3 / 4 / 3

説明だけでSpace発射。2.5秒待って左右を180msおきに交互30回操作、目標2/3で停止。

交互入力を続けた3球自然終了1000点。発射だけでフリッパー無操作でも1010点/約43秒。描画された球の座標だけを読み、落下中y>285の側のフリッパーを押す補助操作42回で1030点/約28秒。上達の差は小さい。

- 理解 4/5: 3球・Space発射・左右フリッパー・光る順ターゲットは分かりやすい。
- 選択 3/5: 入力で反射・球の寿命は変わるが、無操作でも高得点になった。
- 上達 3/5: 球位置を読む試行で+20点。狙った軌道へ上達した強い証拠は得られなかった。
- 手応え 4/5: 球・バンパー・フリッパーの反応と100点加点は見える。
- 再挑戦 3/5: 3球で自然に終わり即再開可能。明示的なショット課題があると再挑戦動機が強まる。

Evidence: [pinball-firstplay.png（未同梱）](/Users/kamimurasora/workspace/luft256/AI-Games/artifacts/resume-arcade-review/pinball-firstplay.png), [pinball-natural.png（未同梱）](/Users/kamimurasora/workspace/luft256/AI-Games/artifacts/resume-arcade-review/pinball-natural.png), [pinball-visual.png（未同梱）](/Users/kamimurasora/workspace/luft256/AI-Games/artifacts/resume-arcade-review/pinball-visual.png)

## 38 shadow-shift

PR: https://github.com/Luft256/AI-Games/pull/58 · codex/game-shadow-shift · 9400d3ba7e163d7f78c328704f186657bb1f83aa

Scores: 4 / 3 / 3 / 4 / 3

説明だけで右を押し、Space→300ms→X→350msを繰り返すとステージ1で5落下・終了。

ソースを読み、足場の色に合わせるジャンプ間隔へ変更。青・桃・青・桃・共通の足場を渡る同じ手順で5面1200点・残5回。割当時の新配置は存在せず、親担当確認により9400dを対象とした。

- 理解 4/5: 実線と点線、青/桃の現実という説明で目標を理解できる。
- 選択 3/5: 空中切替と着地位置の判断は機能する。
- 上達 3/5: 無計画な切替は落下し、着地待ちで改善した。
- 手応え 4/5: 足場の実線化と色、落下メッセージが結果を示す。
- 再挑戦 3/5: 5面とも同じ色順・x配置で、高さだけ小さく変わるため攻略の反復が中心。

Evidence: [shadow-firstplay.png（未同梱）](/Users/kamimurasora/workspace/luft256/AI-Games/artifacts/resume-arcade-review/shadow-firstplay.png), [shadow-assisted.png（未同梱）](/Users/kamimurasora/workspace/luft256/AI-Games/artifacts/resume-arcade-review/shadow-assisted.png)

## 39 rhythm-forge

PR: https://github.com/Luft256/AI-Games/pull/64 · codex/game-rhythm-forge · f49777425dd516e5d4700d42503b2425afe4c2d0

Scores: 4 / 4 / 4 / 4 / 4

説明だけで開始し1.2秒でSpace、0.5秒後600ms長押し。早すぎる入力は得点にならず停止。

27秒無入力は品質0/0/0/0/0・0点。再開し30打刻を3秒開始・800ms間隔、長押し450〜570msで押し離すと3354点（672/672/674/668/668）。全30打刻の時刻はソースから取得し、Playwright時計で補助。

- 理解 4/5: 線とTAP/HOLD、押す・離すが文章で示される。
- 選択 4/5: 単打と長押し終端の違いで操作結果が変わる。
- 上達 4/5: 早い/遅いと誤差msが出て、0点から3354点へ改善した。
- 手応え 4/5: JUST/HOLD/RELEASEと品質の加点が即応する。
- 再挑戦 4/5: 27秒で自然終了し、補正±20msと品質スコアを狙い直せる。

Evidence: [rhythm-firstplay.png（未同梱）](/Users/kamimurasora/workspace/luft256/AI-Games/artifacts/resume-arcade-review/rhythm-firstplay.png), [rhythm-assisted.png（未同梱）](/Users/kamimurasora/workspace/luft256/AI-Games/artifacts/resume-arcade-review/rhythm-assisted.png)

## 40 wind-archer

PR: https://github.com/Luft256/AI-Games/pull/65 · codex/game-wind-archer · edf1cda672b8dc4c124272106e376d058d157e13

Scores: 4 / 4 / 4 / 4 / 4

説明だけで45度・力50で発射。飛行中に角度/力を押しても「飛行中」となり飛行中は照準を変更できないと分かった。

45度・力50の発射から途中53度へ変更して6ラウンド3/6・400点。ソースの弾道と動く的を使う照準補助後、35/85、47/50、29/80、53/55、53/45、39/55で1射ずつ6/6・900点。実際のキーボード入力で射撃し隠し状態は変更していない。

- 理解 4/5: 角度・力・風と3射/的が明示され、点線軌道もある。
- 選択 4/5: 射る時刻・角度・力で当たり方が変わる。
- 上達 4/5: 外れた弾道を見直す試行と、照準補助で命中差を確認。
- 手応え 4/5: 矢の軌跡・命中・残弾・加点が見える。
- 再挑戦 4/5: 6ラウンド後すぐ再開でき、少ない矢で得点を上げる目標がある。

Evidence: [wind-firstplay.png（未同梱）](/Users/kamimurasora/workspace/luft256/AI-Games/artifacts/resume-arcade-review/wind-firstplay.png), [wind-natural.png（未同梱）](/Users/kamimurasora/workspace/luft256/AI-Games/artifacts/resume-arcade-review/wind-natural.png), [wind-aimed.png（未同梱）](/Users/kamimurasora/workspace/luft256/AI-Games/artifacts/resume-arcade-review/wind-aimed.png)

## Findings (non-blocking)

- P3 dash-circuit, paint-sprint — 終了メーターが直前のフレームを残す
  - Reproduction: DashをSpace3回で失敗、またはPaintで目標の輪を完成させる。
  - Observation: Dashの状態はシールド切れでもメーターは1。Paintの結果86/96に対しメーター85/96。
  - Impact: 終了理由と数値がわずかに食い違う。
  - Improvement: inputで終端化した際とstepのdone即return前にメーターを更新する。
- P3 shadow-shift — 5面の色順と経路が同じ
  - Reproduction: 青→桃→青→桃→共通の同じジャンプ手順を5面で繰り返す。
  - Observation: 5面を同じ移動・切替タイミングで落下ゼロでクリア。
  - Impact: 色を読む判断が初回以降は記憶した入力の反復になりやすい。
  - Improvement: 後半の足場色順・横間隔・共通足場の配置を変え、可解性と初見での読みやすさを再プレイする。
- P3 rhythm-forge — 無入力品質0でも全作品完成と表示
  - Reproduction: 開始後27秒入力しない。
  - Observation: 作品5/5、5作品の鍛造完了、品質0/0/0/0/0。
  - Impact: 品質スコアの練習としては成立するが、製作成功したという印象が目標とずれる。
  - Improvement: 終了を「鍛造練習終了」とし、品質0は未完成/失敗品として成功と区別する。
- P3 pinball-orbit — 無操作と狙った操作の得点差が小さい
  - Reproduction: 同じ3球を発射し、フリッパー無操作と球の下降位置で押す試行を比較する。
  - Observation: 無操作1010点、交互1000点、表示球位置反応1030点。
  - Impact: 今回の試行ではフリッパー上達の報酬が弱く、受動的に点が入る印象が残る。
  - Improvement: 狙う場所や発射軌道、連続ターゲット報酬を調整し、意図したショットが無操作より有利になることを独立再確認する。

## Technical coverage and limitations

[technical-corrected.json](technical-corrected.json) supersedes first [technical-results.json（未同梱）](/Users/kamimurasora/workspace/luft256/AI-Games/artifacts/resume-arcade-review/technical-results.json) for expiry. All 7: actual 320px taps, <=320 document width, >=44px controls, pause freeze, simulated hidden pause, paused/hidden 30-minute expiry, ignored post-expiry input, unchanged score/storage, restart, storage-blocked start/pause. Hidden state was simulated; 30 real minutes were not waited. Mobile whole-game wins were not evaluated.

- Dash and Paint purelogic was read before their first actual gameplay; neither has a source-blind initial-play claim.
- All complete wins are source-assisted and most use accelerated Playwright clock. This verifies rules/control paths, not ordinary human success rate.
- Pinball visual controller reads only rendered ball arc coordinates; grapple controller reads rendered DOM HUD.
- No human enjoyment assessment, no real device testing, no actual OS tab-switch test; document.hidden event simulated.
- Browser-only review; npm test/check/build and repository integration were not performed by this reviewer.
- Game source/Git/Issues untouched. Reports and scripts only written beneath artifacts/resume-arcade-review/.

Additional mobile holds: Chrome CDP touchStart/touchEnd (actual browser touch events, not dispatched DOM events) held Grapple right for 500ms: speed72→412 and distance370→299. Rhythm first HOLD pressed/released for450ms earned135 points (-26ms). With localStorage getter throwing SecurityError, a positive99-point rhythm round finished naturally without page errors. See [mobile-holds-results.json](mobile-holds-results.json).

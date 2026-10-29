> 集約注記（2026-10-30）: 元レポートは `/Users/kamimurasora/workspace/luft256/AI-Games/artifacts/resume-catcher-current-flight/review.md`。本文の評価対象HEAD・実操作・補助・未評価範囲を維持した。JSONはこのフォルダの同名ファイルを参照。スクリーンショットと実行scriptは同梱せず、存在を確認できたものだけ元primaryの絶対パスへリンクした。ワイルドカード/範囲表記の画像群も未同梱。これらローカルリンクは別環境で利用できる保証がない。JSON内部の生成時パスは原記録として保持し、集約先対応は [保存元一覧](../provenance.json) を参照。

> 過去の `/tmp` は消失している。10月15日の数字は本文が明記する会話由来の要約であり、今回保存した画像/JSONで当時の生データを再現できるとは扱わない。今回も本物の非表示タブ停止は未確認で、期限試験はClockによる時間前進として読む。

# 32〜34 独立プレイ再評価
2026-10-30 JST。ゲームソース・Git・PR・Issueを変更せず、定期実行も作成していません。
AI評点は診断材料であり、人間の楽しさの実証ではありません。

## 対象と結論

|対象|PR|評価スナップショット|
|---|---|---|
|32 comet-catcher|39|ecc1789d630912a1920002a51d220f98c45355db|
|33 bubble-current|42|24694b55cab30d2a1fe5e610f8c30018fdd71ae6|
|34 ember-flight|44|a2408a363f6f5faea9d175452497ef11d3776a55|

artifacts/fifty-stage/site を既存helper経由で /AI-Games/ の静的Pagesパスとして実行しました。

|ゲーム|理解|選択|上達|手応え|再挑戦|
|---|---:|---:|---:|---:|---:|
|コメットキャッチャー|4|3|4|4|3|
|バブルカレント|4|4|4|3|4|
|エンバーフライト|4|4|4|4|4|

34の旧P1「開始時Space1回だけで体力最大のまま完走」は修正を確認。単発・無操作・上昇保持・連打は門1で失敗し、高度調整によって上下両ルートを完走できました。今回の範囲で残るP1は観測していません。

## 過去観察と評価方法

10月15日の会話では32は初回75→PC725点、33は初回240→補助操作で1100点、34は単発Space放置で1250点でした。旧/tmpは消失しているため、この要約は会話記録に基づきます。今回の観察・画像・QAは元primaryの証跡ディレクトリへ新規保存しました（この集約にはJSONとレポートのみ同梱）。

今回の再評価は以前の知識を引き継ぎ、34の新ソースも参照しています。新規の完全初見ではありません。
- 実Chrome headless/Playwright。PC1280×900、320×800＋hasTouch。
- 32: 既知の発生周期に合わせ、CDP touchStart/Move/Endで防御線を描く補助操作。
- 33: 描画された泡・金の輪のピクセルと移動量を読み、早めに方向を変えるクリック/tap。
- 34: HTMLメーターの距離・高度・体力・次門の必要高度を読み、Up/Down/滑空を切り替え。
内部モデルのs・座標・速度は取得/変更していません。期限・保存禁止・固定入力の一部はClockで加速。ゲームのlogic関数だけを直接実行してプレイ評価の代わりにはしていません。

## 32 コメットキャッチャー

PCで左右・上下・Spaceを入力し、防御線展開を確認。開始直後の盤面は上端114.6px、高さ670.8pxで900px画面内に収まり、前回の開始時スクロール問題の改善を確認しました。

不足していた320pxの全90秒を実施。開始約5.2秒後から3.75秒ごとに中央の下方へ200px相当の線をタッチ描写し、90秒で自然終了。街0/3/0、775点。前回PC725点の山形160px線より広い水平線のため、単なる端末差とは扱いません。

点線・寿命・街耐久を読み、資源を残して到達時刻へ合わせると結果が変わります。一方、周期を覚えると一定戦略で90秒を通せるため、選択と再挑戦の深さは3点。775点が最高得点という証明はしていません。

P2: 資源回復の説明
再現: 3本を連続使用→3秒進める。
観察: 資源1.0/3。最新でも「資源3本は3秒で回復」と表示。
影響: 3秒で全回復するとも読め、初回に使い切りやすい。
改善: 「3秒で1本回復、最大3本」と明記する（満タンまで最大9秒）。

証跡: [comet-pc-start.png（未同梱）](/Users/kamimurasora/workspace/luft256/AI-Games/artifacts/resume-catcher-current-flight/comet-pc-start.png)、[comet-touch-result.png（未同梱）](/Users/kamimurasora/workspace/luft256/AI-Games/artifacts/resume-catcher-current-flight/comet-touch-result.png)、[observations.json](observations.json) の cometTouch90/cometResource。

## 33 バブルカレント

ArrowRight/Space/ArrowLeft/P、再開・リセットを個別操作。水流回転・強流・停止を確認しました。再挑戦は輪の位置だけでなく泡の慣性を見て先回りする画面読み取り補助を使用。

|操作|自然終了|
|---|---|
|PCの適応クリック|5水路、1100点、泡5、残り104秒|
|320pxの適応tap|5水路、1100点、泡5、残り103秒|
|初期水流のままSpaceを250msごとに連打|第2水路、480点、泡0、残り101秒|
|初期水流で無操作（保存禁止テスト）|第1水路、300点、泡0|

今回の放置・連打では適応操作の全5水路クリアを代行できませんでした。すべての固定角度・入力列を探索したわけではありません。

金色の次の輪と赤いサンゴは理解しやすく、慣性を見た早めの旋回という学べる技能があります。前回の初回失敗から全水路への改善も整合。次の水路や残る泡数が再挑戦の目標になります。

P2: 破裂した位置と最後の理由
観察: 途中は「壁・赤いサンゴの手前で水流を変えよう」、終了は「水路探索終了」という共通文言。
影響: 泡が即座に初期位置へ戻り、接触箇所を見逃すと修正しにくい。
改善: 接触位置を短く光らせ、最後の原因と到達水路を結果へ残す。
証跡: [bubble-keyboard-pause.png（未同梱）](/Users/kamimurasora/workspace/luft256/AI-Games/artifacts/resume-catcher-current-flight/bubble-keyboard-pause.png)、[bubble-pc-result.png（未同梱）](/Users/kamimurasora/workspace/luft256/AI-Games/artifacts/resume-catcher-current-flight/bubble-pc-result.png)、[bubble-touch-result.png（未同梱）](/Users/kamimurasora/workspace/luft256/AI-Games/artifacts/resume-catcher-current-flight/bubble-touch-result.png)、観察JSON。

## 34 エンバーフライト：旧P1修正確認

|固定入力|今回の結果|
|---|---|
|開始時Space1回、その後無操作|門1、133点、実高度278m|
|完全無操作|門1、133点、実高度239m|
|Up保持|門1、133点、実高度430m|
|Spaceを250msごとに連打|門1、133点、実高度411m|

門1の必要高度315〜375mまたは130〜190mと、失敗時の実高度が表示されました。単純入力で完走する問題が再現しなくなり、何を変えるべきかも分かります。

上ルート（PC）では予告の上側高度を狙ってUp/Down/滑空を切り替え、3門・ルート点300・体力98・1348点で完走。
下ルート（320px）では下側の高度を狙うタッチ長押し/離す操作で、3門・ルート点180・体力90・1220点で完走。
狭い高得点側と広い安全側を選ぶ結果が現物で成立し、特に門2以後は下降風と次門への高度変更が必要です。

理解4: 次門の必要高度と実高度が判断に結び付く。
選択4: 上下開口・加点と、姿勢/滑空/体力に選択がある。
上達4: 単発入力の失敗高度から開口への調整へ進める。
手応え4: 通過点と高度比較、体力の反応が読める。
再挑戦4: 安全側から高得点側への移行、終了時体力を残す目標がある。

P3案: 320pxでルート点文字は約7px相当。HUDにも「上+100 / 下+60」を併記すると選ぶ前に読みやすい。高度予告はHUDで読め、今回のタッチ完走は妨げていません。

証跡: [ember-single-space-failure.png（未同梱）](/Users/kamimurasora/workspace/luft256/AI-Games/artifacts/resume-catcher-current-flight/ember-single-space-failure.png)、ember-upper-gate1〜3.png、[ember-upper-result.png（未同梱）](/Users/kamimurasora/workspace/luft256/AI-Games/artifacts/resume-catcher-current-flight/ember-upper-result.png)、ember-lower-touch-gate1〜3.png、[ember-lower-touch-result.png（未同梱）](/Users/kamimurasora/workspace/luft256/AI-Games/artifacts/resume-catcher-current-flight/ember-lower-touch-result.png)。

## 30分期限・未完了非保存

得点獲得→Pで停止→Clockを30分相当進める→さらに2秒とSpace入力。
|対象|途中→期限後得点|BEST|保存キー|
|---|---:|---:|---|
|32|25→25|0|null|
|33|60→60|0|null|
|34|20→20|0|null|

全て「30分になったため終了。途中の記録は保存しません」。期限後の追加コールバック・入力による加点なし。各slug-expiry.pngを保存しました。

## 保存禁止

localStorage getterをSecurityErrorにした別環境でも、入力・自然終了が停止せず:
|対象|結果|画面BEST|reload後|
|---|---|---:|---:|
|32|全街喪失、25点|25|0|
|33|第1水路・泡0、300点|300|0|
|34|門1失敗、133点|133|0|

最新34の保存禁止環境は失敗時の保存試行まで。全3門成功時の保存禁止は再試行していません。30分終了の非保存は上の通常保存環境で別に検証しています。

## 証跡・範囲

3本とも320pxで横はみ出しなし、canvas278×177.6px。32の90秒、33の5水路、34の下ルートを実タッチ入力で完了しました。
物理スマホ、人間の反応速度、実時間30分放置、OS休止からの復帰は未評価。npm test/check/buildは統合担当の範囲で実行していません。

- [observations.json](observations.json): 観察・制御ログ・期限・保存禁止・固定入力・viewport。
- [manifest.json](manifest.json): 対象3PRのコミット。
- [qa.mjs（未同梱）](/Users/kamimurasora/workspace/luft256/AI-Games/artifacts/resume-catcher-current-flight/qa.mjs): ember-upper / ember-lower-touch / ember-single / bubble-pc / bubble-touch / comet-touch を引数にして再現補助を実行。replay-<時刻>へ保存し、既存証跡を上書きしません。

QA注記: 初回のタッチ補助は指を開始する前にTouchEndを送り、Chrome入力APIエラーで中断。補助を修正し下ルートを再実行しました。ゲームソースは未変更で、ゲームの不具合に数えていません。上1348点と単発133点は先行プロセスの実操作出力・保存画像からJSONへ転記したことを明記。他の結果は終了時に直接JSON保存しました。

未マージのためIssueは作成せず、残るP2/P3を制作・統合担当へ渡す記録です。

# 50本構成：新作32本の評価記録索引

2026-10-30集約。既存18本に追加する19〜50番の32新作について、PRと評価範囲をたどる索引。これは保存済みレビューの編集・同梱であり、新たな独立プレイ、全作品の一括合格、マージ完了、公開承認を意味しない。`main`への公開判断は別途行う。

## 記録の読み方

- 独立初回は実装作者以外が説明・画面から実操作した範囲。初回後のソース、解答、可視候補探索、HUD読取り、時計補助は各レポートで区別する。特にDash/Paintは最初の操作前にソース参照済み。
- スコアや成功経路は観察例であり、人間の楽しさ・成功率を実証しない。AIの5観点評点は診断材料で、合計点だけを合否にしない。
- 30分試験の大部分はDate.now/Playwright Clockの時間前進と模擬visibilitychange/focus。実時間30分放置、本物の非表示タブ停止、実機スマホを確認したとは扱わない。既存ReefのCDP timer凍結復帰もネイティブ非表示状態とは区別する。
- 同梱対象は4系統のレポートと追跡可能なJSON。画像/script/巨大npmログは未同梱で、元primaryの絶対パスを明示。消失した旧`/tmp`成果物が存在するとは書かない。原JSONの生成時パスは保持した。[保存元とハッシュ](provenance.json)で同梱先を追跡できる。
- 評価HEADと後続修正HEADは別。旧HEADの指摘を修正後まで未解決と断定せず、作者QAを独立再評価と混同しない。最終統合状態・修正後の再確認は統合担当の別記録に従う。

## 32新作のPR・実操作範囲

|番号|ゲーム / PR|評価範囲|具体的な観察|
|---:|---|---|---|
|19|レーザーラボ / [#35](https://github.com/Luft256/AI-Games/pull/35)|[既存の独立記録](../fifty/laser-lab.md)|通常6室、予測1室をPC/320px/キーで確認。予測2〜6室は未評価。旧/tmp証拠の現存は未確認。|
|20|ポケット倉庫 / [#38](https://github.com/Luft256/AI-Games/pull/38)|[歴史的評価・別文書](../fifty-history-2026-10-30.md)|ポケット倉庫の詳細は統合担当の歴史文書を参照。この集約で新たに実操作したとは扱わない。|
|21|橋のアトリエ / [#40](https://github.com/Luft256/AI-Games/pull/40)|[既存の独立記録](../2026-10-15-bridge-weaver.md)|第1面を説明のみで5手クリア、後4面は表示情報からの探索補助。|
|22|ループトレーサー / [#46](https://github.com/Luft256/AI-Games/pull/46)|[歴史的評価・別文書](../fifty-history-2026-10-30.md)|ループトレーサーの過去評価詳細は統合担当の歴史文書を参照。|
|23|マグネット迷路 / [#48](https://github.com/Luft256/AI-Games/pull/48)|[歴史的評価・別文書](../fifty-history-2026-10-30.md)|マグネット迷路の過去評価詳細は統合担当の歴史文書を参照。|
|24|ナンバークロス / [#51](https://github.com/Luft256/AI-Games/pull/51)|[既存の独立記録](../fifty/number-cross.md)|第1面は手計算・重複エラーから修正、後4面は表示合計からの探索補助。|
|25|ギアリンク / [#54](https://github.com/Luft256/AI-Games/pull/54)|[独立初回＋後続ソース補助](puzzle/report.md#gear-link)|誤向きで動力0/5、再挑戦で5手クリア。全6室UIクリア。|
|26|タイルキルト / [#59](https://github.com/Luft256/AI-Games/pull/59)|[独立初回＋後続ソース補助](puzzle/report.md#tile-quilt)|はみ出し拒否を学び3手クリア。全5室UIクリア。キーのフォーカス案内に改善余地。|
|27|クレートバランス / [#60](https://github.com/Luft256/AI-Games/pull/60)|[独立旧HEAD＋修正作者QA](puzzle/report.md#crate-balance)|C左3で-6/±2の敗北、4手勝利。旧次手予告の誤表示は後続修正、作者QAを別保存。|
|28|コンステレーション / [#61](https://github.com/Luft256/AI-Games/pull/61)|[独立初回＋後続ソース補助](puzzle/report.md#constellation)|4手で3本残る行き止まり、再挑戦7手クリア。全6室UIクリア。|
|29|タイムスイッチ / [#63](https://github.com/Luft256/AI-Games/pull/63)|[独立初回＋後続ソース補助](puzzle/report.md#time-switch)|録画3手/5手を比較、全5室UIクリア。40手失敗、録画→再生を跨ぐ期限を確認。|
|30|パルスランナー / [#34](https://github.com/Luft256/AI-Games/pull/34)|[統合担当の別記録](../fifty-history-2026-10-30.md)|パルスランナーの詳細は統合担当の歴史文書を参照。|
|31|グラップルガーデン / [#37](https://github.com/Luft256/AI-Games/pull/37)|[独立初回＋HUD/ソース補助](arcade/report.md#31-grappling-garden)|Space連打は接続せず、減速後に接続する調整で4庭1080点。|
|32|コメットキャッチャー / [#39](https://github.com/Luft256/AI-Games/pull/39)|[過去知識あり・タッチ補助](catcher-current-flight/review.md#32-コメットキャッチャー)|320pxで全90秒775点。周期に合わせた線描画補助。資源回復説明に改善余地。|
|33|バブルカレント / [#42](https://github.com/Luft256/AI-Games/pull/42)|[画面読取り補助の再評価](catcher-current-flight/review.md#33-バブルカレント)|PC/320pxとも5水路1100点。初期角度の連打は第2水路で失敗。|
|34|エンバーフライト / [#44](https://github.com/Luft256/AI-Games/pull/44)|[新ソース/HUD補助の再評価](catcher-current-flight/review.md#34-エンバーフライト旧p1修正確認)|単発Space等は門1で失敗。上下ルート調整で1348/1220点完走。|
|35|ダッシュサーキット / [#49](https://github.com/Luft256/AI-Games/pull/49)|[初操作前ソース参照・補助](arcade/report.md#35-dash-circuit)|連打でシールド切れ、安全窓の位相補助で6室2040点。完全初見とは扱わない。|
|36|ペイントスプリント / [#53](https://github.com/Luft256/AI-Games/pull/53)|[初操作前ソース参照・補助](arcade/report.md#36-paint-sprint)|無移動被弾、囲い方を変え70%達成86点。完全初見とは扱わない。|
|37|ピンボールオービット / [#57](https://github.com/Luft256/AI-Games/pull/57)|[独立初回＋描画座標補助](arcade/report.md#37-pinball-orbit)|3球自然終了。無操作1010点と反応操作1030点で差が小さい。|
|38|シャドウシフト / [#58](https://github.com/Luft256/AI-Games/pull/58)|[独立初回＋ソース補助](arcade/report.md#38-shadow-shift)|初回5落下、着地待ちで5面1200点。同じ色順/経路の反復が課題。|
|39|リズムフォージ / [#64](https://github.com/Luft256/AI-Games/pull/64)|[独立初回＋時刻/時計補助](arcade/report.md#39-rhythm-forge)|無入力0点、30打刻補助で3354点。採点終了の表示修正QAは別JSON。|
|40|ウィンドアーチャー / [#65](https://github.com/Luft256/AI-Games/pull/65)|[独立初回＋弾道補助](arcade/report.md#40-wind-archer)|初回3/6・400点、照準補助で6/6・900点。操作は実キー入力。|
|41|リーフレスキュー / [#36](https://github.com/Luft256/AI-Games/pull/36)|[既存の独立記録](../fifty/reef-rescue.md)|説明のみ12日4/4救出、無操作6日で全滅。CDP凍結復帰試験は実非表示試験とは別。|
|42|タイニータクティクス / [#41](https://github.com/Luft256/AI-Games/pull/41)|[統合担当の別記録](../fifty-history-2026-10-30.md)|タイニータクティクスの詳細は統合担当の歴史文書を参照。|
|43|マーケットモザイク / [#43](https://github.com/Luft256/AI-Games/pull/43)|[統合担当の別記録](../fifty-history-2026-10-30.md)|マーケットモザイクの詳細は統合担当の歴史文書を参照。|
|44|ポーションアトリエ / [#45](https://github.com/Luft256/AI-Games/pull/45)|[統合担当の別記録](../fifty-history-2026-10-30.md)|ポーションアトリエの詳細は統合担当の歴史文書を参照。|
|45|オーチャードウォッチ / [#47](https://github.com/Luft256/AI-Games/pull/47)|[独立初回＋探索補助](strategy/report.md#orchard-watch)|初回15/18失敗後、2行動計画の探索補助をUI実行して24点。|
|46|シグナル探偵 / [#50](https://github.com/Luft256/AI-Games/pull/50)|[独立初回＋可視候補の補助](strategy/report.md#signal-detective)|第1事件を5問で解決。可視候補のminimaxで5事件130点。|
|47|ミュージアムハイスト / [#52](https://github.com/Luft256/AI-Games/pull/52)|[独立初回・自然終了](strategy/report.md#museum-heist)|初回43点勝利、全pass0点・既定選択23点敗北。固定offerは再訪の限界。|
|48|エアトラフィック / [#55](https://github.com/Luft256/AI-Games/pull/55)|[独立初回・自然終了](strategy/report.md#air-traffic)|初回12ターン6機着陸635点。意図的高度競合で衝突を再現。|
|49|ダンジョンドラフト / [#56](https://github.com/Luft256/AI-Games/pull/56)|[独立初回・自然終了](strategy/report.md#dungeon-draft)|予告HP3/宝23を実際の8部屋遠征で達成。鍵→鍛冶で自然敗北も確認。|
|50|スターカートグラファー / [#62](https://github.com/Luft256/AI-Games/pull/62)|[独立初回・別契約も実行](strategy/report.md#star-cartographer)|推奨契約26点と別組合せ32点、補給・星門・報告順を実行。|

## 同梱レビューと証拠

- [25〜29 puzzle](puzzle/report.md) / [同梱一覧](puzzle/evidence.md): 全28室のUIクリア。後半はソース補助。最初のハーネス中断と、time-switchの誤った`actual-failure`ラベルも保存注記に残す。
- [31・35〜40 arcade](arcade/report.md) / [同梱一覧](arcade/evidence.md): キー/タッチ、自然終了、補助完走。期限は[訂正版JSON](arcade/technical-corrected.json)を優先。表示修正の作者QAは別ファイル。
- [32〜34 catcher/current/flight](catcher-current-flight/review.md) / [同梱一覧](catcher-current-flight/evidence.md): 旧知識を持つ再評価。画面読取り/固定周期の補助操作と単純入力の対照を分ける。最新Emberの保存禁止は失敗終了までで、全3門成功時は未検証。
- [45〜50 strategy](strategy/report.md) / [同梱一覧](strategy/evidence.md): 初回自然終了とOrchard/Signalの後続攻略補助を区別。6本とも期限未完了の保存試行0、保存拒否でも勝利。Airの終了後クリックtimeoutはハーネス過走として記録。

## 統合担当の追記先

20ポケット倉庫・22ループトレーサー・23マグネット迷路の歴史的評価と、30パルスランナー・42タイニータクティクス・43マーケットモザイク・44ポーションアトリエの詳細は、統合担当の[過去評価と最終修正の照合](../fifty-history-2026-10-30.md)へ接続した。同文書は会話由来の要約と新しい回帰検証を分け、消失した旧/tmp生ログの現存を主張しない。

19レーザーラボ・21橋のアトリエ・24ナンバークロス・41リーフレスキューは表から既存の保存済みMarkdownへリンクした。既存文書内の古い`/tmp`やローカルartifacts参照は今回の同梱対象ではなく、現存確認なし。元の文章だけで生証拠の存在を保証しない。

## 後続修正の追跡

以下は元評価後の小さな表示修正。初回の評点は旧HEADでの履歴として保持し、修正後を再採点しない。

|対象|修正HEAD|作者の修正確認|統合担当の独立再確認|
|---|---|---|---|
|27 crate-balance / PR60|`d516fd912c2f2756608ea1a77b15e08665e8c795`|[失敗後の次手予告を終了表示へ](puzzle/crate-preview-author-verification.md)|[root-crate-fix.json](../regressions/root-crate-fix.json)|
|35 dash-circuit / PR49|`6d27f3be8ca89e10c0aa85bd7c87e519a0532e68`|[終了時シールド0の表示](followups/2026-10-30-dash-circuit-display-followup.md)|[終了直後の表示を独立再確認](../regressions/root-final-feedback.json)。|
|36 paint-sprint / PR53|`e21569034212fe0a5a85ba4f3fc6a32a72b5a633`|[現在面積と最大面積の区別](followups/2026-10-30-paint-sprint-display-followup.md)|[終了直後の表示を独立再確認](../regressions/root-final-feedback.json)。|
|39 rhythm-forge / PR64|`9b282e1944dc70b0de5cca4a22a37dbe0eb9714d`|[品質0を含む採点終了の表示](followups/2026-10-30-rhythm-forge-display-followup.md)|[終了直後の表示を独立再確認](../regressions/root-final-feedback.json)。|
|45 orchard-watch / PR47|`79f8c2f00aa65aeff2d338cecf43b6e93e186aac`|[実際に休んだ木のみを表示](followups/2026-10-30-orchard-watch-feedback.md) / [作者ブラウザQA](strategy/orchard-fix-browser.json)|[初日B剪定・C水やりの表示を独立再確認](../regressions/root-final-feedback.json)。|

3つのarcade修正HEAD・チェック結果は [fix-heads.json](arcade/fix-heads.json) でも追跡できる。作者QAの[表示結果](arcade/display-fix-qa-results.json)と、独立旧HEAD評価の[exact-heads.json](arcade/exact-heads.json)を混ぜない。feature固有の修正文書はそのPRにも含まれ、ここには読めるように同内容の写しを置いた。回帰JSONの追加や統合完了は統合担当が更新する。

## dev統合と残る改善

32本のfeature PRはすべてdevへマージ済み。[評価対象HEADとマージ記録](integration.json)で対応を追跡できる。mainへの公開承認は受けていない。

残る指摘は対象PRのマージを確認し、既存Issueと重複しないものを登録した。

- [パズル：キーボード操作を始めるための盤面フォーカスを案内する](https://github.com/Luft256/AI-Games/issues/67)
- [ギアリンク：端子と接続方向を連続した形で読みやすくする](https://github.com/Luft256/AI-Games/issues/68)
- [マグネット迷路：横→縦の移動順を短い例で説明する](https://github.com/Luft256/AI-Games/issues/69)
- [ポケット倉庫番：箱の詰みに気付ける任意ヒントを用意する](https://github.com/Luft256/AI-Games/issues/70)
- [ループトレーサー：使わない辺へ任意の×メモを付けられるようにする](https://github.com/Luft256/AI-Games/issues/71)
- [ピンボールオービット：フリッパー判断の効果を強めて見えるようにする](https://github.com/Luft256/AI-Games/issues/72)
- [シャドウシフト：5ステージの切替判断に変化を付ける](https://github.com/Luft256/AI-Games/issues/73)
- [コメットキャッチャー：資源の回復速度を1本単位で明記する](https://github.com/Luft256/AI-Games/issues/74)
- [バブルカレント：泡が破裂した場所と最後の原因を残す](https://github.com/Luft256/AI-Games/issues/75)
- [エンバーフライト：狭い画面でも上下ルートの加点を読めるようにする](https://github.com/Luft256/AI-Games/issues/76)
- [エアトラフィック：320pxで便の現在高度と予測高度を読みやすくする](https://github.com/Luft256/AI-Games/issues/77)
- [スターカートグラファー：320pxの長いタイトルの折り返しを整える](https://github.com/Luft256/AI-Games/issues/78)
- [ミュージアムハイスト・ダンジョンドラフト：固定提示を覚えた後の再挑戦に変化を付ける](https://github.com/Luft256/AI-Games/issues/79)

最終共有変更は [静的サイト受入](acceptance.md) で248テスト・178ブラウザ項目と全50ルートを確認した。READMEの新32本の操作表も、各ゲームの実際のcontrols/help/keysと照合した。

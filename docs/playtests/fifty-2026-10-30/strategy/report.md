> 集約注記（2026-10-30）: 元レポートは `/Users/kamimurasora/workspace/luft256/AI-Games/artifacts/resume-strategy-review/report.md`。本文の評価対象HEAD・実操作・補助・未評価範囲を維持した。JSONはこのフォルダの同名ファイルを参照。スクリーンショットと実行scriptは同梱せず、存在を確認できたものだけ元primaryの絶対パスへリンクした。ワイルドカード/範囲表記の画像群も未同梱。これらローカルリンクは別環境で利用できる保証がない。JSON内部の生成時パスは原記録として保持し、集約先対応は [保存元一覧](../provenance.json) を参照。

# Independent browser play review — games 45–50

Date: 2026-10-30. Reviewer: independent Codex agent, not any game's implementation author. These AI diagnostic scores are not evidence of human enjoyment. Review was read-only for game source and Git; only review artifacts were written. No PR/merge/issue changes.

The routed static site uses `/AI-Games/` project-subpath URLs. Every file in each reviewed game directory was byte-compared with its exact PR HEAD using `git show`; all match. Shared files come from `artifacts/fifty-stage/site/shared/`.

| Game | PR | Exact head | Understanding | Choices | Learning | Feedback | Replay |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Orchard Watch | #47 | 2a36cf33a80d8371026e87538a7cf7efd3141df9 | 4 | 4 | 4 | 3 | 4 |
| Signal Detective | #50 | fdba65ed422aa089d329c3eb2ef6fce66b5968a5 | 4 | 4 | 4 | 4 | 4 |
| Museum Heist | #52 | d95cb070e5f7f22b1016a825615d2c5e6e8cbbff | 4 | 4 | 3 | 4 | 3 |
| Air Traffic | #55 | a81569151799f301f06a59af751372d64e3e9343 | 4 | 5 | 4 | 4 | 4 |
| Dungeon Draft | #56 | ce63e8274399a9194b1d9c2803e90fc0218e6a0e | 4 | 4 | 4 | 4 | 3 |
| Star Cartographer | #62 | 4d70ef01f273aaa8b017331cce9938bd76eb5f27 | 4 | 5 | 4 | 4 | 4 |

No integration-blocking defect observed in the tested paths. Scores alone are not a pass criterion.

## Actual play and diagnostic evidence

### Orchard Watch

Initial play used on-page instructions only: keyboard 2 selected pruning B, keyboard 1 watered C, then committed day one. Subsequent decisions pruned unqualified trees with growth 2–3 and otherwise rested. The complete twelve-day run ended at 15/18 with retry guidance. Reset and queue/undo were verified. The forecast, water chain, and losing one growth to improve the next harvest produced real decisions; simply pruning whenever possible did not win. The game clearly displayed water, growth, quality duration and day progression. Feedback loses one point because the generic daily statement says trees with water 0/5 rested even when no tree has those water values.

Assisted portion: after that initial loss, the pure logic was read, and an explicit beam search over two-action plans found a 24-point route. Every planned action was then executed through UI controls to the natural twelve-day win. This proves that tested route is playable, not that a new player independently discovered it. The route is in [interaction-log.json](interaction-log.json). Same route also completed using real taps at 320px with storage blocked.

### Signal Detective

Initial instructions-only play: queried ●●● (0 exact,0 near), ▲▲▲ (1,0), ■■■ (1,0), ▲■✦ (1,2), then ▲✦■, solving case one on the fifth and final query. The built-in visible candidate list helped. Repeating ●●● for five attempts in another run caused the expected failure and reset was usable. The two feedback numbers and visible shrinking candidate set explained what each probe learned.

Assisted full campaign: a minimax chooser used only the candidate strings already visible in the UI, not hidden solutions or game state. All probes were entered through number keys/Enter, and all five cases ended successfully at 130 points. In blocked storage the same method completed five cases at 110 points; the save exception was caught. Remaining four cases were not solved unaided. Numeric input focuses the probe button, so subsequent Enter works; initial Enter with body focus alone did nothing, a minor discoverability limitation rather than a blocker.

### Museum Heist

Initial keyboard play selected C,C,A,B,A,C,B,C, confirming each selection. Natural eight-round finish: 43 points, two coins left, success. Collection bonuses and the public rival bid were understandable; taking a cheap uncontested item was often attractive. A separate all-pass run failed with zero points. Another baseline confirmed the default card eight times and failed at 23/30, so success did depend on changing choices. Reset was immediate. The 16-coin budget and set/type bonuses give actual consequences, although first-play success left the overbid mechanic largely unexplored. Replay is limited by the fixed offer sequence. The full winning sequence also completed with blocked storage.

### Air Traffic

Initial instructions-only keyboard run planned twelve turns and landed all six planes for 635 points. A/B shared cells at different altitudes; B waited before lowering for landing. C/D subsequently used the same approach. E/F were staggered to reserve the single runway and avoid a high-altitude collision with D. This demonstrated meaningful simultaneous movement, altitude, runway scheduling and fuel constraints, supporting choices=5. An intentional retry lowered B early and advanced twice: A and B collided, and both were named in feedback. The board preview showed current and predicted destinations. Full twelve-turn winning route repeated successfully with blocked storage. At 320px, control buttons remained tappable and no horizontal overflow occurred; labels in the five-column board are visually dense and were not tested on physical hardware.

### Dungeon Draft

Initial instructions-only route: battle, smith, battle, smith, battle, chest, camp, guardian (1,2,1,1,1,1,1,1). The forecast let the reviewer budget armor, health and treasure, and predicted HP3/armor4/treasure23. Actually departed and pressed through all eight rooms: HP3 and treasure23, success. The expedition was not merely predicted. A new run began with key room then smith; the preview warned about insufficient treasure, and actually departing/stepping reproduced failure in room two. Reset worked. Resource timing and the guardian requirement provide decisions, but execution after departure is confirmation-only and the fixed eight offers limit replay. Full successful route completed at 320px with blocked storage.

### Star Cartographer

Initial instructions-only recommended contracts 1 and 2: Atlas→Fern→Relay→Ember→Atlas, four turns, fuel3, both contracts reported, natural win26. On-page graph numbers and reporting destinations made the difference between visiting a star and reporting observations clear. A second unassisted route used contracts 6 and 7: Atlas→Fern→Relay→refuel→Frost→Crown→Dusk→Ember→Atlas; both contracts completed for32. This demonstrated a different contract combination, gate unlock, fuel replenishment and report ordering, supporting choices=5. An intentional retry spent turns refueling/returning between Atlas and Fern and failed at turn10 with only one contract. The entire recommended winning route also completed with real taps at320px despite storage refusal. Minor cosmetic issue: the long Japanese title leaves its final long-vowel mark alone on a line at320px.

## Cross-game checks

- Desktop: Chrome/Playwright,1280×900; actual game keyboard shortcuts used in all six games. Buttons and explicit retry paths exercised. Relative imports/routes loaded without page errors or missing routed resources.
- Mobile:320×760, touch-enabled context; actual Playwright `.tap()` used for all six start actions and reset. Orchard/Star completed wholly by taps; Dungeon departure/progression also by taps. Full-page screenshots were inspected for all six. All six `document.documentElement.scrollWidth` values were320. This is an emulated viewport, not a physical device test.
- Blocked storage: overridden `Storage.getItem/setItem` throw `SecurityError`. All six start and win successfully. Each completed run attempted exactly one denied save; no uncaught browser errors. BEST persistence/reload under denial is intentionally unavailable.
-30-minute unfinished expiry: each game started with a real tap. Date.now offset advanced1,800,001ms; keyboard input triggered expiry, and a second pass dispatched visibilitychange. Every game displayed its own30-minute termination message; no denied save calls occurred on unfinished expiry (writes0). After expiry additional keyboard2/Enter did not change the game panel; retry returned every session to idle. Hidden buttons retained enabled DOM states in Signal/Dungeon but were hidden and could not continue play.
- These turn-based games have no independent simulation loops; source inspection confirmed the common session timer stops on expiration. Native hidden-tab suspension was not demonstrated: opening another headless tab still returned visibilityState=visible. The test therefore covers wall-clock jump, simulated visibility event and overdue-input rejection, not a real30-minute wait or native background timer suspension.
- No new test/build/check invocation was performed by this independent reviewer; the integration owner must retain the required repository checks.

## Actionable non-blocking observations

1. Orchard: commit day one with B pruning/C watering. All resulting water values are1–3, yet daily status appends the water0/5-rest sentence. Impact: it can suggest a growth failure that did not occur. Improve by listing only actual stalled trees or phrasing the sentence as a general rule. Not fixed by this read-only reviewer.
2. Star: open at320px. Title ends with an orphaned long-vowel mark on the next line. Impact: cosmetic scanning quality. Improve responsive heading size or line wrapping. All contract/map controls remained reachable. Not fixed.
3. Air: open at320px after first turn; current/predicted labels share very narrow cells. Impact: increased reading effort for altitude/collision planning. Consider a focused-plane detail or larger board mode. No unreadable-essential-information blocker was demonstrated; physical-device legibility remains unevaluated.
4. Museum/Dungeon: fixed offers make repeated campaigns predictable. Consider later variants after current integration; current score optimization and alternative plans do give replay reasons. No defect and no issue created.

Artifacts: [interaction-log.json](interaction-log.json) contains actual outcomes, routes, expiry/storage counts; `*-first-end.png`, `*-assisted-end.png`, `*-320.png` preserve UI evidence. This review does not claim comprehensive exhaustive paths, every Signal seed, every Star contract pair, human enjoyment, physical touch behavior, or native hidden-tab suspension.

Additional Air failure completion: after intentionally aligning A/B altitude, continued with default movement until natural early end at turn11: landed0/lost6; advance disabled and reset restored1/12. A test harness initially attempted a twelfth click and correctly timed out on the disabled end-state button; this was a harness overrun, not a page error. The actual natural failure and retry are in the final interaction log.

# paint-sprint: display follow-up QA (2026-10-30)

PR #53; reviewed before this fix: `7fddbdbf6beac697186ae356a015b6819740bd05`. This note accompanies the display fix on the existing game branch.

## Finding and correction

The success status used the peak score86 as an unlabeled area, while the final current area was85 after enemy erasure. The distinction was ambiguous; it was not evidence that the final current-area meter was wrong. Input updates could also briefly show an older area meter.

Render the meter from current state, and label the success status with both current area and peak area. Keep peak-based scoring and all gameplay rules.

## Reproduction and observed result

Immediately after Start press Right: both score and painted-area meter show2 before the next simulation frame. Reset. Hold Left700ms, Up560ms, Right1470ms, Down980ms, Left1470ms, Up980ms to complete the large loop.

```json
{
  "meter": "塗った面積 85/96 (88%) / インク 100 / 残り 3回 / 85秒",
  "status": "70%達成！ 現在 85/96マス・最大 86/96マス。",
  "score": "86",
  "best": "86"
}
```

## Validation and scope

- npm test: 137/137 passing.
- npm run check and npm run build: passing; static project-subpath build retained.
- Chrome/Playwright actual keyboard inputs against this worktree. Playwright clock controls timing; no hidden game state was changed. Browser page errors: none.
- Author QA after the independent reviewer identified the issue; this follow-up is not a new independent review or evidence of human enjoyment. The integration reviewer will recheck the new head.
- Reproducible browser script and screenshots: primary workspace artifacts/resume-arcade-review/display-fix-qa.mjs, display-fix-qa-results.json, and the corresponding *-fixed-*.png files.

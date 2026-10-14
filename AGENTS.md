# Repository instructions

## Branches and integration

- `dev` is the integration branch. Start new work from the latest `origin/dev` and create a `codex/<task>` branch.
- Target ordinary feature/fix pull requests at `dev`. After the required checks pass, agents may merge those pull requests into `dev` without asking for additional permission.
- `main` is the production release branch. The user must review the current contents of `dev` and explicitly approve releasing those contents before an agent merges a `dev` → `main` pull request.
- Do not push directly to `main`, merge into `main`, or enable auto-merge into `main` before that approval. Earlier general permission to create or merge PRs does not count as release approval under this policy.
- Any changes added to `dev` after a release approval require renewed review and approval before they can be included in that release.
- Keep GitHub Pages deployment restricted to `refs/heads/main`, including manual workflow runs. `dev` pushes and pull requests must validate only.

## Development

- Keep the site static and compatible with GitHub Pages project subpaths. Use relative links and keep all games in this repository.
- Give each new game its own feature branch and pull request. Use isolated worktrees when developing games concurrently.
- New games must be created using subagents with model `gpt-6.1-sol` and reasoning effort `high`, as requested by the user.
- Every game round must end within 30 minutes of starting, including pauses and hidden tabs. Use the shared session limit, stop simulation and pending callbacks on expiry, and never save an unfinished puzzle as a clear record.
- Before integration, run `npm test`, `npm run check`, and `npm run build` as appropriate, and verify changed game behavior in a browser.

## Game quality

- Follow `docs/game-quality.md`: an independent reviewer must actually play new games, record specific observations, and feed actionable issues back for improvement before integration. AI ratings are diagnostic, not evidence of human enjoyment.
- Give each game a clear short-round goal, meaningful decisions or learnable skill, understandable feedback, and a quick retry. Avoid reskinned duplicates just to increase the count.
- Preserve review findings and verified fixes in `docs/playtests/`. Fix blockers before adding more games.

## Work tracking

- Do not create scheduled runs, recurring automations, or daily production jobs. Continue work in the current chat when requested.
- Create GitHub issues for remaining fixes and improvements only when the affected game or page has already been merged. Include the merged PR and observed behavior.
- For unmerged work in progress, fix findings directly in its feature branch instead of creating an issue. Check existing issues first to avoid duplicates.

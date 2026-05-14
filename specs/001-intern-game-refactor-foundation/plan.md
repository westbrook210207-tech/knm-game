# Implementation Plan: Intern Game Refactor Foundation

**Branch**: `[main]` | **Date**: 2026-05-13 | **Spec**: [spec.md](/Users/nguyentran0703/Downloads/knm-game/specs/001-intern-game-refactor-foundation/spec.md)
**Input**: Feature specification from `/specs/001-intern-game-refactor-foundation/spec.md`

## Summary

Stabilize `intern-game-src` as the canonical product baseline, then make the first refactor pass by separating content data, session/game state, and round logic from the current screen components. The implementation should preserve the current player-visible flow and game feel while making future changes safer and more spec-driven.

## Technical Context

**Language/Version**: JavaScript (ES modules), React 19, Vite 8  
**Primary Dependencies**: React, React DOM, Axios  
**Storage**: In-memory React state for current implementation; localStorage targeted in this refactor pass for predictable session persistence  
**Testing**: ESLint only at present; manual browser verification is required for gameplay behavior in this phase  
**Target Platform**: Modern desktop and mobile browsers  
**Project Type**: Frontend web application / browser game  
**Performance Goals**: Preserve responsive gameplay feel, including smooth bonus mini-game interaction and readable timer feedback at standard browser frame rates  
**Constraints**: Must remain playable without a backend, must preserve current screen order and tone, must avoid broad visual rewrites during foundational refactor  
**Scale/Scope**: Single app in `intern-game-src` with 5 screens, shared HUD/timer/typewriter components, and one local game state container

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- `intern-game-src` remains the baseline product direction: PASS
- Refactor work is driven by an explicit spec artifact: PASS
- Frontend-first, backend-optional behavior is preserved: PASS
- Game feel remains an explicit requirement and is not being flattened into a generic UI cleanup: PASS
- Data, rules, and UI are being separated as independent concerns: PASS

No constitution violations are expected in this plan.

## Project Structure

### Documentation (this feature)

```text
specs/001-intern-game-refactor-foundation/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── checklists/
│   └── requirements.md
└── tasks.md
```

### Source Code (repository root)

```text
intern-game-src/
├── src/
│   ├── api/
│   │   └── index.js
│   ├── components/
│   │   ├── HUD.jsx
│   │   ├── Timer.jsx
│   │   └── Typewriter.jsx
│   ├── data/
│   │   ├── teams.js
│   │   ├── round1Questions.js
│   │   └── round2Scenarios.js
│   ├── game/
│   │   ├── scoring.js
│   │   ├── round1.js
│   │   ├── round2.js
│   │   └── bonus.js
│   ├── hooks/
│   │   └── useGameContext.jsx
│   ├── screens/
│   │   ├── Lobby.jsx
│   │   ├── Round1.jsx
│   │   ├── Round2.jsx
│   │   ├── Bonus.jsx
│   │   └── Results.jsx
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
└── package.json
```

**Structure Decision**: Keep `intern-game-src` as a single Vite application. Add `src/data` for editable game content and `src/game` for round rules/helpers. Preserve existing screen/component directories so the first refactor changes architecture without forcing a visual rewrite.

## Phase 0: Research Decisions

Research outcomes for this feature are captured in [research.md](/Users/nguyentran0703/Downloads/knm-game/specs/001-intern-game-refactor-foundation/research.md).

Key decisions:

- Use `intern-game-src` itself as the active product reference.
- Keep API calls as optional side effects rather than primary control flow.
- Add predictable local persistence instead of relying on volatile reducer-only state.
- Refactor by extraction, not by replacing the router or redesigning every screen.

## Phase 1: Design Artifacts

Phase 1 outputs for this feature:

- [data-model.md](/Users/nguyentran0703/Downloads/knm-game/specs/001-intern-game-refactor-foundation/data-model.md)
- [quickstart.md](/Users/nguyentran0703/Downloads/knm-game/specs/001-intern-game-refactor-foundation/quickstart.md)

No external interface contracts are required in this pass because the feature is focused on internal frontend architecture and local gameplay behavior, not on defining a stable public API.

## Implementation Strategy

### Pass 1: Content Extraction

- Move team definitions out of `Lobby.jsx` into `src/data/teams.js`
- Move Round 1 questions and difficulty metadata out of `Round1.jsx`
- Move Round 2 scenarios and hint structures out of `Round2.jsx`

### Pass 2: State Normalization

- Redesign `useGameContext.jsx` around a clearer state model with grouped state for team, round progress, score summary, and bonus state
- Add serialization boundaries so the session can be restored from localStorage
- Preserve the existing visible screen order and button flows

### Pass 3: Game Logic Extraction

- Extract Round 1 token conversion, answer resolution, and phase helpers to `src/game`
- Extract Round 2 helpers for scenario lookup and SWOT state defaults
- Extract Bonus constants and movement/collision helpers where practical without destabilizing animation behavior

### Pass 4: Screen Integration

- Update screens to consume data modules and game helpers
- Keep CSS and presentation largely unchanged in this phase
- Verify that boss-dialog language, timers, HUD, and progression still feel the same

## Verification Strategy

- Run `npm run build` in `intern-game-src`
- Run `npm run lint` in `intern-game-src` if the current codebase is lint-clean enough for useful signal
- Manually verify the full flow:
  - Lobby team selection
  - Round 1 betting and answer reveal
  - Round 2 reading, writing, and submitted states
  - Bonus win/lose path
  - Results totals and replay path
- Refresh the page during an in-progress session to confirm persistence behavior matches the implemented state model

## Risks And Mitigations

- Risk: Refactoring `useGameContext` can silently break screen transitions.
  - Mitigation: Keep transition names stable and verify every transition manually after each pass.
- Risk: Bonus extraction can break timing or collision feel.
  - Mitigation: Keep animation loop behavior mostly intact in the first pass and extract constants before extracting loop logic.
- Risk: Local persistence can preserve stale or invalid state.
  - Mitigation: Version the stored session shape and fall back to a safe reset when the data is invalid.

## Complexity Tracking

No justified constitution exceptions at this stage.

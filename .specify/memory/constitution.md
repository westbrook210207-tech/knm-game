# KNM Game Constitution

## Core Principles

### I. Intern Game Src Is The Baseline
`intern-game-src` is the product baseline for this repository. New specifications, plans, and implementation work MUST preserve its core single-device game flow unless a newer approved spec intentionally changes that behavior.

### II. Spec Before Refactor
Non-trivial refactors MUST start from an explicit spec artifact that describes the intended player experience, game rules, state model, and screen transitions. Code changes SHOULD follow approved specs rather than reverse-engineering unstable historical docs.

### III. Frontend-First, Backend-Optional
The default target is a playable frontend experience that works without a required backend. Backend hooks MAY exist, but the game MUST remain coherent in local/demo mode unless a spec explicitly promotes backend dependence.

### IV. Game Feel Is A Product Requirement
Visual rhythm, boss-dialog framing, timers, HUD clarity, and screen-to-screen pacing are first-class requirements. Refactors MUST avoid “clean architecture” changes that noticeably flatten the playful tone or reduce usability during live play.

### V. Keep Rules, Data, And UI Separate
Game rules, content data, and UI rendering SHOULD evolve independently. Questions, teams, scenarios, scoring tables, and screen copy MUST move toward dedicated data and logic modules instead of remaining embedded in large screen components.

## Product Constraints

- The primary product is a browser-based intern game for a single team/device flow.
- The repository may contain historical analysis documents, but `docs/rebuild-analysis` is reference material only and MUST NOT override approved specs for the active product direction.
- Round behavior, scoring, and transitions must be understandable from repository artifacts without requiring external tribal knowledge.
- Refactors should prefer incremental compatibility over broad rewrites.

## Workflow Requirements

- Each meaningful feature or refactor starts with a spec under `specs/`.
- Specs must describe player-visible behavior, scope boundaries, and success criteria.
- Plans and tasks must map back to the approved spec and identify what behavior is preserved versus intentionally changed.
- When implementation and old docs conflict, the active spec wins.

## Governance

This constitution governs spec, plan, task, and implementation work for this repository. Changes to these principles require updating this file and documenting why the new rule better serves the active `intern-game-src` product direction.

**Version**: 1.0.0 | **Ratified**: 2026-05-13 | **Last Amended**: 2026-05-13

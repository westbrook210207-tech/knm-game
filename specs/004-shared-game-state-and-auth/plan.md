# Implementation Plan: Shared Game State And Auth

**Branch**: `[004-shared-game-state-and-auth]` | **Date**: 2026-05-15 | **Spec**: [spec.md](/Users/nguyentran0703/Downloads/knm-game/specs/004-shared-game-state-and-auth/spec.md)
**Input**: Feature specification from `/specs/004-shared-game-state-and-auth/spec.md`

## Summary

Introduce Supabase as the first shared backend for the event app. This phase should establish the minimal shared state model, role/session login boundaries, and realtime phase synchronization needed by admin, presenter, team, and judge routes without yet implementing round-specific orchestration.

## Technical Context

**Language/Version**: JavaScript (ES modules), React 19, Vite 8  
**Primary Dependencies**: React, React DOM, React Router, Axios, Supabase client libraries  
**Storage**: Supabase Postgres for shared state and session records; browser localStorage may remain only for non-authoritative UI convenience where needed  
**Testing**: ESLint, production build, manual browser verification, and Supabase-side verification of schema and access behavior  
**Target Platform**: Modern desktop and mobile browsers in a small classroom event setup  
**Project Type**: Multi-route frontend app backed by Supabase realtime and auth/session services  
**Performance Goals**: Phase updates should propagate quickly enough that admin/presenter/team stay visually aligned during a live classroom event  
**Constraints**: Must preserve the route shell structure from `003`, must keep Phase C1/C2/C3 scoped away from full round orchestration, must respect primary-controller session policy, must not expose privileged Supabase credentials to public clients  
**Scale/Scope**: One event, ~9 teams, a small number of judges, one admin control surface, one presenter view

## Constitution Check

- `intern-game-src` remains the active product baseline: PASS
- This feature is defined by a spec before implementation: PASS
- Migration stays incremental rather than rewriting the app structure again: PASS
- Phase boundaries are explicit: shared state and auth now enter scope, but round orchestration remains deferred: PASS
- Game feel is preserved by layering backend truth under the existing UI shells rather than flattening the frontend: PASS

No constitution violations are expected in this plan.

## Project Structure

### Documentation (this feature)

```text
specs/004-shared-game-state-and-auth/
├── compatibility-analysis.md
├── current-architecture-review.md
├── data-model.md
├── plan.md
├── spec.md
└── target-architecture.md
```

### Source Code (repository root)

```text
intern-game-src/
├── src/
│   ├── app/
│   │   ├── routes/
│   │   ├── layouts/
│   │   └── router.jsx
│   ├── hooks/
│   │   └── useGameContext.jsx
│   ├── lib/
│   │   └── supabase/
│   │       ├── client.js
│   │       ├── auth.js
│   │       ├── gameState.js
│   │       └── sessions.js
│   ├── data/
│   ├── screens/
│   ├── App.jsx
│   └── index.css
├── supabase/
│   ├── config.toml
│   └── migrations/
└── package.json
```

**Structure Decision**: Keep the frontend in `intern-game-src` and add a Supabase integration layer under `src/lib/supabase` plus Supabase local project/migrations under `intern-game-src/supabase` if the repo adopts CLI-based workflow. Route shells from `003` remain the entry points while backend truth is introduced beneath them.

## Research Decisions

- Supabase starts in this phase and becomes the first shared source of truth for route synchronization.
- The first backend pass should prioritize `game_state`, `teams`, and session identity over round-specific scoring tables beyond what is minimally required.
- Team multi-device policy must be represented explicitly in backend session state, not inferred only from local storage.
- Presenter should remain read-only against backend state in this phase.
- Admin session revocation should be designed now even if the admin UI remains minimal.

## Implementation Strategy

### Pass 1: Supabase Project And Schema Foundation

- Add Supabase client dependency and integration scaffolding
- Define the initial schema for:
  - `teams`
  - `game_state`
  - `sessions`
  - any minimal judge/admin identity support needed for this phase
- Define which tables live in exposed schemas and what RLS posture is required

### Pass 2: Shared Phase Sync

- Build read/write helpers around `game_state`
- Allow admin-facing code to update current phase
- Allow presenter and team routes to subscribe to current shared phase
- Verify reconnect and initial load behavior for late-joining clients

### Pass 3: Auth And Session Policy

- Define login flows for admin, team, and judge
- Implement primary-controller assignment for first successful team session
- Implement secondary/read-only handling
- Implement admin-triggered session revocation behavior

### Pass 4: Route Integration

- Connect `/admin`, `/presenter`, `/team/:teamId`, and `/judge/:judgeId` shells to backend-derived identity/state
- Keep round-specific UI mostly shell-like where orchestration is not yet in scope
- Preserve safe fallbacks so partially integrated screens do not regress into unusable states

### Pass 5: Verification

- Verify schema and access behavior in Supabase
- Verify frontend build/lint still pass
- Verify login/session behavior and phase sync across multiple routes

## Verification Strategy

- Verify Supabase schema creation and migration state
- Verify at least one write/read cycle for `game_state`
- Verify admin phase change propagates to presenter and team routes
- Verify one team can open a primary session and a secondary session with distinguishable behavior
- Verify admin revoke invalidates or disables a team session
- Run `npm run build` in `intern-game-src`
- Run `npm run lint` in `intern-game-src`
- Manually verify route behavior for:
  - `/admin`
  - `/presenter`
  - `/team/:teamId`
  - `/judge/:judgeId`

## Risks And Mitigations

- Risk: Supabase schema or RLS decisions are wrong and block later round flows.
  - Mitigation: keep this phase narrow, verify schema behavior directly, and avoid over-designing round tables too early.
- Risk: Team multi-device policy becomes inconsistent between frontend assumptions and backend session records.
  - Mitigation: define primary/secondary state explicitly in backend session rows and make the UI read that truth.
- Risk: Auth/session implementation leaks privileged access patterns into public clients.
  - Mitigation: keep service-role logic out of the browser and define access boundaries before wiring writes.
- Risk: Realtime sync appears to work in one tab but fails on reconnect or late joins.
  - Mitigation: verify both initial fetch and subscription update paths, not only live changes.

## Complexity Tracking

This is the first feature that requires Supabase and therefore marks the start of the highest-risk migration zone identified in the roadmap. No constitution exceptions are requested, but implementation should not begin until Supabase project access and environment setup are confirmed.

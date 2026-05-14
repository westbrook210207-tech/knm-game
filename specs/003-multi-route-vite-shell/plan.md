# Implementation Plan: Multi-Route Vite Shell

**Branch**: `[main]` | **Date**: 2026-05-15 | **Spec**: [spec.md](/Users/nguyentran0703/Downloads/knm-game/specs/003-multi-route-vite-shell/spec.md)
**Input**: Feature specification from `/specs/003-multi-route-vite-shell/spec.md`

## Summary

Upgrade `intern-game-src` from a single-flow Vite SPA into a multi-route Vite application that reflects the GDD role model: admin, presenter, team, and judge. This phase should establish routing, shell pages, and shared visual primitives while deliberately avoiding Supabase, auth, and realtime gameplay orchestration.

## Technical Context

**Language/Version**: JavaScript (ES modules), React 19, Vite 8  
**Primary Dependencies**: React, React DOM, Axios, React Router  
**Storage**: Existing localStorage session support may remain for prototype compatibility, but no new backend persistence is introduced in this feature  
**Testing**: ESLint, production build, and manual route verification in the browser  
**Target Platform**: Modern desktop and mobile browsers  
**Project Type**: Multi-route frontend web application hosted as static assets  
**Performance Goals**: Route changes should feel immediate; the shell migration should not visibly degrade the current prototype's responsiveness  
**Constraints**: Must stay within the existing Vite app, must remain static-hostable on Vercel, must not pull in Supabase/auth complexity yet, must preserve the current visual identity  
**Scale/Scope**: One frontend app in `intern-game-src`, introducing route-level structure and shared shell components without implementing live event orchestration

## Constitution Check

- `intern-game-src` remains the active product baseline: PASS
- This feature follows an explicit approved spec before code changes: PASS
- Frontend-first, backend-later migration behavior is preserved: PASS
- The prototype's game feel remains a first-class requirement: PASS
- Phase boundaries are respected by keeping shared state/auth/realtime out of this shell feature: PASS

No constitution violations are expected in this plan.

## Project Structure

### Documentation (this feature)

```text
specs/003-multi-route-vite-shell/
├── plan.md
└── spec.md
```

### Source Code (repository root)

```text
intern-game-src/
├── src/
│   ├── app/
│   │   ├── routes/
│   │   │   ├── AdminRoute.jsx
│   │   │   ├── PresenterRoute.jsx
│   │   │   ├── TeamRoute.jsx
│   │   │   ├── JudgeRoute.jsx
│   │   │   └── HomeRoute.jsx
│   │   ├── layouts/
│   │   │   └── RoleShell.jsx
│   │   └── router.jsx
│   ├── components/
│   │   ├── HUD.jsx
│   │   ├── Timer.jsx
│   │   ├── Typewriter.jsx
│   │   └── ...
│   ├── data/
│   │   └── teams.js
│   ├── screens/
│   │   └── ...
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
└── package.json
```

**Structure Decision**: Keep a single Vite app and add an `app/` route shell layer instead of spinning up a new frontend. The existing screens remain available as migration references while route-level entry points are introduced in a clean, explicit structure.

## Research Decisions

- Use React Router rather than introducing a new framework.
- Keep route shells lightweight and mostly presentational in this phase.
- Reuse existing style primitives and screen patterns from the prototype instead of designing placeholder admin/judge/presenter UIs from scratch.
- Prefer a migration-friendly structure where current prototype pieces can be progressively rehomed under route-level modules.

## Implementation Strategy

### Pass 1: Routing Foundation

- Add React Router to `intern-game-src`
- Define route structure for `/`, `/admin`, `/presenter`, `/team/:teamId`, and `/judge/:judgeId`
- Ensure direct route loads work in local dev and remain Vercel-compatible

### Pass 2: Role Shell Pages

- Create route components for admin, presenter, team, and judge shells
- Define a shared shell layout component to keep visual language consistent
- Decide how the current single-device prototype flow is exposed during migration:
  - folded into the team route, or
  - preserved behind a separate transitional route

### Pass 3: Shared Visual System Extraction

- Identify the minimum shared visual primitives needed across role shells
- Reuse fonts, colors, background treatment, dialog/HUD styling cues, and spacing conventions from the prototype
- Avoid broad CSS rewrites that would destabilize the working prototype

### Pass 4: Verification

- Verify route navigation and direct loads
- Verify the current prototype still remains usable as a reference path if intentionally preserved
- Verify Vite build, lint, and static-hosting assumptions still hold

## Verification Strategy

- Run `npm run build` in `intern-game-src`
- Run `npm run lint` in `intern-game-src`
- Manually verify:
  - `/`
  - `/admin`
  - `/presenter`
  - `/team/:teamId`
  - `/judge/:judgeId`
- Manually verify one invalid `teamId` and one invalid `judgeId` behavior
- Confirm the app still loads via browser refresh on a nested route in dev and remains compatible with Vercel static deployment expectations

## Risks And Mitigations

- Risk: Route migration may break the current prototype flow before replacement shells are useful.
  - Mitigation: keep migration incremental and preserve a deliberate fallback path to the current prototype during the transition.
- Risk: Shared styling extraction may accidentally flatten the game's visual identity.
  - Mitigation: extract only core primitives first and review route shells against the existing prototype side by side.
- Risk: React Router integration may introduce static-hosting edge cases.
  - Mitigation: verify direct loads for nested routes and prepare Vercel rewrite configuration if the router mode requires it.
- Risk: Phase B scope may creep into auth or backend behavior.
  - Mitigation: reject any implementation that requires Supabase setup, protected routes, or permission logic in this feature.

## Complexity Tracking

No justified constitution exceptions at this stage.

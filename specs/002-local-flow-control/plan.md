# Implementation Plan: Local Flow Control

**Branch**: `[main]` | **Date**: 2026-05-13 | **Spec**: [spec.md](/Users/nguyentran0703/Downloads/knm-game/specs/002-local-flow-control/spec.md)
**Input**: Feature specification from `/specs/002-local-flow-control/spec.md`

## Summary

Add a lightweight local control panel to the frontend so presenters can manually drive the demo flow, select teams, and correct state during a session. The implementation will stay fully client-side and static-hosting friendly so the app remains deployable on Vercel without custom backend requirements.

## Technical Context

**Language/Version**: JavaScript (ES modules), React 19, Vite 8  
**Primary Dependencies**: React, React DOM, Axios  
**Storage**: React shared state plus browser localStorage persistence  
**Testing**: ESLint, production build, and manual browser verification  
**Target Platform**: Modern browsers on desktop first, mobile-safe secondary  
**Project Type**: Static-hostable frontend web application  
**Performance Goals**: No visible slowdown in gameplay screens; control actions should update UI immediately  
**Constraints**: Must stay Vercel-compatible, must not require server-side sessions for control, must not break the player-facing flow  
**Scale/Scope**: One reusable overlay component, a few new reducer actions, and light styling inside `intern-game-src`

## Constitution Check

- `intern-game-src` remains the baseline product direction: PASS
- The feature is defined by a spec before implementation: PASS
- Frontend-first, backend-optional behavior is preserved: PASS
- Game feel remains intact because control UI is additive rather than replacing player screens: PASS
- Data, rules, and UI separation remain compatible with the existing refactor direction: PASS

## Project Structure

```text
intern-game-src/src/
├── components/
│   ├── ControlPanel.jsx
│   ├── ControlPanel.css
│   ├── HUD.jsx
│   ├── Timer.jsx
│   └── Typewriter.jsx
├── data/
│   └── teams.js
├── hooks/
│   └── useGameContext.jsx
├── screens/
│   ├── Lobby.jsx
│   ├── Round1.jsx
│   ├── Round2.jsx
│   ├── Bonus.jsx
│   └── Results.jsx
└── App.jsx
```

## Research Decisions

- Keep the control panel entirely client-side.
- Reuse the existing shared game state instead of building a separate admin state store.
- Avoid route changes or server-side logic so Vercel hosting stays simple.

## Implementation Strategy

### Pass 1: Shared State Controls

- Add reducer actions for manual screen, team, question, token, and score overrides
- Keep overrides compatible with existing persistence

### Pass 2: Overlay UI

- Create a floating control panel component
- Add controls for screen selection, team selection, reset, question progress, token adjustment, and score adjustment

### Pass 3: Verification

- Confirm build and lint pass
- Confirm local control works even when backend requests fail
- Confirm the app remains static-hostable and Vercel-friendly

## Verification Strategy

- Run `npm run build` in `intern-game-src`
- Run `npm run lint` in `intern-game-src`
- Smoke-test the overlay on:
  - Lobby
  - Round 1
  - Round 2
  - Bonus
  - Results
- Confirm that manual overrides persist through the shared session state

## Risks And Mitigations

- Risk: control UI may clutter the player view.
  - Mitigation: make it collapsible and visually secondary.
- Risk: manual overrides may create inconsistent state.
  - Mitigation: keep actions narrow and reset dependent round state when team changes.
- Risk: deployment assumptions may drift toward backend dependence.
  - Mitigation: keep the feature self-contained and static-safe.

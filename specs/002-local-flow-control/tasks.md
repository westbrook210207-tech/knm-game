# Tasks: Local Flow Control

**Input**: Design documents from `/specs/002-local-flow-control/`
**Prerequisites**: plan.md, spec.md

## Phase 1: Foundational

- [ ] T001 Add local flow control feature spec in `specs/002-local-flow-control/spec.md`
- [ ] T002 Add implementation plan in `specs/002-local-flow-control/plan.md`
- [ ] T003 Update `.specify/feature.json` to point at `specs/002-local-flow-control`

## Phase 2: User Story 1 - Control Screen Progression (P1)

- [ ] T004 [US1] Add organizer control actions to `intern-game-src/src/hooks/useGameContext.jsx`
- [ ] T005 [US1] Create `intern-game-src/src/components/ControlPanel.jsx`
- [ ] T006 [US1] Create `intern-game-src/src/components/ControlPanel.css`
- [ ] T007 [US1] Mount the control panel in `intern-game-src/src/App.jsx`

## Phase 3: User Story 2 - Control Team And Round State (P2)

- [ ] T008 [US2] Add team, question, token, and score override actions to `intern-game-src/src/hooks/useGameContext.jsx`
- [ ] T009 [US2] Wire the control panel inputs to shared state in `intern-game-src/src/components/ControlPanel.jsx`

## Phase 4: User Story 3 - Stay Static-Hosting Friendly (P3)

- [ ] T010 [US3] Keep the control feature fully client-side and compatible with local persistence
- [ ] T011 [US3] Verify `npm run build` and `npm run lint` in `intern-game-src`

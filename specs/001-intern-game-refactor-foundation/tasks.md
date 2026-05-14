# Tasks: Intern Game Refactor Foundation

**Input**: Design documents from `/specs/001-intern-game-refactor-foundation/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, quickstart.md

**Tests**: No automated test work is required in this feature. Verification is via build, lint where useful, and manual gameplay checks from `quickstart.md`.

**Organization**: Tasks are grouped by user story to support incremental refactor work while preserving the current product flow.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Create the planning and execution scaffolding for the refactor

- [x] T001 Confirm the active feature artifacts are present in `specs/001-intern-game-refactor-foundation/`
- [x] T002 Update `AGENTS.md` to point to `specs/001-intern-game-refactor-foundation/plan.md`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Establish the repository direction and architecture boundaries before screen refactors

- [x] T003 Create the project constitution in `.specify/memory/constitution.md`
- [x] T004 Create the baseline refactor spec in `specs/001-intern-game-refactor-foundation/spec.md`
- [x] T005 Create the implementation plan in `specs/001-intern-game-refactor-foundation/plan.md`
- [x] T006 [P] Create research decisions in `specs/001-intern-game-refactor-foundation/research.md`
- [x] T007 [P] Create the internal state/data reference in `specs/001-intern-game-refactor-foundation/data-model.md`
- [x] T008 [P] Create manual verification guidance in `specs/001-intern-game-refactor-foundation/quickstart.md`

**Checkpoint**: The spec-driven refactor baseline is documented and ready for code work.

---

## Phase 3: User Story 1 - Stabilize The Current Game Loop (Priority: P1) 🎯 MVP

**Goal**: Preserve the current `intern-game-src` player journey while removing embedded content data from screen components.

**Independent Test**: The app still runs through `lobby -> round1 -> round2 -> bonus -> results`, and the screens now import their content from dedicated data modules.

### Implementation for User Story 1

- [x] T009 [P] [US1] Create `intern-game-src/src/data/teams.js` with the canonical team list extracted from `intern-game-src/src/screens/Lobby.jsx`
- [x] T010 [P] [US1] Create `intern-game-src/src/data/round1Questions.js` with quiz content and Round 1 metadata extracted from `intern-game-src/src/screens/Round1.jsx`
- [x] T011 [P] [US1] Create `intern-game-src/src/data/round2Scenarios.js` with scenario and hint content extracted from `intern-game-src/src/screens/Round2.jsx`
- [x] T012 [US1] Update `intern-game-src/src/screens/Lobby.jsx` to use `src/data/teams.js`
- [x] T013 [US1] Update `intern-game-src/src/screens/Round1.jsx` to use `src/data/round1Questions.js`
- [x] T014 [US1] Update `intern-game-src/src/screens/Round2.jsx` to use `src/data/round2Scenarios.js`

**Checkpoint**: Core game content is no longer embedded in the main screen files, and the visible flow remains unchanged.

---

## Phase 4: User Story 2 - Separate Product Rules From Screen Code (Priority: P2)

**Goal**: Normalize the internal game state and move reusable rules out of screen components.

**Independent Test**: Screens still work after the state model and helper logic are extracted, and shared rules are no longer duplicated inside large UI files.

### Implementation for User Story 2

- [x] T015 [P] [US2] Create `intern-game-src/src/game/scoring.js` for token conversion and result helper logic currently embedded in screen files
- [x] T016 [P] [US2] Create `intern-game-src/src/game/round1.js` for Round 1 defaults and transition helpers
- [x] T017 [P] [US2] Create `intern-game-src/src/game/round2.js` for scenario lookup and SWOT defaults
- [x] T018 [P] [US2] Create `intern-game-src/src/game/bonus.js` for reusable bonus constants and helpers
- [x] T019 [US2] Refactor `intern-game-src/src/hooks/useGameContext.jsx` into a grouped session state model with clear reset behavior
- [x] T020 [US2] Update `intern-game-src/src/screens/Round1.jsx` and `intern-game-src/src/screens/Results.jsx` to use `src/game/scoring.js`
- [x] T021 [US2] Update `intern-game-src/src/screens/Round2.jsx` to use `src/game/round2.js`
- [x] T022 [US2] Update `intern-game-src/src/screens/Bonus.jsx` to use `src/game/bonus.js` where safe without changing gameplay feel

**Checkpoint**: Game rules and reusable state logic are separated from rendering concerns.

---

## Phase 5: User Story 3 - Support Safe Iteration For Demo Use (Priority: P3)

**Goal**: Make the frontend game resilient for demos by documenting and implementing predictable local persistence.

**Independent Test**: A mid-session refresh restores or safely resets progress according to the implemented persistence rules.

### Implementation for User Story 3

- [x] T023 [P] [US3] Create local session serialization helpers in `intern-game-src/src/game/sessionPersistence.js`
- [x] T024 [US3] Update `intern-game-src/src/hooks/useGameContext.jsx` to restore and persist the normalized game session
- [x] T025 [US3] Add invalid-state fallback and reset handling in `intern-game-src/src/hooks/useGameContext.jsx`
- [x] T026 [US3] Update `specs/001-intern-game-refactor-foundation/data-model.md` and `quickstart.md` if persistence behavior changes during implementation

**Checkpoint**: Demo-mode play is more resilient and refresh behavior is documented.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Validate the refactor and record its outcome

- [x] T027 Run `npm run build` in `intern-game-src`
- [x] T028 Run `npm run lint` in `intern-game-src` and record any pre-existing issues that are outside feature scope
- [ ] T029 Execute the manual verification flow from `specs/001-intern-game-refactor-foundation/quickstart.md`
- [ ] T030 Update feature docs in `specs/001-intern-game-refactor-foundation/` to reflect the final implemented scope

## Dependencies & Execution Order

### Phase Dependencies

- Phase 1 and Phase 2 establish the spec-driven baseline and should complete first.
- Phase 3 is the MVP implementation pass and should complete before deeper state refactors.
- Phase 4 depends on Phase 3 because helper extraction should target the new data modules.
- Phase 5 depends on Phase 4 because persistence should operate on the normalized state shape.
- Phase 6 runs after the desired implementation passes are complete.

### User Story Dependencies

- **User Story 1 (P1)**: Depends on the documented baseline only.
- **User Story 2 (P2)**: Depends on User Story 1 data extraction.
- **User Story 3 (P3)**: Depends on User Story 2 state normalization.

### Parallel Opportunities

- T009, T010, and T011 can be done in parallel because they create separate data modules.
- T015, T016, T017, and T018 can be done in parallel because they target separate helper files.
- Documentation updates in the feature folder can proceed in parallel with low-risk code extraction work when behavior is already settled.

## Implementation Strategy

### MVP First

1. Complete all documentation and baseline tasks
2. Complete User Story 1 data extraction
3. Verify the visible game loop is unchanged

### Incremental Delivery

1. Land data extraction
2. Land rules/state extraction
3. Land persistence
4. Run validation and tighten docs

## Notes

- Keep presentation and CSS changes out of the foundational refactor unless they are necessary to preserve current behavior.
- Prefer extraction and import rewiring over rewriting working gameplay flows.
- If verification reveals behavior drift, pause and update the spec before continuing deeper refactors.

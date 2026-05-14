# Feature Specification: Local Flow Control

**Feature Branch**: `[002-local-flow-control]`  
**Created**: 2026-05-13  
**Status**: Draft  
**Input**: User description: "Add a local flow control layer so the game can be manually driven during demos while remaining hostable on Vercel."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Control Screen Progression (Priority: P1)

As a presenter or organizer, I need a local control panel so I can force the game to specific screens during demos without editing code or relying on backend infrastructure.

**Why this priority**: Manual screen control is the most immediate missing capability for live use, and it unlocks practical demos on a static deployment.

**Independent Test**: A presenter can open the control panel, switch between all five screens, and continue demoing the app without reloading the page or modifying source files.

**Acceptance Scenarios**:

1. **Given** the app is running, **When** the presenter opens the control panel and selects a target screen, **Then** the app navigates immediately to that screen.
2. **Given** the presenter is mid-demo, **When** they reset the game from the control panel, **Then** the session returns to a clean lobby state.

---

### User Story 2 - Control Team And Round State (Priority: P2)

As a presenter or organizer, I need to set key game values such as selected team, Round 1 question, tokens, and displayed scores so I can recover from mistakes or jump to a prepared scenario quickly.

**Why this priority**: Screen control alone is not enough if the underlying round state remains out of sync with the intended demo script.

**Independent Test**: A presenter can choose a team, adjust Round 1 progression, and modify visible scores from the control panel without breaking the UI.

**Acceptance Scenarios**:

1. **Given** the presenter wants to jump into a specific department scenario, **When** they choose a team from the control panel, **Then** the active team state updates consistently across the HUD and round screens.
2. **Given** the presenter needs to correct a demo state, **When** they adjust tokens or scores, **Then** the affected screens immediately reflect the new values.

---

### User Story 3 - Stay Static-Hosting Friendly (Priority: P3)

As the maintainer, I need the flow control feature to remain compatible with Vercel static hosting so the app can be deployed without a custom server or real-time backend.

**Why this priority**: The product must stay easy to host and share, and local flow control should not introduce infrastructure requirements that fight that goal.

**Independent Test**: The app builds as a static frontend, the control panel works without backend APIs, and the resulting deployment assumptions stay compatible with Vercel hosting.

**Acceptance Scenarios**:

1. **Given** the app is built for production, **When** it is served as static assets, **Then** the local control panel remains fully usable.
2. **Given** API calls fail or are unavailable, **When** the presenter uses the control panel, **Then** the app still supports manual flow control locally.

---

### Edge Cases

- What happens if the presenter opens Round 2 or Bonus before choosing a team?
- What happens if the presenter sets scores before the related round has been played?
- What happens if a persisted session already exists and the presenter manually overrides flow state?
- How does the control panel behave on narrow mobile viewports?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The app MUST provide a local control panel accessible from the UI during runtime.
- **FR-002**: The control panel MUST allow manual switching between `lobby`, `round1`, `round2`, `bonus`, and `results`.
- **FR-003**: The control panel MUST allow selecting the active team from the existing team list.
- **FR-004**: The control panel MUST allow resetting the entire session to a clean initial state.
- **FR-005**: The control panel MUST allow adjusting Round 1 question progress and token state.
- **FR-006**: The control panel MUST allow adjusting Round 2 and Bonus score values shown in the app.
- **FR-007**: The control panel MUST work without requiring backend connectivity.
- **FR-008**: The feature MUST remain compatible with static hosting on Vercel.
- **FR-009**: Manual control changes MUST update the same shared game state used by the player-facing screens.

### Key Entities *(include if feature involves data)*

- **Control Panel State**: The UI state for opening, closing, and interacting with the local organizer controls.
- **Manual Flow Command**: A user action that changes screen, team, question progress, tokens, or scores.
- **Shared Game Session**: The persisted game state that must reflect both player interactions and organizer overrides.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A presenter can move to any screen in under 5 seconds using only the control panel.
- **SC-002**: A presenter can reset and re-stage a demo scenario without reloading the page.
- **SC-003**: The production build remains deployable as a static app with no required server-side control layer.
- **SC-004**: Team, token, and score overrides are reflected immediately in the visible UI after they are changed.

## Assumptions

- The first control feature is intended for local/demo use, not secure multi-user event administration.
- The app continues to run as a Vite-built static frontend that can be hosted on Vercel.
- Local control is acceptable as an always-available or lightly hidden overlay in this phase.

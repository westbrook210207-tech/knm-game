# Feature Specification: Shared Game State And Auth

**Feature Branch**: `[004-shared-game-state-and-auth]`  
**Created**: 2026-05-15  
**Status**: Draft  
**Input**: User description: "Move into the first Supabase-backed phase by defining shared game state, role login, and session control for the small multi-device event."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Sync Phase Across Screens (Priority: P1)

As an organizer, I need admin, presenter, and team screens to read the same current game phase from one shared backend source so the classroom does not drift into mismatched states.

**Why this priority**: Shared phase state is the minimum viable realtime backbone for the event and unlocks every later round flow.

**Independent Test**: A reviewer can change the current phase from an admin-facing action and observe presenter and team-facing views reflect the same phase without manual refresh.

**Acceptance Scenarios**:

1. **Given** the event is in lobby state, **When** admin changes the phase to a Round 1 phase, **Then** presenter and connected team routes receive the updated phase.
2. **Given** a team opens its route after a phase is already active, **When** the screen loads, **Then** it sees the current shared phase rather than a local default.

---

### User Story 2 - Role Login With Event-Safe Session Rules (Priority: P1)

As an organizer, I need admin, team, and judge login flows with predictable session rules so devices can enter the event safely without conflicting control.

**Why this priority**: The event cannot run reliably if teams or judges enter the wrong role, keep stale sessions, or fight over the same control surface.

**Independent Test**: A reviewer can log in as team, judge, or admin using the defined credentials flow and see that the session model follows the documented primary-controller policy.

**Acceptance Scenarios**:

1. **Given** a team logs in on one device, **When** it becomes the first successful session, **Then** that device is marked as the primary controller.
2. **Given** the same team logs in on a second device, **When** the second session is created, **Then** it is treated according to the defined secondary/read-only policy.
3. **Given** admin revokes a team session, **When** that team refreshes or interacts again, **Then** the revoked session no longer has active control.

---

### User Story 3 - Keep The Supabase Integration Narrow And Verifiable (Priority: P2)

As the maintainer, I need the first Supabase phase to stay focused on shared state and auth scaffolding so we can verify schema, access rules, and subscriptions before implementing round-specific orchestration.

**Why this priority**: Phase C is the riskiest part of the roadmap, and mixing round scoring logic into the first backend pass would make failures harder to isolate.

**Independent Test**: A reviewer can inspect the schema, login model, and shared phase sync behavior without needing Round 1 marking or Round 2 scoring to already exist.

**Acceptance Scenarios**:

1. **Given** the backend integration is running, **When** a reviewer tests the role routes, **Then** they can verify login/session behavior and shared phase sync without needing round-specific scoring APIs.
2. **Given** a new contributor reads the spec and plan, **When** they prepare implementation work, **Then** they can identify which concerns belong to `004` versus later phase specs.

---

### Edge Cases

- What happens when a team opens `/team/:teamId` with no active session?
- What happens when a revoked team session still has a stale local token or cached browser state?
- What happens when two team devices attempt first login nearly simultaneously?
- What happens when presenter opens before admin has initialized a game state row?
- What happens when a judge logs in outside Round 2?
- What happens when realtime delivery lags and a client reconnects mid-phase?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The feature MUST introduce Supabase as the shared backend for this app.
- **FR-002**: The feature MUST define a shared `game_state` model that represents the current event phase and other minimum global state needed by admin, presenter, and team routes.
- **FR-003**: The feature MUST define role login flows for admin, team, and judge.
- **FR-004**: Team login MUST support multiple devices while preserving one primary controller policy per team.
- **FR-005**: The feature MUST support admin-driven session revocation for team sessions.
- **FR-006**: Presenter routes MUST be able to read shared phase state without write permissions.
- **FR-007**: Team routes MUST be able to read the shared phase state after login and determine whether the current device is a primary or secondary session.
- **FR-008**: Judge routes MUST be able to establish identity for later scoring phases even if scoring UI is not fully implemented in this feature.
- **FR-009**: The initial Supabase schema MUST identify at least `teams`, `game_state`, `sessions`, and any minimal supporting auth/session records required by the chosen implementation.
- **FR-010**: The feature MUST define which data is global event state versus per-team session state.
- **FR-011**: The feature MUST define realtime subscriptions required for shared phase synchronization in this phase.
- **FR-012**: The feature MUST define security expectations for backend access, including which roles can read or write each shared data surface.
- **FR-013**: The feature MUST remain compatible with the route structure introduced in `003-multi-route-vite-shell`.
- **FR-014**: The feature MUST not yet implement full Round 1 marking, Round 2 judging, or bonus scoring orchestration, which belong to later specs.

### Key Entities *(include if feature involves data)*

- **Game State**: The shared event-level state containing at minimum the current phase and any global metadata needed across role routes.
- **Team Record**: A team identity record used to map `teamId`, display information, and login/session rules.
- **Team Session**: A session associated with a team device, including whether it is primary, secondary, active, or revoked.
- **Judge Identity**: A judge-specific login identity used to establish later scoring permissions.
- **Admin Identity**: A privileged identity capable of writing global game state and revoking sessions.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Admin, presenter, and team clients can all observe the same current phase from shared backend state.
- **SC-002**: A team can log in on two devices and the system can distinguish primary versus secondary session behavior.
- **SC-003**: Admin can revoke a team session and the affected device loses active control.
- **SC-004**: The shared-state and auth foundation can be tested independently from round scoring logic.

## Assumptions

- Supabase will be the backend used for database, auth/session support, and realtime subscriptions in this phase.
- The event remains small-scale enough that a single shared event state model is sufficient.
- Judge login may begin with simple identity/session support before full scoring features are added.
- Existing prototype local state can remain as a temporary fallback or UI shell aid while shared state is introduced, as long as backend state becomes the source of truth for phase sync.

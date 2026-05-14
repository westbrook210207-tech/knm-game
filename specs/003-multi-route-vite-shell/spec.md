# Feature Specification: Multi-Route Vite Shell

**Feature Branch**: `[003-multi-route-vite-shell]`  
**Created**: 2026-05-15  
**Status**: Draft  
**Input**: User description: "Evolve `intern-game-src` into a multi-route Vite app that matches the GDD role structure without introducing gameplay backend logic yet."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Separate Role Entry Points (Priority: P1)

As an organizer, I need distinct app routes for admin, presenter, team, and judge so the product structure matches the real event roles instead of forcing every use case through one single-device flow.

**Why this priority**: The current single-flow SPA is the main structural gap between the prototype and the intended event operation model.

**Independent Test**: A reviewer can run the Vite app, visit the four target routes directly, and see stable role-specific shell pages without breaking the existing visual language.

**Acceptance Scenarios**:

1. **Given** the app is running, **When** a user visits `/admin`, **Then** they see an admin shell screen instead of the single-device prototype flow.
2. **Given** the app is running, **When** a user visits `/presenter`, `/team/:teamId`, or `/judge/:judgeId`, **Then** each route renders a dedicated shell appropriate to that role.

---

### User Story 2 - Preserve The Existing Prototype As UI Source (Priority: P2)

As a maintainer, I need the new shell to reuse the current visual system and game-feel language so migration does not accidentally flatten the product into generic placeholder pages.

**Why this priority**: The current prototype's strongest asset is its visual tone and team-facing experience, so the new route structure should inherit that rather than start visually from zero.

**Independent Test**: A reviewer can compare the new role shells against `intern-game-src` and confirm that fonts, colors, HUD language, and layout direction are clearly descended from the prototype.

**Acceptance Scenarios**:

1. **Given** the new shell routes exist, **When** a maintainer reviews them, **Then** the shared design tokens and core visual primitives are reused instead of duplicated ad hoc per route.
2. **Given** the team route shell is opened, **When** a user compares it to the existing prototype, **Then** the screen tone still feels like the same game family.

---

### User Story 3 - Keep Phase B Lightweight And Local-First (Priority: P3)

As the maintainer, I need Phase B to stop at shell architecture so we can validate route structure safely before taking on higher-risk realtime or auth work.

**Why this priority**: Shared backend state, session policy, and realtime permissions are already identified as the highest-risk phases and should not be mixed into the routing foundation.

**Independent Test**: A reviewer can confirm that route migration lands without requiring Supabase setup, live auth, or role-based data permissions.

**Acceptance Scenarios**:

1. **Given** the new multi-route shell is implemented, **When** the app is built and run locally, **Then** it works without any backend requirement.
2. **Given** a maintainer reviews the feature scope, **When** they inspect the route shells, **Then** they can see that gameplay logic and realtime behavior remain out of scope for this phase.

---

### Edge Cases

- What happens when a user visits `/team/:teamId` with an unknown team identifier?
- What happens when a user visits `/judge/:judgeId` with an unknown judge identifier?
- How does the app behave when a route is opened directly via browser refresh on static hosting?
- How does the root route `/` decide whether to remain a landing page, redirect helper, or simple route chooser in this phase?
- How much of the existing single-device `App` flow remains accessible while multi-route migration is in progress?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The product MUST remain a Vite-based React application during this feature.
- **FR-002**: The product MUST introduce client-side routing that supports `/`, `/admin`, `/presenter`, `/team/:teamId`, and `/judge/:judgeId`.
- **FR-003**: Each route MUST render a distinct role shell that reflects the intended responsibility of that role even if full gameplay is not implemented yet.
- **FR-004**: The feature MUST preserve the existing prototype as the visual baseline for shared styling, typography, and interface tone.
- **FR-005**: The team route MUST be able to receive a team identifier from the URL and render a team-scoped shell state.
- **FR-006**: The judge route MUST be able to receive a judge identifier from the URL and render a judge-scoped shell state.
- **FR-007**: The root route MUST provide a clear entry behavior for this phase, such as a route chooser, role landing page, or redirect layer.
- **FR-008**: The implementation MUST remain runnable without Supabase, role auth, or realtime subscriptions.
- **FR-009**: The existing prototype flow MUST remain either preserved behind a deliberate route or cleanly absorbed into the new team route without losing reference value during migration.
- **FR-010**: The new route structure MUST remain compatible with static hosting and direct browser navigation on Vercel.
- **FR-011**: The feature MUST define which shared layout primitives or design tokens are centralized as part of the shell migration.
- **FR-012**: Phase B MUST avoid introducing role permission logic, backend writes, or gameplay orchestration that belongs to later phases.

### Key Entities *(include if feature involves data)*

- **Role Route**: A client-side route representing one event role such as admin, presenter, team, or judge.
- **Role Shell**: The initial layout and UI scaffolding for a route before realtime gameplay logic is attached.
- **Route Params**: URL parameters such as `teamId` and `judgeId` that scope a shell to a specific participant.
- **Shared Visual System**: The fonts, colors, spacing, HUD patterns, and core presentation rules reused from the prototype.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A maintainer can navigate to all five planned routes locally and see stable role-specific shells without runtime errors.
- **SC-002**: The app still builds successfully as a Vite project and remains compatible with static hosting.
- **SC-003**: A reviewer can identify reused shared visual primitives rather than route-by-route styling duplication.
- **SC-004**: The shell migration does not require Supabase credentials or backend services to be tested in a browser.

## Assumptions

- This feature is intentionally limited to route architecture and shared UI shell work.
- `intern-game-src` remains the codebase to evolve, rather than creating a second frontend app.
- Full auth, session policy, and realtime game state are deferred to later specs.
- The current prototype's single-device flow can temporarily coexist with route shells if that reduces migration risk.

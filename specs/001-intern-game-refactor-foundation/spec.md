# Feature Specification: Intern Game Refactor Foundation

**Feature Branch**: `[001-intern-game-refactor-foundation]`  
**Created**: 2026-05-13  
**Status**: Draft  
**Input**: User description: "Adopt a spec-driven refactor workflow and treat `intern-game-src` as the product baseline instead of following the rebuild-analysis direction."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Stabilize The Current Game Loop (Priority: P1)

As a maintainer, I need the repository to clearly define and preserve the current `intern-game-src` single-device game loop so we can refactor safely without accidentally changing the playable experience.

**Why this priority**: Without a locked baseline, every refactor risks changing game behavior and reintroducing confusion about which version of the product is authoritative.

**Independent Test**: A reviewer can compare the approved spec to the current game flow and confirm that the intended player journey from lobby through results is fully described and internally consistent.

**Acceptance Scenarios**:

1. **Given** a contributor starts refactor work, **When** they read the approved spec, **Then** they can identify the canonical screen order, round goals, and scoring model without consulting `docs/rebuild-analysis`.
2. **Given** a contributor proposes a refactor, **When** they compare their change against the spec, **Then** they can tell whether gameplay is preserved or intentionally changed.

---

### User Story 2 - Separate Product Rules From Screen Code (Priority: P2)

As a maintainer, I need the game content, rules, and state model documented independently from the current screen components so we can refactor code in smaller pieces instead of editing large mixed-purpose files.

**Why this priority**: The current screens mix content, logic, and rendering, which slows updates and makes behavior harder to reason about.

**Independent Test**: A reviewer can extract a refactor plan from the spec alone and identify which data, state, and logic modules should exist before touching UI polish.

**Acceptance Scenarios**:

1. **Given** the approved spec, **When** a contributor prepares a refactor plan, **Then** they can map teams, questions, scenarios, scoring, and round progression into separate concerns.
2. **Given** a future content update, **When** the maintainer reviews the spec, **Then** they know which game artifacts should be editable without rewriting entire screens.

---

### User Story 3 - Support Safe Iteration For Demo Use (Priority: P3)

As a maintainer running demos or playtests, I need the refactored product to remain usable without backend setup and resilient to common demo issues like refreshes or partial progress loss.

**Why this priority**: The product is currently most valuable as a playable demo, so refactor work must not make it harder to run in practical settings.

**Independent Test**: A reviewer can verify from the spec that demo/local mode remains supported and that persistence behavior is explicitly defined rather than left accidental.

**Acceptance Scenarios**:

1. **Given** the game runs without an API server, **When** a team starts a session, **Then** the product still provides a coherent playthrough.
2. **Given** the player refreshes during a session, **When** the chosen persistence behavior is applied, **Then** the resulting state is predictable and documented.

---

### Edge Cases

- What happens when a player refreshes the browser mid-round?
- What happens when no backend is available or an API call fails?
- What happens when the player reaches a round transition with incomplete optional data?
- How does the game reset cleanly for a new playthrough after reaching results?
- How is bonus scoring handled if the player exits before finishing the mini-game?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The repository MUST treat `intern-game-src` as the canonical product baseline for the active refactor direction.
- **FR-002**: The product MUST preserve a single-device playable flow with the screen order `lobby -> round1 -> round2 -> bonus -> results` unless a later approved spec changes it.
- **FR-003**: The specification set MUST define the intended rules for Round 1, Round 2, Bonus, and final results in player-visible terms.
- **FR-004**: The specification set MUST define the minimum game state required to progress through a full session.
- **FR-005**: The refactor direction MUST support play without a required backend dependency.
- **FR-006**: The refactor direction MUST identify game content as separately maintainable artifacts, including teams, Round 1 questions, Round 2 scenarios, and score rules.
- **FR-007**: The refactor direction MUST identify state transitions and reset behavior for a full playthrough.
- **FR-008**: The product MUST define how API failures affect gameplay so that demo mode behavior is predictable.
- **FR-009**: The product MUST define whether and how session progress persists across page refreshes.
- **FR-010**: Future refactor plans MUST be traceable back to this specification and explicitly call out preserved behavior versus intentional changes.

### Key Entities *(include if feature involves data)*

- **Team**: A selectable department in the lobby with an identifier, display name, and themed presentation.
- **Round 1 Question**: A prompt with difficulty, answer options, a correct answer, and token-related scoring impact.
- **Round 2 Scenario**: A candidate/case profile tied to a team and used to drive SWOT analysis gameplay.
- **Game Session**: The current playthrough state containing selected team, current screen, round progress, and scores.
- **Score Summary**: The derived view of Round 1, Round 2, Bonus, and total results shown to the player.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A new contributor can identify the canonical product direction and full game loop within 10 minutes by reading repository specs alone.
- **SC-002**: A refactor plan derived from the spec can separate content, state, and logic concerns without requiring reference to `docs/rebuild-analysis`.
- **SC-003**: The spec defines enough behavior that two maintainers reviewing the same proposed refactor would agree on whether it preserves or changes gameplay.
- **SC-004**: The spec explicitly documents local/demo mode expectations and refresh behavior so demo setup questions are answerable without inspecting screen code.

## Assumptions

- The active product direction is a browser-based frontend game centered on `intern-game-src`.
- Backend integration is optional for the current phase and should not drive the first refactor pass.
- Existing visual language, tone, and round structure are worth preserving unless a later spec intentionally changes them.
- Historical rebuild-analysis documents remain available for context but are out of scope as decision-making authorities for this feature.

# Research: Intern Game Refactor Foundation

## Decision 1: Use `intern-game-src` as the primary product reference

- **Decision**: Treat the current `intern-game-src` implementation and its playable flow as the active source for product behavior.
- **Rationale**: The repository direction has already shifted away from the older rebuild-analysis path. Refactor decisions need a stable, inspectable baseline that matches what the user wants to keep evolving.
- **Alternatives considered**:
  - Use `docs/rebuild-analysis` as the primary source.
    - Rejected because it points toward a different architecture and introduces decision noise for the current goal.
  - Preserve both directions equally.
    - Rejected because it prevents a clear spec-driven workflow.

## Decision 2: Refactor by extraction instead of feature redesign

- **Decision**: First-pass refactor work will extract data and logic out of large screen components while preserving current UI flow and screen hierarchy.
- **Rationale**: The current pain is architectural coupling, not lack of features. Extraction lowers risk and makes follow-up changes easier without flattening game feel.
- **Alternatives considered**:
  - Rewrite the app into a new route structure immediately.
    - Rejected because it increases scope and makes gameplay regressions more likely.
  - Redesign screens at the same time as refactoring.
    - Rejected because it mixes behavior changes with architecture changes and makes verification harder.

## Decision 3: Keep backend calls optional in the first refactor pass

- **Decision**: Preserve the current demo-friendly approach where API calls are optional and failures do not block playthrough completion.
- **Rationale**: The product needs to stay runnable without backend setup, and the current repo does not contain a matching backend implementation for the declared endpoints.
- **Alternatives considered**:
  - Remove all API calls now.
    - Rejected because they may still be useful for future integration and can remain as non-blocking adapters.
  - Make API success mandatory.
    - Rejected because it conflicts with the current product direction and breaks demo use.

## Decision 4: Add explicit local persistence

- **Decision**: Introduce predictable localStorage persistence for the game session as part of the state refactor.
- **Rationale**: The current reducer loses all progress on refresh, which is risky for demos and inconsistent with the desired “safe iteration” goal in the spec.
- **Alternatives considered**:
  - Keep the current ephemeral reducer only.
    - Rejected because it leaves an important edge case unresolved.
  - Add backend persistence first.
    - Rejected because it would move the refactor away from frontend-first constraints.

## Decision 5: Keep public contracts internal for now

- **Decision**: Do not create formal interface contracts for external consumers in this feature.
- **Rationale**: The current refactor target is internal architecture within a single frontend app. The useful contracts at this stage are data-model and state-model artifacts, not public API guarantees.
- **Alternatives considered**:
  - Produce pseudo-API contracts for current Axios wrappers.
    - Rejected because the endpoints are not authoritative and the repo does not implement them.

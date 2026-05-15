# Tasks: Shared Game State And Auth

## Phase 1 - Supabase Foundation

- [x] Confirm Supabase project access and environment setup
- [x] Add Supabase client dependencies to `intern-game-src`
- [x] Define initial schema for `teams`, `game_state`, and `sessions`
- [x] Decide how judge/admin identities are represented in this phase

## Phase 2 - Shared Phase Sync

- [x] Implement shared `game_state` read/write helpers
- [ ] Wire admin phase update flow
- [x] Wire presenter read-only phase subscription
- [x] Wire team read-only phase subscription

## Phase 3 - Auth And Session Policy

- [ ] Implement admin, team, and judge login flows
- [ ] Implement primary-controller assignment for team sessions
- [ ] Implement secondary/read-only team session behavior
- [ ] Implement admin session revocation

## Phase 4 - Route Integration

- [ ] Connect `/admin`, `/presenter`, `/team/:teamId`, and `/judge/:judgeId` shells to backend-backed identity/state
- [ ] Keep round-specific orchestration out of this feature

## Phase 5 - Verification

- [ ] Verify Supabase schema/migration state
- [ ] Verify `game_state` write/read behavior
- [ ] Verify phase sync across admin, presenter, and team routes
- [ ] Verify multi-device team session behavior
- [ ] Verify admin revoke behavior
- [ ] Run `npm run build` in `intern-game-src`
- [ ] Run `npm run lint` in `intern-game-src`

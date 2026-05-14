# Tasks: Multi-Route Vite Shell

## Phase 1 - Routing Foundation

- [x] Add `react-router-dom` to `intern-game-src`
- [x] Create route definitions for `/`, `/admin`, `/presenter`, `/team/:teamId`, `/judge/:judgeId`
- [x] Preserve the current prototype flow behind a deliberate transitional route

## Phase 2 - Role Shells

- [x] Create a shared role shell layout component
- [x] Create `HomeRoute`, `AdminRoute`, `PresenterRoute`, `TeamRoute`, and `JudgeRoute`
- [x] Handle invalid `teamId` and `judgeId` states gracefully
- [x] Add a fallback route for invalid URLs

## Phase 3 - Visual System Reuse

- [x] Reuse prototype fonts, colors, and layout cues in route shells
- [x] Keep the existing prototype playable for migration reference

## Phase 4 - Static Hosting Compatibility

- [ ] Confirm browser refresh on nested routes remains deployable on Vercel
- [x] Add routing fallback configuration if needed for static hosting

## Phase 5 - Verification

- [x] Run `npm run build` in `intern-game-src`
- [x] Run `npm run lint` in `intern-game-src`
- [ ] Manually verify `/`, `/admin`, `/presenter`, `/team/:teamId`, `/judge/:judgeId`, and the transitional prototype route

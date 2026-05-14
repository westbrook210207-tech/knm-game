# Quickstart: Intern Game Refactor Foundation

## Goal

Verify the refactor foundation without changing the visible product flow of `intern-game-src`.

## Setup

1. Change into `intern-game-src`
2. Install dependencies if needed with `npm install`
3. Start the app with `npm run dev`

## Manual Verification Flow

### 1. Lobby

- Open the app
- Confirm the lobby renders with the boss intro, title, and team grid
- Select a team and start the game

### 2. Round 1

- Confirm questions appear in the expected order
- Place bets across multiple questions
- Verify correct and incorrect answers change tokens as expected
- Complete all questions and confirm the app advances to Round 2

### 3. Round 2

- Confirm the selected team maps to the expected scenario
- Move from reading to writing
- Enter SWOT content, toggle hints, and submit
- Confirm the app advances to Bonus

### 4. Bonus

- Verify keyboard or on-screen controls move the player
- Confirm collision/life behavior still works
- Verify both win and loss paths can reach Results

### 5. Results

- Confirm final section shows Round 1, Round 2, Bonus, and total values
- Use replay/reset and confirm the game returns to Lobby cleanly

### 6. Persistence

- Start a playthrough and refresh mid-session
- Confirm the session restores from browser localStorage and remains on the expected screen
- Confirm team selection, Round 1 progress, and score state survive refresh in the same browser
- Clear invalid storage data if needed and confirm the app safely resets

## Build Verification

Run these from `intern-game-src`:

- `npm run build`
- `npm run lint`

If lint errors pre-exist outside the refactor scope, record them and use build plus manual flow verification as the minimum acceptance bar for this phase.

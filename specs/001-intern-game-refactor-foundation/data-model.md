# Data Model: Intern Game Refactor Foundation

## Overview

This feature formalizes the internal game data and session state that should exist independently from screen components.

## Entities

### Team

Represents a selectable department in the lobby.

**Fields**

- `id`: stable identifier used across the session
- `name`: display label shown in UI
- `icon`: emoji or visual marker shown in the lobby and related UI

**Rules**

- Exactly one team is selected for a playthrough
- Team identity determines the Round 2 scenario

### Round1Question

Represents one quiz prompt in Round 1.

**Fields**

- `id`: stable numeric or string identifier
- `text`: player-facing prompt
- `difficulty`: display category
- `answer`: explanation shown after reveal
- `options`: available answers
- `correct`: correct option label

**Rules**

- Questions are presented in a fixed order for the current baseline
- A player may submit at most one answer per question
- Token gain or loss depends on both answer correctness and placed bet

### Round2Scenario

Represents the case file shown in Round 2.

**Fields**

- `teamId`: owning team identifier
- `name`: candidate name
- `major`: field of study or role
- `age`: candidate age
- `file`: full scenario text
- `hints`: suggested SWOT references keyed by `S`, `W`, `O`, `T`

**Rules**

- Each team maps to exactly one scenario
- The scenario remains stable throughout the playthrough

### GameSession

Represents the current playthrough state.

**Fields**

- `screen`: current visible screen
- `sessionId`: optional session marker for API calls
- `team`: selected team identity
- `round1`: nested state for question progression, tokens, bets, answers, and score
- `round2`: nested state for reading/writing/submitted progress, SWOT input, and score
- `bonus`: nested state for player position, lives, phase, and score outcome
- `results`: derived or cached totals for final display

**Rules**

- Session starts at `lobby`
- Session is persisted to browser localStorage under a versioned payload
- Session can be restored from serialized local state if the stored version and shape are valid
- Invalid, unreadable, or outdated serialized state must fall back to a safe reset

## State Transitions

### Screen Flow

- `lobby -> round1`
- `round1 -> round2`
- `round2 -> bonus`
- `bonus -> results`
- `results -> lobby` via replay/reset

### Round 1 Phase Flow

- `betting -> answering -> reveal -> next question or round end`

### Round 2 Phase Flow

- `reading -> writing -> submitted`

### Bonus Phase Flow

- `playing -> won`
- `playing -> dead`
- `won|dead -> results`

## Derived Values

### Round 1 Score

Derived from final token count using the token conversion table.

### Total Score

Derived from:

- Round 1 score
- Round 2 score
- Bonus score

### Result Verdict

Derived from total score threshold and shown in the final results screen.

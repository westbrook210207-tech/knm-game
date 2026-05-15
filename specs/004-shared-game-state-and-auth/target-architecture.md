# Target Supabase Architecture

## Mục tiêu

Tài liệu này mô tả **kiến trúc đích** của app sau khi bước vào `004-shared-game-state-and-auth`, bám đúng các quyết định đã chốt:

- `role_profiles` là bảng role chung
- `events` tồn tại dù hiện chỉ có 1 row
- `team_sessions` là nguồn sự thật cho `is_primary`, `can_control`, `revoked`

---

## 1. Boundary tổng thể

```text
Frontend (Vite + React Router)
  /admin
  /presenter
  /team/:teamId
  /judge/:judgeId
        |
        v
Supabase Client Layer
  - auth client
  - game state client
  - sessions client
        |
        v
Supabase Platform
  - Auth
  - Postgres
  - Realtime
```

### Nguyên tắc

- Frontend chỉ dùng `publishable/anon` client key
- Shared event truth nằm ở Postgres
- Phase sync đi qua Realtime
- Role/session policy đi qua Auth + Postgres session tables
- Local storage chỉ là UI convenience, không phải source of truth

---

## 2. Route responsibility

### `/admin`

Quyền:
- login với role `admin`
- đọc/ghi `game_state`
- đọc `teams`, `role_profiles`, `team_sessions`
- revoke `team_sessions`

Chưa làm ở `004`:
- Round 1 marking đầy đủ
- Round 2 publish score đầy đủ

### `/presenter`

Quyền:
- không cần control write
- đọc `game_state`
- đọc `teams`
- về sau đọc `team_scores`

Mục tiêu ở `004`:
- subscribe phase shared state

### `/team/:teamId`

Quyền:
- login với role `team`
- đọc `game_state`
- đọc own `team_sessions`
- tạo/claim session cho thiết bị hiện tại

Mục tiêu ở `004`:
- xác định thiết bị này là `primary` hay `secondary`
- nếu `secondary` thì read-only

### `/judge/:judgeId`

Quyền:
- login với role `judge`
- đọc identity/profile
- đọc `game_state`

Mục tiêu ở `004`:
- có identity và session scaffold
- chưa cần submit score thật

---

## 3. Supabase service split

### Auth

Dùng để:
- xác định ai đang login
- giữ `auth.users`
- hỗ trợ session token của browser

Auth **không đủ** để biết user là admin/team/judge.  
Phần đó map qua `role_profiles`.

### Postgres

Giữ:
- `events`
- `teams`
- `role_profiles`
- `game_state`
- `team_sessions`

### Realtime

Dùng cho:
- update `game_state.current_phase`
- update session status cần reflect ngay

Không nên dùng Realtime để thay thế hết business logic.  
Business truth vẫn là DB rows.

---

## 4. Table ownership model

### `events`

Vai trò:
- “container” của một lần chạy game

Lý do tồn tại:
- tránh hardcode toàn app vào một game vô danh
- dễ seed / reset / archive / test

### `teams`

Vai trò:
- danh sách 9 team/phòng ban
- map với route `team/:teamId`

### `role_profiles`

Vai trò:
- map một `auth.users` sang role thật trong event

Ví dụ:
- admin account
- judge account
- team account gắn với `team_id`

### `game_state`

Vai trò:
- row global cho phase hiện tại của event

Ở `004`, đây là trọng tâm lớn nhất.

### `team_sessions`

Vai trò:
- row theo từng thiết bị / phiên đăng nhập của team

Đây là nơi giữ:
- `is_primary`
- `can_control`
- `status = active/revoked/expired`

---

## 5. Event flow trong `004`

### Admin update phase

```text
Admin UI
  -> writes game_state.current_phase
  -> Realtime emits row change
  -> Presenter receives
  -> Team routes receive
```

### Team login

```text
Team route
  -> login with auth
  -> load role_profiles for current auth user
  -> verify role = team and team matches route param
  -> create/claim team_sessions row
  -> determine primary vs secondary
```

### Revoke team session

```text
Admin UI
  -> updates team_sessions.status = revoked
  -> revoked client sees loss of control
  -> frontend routes back to login or read-only state
```

---

## 6. Source of truth rules

### Source of truth

- current phase: `game_state`
- team identity: `teams`
- logged-in role: `role_profiles`
- control rights per device: `team_sessions`

### Not source of truth

- URL params
- localStorage
- current React state

Những thứ đó chỉ là view state / navigation state.

---

## 7. Phase boundaries

### `004` phải làm

- Supabase client setup
- schema nền
- phase sync
- role login scaffold
- team session primary/secondary/revoke

### `004` chưa làm

- Round 1 bet rows
- Round 1 answer marking flow
- judge score submission logic
- leaderboard tổng hoàn chỉnh

---

## 8. Architecture decision summary

### Chốt cho `004`

1. Frontend route structure giữ nguyên từ `003`
2. Supabase bắt đầu từ `004`
3. `game_state` là shared phase truth
4. `role_profiles` là role map trung tâm
5. `team_sessions` là session/control map trung tâm
6. `events` tồn tại dù hiện chỉ 1 event

Đây là kiến trúc đúng theo flow đã chốt hiện tại, và đủ nhỏ để bắt đầu implementation có kiểm soát.

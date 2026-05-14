# Current Database Map

Tài liệu này mô tả schema Supabase/Postgres của current event system.

## Enum Types

### `public.game_phase`

Các phase hiện có:

- `lobby`
- `round1_question_open`
- `round1_betting_locked`
- `round1_reveal`
- `round2_case_draw`
- `round2_discussion`
- `round2_presentation`
- `bonus`
- `results`
- `paused`

### `public.user_role`

Hiện có:

- `team`
- `judge`
- `admin`
- `public`

Lưu ý: role enum tồn tại nhưng app thực tế chủ yếu dùng code/session, không dùng auth user role.

### `public.team_status`

Hiện có:

- `waiting`
- `active`
- `submitted`
- `locked`
- `offline`

Status dùng nhiều ở `/student`, `/admin`, `/leaderboard`.

## Tables

### `round2_cases`

Lưu 9 tình huống Round 2.

Columns chính:

- `id uuid`
- `case_number smallint unique`
- `title text`
- `prompt text`
- `expected_swot jsonb`
- `suggested_plan text`
- `created_at`
- `updated_at`

Liên hệ flow:

- Team được assign một case qua `teams.round2_case_id`.
- Student/Judge/Leaderboard đọc prompt từ case này.
- Judge score gắn với `round2_case_id`.

### `teams`

Lưu 9 phòng ban/đội.

Columns chính:

- `id uuid`
- `name text`
- `team_code text unique`
- `sort_key smallint`
- `round2_case_id uuid unique`
- `token_balance integer default 10`
- `round1_points integer default 1`
- `round2_points integer default 0`
- `bonus_points integer default 0`
- `total_points generated`
- `display_rank integer`
- `status team_status`
- timestamps

Liên hệ flow:

- `team_code` dùng đăng nhập `/student`.
- `token_balance` thay đổi sau Round 1.
- `round1_points` refresh từ token balance.
- `round2_points` chỉ cập nhật khi admin publish Round 2.
- `display_rank` do `refresh_leaderboard()` cập nhật.

### `round1_questions`

Lưu 5 câu hỏi Round 1.

Columns chính:

- `id uuid`
- `question_number smallint unique`
- `prompt text`
- `answer_key text`
- `difficulty text`
- timestamps

Liên hệ flow:

- Admin chọn `question_number`.
- Student có thể hiển thị prompt hiện tại.
- `round1_submissions.question_number` reference vào table này.

### `admin_accounts`

Lưu admin code.

Columns chính:

- `id uuid`
- `display_name text`
- `admin_code text unique`
- `is_active boolean`
- timestamps

Liên hệ flow:

- `private.require_admin(p_admin_code)` xác thực admin trước khi mutation.
- `admin_events.admin_id` reference vào table này.

### `judge_accounts`

Lưu 3 judge code.

Columns chính:

- `id uuid`
- `display_name text`
- `judge_code text unique`
- `sort_order smallint`
- `is_active boolean`
- timestamps

Liên hệ flow:

- `private.require_judge(p_judge_code)` xác thực judge.
- `judge_scores.judge_id` đảm bảo mỗi judge chỉ có một score/team.

### `game_state`

Singleton lưu trạng thái event hiện tại.

Columns chính:

- `singleton boolean primary key`
- `phase game_phase`
- `round_number smallint`
- `question_number smallint`
- `active_team_id uuid`
- `countdown_ends_at timestamptz`
- `is_submission_locked boolean`
- `projector_message text`
- timestamps

Liên hệ flow:

- Mọi route đọc phase từ đây.
- Admin mutation chủ yếu update table này.
- `active_team_id` quyết định Round 2 đang trình bày.
- `question_number` quyết định Round 1 câu hiện tại.

### `team_sessions`

Lưu session thiết bị của team.

Columns chính:

- `id uuid`
- `team_id uuid`
- `session_token text unique`
- `user_agent text`
- `is_active boolean`
- `created_at`
- `last_seen_at`
- `revoked_at`

Liên hệ flow:

- `join_team` revoke session cũ của cùng team.
- `get_current_team_state` yêu cầu session active.
- Reset demo state revoke toàn bộ active sessions.

### `round1_submissions`

Lưu token bet mỗi team mỗi câu.

Columns chính:

- `id uuid`
- `team_id uuid`
- `question_number smallint`
- `bet_amount integer`
- `answer_text text`
- `submitted_at`
- `is_correct boolean null`
- `token_delta integer`
- `marked_at`
- `processed_at`
- unique `(team_id, question_number)`

Liên hệ flow:

- Student khóa cược tạo row.
- Khi admin khóa cược, migration `0004` seed default bet `1` cho team chưa submit.
- Admin chấm đúng/sai update `is_correct`, `token_delta`, `processed_at`.
- Token team cộng/trừ theo `token_delta`.

### `round2_results`

Lưu kết quả tổng hợp Round 2 mỗi team.

Columns chính:

- `team_id uuid primary key`
- `round2_case_id uuid`
- `judge_count integer`
- `average_score numeric`
- `final_score integer`
- `is_finalized boolean`
- `is_published boolean`
- `finalized_at`
- `published_at`
- timestamps

Liên hệ flow:

- `submit_judge_score` upsert result sau mỗi judge.
- Khi đủ 3 judge, `is_finalized = true`.
- `publish_round2_result` set published và copy `final_score` vào `teams.round2_points`.

### `judge_scores`

Lưu điểm từng judge cho từng team.

Columns chính:

- `id uuid`
- `team_id uuid`
- `judge_id uuid`
- `round2_case_id uuid`
- `score_swot integer`
- `score_logic integer`
- `score_presentation integer`
- `total_score generated`
- `submitted_at`
- unique `(team_id, judge_id)`

Liên hệ flow:

- Judge có thể upsert điểm cho cùng team.
- Admin/judge status count từ table này.

### `admin_events`

Audit log hành động admin.

Columns chính:

- `id uuid`
- `admin_id uuid`
- `action text`
- `payload jsonb`
- `created_at`

Liên hệ flow:

- Ghi log khi set phase, mark Round 1, activate Round 2, publish, adjust score, grant bonus, reset demo.

## Views

### `leaderboard_view`

Expose leaderboard public:

- `id`
- `name`
- `sort_key`
- `token_balance`
- `round1_points`
- `round2_points`
- `bonus_points`
- `total_points`
- `display_rank`
- `status`

RPC `get_public_leaderboard()` trả view này.

### `judge_submission_status_view`

Expose trạng thái judge submission:

- `team_id`
- `team_name`
- `round2_case_id`
- `judge_submission_count`
- `submitted_by`

RPC `get_judge_submission_status(adminCode)` yêu cầu admin code rồi trả view này.

## Important Functions / RPC

### Auth/session helpers

- `private.require_admin(p_admin_code)`
- `private.require_judge(p_judge_code)`
- `private.require_team_session(p_session_token)`

### Utility

- `public.points_for_tokens(p_tokens)`
- `private.refresh_team_points(p_team_id default null)`
- `private.refresh_leaderboard()`
- `private.log_admin_event(...)`
- `private.seed_round1_lock_defaults(p_question_number)`

### Public RPC used by frontend

- `public.join_team`
- `public.get_current_team_state`
- `public.get_public_leaderboard`
- `public.submit_round1_answer`
- `public.set_game_phase`
- `public.mark_round1_results`
- `public.get_assigned_round2_case`
- `public.activate_round2_team`
- `public.get_active_presentation`
- `public.submit_judge_score`
- `public.get_judge_submission_status`
- `public.publish_round2_result`
- `public.adjust_team_score`
- `public.grant_bonus_points`
- `public.reset_demo_state`

## Migration History

### `0001_backend_v1.sql`

Tạo schema ban đầu:

- enum types
- tables
- triggers
- core functions
- RLS enable
- initial grants

### `0002_backend_v1_hardening.sql`

Hardening chính:

- tạo schema `private`
- chuyển helper auth/log/refresh sang private namespace
- tạo views `leaderboard_view`, `judge_submission_status_view`
- refine grants/revokes để frontend gọi RPC qua anon key

### `0003_reset_demo_state.sql`

Thêm `reset_demo_state(adminCode)`:

- revoke sessions
- clear judge scores, round2 results, round1 submissions
- reset token/points/status
- reset `game_state` về lobby Q1

### `0004_round1_question_sync_and_lock_defaults.sql`

Sửa flow Round 1:

- `set_game_phase` nhận thêm `p_question_number`
- khi mở Round 1, sync question number vào `game_state`
- khi khóa cược, seed default submission bet `1` cho team chưa submit
- giảm lỗi missing submission lúc admin chấm

### `0005_round1_single_submit_per_question.sql`

Sửa `submit_round1_answer`:

- chỉ cho submit một lần mỗi team mỗi question
- nếu đã locked/submitted câu đó thì không cho đổi bet

### `0006_localize_vietnamese_copy.sql`

Cập nhật dữ liệu nội dung tiếng Việt có dấu:

- prompt/answer key Round 1
- 9 case Round 2 bản dài hơn
- expected SWOT
- suggested plan
- projector message

## Seed Data

Seed hiện có:

- 9 `round2_cases`
- 9 `teams`: `TEAM-01` đến `TEAM-09`
- map `teams.sort_key = round2_cases.case_number`
- 5 `round1_questions`
- 1 admin: `ADMIN-UEH`
- 3 judge: `JUDGE-01`, `JUDGE-02`, `JUDGE-03`
- singleton `game_state` phase `lobby`, question `1`

## Security Notes

- Tables enable RLS.
- Frontend dùng anon key để gọi RPC.
- Sensitive mutations rely on admin/judge/team code checked inside security definer functions.
- Helper functions đã được đưa sang `private` trong migration hardening.
- Public RPC vẫn nằm ở `public` để Supabase REST có thể gọi qua `/rpc`; đây là tradeoff thực dụng cho event.

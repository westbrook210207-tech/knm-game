# Current Event System

Tài liệu này mô tả version hiện tại của project chính, không tính các thử nghiệm UI rebase vừa làm.

## Mục Tiêu Kiến Trúc

Project chính là một event system thật, backend-driven:

- Supabase/Postgres là nguồn sự thật cho phase, team, điểm, câu hỏi và phiên đăng nhập.
- Frontend chỉ là các màn theo vai trò: team, admin, judge, public projector.
- Admin điều phối game xuyên suốt, không để client tự tiến vòng.
- Judge chấm Round 2 riêng, admin publish điểm sau khi đủ dữ liệu.
- Leaderboard lấy dữ liệu công khai từ backend để dùng trên máy chiếu.

## Workspace Quan Trọng

- `apps/web`: Next.js app chính.
- `src/shared/contracts.ts`: type contract giữa frontend và backend client.
- `src/backend/client.js`: RPC client gọi Supabase REST `/rpc`.
- `supabase/migrations`: schema và RPC database.
- `supabase/seed.sql`: seed team, câu hỏi, case, admin code, judge code.
- `docs`: runbook, checklist và troubleshooting.

## Routes Frontend Chính

- `/`: entrypoint/hub.
- `/student`: màn đội chơi.
- `/leaderboard`: màn máy chiếu công khai.
- `/admin`: command center điều phối.
- `/judge`: màn chấm Round 2.
- `/bonus`: route mới thử nghiệm, chưa phải flow lõi ổn định.
- `/results`: route mới thử nghiệm, chưa phải flow lõi ổn định.

## Backend Client Contract

Frontend dùng `getGameBackendClient()` từ `apps/web/lib/game-backend.ts`, bọc `createGameBackendClient()` từ `src/backend/client.js`.

RPC đang được frontend gọi:

- `joinTeam(teamCode, sessionToken, userAgent?)`
- `getCurrentTeamState(sessionToken)`
- `getPublicLeaderboard()`
- `submitRound1Answer(sessionToken, questionNumber, betAmount, answerText)`
- `getAssignedRound2Case(sessionToken)`
- `getActivePresentation()`
- `submitJudgeScore(judgeCode, teamId, scoreSwot, scoreLogic, scorePresentation)`
- `setGamePhase(adminCode, phase, countdownEndsAt?, projectorMessage?, questionNumber?)`
- `markRound1Results(adminCode, questionNumber, teamResults)`
- `activateRound2Team(adminCode, teamId)`
- `getJudgeSubmissionStatus(adminCode)`
- `publishRound2Result(adminCode, teamId)`
- `adjustTeamScore(adminCode, teamId, patch, note?)`
- `grantBonusPoints(adminCode, teamId, points?, note?)`
- `resetDemoState(adminCode)`

## Vai Trò Và Auth

Current system không dùng Supabase Auth user login. Nó dùng operational codes:

- Team: nhập `TEAM-01` đến `TEAM-09`, tạo `team_sessions.session_token` client-side rồi lưu localStorage.
- Admin: nhập admin code, lưu localStorage trên máy điều phối.
- Judge: nhập judge code, lưu localStorage trên máy giám khảo.
- Public: leaderboard không cần code.

Điểm mạnh của mô hình này là phù hợp event offline/onsite: nhanh, dễ reset, ít friction.

## Flow Round 1

Luật hiện tại:

1. Admin chọn câu `Q1..Q5`.
2. Admin set phase `round1_question_open`, có thể kèm countdown.
3. Team ở `/student` chỉ chọn số token cược và bấm khóa cược.
4. Team trả lời ngoài đời/offline, không chọn đáp án trên web.
5. Admin set phase `round1_betting_locked`.
6. Backend seed default bet `1` cho đội đủ điều kiện nhưng chưa submit, tránh lỗi missing submission.
7. Admin chấm từng đội đúng/sai tại `/admin`.
8. `markRound1Results` cộng/trừ token theo bet.
9. `round1_points` được tính từ `token_balance` bằng `points_for_tokens`.
10. Leaderboard refresh và hiển thị điểm mới.

Quy đổi token -> điểm:

- `>= 18 token`: 5 điểm
- `14..17 token`: 4 điểm
- `9..13 token`: 3 điểm
- `4..8 token`: 2 điểm
- `0..3 token`: 1 điểm

## Flow Round 2

Luật hiện tại:

1. Mỗi team có sẵn `round2_case_id`.
2. Admin dùng `/admin` chọn team active.
3. `activateRound2Team` set `game_state.active_team_id` và phase `round2_presentation`.
4. `/student` của team đọc case/prompt được assign.
5. `/judge` đọc active presentation và full prompt.
6. Mỗi judge gửi điểm theo 3 rubric:
   - SWOT: 0..2
   - Logic: 0..2
   - Presentation: 0..1
7. `judge_scores` lưu điểm từng judge, unique theo `team_id + judge_id`.
8. Khi đủ 3 judge, backend tính average và final score trong `round2_results`.
9. Admin gọi `publishRound2Result`.
10. Backend ghi `teams.round2_points` và refresh leaderboard.

## Public Projector Flow

`/leaderboard` đọc:

- `getPublicLeaderboard()`
- `getActivePresentation()`

Màn máy chiếu cần hiển thị đồng thời:

- phase hiện tại
- câu hỏi/case hiện tại
- active team
- judge submission count
- ranking
- status của đội

## Điểm Mạnh

- Flow thật phù hợp event: có admin, judge, public display, team session.
- Backend là source of truth, ít rủi ro mỗi máy lệch state.
- Có reset demo state.
- Có audit admin events.
- Có docs troubleshooting/runtime cache.
- Round 1 và Round 2 đã xử lý nhiều lỗi thực tế qua test.

## Điểm Yếu

- UI bị nặng dashboard/control surface, chưa đủ game feel.
- CSS đã bị thử nghiệm nhiều lớp nên dễ conflict.
- Bonus/results chưa có backend flow sâu.
- Flow operational đúng nhưng chưa “đã mắt” như bản `intern-game-src`.
- Một số RPC vẫn là public exposed security definer, dù đã hardening bằng private helper và grants có kiểm soát.

## Nên Giữ Khi Rebuild

- Toàn bộ schema/RPC event thật.
- Session model team/admin/judge.
- Round 1 offline answer + admin mark.
- Round 2 active team + judge scoring + admin publish.
- Leaderboard public sync.
- Reset demo state và docs vận hành.

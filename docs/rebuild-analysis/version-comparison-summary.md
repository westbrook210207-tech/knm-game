# Version Comparison Summary

## Nhận Định Nhanh

Bản current của mình đúng về event architecture nhưng UI còn nặng dashboard.

Bản `intern-game-src` đúng về cảm giác game nhưng logic là demo client-side, thiếu event operation thật.

Nếu làm lại từ đầu, hướng hợp lý nhất là:

- Database/RPC/session/flow lấy từ current system.
- Visual language/screen composition lấy từ `intern-game-src`.
- Không migrate bằng cách “đắp CSS lên UI cũ”.
- Không copy nguyên `intern-game-src` rồi vá backend một cách vội, vì flow demo của nó trái luật event hiện tại.

## So Sánh Theo Mảng

| Mảng | Current event system | `intern-game-src` | Kết luận |
|---|---|---|---|
| State source | Supabase/Postgres | React reducer local | Giữ current |
| Routing | Next routes theo vai trò | SPA screen switch | Giữ Next routes |
| Team auth | Team code + session token | Chọn team trực tiếp | Giữ current |
| Admin | Có command center thật | Không có | Giữ current, redesign UI |
| Judge | Có judge code + rubric | Không có judge riêng | Giữ current, lấy layout hồ sơ |
| Leaderboard | Public backend sync | API giả định/local | Giữ current, redesign projector |
| Round 1 | Offline answer, admin mark | Team tự chọn đáp án web | Giữ current logic, lấy betting UI |
| Round 2 | Active team + judge score + admin publish | Team tự nhập SWOT | Giữ current logic, lấy candidate file UI |
| Bonus | Có RPC `grantBonusPoints`, chưa full screen flow | Có mini-game UI | Lấy UI, thiết kế backend sau |
| Results | Leaderboard có điểm thật | Local final screen đẹp | Lấy UI, nối leaderboard thật |
| Docs/recovery | Có runbook/reset/dev troubleshooting | Không có | Giữ current |

## Những Gì Bản Bạn Bạn Thiếu So Với Bản Mình

### Event operation thật

- Không có admin điều khiển phase.
- Không có judge chấm độc lập.
- Không có public projector state.
- Không có active team Round 2.
- Không có publish điểm Round 2.
- Không có reset demo state.

### Auth/session

- Không có team code.
- Không có admin code.
- Không có judge code.
- Không có session token/revoke.
- Không restore session sau refresh.

### Backend/data integrity

- Không có database schema.
- Không có unique constraints cho submit/chấm.
- Không có singleton `game_state`.
- Không có audit admin events.
- Không có leaderboard rank backend.

### Multi-device event

- Mỗi browser tự có reducer state.
- Không đảm bảo máy chiếu, admin, team, judge cùng nhìn một phase.
- Không có cơ chế tránh mỗi đội tự next question.

## Những Gì Bản Mình Thiếu So Với Bản Bạn Bạn

### Visual/game feel

- Current UI nhìn giống dashboard nhiều hơn game.
- Boss/director framing chưa tự nhiên.
- HUD chưa đủ “game-first”.
- Screen transition/game rhythm chưa rõ.

### Screen composition

- Lobby chưa có cảm giác vào game.
- Student Round 1 chưa “đã” bằng betting screen của bạn bạn.
- Round 2 chưa đủ cảm giác hồ sơ ứng viên.
- Results chưa có cảm xúc tổng kết.
- Bonus chưa thành mini-game thật.

### Design system

- CSS current đã qua nhiều lần vá, dễ conflict.
- Font/palette/class chưa nhất quán bằng bản bạn bạn.
- Một số component giống admin panel hơn là event/game screen.

## Hướng Rebuild Đề Xuất

### Nguyên tắc 1: Database không đổi ở pass đầu

Không đổi schema/RPC lớn khi đang rebuild UI. Chỉ nối UI mới vào contract hiện có.

Lý do:

- Round 1 đã ổn.
- Round 2 đã ổn.
- Reset và leaderboard đã ổn.
- Đổi schema cùng lúc đổi UI sẽ khó debug.

### Nguyên tắc 2: Copy visual structure, không copy reducer logic

Nên copy/port:

- `HUD` look
- `BossDialog`
- `Timer` presentation
- `Lobby` composition
- `Round1` betting card layout
- `Round2` candidate file layout
- `Bonus` mini-game layout
- `Results` verdict/progress UI

Không copy:

- `useGameContext` reducer làm source of truth.
- `SET_SCREEN` progression thay Next routes.
- client-side Round 1 answer scoring.
- client-side Round 2 SWOT submission scoring.
- local total score.

### Nguyên tắc 3: Làm từng màn, có acceptance rõ

Thứ tự an toàn:

1. Tạo clean UI shell mới trong `apps/web/components/game-shell`.
2. Rebuild `/` lobby trước, chỉ link role routes, chưa động gameplay.
3. Rebuild `/student` Round 1 theo betting UI, nối `getCurrentTeamState` và `submitRound1Answer`.
4. Rebuild `/leaderboard` projector, nối `getPublicLeaderboard` và `getActivePresentation`.
5. Rebuild `/judge`, dùng layout candidate file + rubric.
6. Rebuild `/admin`, ưu tiên thao tác rõ hơn là đẹp.
7. Sau khi 5 màn ổn mới quay lại `/bonus` và `/results`.

### Nguyên tắc 4: Tách CSS mới, không đè global lung tung

Không nên append thêm 800 dòng vào `globals.css` như lần thử.

Nên làm:

- `apps/web/styles/game-theme.css`
- `apps/web/components/game-ui/*.tsx`
- route-specific CSS module hoặc class namespace rõ: `.gameLobby`, `.gameStudent`, `.gameJudge`

Mục tiêu là nếu lỗi font/layout, rollback dễ.

## Mapping Rebuild Cụ Thể

### `/`

Lấy từ `Lobby.jsx`:

- boss intro
- big title
- grid cards

Đổi logic:

- không chọn team trực tiếp.
- hiển thị role cards:
  - Team
  - Admin
  - Judge
  - Leaderboard

### `/student`

Round 1:

- lấy visual bet chips/question card/timer từ `Round1.jsx`.
- bỏ answer options.
- button chính là “Khóa cược token”.
- câu hiện tại lấy từ `game_state.question_number`.
- disabled theo backend phase.

Round 2:

- lấy visual candidate file từ `Round2.jsx`.
- không có SWOT input team-side.
- chỉ hiển thị full prompt/case và status active.

### `/leaderboard`

Lấy visual:

- stage/public board style.
- score rows/progress language từ `Results.jsx`.

Nối data:

- `getPublicLeaderboard`.
- `getActivePresentation`.

Must-have:

- phase
- current question/case
- active team
- judge count
- top ranking
- team statuses

### `/admin`

Không copy screen nào nguyên.

Lấy visual grammar:

- HUD
- dialog
- card/button style
- compact command panels

Giữ function:

- save/clear admin code
- set phase
- choose Q1..Q5
- mark Round 1
- activate Round 2 team
- publish Round 2
- reset demo

### `/judge`

Lấy từ `Round2.jsx`:

- left candidate file
- right control/rubric panel

Đổi logic:

- judge code localStorage.
- active presentation từ backend.
- submit score qua `submitJudgeScore`.

### `/bonus`

Pass đầu:

- có thể copy mini-game UI.
- chưa ép scoring backend.

Pass sau:

- admin start bonus.
- active team bonus turn.
- `grantBonusPoints`.

### `/results`

Pass đầu:

- copy visual verdict/progress.
- đọc `getPublicLeaderboard`.
- show top teams.

Pass sau:

- admin set phase `results`.
- public display mode riêng.

## Rủi Ro Nếu Copy Nguyên `intern-game-src`

- Team có thể tự qua câu/vòng mà admin không biết.
- Leaderboard sẽ lệch giữa các máy.
- Judge flow biến mất.
- Round 1 bị sai luật vì team tự chọn đáp án web.
- Round 2 bị sai luật vì team tự submit SWOT thay vì trình bày + judge chấm.
- Refresh browser mất state.
- Không reset DB được từ admin.

## Rủi Ro Nếu Giữ UI Current Và Vá Tiếp

- CSS conflict ngày càng nặng.
- Game feel không tới.
- Mỗi lần polish lại phát sinh layout/font bug.
- Dễ rơi vào kiểu “dashboard mặc áo game”.

## Quyết Định Đề Xuất

Nên rebuild UI clean theo `intern-game-src`, nhưng trong `apps/web` hiện tại:

1. Tạo component/theme mới sạch.
2. Port từng screen bằng visual source từ bạn bạn.
3. Nối từng screen vào backend contract current.
4. Build sau mỗi route.
5. Không xóa flow current cho đến khi route mới pass.

Đây là con đường hơi chậm hơn copy-paste, nhưng ít “nổ tung” hơn và dễ quay lại hơn.

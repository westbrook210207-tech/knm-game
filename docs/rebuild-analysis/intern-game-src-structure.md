# Intern Game Src Structure

Tài liệu này mô tả bản bạn của bạn trong folder `intern-game-src`.

## Mục Tiêu Kiến Trúc

`intern-game-src` là một Vite React single-page game demo.

Đặc điểm chính:

- UI/game feel mạnh hơn current app.
- Flow chạy local trong React reducer.
- Có API wrapper bằng Axios nhưng code có fallback demo mode.
- Không có admin/judge/public projector flow thật.
- Không có Supabase schema/RPC thật trong folder này.

## File Structure

```text
intern-game-src/src
├── App.jsx
├── main.jsx
├── index.css
├── api/index.js
├── hooks/useGameContext.jsx
├── components/HUD.jsx
├── components/HUD.css
├── components/Timer.jsx
├── components/Timer.css
├── components/Typewriter.jsx
└── screens
    ├── Lobby.jsx
    ├── Lobby.css
    ├── Round1.jsx
    ├── Round1.css
    ├── Round2.jsx
    ├── Round2.css
    ├── Bonus.jsx
    ├── Bonus.css
    ├── Results.jsx
    └── Results.css
```

## App Router

`App.jsx` dùng `GameProvider` và local `state.screen`.

Flow screens:

- `lobby`
- `round1`
- `round2`
- `bonus`
- `results`

Không dùng URL routes riêng. Đây là SPA internal routing bằng reducer.

## Local Game State

`useGameContext.jsx` có state:

- `screen`
- `sessionId`
- `teamId`
- `teamName`
- `tokens`
- `round1Score`
- `round2Score`
- `bonusScore`
- `totalScore`
- `currentQuestion`
- `allTeams`

Reducer actions:

- `SET_SCREEN`
- `SET_SESSION`
- `SET_TEAM`
- `UPDATE_TOKENS`
- `SET_ROUND1_SCORE`
- `SET_ROUND2_SCORE`
- `SET_BONUS_SCORE`
- `NEXT_QUESTION`
- `RESET_QUESTION`
- `CALC_TOTAL`

Điểm quan trọng: state này là client-only. Nếu refresh browser, state mất trừ khi app tự bổ sung persistence.

## API Layer

`api/index.js` dùng Axios với:

```text
VITE_API_URL || http://localhost:3000/api
```

Endpoints giả định:

- `GET /session/:sessionId`
- `POST /session`
- `GET /round1/:sessionId/question/:questionIndex`
- `POST /round1/:sessionId/answer`
- `GET /round1/:sessionId/results`
- `GET /round2/:sessionId/scenario/:teamId`
- `POST /round2/:sessionId/submit`
- `GET /round2/:sessionId/scores`
- `POST /bonus/:sessionId/submit`
- `GET /leaderboard/:sessionId`

Trong screen code, nhiều call được bọc `try/catch` và tiếp tục chạy demo mode nếu backend fail.

## Lobby Screen

File: `screens/Lobby.jsx`

UI elements đáng giữ:

- background grid
- boss avatar/dialog
- typewriter intro
- big title `HÀNH TRÌNH THỰC TẬP SINH`
- team grid 9 phòng ban
- CTA start

Logic hiện tại:

- user chọn team trực tiếp từ client list.
- gọi `createSession({ teamId })`.
- nếu API fail thì tạo local demo session.
- set `state.team`, `state.session`, rồi chuyển screen `round1`.

Thiếu so với current system:

- không nhập team code
- không revoke session
- không restore session từ localStorage
- không có role entry cho admin/judge/projector

## HUD Component

File: `components/HUD.jsx`

Hiển thị:

- screen label
- team name
- token trong Round 1
- score V1/V2/Bonus

Điểm mạnh:

- language rất game
- HUD compact, đọc nhanh
- đồng bộ visual với mọi screen

Thiếu:

- không đọc phase backend
- không biết active team/public projector
- không có admin/judge state

## Timer Component

File: `components/Timer.jsx`

Logic:

- local countdown theo seconds truyền vào.
- callback `onExpire`.
- màu bar đổi theo remaining percent.

Điểm mạnh:

- đơn giản, cảm giác game tốt.

Thiếu:

- không sync với `game_state.countdown_ends_at`.
- nếu máy reload/lệch clock thì không biết event time thật.

## Round 1 Screen

File: `screens/Round1.jsx`

UI elements đáng giữ:

- boss panel
- question card
- difficulty tag
- timer row
- token bet chips
- answer option grid
- reveal state
- token reward/loss animation feeling

Logic hiện tại:

- hardcode 5 questions trong frontend.
- phase local: `betting -> answering -> reveal -> done`.
- team tự chọn answer trên web.
- client tự cộng/trừ token.
- client tự chuyển question.
- sau câu cuối tự tính Round 1 score và chuyển Round 2.

Khác luật current system:

- current Round 1 không cho answer trên web.
- current Round 1 admin chấm đúng/sai ngoài đời.
- current token/score phải nằm ở database, không tự tính local.
- current question do admin set, không do team tự next.

## Round 2 Screen

File: `screens/Round2.jsx`

UI elements đáng giữ:

- file/candidate profile layout
- left: hồ sơ tình huống
- right: SWOT form/grid
- boss mini dialog
- hints panel
- submitted state

Logic hiện tại:

- scenario hardcode theo `teamId`.
- team tự nhập SWOT trong web.
- submit SWOT qua fake/API wrapper.
- demo set placeholder score.
- chuyển bonus bằng local dispatch.

Khác luật current system:

- current Round 2 không phải team self-submit SWOT để backend chấm.
- current Round 2 là team trình bày ngoài đời, judge chấm ở `/judge`.
- current active team do admin chọn.
- current score chỉ publish vào leaderboard sau admin action.

## Bonus Screen

File: `screens/Bonus.jsx`

UI/logic:

- mini-game dạng vượt đường.
- keyboard + dpad.
- lives.
- win/dead state.
- nếu thắng dispatch `SET_BONUS_SCORE`.
- submit bonus API nếu có, fail thì bỏ qua.

Điểm mạnh:

- có chất game thật nhất trong hai bản.
- phù hợp làm optional stage hoặc mini-break.

Thiếu:

- chưa có backend event flow rõ.
- chưa có admin start/stop/publish bonus.
- chưa có per-team turn control.

## Results Screen

File: `screens/Results.jsx`

UI/logic:

- tính total từ local state.
- verdict promoted/fired.
- rows điểm V1/V2/Bonus.
- progress bars.

Điểm mạnh:

- màn kết quả có cảm xúc.

Thiếu:

- không đọc leaderboard thật.
- không có public final board theo event.
- không xử lý multi-team ranking.

## Visual Language

Các yếu tố nên lấy:

- arcade-corporate palette vàng/đỏ/xanh đậm.
- boss/director framing.
- HUD compact.
- dialog box.
- screen-specific rhythm.
- card/button border sắc hơn.
- title lớn có sân khấu.
- timer/token/betting UI có cảm giác game show.

Các yếu tố không nên bê nguyên:

- emoji quá nhiều nếu làm mất chuyên nghiệp.
- local reducer progression.
- hardcoded score logic.
- hardcoded scenario nếu database đã là source of truth.
- answer multiple-choice Round 1 trên web.

## Kết Luận

`intern-game-src` là visual source tốt, nhưng không phải event system. Khi rebuild, nên coi folder này là “UI kit + game feel reference”, không phải app logic source.

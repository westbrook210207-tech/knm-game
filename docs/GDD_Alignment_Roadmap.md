# GDD Alignment Roadmap
## Chuyển từ prototype hiện tại sang architecture đúng GDD

---

## 1. Kết luận ngắn

Không nên "code lại toàn bộ sang framework mới ngay lập tức" theo kiểu vứt bỏ prototype hiện tại.

Hướng an toàn hơn là:

1. Giữ `intern-game-src` như **prototype UI/game feel** và nơi tham chiếu nhanh cho team view
2. Xem GDD là **north star / target architecture**
3. Tách migration thành nhiều phase nhỏ, mỗi phase vẫn có thể demo được

Nói cách khác: **với scope event nhỏ hiện tại, đích thực dụng hơn là Vite + React Router + Supabase Realtime; không cần rewrite big-bang sang Next.js.**

---

## 2. Những gì prototype hiện tại vẫn dùng được

### Giữ lại gần như nguyên vẹn

- Visual language tổng thể
- Boss dialog framing
- HUD
- Timer presentation
- Team-side Round 2 profile layout
- Results screen / podium cảm xúc

### Chỉ dùng như prototype, không dùng làm logic thật

- Local screen switch `lobby -> round1 -> round2 -> results`
- Local scoring cho Round 1
- Local self-submit SWOT cho Round 2
- Control panel local như công cụ demo

---

## 3. Những gì architecture đích theo GDD bắt buộc phải có

- `admin` route điều khiển phase
- `presenter` route chỉ hiển thị
- `team` route cho từng đội
- `judge` route cho BGK
- Shared backend state
- Realtime sync giữa các màn hình
- Login/password theo vai trò
- Multi-device support cho team view
- Single primary controller cho mỗi đội
- Admin revoke session khi cần
- Leaderboard realtime
- Round 1 admin-marked
- Round 2 judge-scored

---

## 4. Architecture đề xuất

```text
                       +----------------------+
                       |      Presenter       |
                       |   /presenter route   |
                       |  Read-only realtime  |
                       +----------+-----------+
                                  |
                                  |
                     Realtime read from shared game state
                                  |
                                  v
 +----------------+     +----------------------+     +----------------+
 |     Admin      | --> |   Supabase Backend   | <-- |     Judge      |
 |   /admin       |     |                      |     |   /judge/:id   |
 | phase control  |     |  game_state          |     | submit scores  |
 | mark answers   |     |  teams               |     |                |
 | publish scores |     |  bets                |     +----------------+
 +----------------+     |  judge_scores        |
                        |  sessions/login      |
                        +----------+-----------+
                                   ^
                                   |
                        Realtime read/write where allowed
                                   |
        +------------+-------------+-------------+------------+
        |            |             |             |            |
        v            v             v             v            v
   Team 1 View   Team 2 View   Team 3 View   ...         Team 9 View
   /team/1       /team/2       /team/3                   /team/9
```

---

## 5. Route mapping đề xuất

### App shell

- `/`:
  - landing / room selection / redirect layer
- `/admin`:
  - phase control
  - answer marking
  - pitch progression
- `/presenter`:
  - fullscreen classroom/projector mode
- `/team/:teamId`:
  - login password
  - có thể mở trên nhiều máy
  - chỉ 1 máy chính được thao tác gameplay
  - team-specific state
  - betting / case reading
- `/judge/:judgeId`:
  - judge login
  - score submission screen

---

## 6. Migration roadmap

## Phase A — Stabilize current prototype

Mục tiêu:
- Giữ bản đang chạy được
- Dùng làm UI reference

Trạng thái:
- Đã làm phần lớn

Deliverables:
- Refactor data/state/logic cơ bản
- Local control mode
- Deploy được trên Vercel

---

## Phase B — Create target multi-route shell in Vite

Mục tiêu:
- Dựng app mới theo route structure của GDD

Việc làm:
- Giữ app Vite hiện tại và nâng cấp thành multi-route app
- Thêm React Router
- Dựng route rỗng:
  - `/admin`
  - `/presenter`
  - `/team/:teamId`
  - `/judge/:judgeId`
- Port design tokens / fonts / core CSS language từ prototype

Lưu ý:
- Chưa cần gameplay thật ở phase này

---

## Phase C1 — Shared game state core

Mục tiêu:
- Có backend state tối thiểu dùng chung cho tất cả màn hình

Việc làm:
- Setup Supabase project
- Tạo schema:
  - `teams`
  - `game_state`
  - `bets`
  - `judge_scores`
  - `sessions`
- Tạo sync phase cơ bản:
  - admin đổi phase
  - presenter nhận phase mới
  - team view nhận phase mới

Kết quả mong muốn:
- Presenter và team nhìn cùng một phase
- Admin đổi phase, các màn đổi theo ngay

---

## Phase C2 — Auth/login theo role

Mục tiêu:
- Chốt login flow đúng event operation

Việc làm:
- Tạo password/login flow cho:
  - admin
  - team
  - judge
- Tạo team session policy:
  - nhiều máy có thể login
  - máy đầu tiên là primary mặc định
  - secondary machine có thể read-only ở phase đầu
- Tạo admin action revoke session

Kết quả mong muốn:
- Team login đúng flow classroom
- Có thể reset quyền điều khiển nếu login nhầm máy

---

## Phase C3 — Realtime subscriptions theo role

Mục tiêu:
- Tách read/write permission theo đúng từng loại màn hình

Việc làm:
- Tạo subscription realtime cho presenter/team/judge/admin
- Chỉ primary controller của team được gửi thao tác gameplay
- Secondary machine nếu có chỉ subscribe read-only

Kết quả mong muốn:
- Multi-device nhưng không bị conflict thao tác
- Admin có thể revoke và gán lại quyền điều khiển khi cần

---

## Phase D — Implement Round 1 theo GDD

Mục tiêu:
- Thay local Round 1 bằng flow thật

Việc làm:
- Team view:
  - thấy câu hỏi
  - đặt cược token
  - không chọn đáp án trên web
- Admin:
  - start question
  - lock betting
  - mark đúng/sai từng đội
  - reveal answer
- Presenter:
  - countdown
  - "Giơ bảng!"
  - answer reveal
  - realtime leaderboard

---

## Phase E — Implement Round 2 theo GDD

Mục tiêu:
- Thay self-submit SWOT bằng pitch + judge scoring

Việc làm:
- Team view:
  - đọc case cố định của đội
  - countdown discussion
- Presenter:
  - hiện đội đang pitch
  - hiện popup điểm BGK
- Judge view:
  - submit score theo rubric
- Admin:
  - start pitch
  - wait/override judge submission
  - publish round result

---

## Phase F — Implement Results / Closing Flow

Mục tiêu:
- Hoàn tất màn kết quả cuối và flow khép vòng event

Việc làm:
- Presenter:
  - hiện kết quả cuối / podium top 3
- Admin/backend:
  - chốt phase `results`
  - publish leaderboard cuối
  - reset event an toàn khi cần

---

## 7. Ưu tiên kỹ thuật

### Nên làm trước

1. Vite multi-route shell + route structure
2. Supabase schema + shared game_state core
3. Team login/session policy
4. Presenter/Admin/Team sync cho Round 1

### Nên làm sau

1. Judge route hoàn chỉnh
2. Results / closing flow
3. Podium polish / hiệu ứng lớp học
4. Multi-device niceties beyond primary-controller policy

---

## 8. Risk Map

| Phase | Risk | Vì sao |
|---|---|---|
| Phase A — Stabilize current prototype | Low | Chủ yếu là refactor nội bộ và tooling; đã hoàn thành phần lớn nên rủi ro còn lại thấp |
| Phase B — Create target multi-route shell in Vite | Medium | Có tái cấu trúc route, app shell, port visual system; nhưng chưa dính gameplay thật nên vẫn kiểm soát được |
| Phase C1 — Shared game state core | High | Đây là nền móng backend; nếu schema hoặc phase sync thiết kế sai thì tất cả màn hình phía sau đều bị ảnh hưởng |
| Phase C2 — Auth/login theo role | High | Chứa policy vận hành thật: password, multi-device, primary controller, revoke session; sai ở đây sẽ gây rối toàn bộ classroom flow |
| Phase C3 — Realtime subscriptions theo role | High | Dễ phát sinh race condition, permission mismatch, 2 máy cùng thao tác, lag hoặc state lệch giữa admin/presenter/team/judge |
| Phase D — Implement Round 1 theo GDD | Medium | Flow rõ nhưng có nhiều state transition và cần presenter/admin/team sync ổn định để không vỡ nhịp lớp học |
| Phase E — Implement Round 2 theo GDD | High | Đây là flow nghiệp vụ phức tạp nhất: active team, presenter focus, 3 judge submit, admin override, publish result |
| Phase F — Implement Results / Closing Flow | Medium | Không còn bonus, nhưng flow công bố kết quả cuối, podium, và reset event vẫn cần rõ để tránh state lệch |

### Risk interpretation

- **High risk**: Có thể block các phase sau nếu làm sai; cần spec chặt, acceptance rõ, và test vận hành sớm
- **Medium risk**: Có thể làm incremental, nhưng vẫn cần smoke test sau mỗi mốc
- **Low risk**: Có thể triển khai tương đối độc lập, rollback dễ

### Trọng tâm giảm rủi ro

1. Tách Phase C thành C1/C2/C3 như hiện tại để không gom quá nhiều unknown vào một lượt
2. Không làm Round 2 trước khi C1/C2/C3 đủ ổn
3. Chuẩn bị fallback manual override cho các điểm dễ kẹt:
   - judge chưa submit
   - team login nhầm máy
   - presenter không sync kịp
   - team view mất kết nối

---

## 9. Quyết định thực dụng

### Có cần chuyển sang Next.js không?

Với scope hiện tại là:
- event nhỏ trong trường
- khoảng 9 team cùng judges, admin, presenter
- cần realtime nhưng không có ý định scale thành platform

thì:
- **Không cần chuyển sang Next.js**
- **Vite + React Router + Supabase là đủ phù hợp**

Hướng đúng là:
- không rewrite big-bang
- mà nâng cấp trực tiếp từ prototype hiện tại
- thêm route structure rõ ràng
- thêm shared realtime state và session policy

---

## 10. Spec tiếp theo nên là gì

Spec tiếp theo hợp lý nhất:

- `003-multi-route-vite-shell`

Phạm vi:
- dựng multi-route shell trên Vite
- port visual system
- tạo 4 route theo GDD
- chưa cần gameplay đầy đủ

Sau đó:

- `004-shared-game-state-and-auth`
- `005-round1-admin-marking`
- `006-round2-judge-flow`
- `007-results-closing-flow`

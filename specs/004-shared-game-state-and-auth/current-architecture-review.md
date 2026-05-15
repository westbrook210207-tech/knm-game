# Current Architecture Review

## Mục tiêu

Tài liệu này mô tả **kiến trúc hiện tại trong codebase**, trước khi cắm Supabase thật.

Mục tiêu là đọc code như nó đang tồn tại, không suy diễn theo target architecture.

---

## 1. App shell hiện tại

App hiện tại là:

- `Vite + React`
- `React Router` đã có route shell cơ bản
- chưa có Supabase client
- chưa có backend shared state thật

Route hiện có:
- `/`
- `/admin`
- `/presenter`
- `/team/:teamId`
- `/judge/:judgeId`
- `/prototype`
- fallback `*`

Nguồn: [intern-game-src/src/app/router.jsx](/Users/nguyentran0703/Downloads/knm-game/intern-game-src/src/app/router.jsx:1)

---

## 2. Route maturity

### Route shell mới

`/admin`, `/presenter`, `/team/:teamId`, `/judge/:judgeId`

Tình trạng:
- mostly presentational
- có visual shell
- chưa có identity thật
- chưa có backend data thật

### Prototype route

`/prototype`

Tình trạng:
- vẫn là bản gameplay cũ
- chạy bằng local shared state
- có control panel local nếu `?control=1`

Nguồn:
- [PrototypeApp.jsx](/Users/nguyentran0703/Downloads/knm-game/intern-game-src/src/app/PrototypeApp.jsx:1)
- [useGameContext.jsx](/Users/nguyentran0703/Downloads/knm-game/intern-game-src/src/hooks/useGameContext.jsx:1)

---

## 3. Current state architecture

State gameplay hiện tại được giữ bằng:
- React Context
- `useReducer`
- localStorage persistence

Canonical shape:
- `screen`
- `sessionId`
- `allTeams`
- `team`
- `round1`
- `round2`
- `bonus`
- `results`

Điểm quan trọng:
- state này là **single-device local session state**
- chưa có khái niệm shared event state giữa nhiều client
- `screen` hiện vẫn là local progression trong prototype flow

---

## 4. Current API layer

Hiện có một `axios` API layer ở:
- [intern-game-src/src/api/index.js](/Users/nguyentran0703/Downloads/knm-game/intern-game-src/src/api/index.js:1)

Nhưng layer này:
- trỏ tới `VITE_API_URL`
- dựa trên REST endpoints kiểu `/session`, `/round1`, `/round2`
- không có backend thực trong repo này
- thực tế được dùng theo kiểu “try API, fail thì demo mode”

Tức là:
- API layer hiện tại **không phải source of truth**
- chỉ là lớp historical/fallback, không đáng dùng làm nền cho shared event architecture mới

---

## 5. Current identity model

Hiện tại **chưa có**:
- Supabase Auth
- role login thật
- session revoke thật
- primary vs secondary device thật

Chỉ có:
- route params
- local selection
- preselected team qua query param trong prototype bridge

Kết luận:
- identity model hiện tại gần như chưa tồn tại

---

## 6. Current multi-device capability

Hiện tại app:
- có thể mở nhiều tab/máy
- nhưng không có shared state thật
- không có conflict resolution
- không có team session control

Nói cách khác:
- multi-device **về mặt kỹ thuật trình duyệt** thì có thể mở
- multi-device **về mặt product/event operation** thì chưa có

---

## 7. Current architecture strengths

Những gì hiện tại đã tốt:

1. Route shell đã tồn tại
2. Prototype gameplay còn chạy được
3. Visual language rõ và reusable
4. Local state đã được refactor khá sạch
5. Có bridge từ `team/:teamId` sang prototype
6. Static hosting compatibility đã được nghĩ tới (`vercel.json`)

---

## 8. Current architecture gaps

Những gì còn thiếu so với shared event system:

1. Không có shared backend state
2. Không có auth/role identity
3. Không có session table
4. Không có source of truth cho current phase
5. Không có realtime subscription
6. Không có admin write path thật
7. Không có presenter/team sync thật

---

## 9. Current architecture summary

Codebase hiện tại đã đi được đến mức:

- **Frontend shell-ready**
- **Prototype-preserving**
- **Spec-driven enough để bắt đầu backend phase**

Nhưng vẫn đang dừng ở:

- **local-first architecture**
- **no real shared event control**

Đây là một vị trí tốt để bắt đầu `004`, vì frontend không còn quá rối, nhưng backend truth vẫn chưa bị hardcode sai quá sâu.

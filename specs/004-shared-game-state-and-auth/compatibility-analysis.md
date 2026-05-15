# Compatibility Analysis

## Mục tiêu

So sánh giữa:

1. **Target Supabase Architecture**
2. **Current Architecture Review**

để quyết định mức độ tương thích và mức độ cần chỉnh sửa trước khi implementation `004`.

---

## 1. Overall compatibility verdict

### Kết luận ngắn

**Tương thích ở mức trung bình-khá.**

Nghĩa là:
- không cần rebuild lại frontend
- nhưng chưa thể cắm Supabase theo kiểu “thêm client là xong”
- cần thêm một integration layer rõ ràng để local prototype state không tranh quyền với backend state

---

## 2. Match areas

### A. Route structure

Target cần:
- `/admin`
- `/presenter`
- `/team/:teamId`
- `/judge/:judgeId`

Current có:
- đầy đủ các route này

Đánh giá:
- **match cao**

Ảnh hưởng:
- không cần đổi lại routing strategy

---

### B. UI shell separation

Target cần:
- mỗi role có entry point riêng

Current có:
- route shell riêng cho từng role
- prototype route tách riêng

Đánh giá:
- **match cao**

Ảnh hưởng:
- có thể cắm shared state vào route shells hiện tại theo incremental path

---

### C. Prototype preservation

Target cần:
- giữ gameplay hiện tại làm UI reference

Current có:
- `/prototype`
- bridge từ team route sang prototype

Đánh giá:
- **match rất cao**

Ảnh hưởng:
- backend phase có thể tiến hành mà không làm mất baseline visual/game feel

---

## 3. Partial match areas

### A. Team route identity

Target cần:
- team route có identity thật từ auth + role profile + session

Current có:
- `teamId` từ URL
- bridge query param vào prototype

Đánh giá:
- **match thấp-trung bình**

Cần chỉnh:
- team route phải chuyển từ “route param only” sang “route param + verified backend identity”

---

### B. Screen state model

Target cần:
- `game_state.current_phase` là source of truth toàn event

Current có:
- `state.screen` local trong prototype reducer

Đánh giá:
- **match trung bình**

Cần chỉnh:
- không bỏ local state ngay
- nhưng phải tách rõ:
  - local UI state
  - shared event phase state

Đây là một điểm rất quan trọng để tránh buggy hybrid state.

---

### C. Current API abstraction

Target cần:
- Supabase client layer

Current có:
- Axios REST layer cũ

Đánh giá:
- **match thấp**

Cần chỉnh:
- không mở rộng tiếp REST layer cũ
- thêm layer mới kiểu:
  - `src/lib/supabase/client.js`
  - `src/lib/supabase/gameState.js`
  - `src/lib/supabase/auth.js`
  - `src/lib/supabase/sessions.js`

---

## 4. Mismatch areas

### A. Shared event source of truth

Target:
- shared DB-backed phase

Current:
- không có shared truth

Đánh giá:
- **mismatch hoàn toàn**

Ý nghĩa:
- đây là phần phải xây mới

---

### B. Role auth

Target:
- admin/team/judge login thật

Current:
- chưa có auth thật

Đánh giá:
- **mismatch hoàn toàn**

Ý nghĩa:
- phải xây mới từ đầu, không salvage từ code hiện tại

---

### C. Session control policy

Target:
- `team_sessions` quyết định primary/secondary/revoked

Current:
- chưa có model tương đương

Đánh giá:
- **mismatch hoàn toàn**

Ý nghĩa:
- phải xây mới hoàn toàn ở DB + frontend integration

---

### D. Realtime sync

Target:
- presenter/team/admin sync phase qua Realtime

Current:
- không có realtime thật

Đánh giá:
- **mismatch hoàn toàn**

Ý nghĩa:
- đây là phần mới hoàn toàn của `004`

---

## 5. Compatibility score by area

| Area | Score | Nhận xét |
|---|---:|---|
| Route structure | 9/10 | Gần như sẵn sàng |
| Visual system reuse | 9/10 | Đã có nền rất tốt |
| Prototype preservation | 10/10 | Đã làm đúng hướng |
| Shared state readiness | 4/10 | Có local state sạch nhưng chưa có backend truth |
| Auth/session readiness | 2/10 | Hầu như chưa có gì |
| Realtime readiness | 2/10 | Hầu như chưa có gì |
| API abstraction readiness | 4/10 | Có abstraction cũ nhưng không hợp target architecture |

### Tổng quan

**Frontend shell readiness: cao**  
**Backend/shared-state readiness: thấp**

---

## 6. Recommended implementation decisions

### Decision 1

**Không rebuild lại frontend shell.**

Lý do:
- route structure đã đúng
- visual system đã usable
- prototype bridge đã có

### Decision 2

**Không reuse `src/api/index.js` làm nền chính cho `004`.**

Lý do:
- nó được thiết kế cho REST backend cũ
- không phản ánh Supabase model

### Decision 3

**Thêm integration layer song song thay vì sửa thẳng reducer cũ ngay.**

Khuyến nghị:
- phase đầu của `004` nên thêm:
  - Supabase client
  - auth/session hooks
  - game state hooks
- chưa nên nhồi mọi thứ vào `useGameContext` cũ

### Decision 4

**Tách `shared phase state` khỏi `prototype gameplay state`.**

Gợi ý:
- route shells đọc `game_state`
- prototype reducer tiếp tục giữ state cục bộ cho gameplay flow cũ
- chỉ khi bước sang `005` trở đi mới migrate gameplay truth dần sang backend

### Decision 5

**Ưu tiên C1 trước C2/C3 trong implementation order thật.**

Lý do:
- nếu chưa có `game_state` và schema nền rõ
- auth/session sẽ rất dễ xây sai context

---

## 7. What needs to be created from scratch

Các khối gần như phải xây mới:

1. Supabase client layer
2. DB schema + migration
3. role login flow
4. team session primary/secondary logic
5. revoke session logic
6. realtime phase subscription

---

## 8. What can be kept with light adaptation

Các khối có thể giữ:

1. route shell structure
2. visual system / CSS variables / layout tone
3. prototype route
4. team route bridge
5. current local reducer như temporary fallback/reference

---

## 9. Final verdict

### Có nên tiếp tục theo hướng hiện tại không?

**Có.**

### Có nên rebuild lại từ đầu trước khi làm `004` không?

**Không.**

### Có cần cẩn thận để không biến `004` thành spaghetti hybrid state không?

**Rất cần.**

Đó là rủi ro lớn nhất hiện tại.

Nếu làm đúng, `004` nên được hiểu là:

- thêm backend truth
- thêm auth/session truth
- nhưng chưa phá prototype flow

Đây là mức chuyển đổi hợp lý nhất theo spec-driven path hiện tại.

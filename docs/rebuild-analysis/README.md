# Rebuild Analysis

Folder này dùng để tách bạch hai version trước khi làm lại UI từ đầu.

- `current-event-system.md`: cấu trúc app hiện tại, backend contract, frontend routes và flow vận hành thật.
- `current-database-map.md`: database schema, seed data, RPC và mối liên hệ table -> flow.
- `intern-game-src-structure.md`: cấu trúc bản `intern-game-src`, local reducer flow, UI/screens và API giả định.
- `version-comparison-summary.md`: so sánh thật lòng hai bản và hướng rebuild đề xuất.

Ghi chú quan trọng: version UI rebase vừa thử đang là experimental và chưa nên dùng làm nền. Khi rebuild, nên lấy logic/backend từ current event system ổn định, còn lấy visual language từ `intern-game-src` một cách có kiểm soát.

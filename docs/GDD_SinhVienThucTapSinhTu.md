# GAME DESIGN DOCUMENT
## "SINH VIÊN THỰC TẬP SINH TỬ"
**Version 1.1 | UEH — Kỹ năng mềm | Định vị bản thân trong doanh nghiệp**

---

## 1. TỔNG QUAN

| | |
|---|---|
| **Tên game** | Sinh Viên Thực Tập Sinh Tử |
| **Chủ đề** | Định vị bản thân trong doanh nghiệp |
| **Số đội thi đấu** | 9 đội (nhóm tổ chức không tham gia) |
| **Số người/đội** | 7–8 người |
| **Thời gian** | ~30 phút |
| **Điểm tối đa** | 12 điểm |
| **Tech stack** | Target architecture: Next.js + Supabase Realtime |

### Narrative
> *"Chúc mừng! Các bạn vừa được nhận vào tập đoàn XYZ với tư cách thực tập sinh. Hôm nay là ngày thử việc cuối cùng — Sếp Tổng sẽ tung ra 3 thử thách liên tiếp. Phòng ban nào chứng minh được năng lực sẽ được THĂNG CHỨC chính thức. Phòng ban nào thất bại... nhận quyết định SA THẢI!"*

---

## 2. ROUTES & PHÂN QUYỀN

| Route | Dùng cho | Thiết bị | Ghi chú |
|---|---|---|---|
| `/admin` | Nhóm tổ chức điều khiển toàn bộ game | Laptop nhóm tổ chức | Password riêng |
| `/presenter` | Màn chiếu lớp học | Máy chiếu | Không có control, chỉ hiển thị |
| `/team/:teamId` | Từng đội chơi (team1 → team9) | Laptop/điện thoại mỗi đội | Login bằng password được phát trước |
| `/judge/:judgeId` | 3 BGK chấm điểm (judge1 → judge3) | Thiết bị riêng mỗi BGK | Chỉ active ở Round 2 |

### Team Login Flow
- Màn hình lobby: danh sách 9 phòng ban
- Đội click vào phòng ban của mình → nhập password → vào team view
- Mỗi đội có password riêng, cố định từ trước

### Team Session Policy
- Mỗi đội **được phép đăng nhập nhiều máy** nếu cần (ví dụ 1 laptop chính + 1 điện thoại dự phòng)
- Tuy nhiên chỉ có **1 máy chính** dùng để thao tác gameplay trong lớp
- Máy đầu tiên login thành công được xem là **máy chính mặc định**
- Admin có thể **revoke session** của một đội nếu cần reset quyền điều khiển hoặc xử lý login nhầm
- Khi session bị revoke:
  - team view bị đưa về màn hình login
  - đội phải đăng nhập lại để tiếp tục
- Nếu implementation cần đơn giản hơn ở phase đầu:
  - có thể cho phép nhiều máy read-only cùng xem
  - nhưng chỉ máy chính mới được gửi thao tác đặt cược / submit / điều khiển

---

## 3. HỆ THỐNG ĐIỂM

| Vòng | Điểm tối đa | Cách tính |
|---|---|---|
| Round 1 — Ngân sách nhân sự | 5 điểm | Ngưỡng token còn lại |
| Round 2 — Họp khẩn với Sếp | 5 điểm | Trung bình 3 BGK, làm tròn xuống |
| Bonus — Vượt đường về nhà | 2 điểm | Đến đích = +2 |
| **Tổng** | **12 điểm** | |

---

## 4. ROUND 1 — "THỬ THÁCH NGÂN SÁCH NHÂN SỰ"

### Tổng quan
- Thời gian: ~10 phút
- Điểm tối đa: 5 điểm
- Cơ chế: Đặt cược token + trả lời câu hỏi bằng bảng viết tay

### Token System
- Mỗi đội bắt đầu với **10 token**
- Mỗi câu hỏi: đặt cược tối thiểu 1, tối đa 5 token
- Đúng → cộng số token đặt / Sai → mất số token đặt
- Token không thể âm (nếu token = 0, đội vẫn chơi nhưng gắn nhãn "Phòng ban cảnh báo")
- Nếu đội còn **0 token**:
  - hệ thống **auto-bet = 0**
  - team vẫn thấy câu hỏi và tham gia trả lời bằng bảng viết tay
  - admin vẫn có thể mark đúng/sai để giữ flow lớp học nhất quán
  - token giữ nguyên ở 0 cho đến hết Round 1

### Quy đổi token → điểm cuối Round 1
| Token còn lại | Điểm |
|---|---|
| 18+ | 5 |
| 14–17 | 4 |
| 9–13 | 3 |
| 4–8 | 2 |
| 0–3 | 1 |

### Flow từng câu hỏi
```
1. Admin bấm "Bắt đầu câu X"
         ↓
2. Presenter + Team view: hiện câu hỏi + countdown 30s
   - Team view: hiện ô đặt cược token (slider 1–5)
   - Một nửa đội: nhìn màn hình, quyết định đặt token
   - Một nửa đội: viết đáp án lên bảng vật lý
         ↓
3. Hết 30s → tự động khóa ô đặt cược
   - Presenter hiện: "Giơ bảng!"
         ↓
4. Admin nhìn bảng từng đội → bấm Đúng/Sai cho từng đội trên admin panel
   - Token cộng/trừ realtime
   - Leaderboard cập nhật realtime trên presenter + team view
         ↓
5. Admin bấm "Reveal đáp án"
   - Presenter + Team view: hiện đáp án + giải thích
         ↓
6. Admin bấm "Câu tiếp theo" → lặp lại từ bước 1
   (Sau câu 5 → Admin bấm "Kết thúc Round 1" → quy đổi token → điểm)
```

### 5 Câu hỏi Round 1
| # | Câu hỏi | Đáp án | Độ khó |
|---|---|---|---|
| 1 | Quy trình định vị bản thân có mấy bước? Kể tên? | 3 bước: Xác định mục tiêu → SWOT → Kế hoạch hành động | Dễ |
| 2 | Trong mô hình ASK, kiến thức chiếm 85% sự thành công — Đúng hay Sai? | Sai — Thái độ + Kỹ năng chiếm 85%, Kiến thức chỉ 15% | Dễ có bẫy |
| 3 | Jeff Bezos nói: "Thương hiệu của bạn là những gì bạn nói về chính mình" — Đúng hay Sai? | Sai — là những gì người khác nói về bạn khi bạn không có mặt | Trung bình có bẫy |
| 4 | Trong SWOT bản thân, yếu tố nào thuộc môi trường bên ngoài? | Opportunities + Threats (phải đủ cả hai) | Trung bình |
| 5 | Kế hoạch hành động là bước thứ 2 trong quy trình định vị bản thân — Đúng hay Sai? | Sai — là bước 3, bước 2 là SWOT | Khó có bẫy |

### Leaderboard
- Hiển thị realtime trên: **team view** (để người đặt cược track token) + **presenter**
- Hiển thị: tên đội, token hiện tại, điểm dự kiến

---

## 5. ROUND 2 — "HỌP KHẨN VỚI SẾP"

### Tổng quan
- Thời gian: ~15 phút
- Điểm tối đa: 5 điểm
- Cơ chế: Phân tích SWOT tình huống → pitch → BGK chấm điểm

### Rubric chấm điểm (tối đa 5 điểm)
| Tiêu chí | Điểm |
|---|---|
| Xác định đúng & đủ S, W, O, T | 2 điểm |
| Đề xuất ít nhất 1 hành động cụ thể dựa trên SWOT | 2 điểm |
| Đại diện trình bày tự tin, rõ ràng | 1 điểm |

### Flow Round 2
```
Admin bấm "Bắt đầu Round 2"
         ↓
Tất cả team view: hiện tình huống của đội mình (cố định từ trước)
Presenter: hiện countdown 1p30s thảo luận + thông báo "Các đội thảo luận!"
         ↓
Hết 1p30s → Admin bấm "Bắt đầu pitch — Đội [X]"
         ↓
Presenter: hiện tình huống của Đội X đang pitch
Team view Đội X: vẫn thấy tình huống của mình
8 đội còn lại: vẫn thấy tình huống của mình
Judge panel: mở ô nhập điểm (0–5 cho từng tiêu chí)
         ↓
Đội X pitch xong → 3 BGK submit điểm
         ↓
Admin nhận đủ 3 submit (hoặc bấm override nếu cần)
         ↓
Presenter: hiện popup điểm BGK1 / BGK2 / BGK3 → điểm trung bình làm tròn xuống
         ↓
Admin bấm "Đội tiếp theo" → lặp lại cho đến hết Đội 9
         ↓
Admin bấm "Kết thúc Round 2" → cộng điểm vào bảng tổng
```

### Phân công tình huống (cố định)
| Đội | Tình huống |
|---|---|
| Team 1 | An — Tài chính |
| Team 2 | Bảo — Quản trị kinh doanh |
| Team 3 | Chi — Marketing |
| Team 4 | Dũng — Logistics |
| Team 5 | Emm — CNTT |
| Team 6 | Phong — Kế toán |
| Team 7 | Giang — Luật |
| Team 8 | Huy — Truyền thông |
| Team 9 | Ivy — Ngoại thương |

### 9 Tình huống đầy đủ

**Tình huống 1 — An (Tài chính)**
> *"An, 22 tuổi, sinh viên năm 4 ngành Tài chính. GPA 3.6, thường được nhóm giao phần xử lý số liệu và luôn hoàn thành tốt. Trong các buổi thuyết trình nhóm, An thường nhường phần trình bày cho người khác với lý do 'bạn kia nói hay hơn'. Chưa từng đi thực tập. Hiện tại các công ty fintech đang tuyển dụng mạnh và ưu tiên người biết phân tích dữ liệu, tuy nhiên yêu cầu ứng viên có ít nhất 6 tháng thực tập."*

| | Đáp án gợi ý |
|---|---|
| S | Giỏi xử lý và phân tích số liệu, GPA cao |
| W | Ngại thuyết trình, thiếu tự tin giao tiếp, chưa có kinh nghiệm thực tập |
| O | Fintech đang tuyển mạnh, ưu tiên đúng thế mạnh của An |
| T | Yêu cầu 6 tháng thực tập — An chưa đáp ứng |
| Kế hoạch | Tìm thực tập fintech ngay học kỳ cuối + tham gia club/workshop luyện thuyết trình |

---

**Tình huống 2 — Bảo (Quản trị kinh doanh)**
> *"Bảo, 23 tuổi, vừa tốt nghiệp ngành Quản trị kinh doanh. Trong các dự án nhóm, Bảo luôn là người đứng ra phân công công việc và cả nhóm đều nghe theo vì Bảo nói chuyện rất có sức thuyết phục. Tuy nhiên giáo viên hướng dẫn đã nhiều lần nhắc về việc nộp báo cáo trễ hạn. Khi được hỏi về số liệu trong buổi bảo vệ đồ án, Bảo thường chuyển câu hỏi sang thành viên khác. Hiện tại nhiều startup đang tuyển Business Development Executive — vị trí cần người biết thuyết phục đối tác và mở rộng thị trường, nhưng đòi hỏi ứng viên phải tự lập kế hoạch và theo dõi tiến độ công việc độc lập mà không cần nhắc nhở."*

| | Đáp án gợi ý |
|---|---|
| S | Giao tiếp tốt, thuyết phục giỏi, có kinh nghiệm leadership nhóm |
| W | Hay trễ deadline, yếu phân tích số liệu |
| O | Startup tuyển BDE — đúng thế mạnh thuyết phục của Bảo |
| T | Vị trí đòi hỏi tự quản lý tiến độ — đúng điểm yếu của Bảo |
| Kế hoạch | Apply BDE để tận dụng thế mạnh + dùng Notion/Trello khắc phục trễ deadline |

---

**Tình huống 3 — Chi (Marketing)**
> *"Chi, 21 tuổi, sinh viên năm 3 ngành Marketing. Trang cá nhân về lifestyle của Chi có 5.000 followers và tăng đều mỗi tháng nhờ các video ngắn Chi tự quay và edit. Mỗi khi lớp có bài tập tiếng Anh, Chi thường nhờ bạn bè hỗ trợ hoặc dùng Google Translate. Chưa có bằng chứng chỉ nào. Các agency nước ngoài đang mở văn phòng tại Việt Nam và tuyển Digital Marketer gấp, lương cao nhưng yêu cầu giao tiếp tiếng Anh lưu loát."*

| | Đáp án gợi ý |
|---|---|
| S | Giỏi làm content, có personal brand thực tế với 5.000 followers |
| W | Tiếng Anh yếu, không có bằng chứng chỉ |
| O | Agency nước ngoài tuyển Digital Marketer gấp — đúng ngành Chi đang làm |
| T | Yêu cầu tiếng Anh lưu loát — đúng điểm yếu của Chi |
| Kế hoạch | Luyện tiếng Anh giao tiếp + dùng trang 5K followers như portfolio khi apply agency nội địa trước |

---

**Tình huống 4 — Dũng (Logistics)**
> *"Dũng, 24 tuổi, đi làm được 1 năm tại công ty logistics nhỏ. Sếp Dũng hay giao việc độc lập vì 'giao cho Dũng là yên tâm, đúng giờ, không cần nhắc'. Trong các buổi họp bàn cải tiến quy trình, Dũng thường ngồi nghe và gật đầu, hiếm khi lên tiếng dù đôi khi thấy có vấn đề. Gần đây công ty thông báo sẽ chuyển toàn bộ quy trình giao nhận sang hệ thống quản lý kho điện tử mới trong 3 tháng tới, Dũng nghe xong chỉ nhún vai: 'chắc có người hướng dẫn thôi'. Ngành logistics đang chuyển đổi số mạnh — những nhân viên chủ động học công nghệ mới và đề xuất cải tiến đang được ưu tiên thăng tiến, trong khi những ai chờ được chỉ dẫn dần bị đánh giá là thiếu năng động."*

| | Đáp án gợi ý |
|---|---|
| S | Đáng tin cậy, đúng giờ, được sếp tin tưởng |
| W | Thụ động, không chủ động đề xuất, ngại học cái mới |
| O | Chuyển đổi số mở cơ hội thăng tiến cho người chủ động |
| T | Ai không thích nghi bị đánh giá thiếu năng động |
| Kế hoạch | Xin tham gia nhóm triển khai hệ thống mới + tập đề xuất ít nhất 1 cải tiến/tháng |

---

**Tình huống 5 — Emm (CNTT)**
> *"Emm, 22 tuổi, sinh viên năm 4 ngành Công nghệ thông tin. Code giỏi, đã có 2 dự án cá nhân trên GitHub, đạt giải Ba hackathon cấp trường — tất cả đều là dự án solo. Các thành viên nhóm môn học cũ của Emm hay nhận xét 'làm việc với Emm ra sản phẩm tốt nhưng mệt lắm'. Emm thường kết thúc tranh luận bằng câu 'cứ làm theo cách tôi đi, tôi biết cách này đúng'. Các công ty startup công nghệ đang bùng nổ và rất cần developer giỏi, nhưng đều nhấn mạnh văn hóa teamwork là tiêu chí tuyển dụng hàng đầu."*

| | Đáp án gợi ý |
|---|---|
| S | Code giỏi, có portfolio thực tế, từng đạt giải hackathon |
| W | Khó làm việc nhóm, không chịu nhận góp ý, hay áp đặt |
| O | Startup bùng nổ, nhu cầu developer cao |
| T | Teamwork là tiêu chí hàng đầu — đúng điểm yếu chí mạng của Emm |
| Kế hoạch | Tham gia dự án nhóm/hackathon team + luyện lắng nghe trước khi phản bác |

---

**Tình huống 6 — Phong (Kế toán)**
> *"Phong, 23 tuổi, vừa tốt nghiệp ngành Kế toán. Thầy cô đánh giá Phong là sinh viên hiếm hoi không bao giờ sai một con số trong suốt 4 năm học, làm việc gì cũng tỉ mỉ và cẩn thận. Phong không có LinkedIn, chưa từng tham gia câu lạc bộ hay sự kiện nào ngoài giờ học. Khi bạn bè rủ đi networking, Phong thường từ chối vì 'mình làm kế toán cần gì quen biết nhiều'. Hiện tại nhiều doanh nghiệp đang tuyển kế toán gấp và sẵn sàng nhận sinh viên mới tốt nghiệp nếu có thái độ cầu thị và chịu học hỏi — tuy nhiên hầu hết các vị trí đều yêu cầu ứng viên trải qua phỏng vấn nhiều vòng và được giới thiệu qua người quen trong ngành."*

| | Đáp án gợi ý |
|---|---|
| S | Chuyên môn vững, tỉ mỉ, cẩn thận — được thầy cô đánh giá cao |
| W | Không có network, không LinkedIn, tư duy khép kín |
| O | Doanh nghiệp tuyển gấp, chấp nhận sinh viên mới nếu thái độ tốt |
| T | Tuyển qua giới thiệu, phỏng vấn nhiều vòng — đúng điểm yếu thiếu network |
| Kế hoạch | Lập LinkedIn ngay + tham gia hội nhóm kế toán để xây network trước mùa tuyển dụng |

---

**Tình huống 7 — Giang (Luật)**
> *"Giang, 21 tuổi, sinh viên năm 3 ngành Luật. Từng đạt giải Nhất hùng biện cấp khoa, giáo viên nhận xét Giang phân tích tình huống pháp lý rất sắc bén. Nhưng mỗi khi bạn bè hỏi 'sau này mày muốn làm gì', Giang chỉ cười trừ. Giang hay so sánh bản thân với người bạn thân đã có định hướng rõ ràng từ năm nhất và tự nhủ 'chắc mình kém hơn'. Ngành luật đang mở ra nhiều ngách mới như luật công nghệ và luật sở hữu trí tuệ — những lĩnh vực đang thiếu nhân lực trầm trọng nhưng ít sinh viên luật biết đến."*

| | Đáp án gợi ý |
|---|---|
| S | Tư duy pháp lý sắc bén, kỹ năng hùng biện tốt |
| W | Thiếu định hướng, hay so sánh bản thân, chưa biết mình muốn gì |
| O | Luật công nghệ/sở hữu trí tuệ thiếu nhân lực, ít người biết đến |
| T | Không có định hướng sẽ bỏ lỡ cơ hội ngách đang mở |
| Kế hoạch | Tìm hiểu luật công nghệ + thử thực tập văn phòng chuyên ngành để xác định hướng đi |

---

**Tình huống 8 — Huy (Truyền thông)**
> *"Huy, 25 tuổi, đã đi làm 2 năm trong ngành truyền thông. Cứ mỗi lần cần booking địa điểm, mời khách, hay tìm nhà tài trợ — mọi người đều gọi Huy vì 'Huy quen hết rồi'. Ba sự kiện Huy phụ trách đều diễn ra suôn sẻ. Tuy nhiên mỗi khi sếp yêu cầu viết bài PR hay caption mạng xã hội, Huy thường mất rất nhiều thời gian và kết quả vẫn phải chỉnh sửa nhiều. Huy cũng không có bằng cấp chuyên ngành truyền thông. Các thương hiệu lớn đang cắt giảm ngân sách tổ chức sự kiện trực tiếp và chuyển sang đầu tư mạnh vào content digital."*

| | Đáp án gợi ý |
|---|---|
| S | Network rộng, kinh nghiệm tổ chức sự kiện thực tế |
| W | Viết lách yếu, không có bằng cấp chuyên ngành |
| O | Thương hiệu đầu tư mạnh vào content digital |
| T | Ngân sách sự kiện bị cắt — thế mạnh chính của Huy đang mất giá trị |
| Kế hoạch | Tận dụng network học content + viết về sự kiện đã tổ chức như portfolio chuyển ngách |

---

**Tình huống 9 — Ivy (Ngoại thương)**
> *"Ivy, 22 tuổi, sinh viên năm 4 ngành Ngoại thương. IELTS 7.5, từng trao đổi sinh viên tại Singapore 1 học kỳ — là một trong số ít sinh viên khoa có kinh nghiệm học tập quốc tế. Trước mỗi kỳ thi hay deadline quan trọng, Ivy thường nhắn tin hỏi bạn bè 'tao làm vậy có đúng không' dù bản thân đã chuẩn bị rất kỹ. Khi nhóm bất đồng ý kiến, Ivy thường chọn im lặng để tránh xung đột. Các tập đoàn đa quốc gia đang tuyển Management Trainee với mức lương hấp dẫn, ưu tiên ứng viên có kinh nghiệm quốc tế — nhưng chương trình nổi tiếng là áp lực cao và đòi hỏi khả năng ra quyết định nhanh."*

| | Đáp án gợi ý |
|---|---|
| S | Tiếng Anh xuất sắc, có kinh nghiệm quốc tế — hội đủ điều kiện ưu tiên |
| W | Thiếu quyết đoán, hay lo lắng thái quá, tránh xung đột |
| O | Management Trainee ưu tiên đúng profile của Ivy |
| T | Chương trình áp lực cao, đòi hỏi ra quyết định nhanh — đúng điểm yếu |
| Kế hoạch | Luyện ra quyết định trong tình huống nhỏ hàng ngày + tìm mentor đã trải qua MT program |

---

## 6. VÒNG BONUS — "VƯỢT ĐƯỜNG VỀ NHÀ"

### Tổng quan
- Thời gian: ~5 phút
- Điểm: +2 nếu đến đích, +0 nếu không
- Game: Cross the Road

### Cơ chế
- Game Cross the Road chạy trực tiếp trên thiết bị của từng đội tại bàn
- Cả đội cùng chơi trên 1 màn hình (có thể luân phiên điều khiển)
- Không giới hạn số lần thử trong thời gian cho phép
- Sau khi đội hoàn thành vòng bonus và đạt điều kiện qua màn, hệ thống cập nhật **+2 điểm** lên leaderboard cho đội đó
- Việc cập nhật điểm có thể được trigger từ admin panel hoặc từ logic game tùy implementation cuối cùng

---

## 7. TỔNG KẾT

### Flow tổng kết
```
Admin bấm "Kết thúc game"
      ↓
Hệ thống tính tổng điểm: Round 1 + Round 2 + Bonus
      ↓
Presenter: hiện podium Top 3 (Kahoot style) + hiệu ứng ăn mừng
```

### Kết quả
- **Top 3 phòng ban** → *"Chính thức được tuyển dụng — THĂNG CHỨC!"* 🎉
- **Đội cuối bảng** → Penalty vui: đứng dậy đọc to câu định vị bản thân
  > *"Chúng tôi là [tên đội], điểm mạnh của chúng tôi là... và chúng tôi xứng đáng được nhận lại vì..."*

---

## 8. DATA MODEL — SUPABASE

```sql
-- Bảng đội chơi
teams (
  id: uuid PRIMARY KEY,
  team_id: int UNIQUE,          -- 1–9
  name: text,                    -- "Phòng ban 1", etc.
  password: text,
  tokens: int DEFAULT 10,
  score_r1: int DEFAULT 0,
  score_r2: int DEFAULT 0,
  score_bonus: int DEFAULT 0,
  total_score: int GENERATED,
  situation_id: int              -- cố định, 1–9
)

-- Trạng thái game (chỉ có 1 row)
game_state (
  id: int DEFAULT 1 PRIMARY KEY,
  phase: text,                   -- 'lobby' | 'r1_question' | 'r1_reveal' | 'r2_discuss' | 'r2_pitch' | 'bonus' | 'result'
  current_round: int,            -- 1 | 2 | 3
  current_question: int,         -- 1–5 (Round 1)
  current_team_pitch: int,       -- 1–9 (Round 2)
  betting_locked: bool DEFAULT false
)

-- Lịch sử đặt cược
bets (
  id: uuid PRIMARY KEY,
  team_id: int,
  question_id: int,
  amount: int,                   -- 1–5
  is_correct: bool,
  created_at: timestamp
)

-- Điểm BGK Round 2
judge_scores (
  id: uuid PRIMARY KEY,
  judge_id: int,                 -- 1–3
  team_id: int,
  score: int,                    -- 0–5
  submitted_at: timestamp
)
```

---

## 9. ADMIN CONTROL PANEL — CHI TIẾT

### Layout
- **Header:** Trạng thái game hiện tại (phase, vòng, câu/đội đang chạy)
- **Main panel:** Thay đổi theo phase
- **Sidebar:** Leaderboard token realtime (Round 1) hoặc điểm tổng (Round 2+)

### Các nút theo phase

**Round 1:**
- Bắt đầu câu X
- [Sau 30s tự khóa betting] → Giơ bảng!
- Đúng/Sai cho từng đội (9 nút × 2)
- Reveal đáp án
- Câu tiếp theo / Kết thúc Round 1

**Round 2:**
- Bắt đầu Round 2 (trigger countdown 1p30s)
- Bắt đầu pitch Đội X
- Override (bỏ qua BGK chưa submit)
- Đội tiếp theo
- Kết thúc Round 2

**Bonus:**
- Bắt đầu Bonus
- Cập nhật đội X vượt bonus (+2 điểm lên leaderboard)
- Kết thúc Bonus

**Tổng kết:**
- Hiện kết quả

---

## 10. PRESENTER VIEW — CHI TIẾT

### Hiển thị theo phase

| Phase | Nội dung hiển thị |
|---|---|
| Lobby | Tên game + danh sách phòng ban + trạng thái đăng nhập |
| R1 — Câu hỏi | Câu hỏi + countdown 30s + leaderboard token |
| R1 — Giơ bảng | "GIƠ BẢNG!" fullscreen |
| R1 — Reveal | Đáp án + giải thích + leaderboard cập nhật |
| R2 — Thảo luận | "Các đội thảo luận!" + countdown 1p30s |
| R2 — Pitch | Tình huống đội đang pitch + tên đội |
| R2 — Điểm | Popup: BGK1 / BGK2 / BGK3 → điểm trung bình |
| Bonus | Thông báo vòng bonus |
| Kết thúc | Podium Top 3 + hiệu ứng ăn mừng |

---

## 11. TEAM VIEW — CHI TIẾT

### Hiển thị theo phase

| Phase | Nội dung hiển thị |
|---|---|
| Lobby | Màn hình chọn phòng ban + nhập password |
| R1 — Câu hỏi | Câu hỏi + slider đặt cược (1–5) + countdown + leaderboard token |
| R1 — Locked | "Đã đặt cược X token" + chờ giơ bảng |
| R1 — Reveal | Đáp án + kết quả đúng/sai + token hiện tại |
| R2 — Thảo luận | Tình huống của đội mình + countdown 1p30s |
| R2 — Pitch | Tình huống của đội mình (giữ nguyên cho tất cả đội) |
| Bonus | Giao diện Cross the Road |
| Kết thúc | Bảng điểm tổng |

---

## 12. JUDGE VIEW — CHI TIẾT

- Chỉ active trong phase R2 — Pitch
- Hiển thị: tên đội đang pitch + tình huống của đội đó
- Form chấm điểm:
  - Tiêu chí 1: Xác định đúng & đủ SWOT (0–2)
  - Tiêu chí 2: Hành động cụ thể dựa trên SWOT (0–2)
  - Tiêu chí 3: Trình bày tự tin (0–1)
  - Tổng tự động tính (0–5)
  - Nút Submit
- Sau khi submit: màn hình chờ, không thể chỉnh sửa
- Hiện trạng thái: BGK1 ✅ / BGK2 ⏳ / BGK3 ⏳

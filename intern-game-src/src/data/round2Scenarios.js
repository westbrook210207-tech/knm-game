export const ROUND2_SCENARIOS = {
  finance: {
    name: 'An',
    major: 'Tài chính',
    age: 22,
    file: 'An, 22 tuổi, sinh viên năm 4 ngành Tài chính. GPA 3.6, thường được nhóm giao phần xử lý số liệu và luôn hoàn thành tốt. Trong các buổi thuyết trình nhóm, An thường nhường phần trình bày cho người khác với lý do "bạn kia nói hay hơn". Chưa từng đi thực tập. Hiện tại các công ty fintech đang tuyển dụng mạnh và ưu tiên người biết phân tích dữ liệu, tuy nhiên yêu cầu ứng viên có ít nhất 6 tháng thực tập.',
    hints: { S: 'Giỏi xử lý số liệu, GPA cao', W: 'Ngại thuyết trình, chưa có kinh nghiệm thực tập', O: 'Fintech đang tuyển mạnh, ưu tiên phân tích dữ liệu', T: 'Yêu cầu 6 tháng thực tập' },
  },
  business: {
    name: 'Bảo',
    major: 'Quản trị kinh doanh',
    age: 23,
    file: 'Bảo, 23 tuổi, vừa tốt nghiệp ngành Quản trị kinh doanh. Trong các dự án nhóm, Bảo luôn là người đứng ra phân công công việc và cả nhóm đều nghe theo vì Bảo nói chuyện rất có sức thuyết phục. Tuy nhiên giáo viên hướng dẫn đã nhiều lần nhắc về việc nộp báo cáo trễ hạn. Khi được hỏi về số liệu trong buổi bảo vệ đồ án, Bảo thường chuyển câu hỏi sang thành viên khác. Nhiều startup đang tuyển Business Development Executive — cần người biết thuyết phục đối tác và mở rộng thị trường, nhưng đòi hỏi tự lập kế hoạch và theo dõi tiến độ độc lập.',
    hints: { S: 'Giao tiếp tốt, thuyết phục giỏi, có kinh nghiệm leadership', W: 'Hay trễ deadline, yếu phân tích số liệu', O: 'Startup tuyển BDE — đúng thế mạnh thuyết phục', T: 'Vị trí đòi hỏi tự quản lý tiến độ' },
  },
  marketing: {
    name: 'Chi',
    major: 'Marketing',
    age: 21,
    file: 'Chi, 21 tuổi, sinh viên năm 3 ngành Marketing. Trang cá nhân về lifestyle của Chi có 5.000 followers và tăng đều mỗi tháng nhờ các video ngắn Chi tự quay và edit. Mỗi khi lớp có bài tập tiếng Anh, Chi thường nhờ bạn bè hỗ trợ hoặc dùng Google Translate. Chưa có bằng chứng chỉ nào. Các agency nước ngoài đang mở văn phòng tại Việt Nam và tuyển Digital Marketer gấp, lương cao nhưng yêu cầu giao tiếp tiếng Anh lưu loát.',
    hints: { S: 'Giỏi làm content, có personal brand 5.000 followers', W: 'Tiếng Anh yếu, không có bằng chứng chỉ', O: 'Agency nước ngoài tuyển Digital Marketer gấp', T: 'Yêu cầu tiếng Anh lưu loát' },
  },
  logistics: {
    name: 'Dũng',
    major: 'Logistics',
    age: 24,
    file: 'Dũng, 24 tuổi, đi làm được 1 năm tại công ty logistics nhỏ. Sếp Dũng hay giao việc độc lập vì "giao cho Dũng là yên tâm, đúng giờ, không cần nhắc". Trong các buổi họp bàn cải tiến quy trình, Dũng thường ngồi nghe và gật đầu, hiếm khi lên tiếng dù đôi khi thấy có vấn đề. Gần đây công ty sẽ chuyển toàn bộ quy trình sang hệ thống quản lý kho điện tử mới trong 3 tháng tới. Ngành logistics đang chuyển đổi số mạnh — những nhân viên chủ động học công nghệ mới đang được ưu tiên thăng tiến.',
    hints: { S: 'Đáng tin cậy, đúng giờ, được sếp tin tưởng', W: 'Thụ động, không chủ động đề xuất, ngại học cái mới', O: 'Chuyển đổi số mở ra cơ hội thăng tiến', T: 'Ai không thích nghi sẽ bị đánh giá thiếu năng động' },
  },
  it: {
    name: 'Emm',
    major: 'CNTT',
    age: 22,
    file: 'Emm, 22 tuổi, sinh viên năm 4 ngành Công nghệ thông tin. Code giỏi, đã có 2 dự án cá nhân trên GitHub, đạt giải Ba hackathon cấp trường — tất cả đều là dự án solo. Các thành viên nhóm cũ hay nhận xét "làm việc với Emm ra sản phẩm tốt nhưng mệt lắm". Emm thường kết thúc tranh luận bằng câu "cứ làm theo cách tôi đi, tôi biết cách này đúng". Các startup công nghệ đang bùng nổ và rất cần developer giỏi, nhưng đều nhấn mạnh văn hóa teamwork là tiêu chí tuyển dụng hàng đầu.',
    hints: { S: 'Code giỏi, có portfolio thực tế, từng đạt giải hackathon', W: 'Khó làm việc nhóm, không chịu nhận góp ý', O: 'Startup bùng nổ, nhu cầu developer cao', T: 'Teamwork là tiêu chí hàng đầu — đúng điểm yếu của Emm' },
  },
  accounting: {
    name: 'Phong',
    major: 'Kế toán',
    age: 23,
    file: 'Phong, 23 tuổi, vừa tốt nghiệp ngành Kế toán. Thầy cô đánh giá Phong là sinh viên hiếm hoi không bao giờ sai một con số trong suốt 4 năm học. Phong không có LinkedIn, chưa từng tham gia câu lạc bộ hay sự kiện nào ngoài giờ học. Khi bạn bè rủ đi networking, Phong thường từ chối vì "mình làm kế toán cần gì quen biết nhiều". Hiện tại nhiều doanh nghiệp đang tuyển kế toán gấp và sẵn sàng nhận sinh viên mới tốt nghiệp, tuy nhiên hầu hết các vị trí yêu cầu ứng viên được giới thiệu qua người quen trong ngành.',
    hints: { S: 'Chuyên môn vững, tỉ mỉ, cẩn thận', W: 'Không có network, không có LinkedIn, tư duy khép kín', O: 'Doanh nghiệp tuyển gấp, chấp nhận sinh viên mới', T: 'Tuyển qua giới thiệu — đúng điểm yếu thiếu network' },
  },
  legal: {
    name: 'Giang',
    major: 'Luật',
    age: 21,
    file: 'Giang, 21 tuổi, sinh viên năm 3 ngành Luật. Từng đạt giải Nhất hùng biện cấp khoa, giáo viên nhận xét Giang phân tích tình huống pháp lý rất sắc bén. Nhưng mỗi khi bạn bè hỏi "sau này mày muốn làm gì", Giang chỉ cười trừ. Giang hay so sánh bản thân với người bạn thân đã có định hướng rõ ràng từ năm nhất. Ngành luật đang mở ra nhiều ngách mới như luật công nghệ và luật sở hữu trí tuệ — những lĩnh vực đang thiếu nhân lực trầm trọng nhưng ít sinh viên luật biết đến.',
    hints: { S: 'Tư duy pháp lý sắc bén, kỹ năng hùng biện tốt', W: 'Thiếu định hướng, hay so sánh bản thân', O: 'Luật công nghệ và sở hữu trí tuệ thiếu nhân lực', T: 'Không có định hướng sẽ bỏ lỡ cơ hội' },
  },
  media: {
    name: 'Huy',
    major: 'Truyền thông',
    age: 25,
    file: 'Huy, 25 tuổi, đã đi làm 2 năm trong ngành truyền thông. Cứ mỗi lần cần booking địa điểm, mời khách, hay tìm nhà tài trợ — mọi người đều gọi Huy vì "Huy quen hết rồi". Ba sự kiện Huy phụ trách đều diễn ra suôn sẻ. Tuy nhiên mỗi khi sếp yêu cầu viết bài PR hay caption mạng xã hội, Huy thường mất rất nhiều thời gian và kết quả vẫn phải chỉnh sửa nhiều. Các thương hiệu lớn đang cắt giảm ngân sách tổ chức sự kiện trực tiếp và chuyển sang đầu tư mạnh vào content digital.',
    hints: { S: 'Network rộng, có kinh nghiệm tổ chức sự kiện thực tế', W: 'Viết lách yếu, không có bằng cấp chuyên ngành', O: 'Thương hiệu đầu tư mạnh vào content digital', T: 'Ngân sách sự kiện bị cắt — thế mạnh chính đang mất giá trị' },
  },
  trade: {
    name: 'Ivy',
    major: 'Ngoại thương',
    age: 22,
    file: 'Ivy, 22 tuổi, sinh viên năm 4 ngành Ngoại thương. IELTS 7.5, từng trao đổi sinh viên tại Singapore 1 học kỳ — là một trong số ít sinh viên khoa có kinh nghiệm học tập quốc tế. Trước mỗi kỳ thi hay deadline quan trọng, Ivy thường nhắn tin hỏi bạn bè "tao làm vậy có đúng không" dù bản thân đã chuẩn bị rất kỹ. Khi nhóm bất đồng ý kiến, Ivy thường chọn im lặng để tránh xung đột. Các tập đoàn đa quốc gia đang tuyển Management Trainee với mức lương hấp dẫn, ưu tiên ứng viên có kinh nghiệm quốc tế — nhưng chương trình nổi tiếng là áp lực cao và đòi hỏi khả năng ra quyết định nhanh.',
    hints: { S: 'Tiếng Anh xuất sắc, có kinh nghiệm quốc tế', W: 'Thiếu quyết đoán, hay lo lắng thái quá, tránh xung đột', O: 'Management Trainee ưu tiên đúng profile của Ivy', T: 'Chương trình áp lực cao, đòi hỏi ra quyết định nhanh' },
  },
};

export const ROUND2_SWOT_FIELDS = [
  { key: 'S', label: 'Strengths', emoji: '💪', color: 'var(--accent-green)', description: 'Điểm mạnh bên trong' },
  { key: 'W', label: 'Weaknesses', emoji: '⚠️', color: 'var(--accent-red)', description: 'Điểm yếu bên trong' },
  { key: 'O', label: 'Opportunities', emoji: '🚀', color: 'var(--accent-blue)', description: 'Cơ hội bên ngoài' },
  { key: 'T', label: 'Threats', emoji: '⚡', color: 'var(--accent-orange)', description: 'Thách thức bên ngoài' },
];

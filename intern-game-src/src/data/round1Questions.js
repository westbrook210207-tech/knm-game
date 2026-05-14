export const ROUND1_QUESTIONS = [
  {
    id: 1,
    text: 'Quy trình định vị bản thân có mấy bước? Kể tên?',
    difficulty: 'DỄ',
    answer: '3 bước: Xác định mục tiêu → SWOT → Kế hoạch hành động',
    options: [
      { label: 'A', text: '2 bước: Mục tiêu → SWOT' },
      { label: 'B', text: '3 bước: Mục tiêu → SWOT → Kế hoạch' },
      { label: 'C', text: '4 bước: Mục tiêu → SWOT → KH → Đánh giá' },
      { label: 'D', text: '3 bước: SWOT → Mục tiêu → Kế hoạch' },
    ],
    correct: 'B',
  },
  {
    id: 2,
    text: 'Trong mô hình ASK, kiến thức chiếm 85% sự thành công — Đúng hay Sai?',
    difficulty: 'DỄ (CÓ BẪY)',
    answer: 'Sai — Thái độ + Kỹ năng chiếm 85%, Kiến thức chỉ 15%',
    options: [
      { label: 'A', text: 'Đúng' },
      { label: 'B', text: 'Sai' },
    ],
    correct: 'B',
  },
  {
    id: 3,
    text: '"Thương hiệu của bạn là những gì bạn nói về chính mình" — Jeff Bezos. Đúng hay Sai?',
    difficulty: 'TRUNG BÌNH',
    answer: 'Sai — là những gì người khác nói về bạn khi bạn không có mặt',
    options: [
      { label: 'A', text: 'Đúng' },
      { label: 'B', text: 'Sai' },
    ],
    correct: 'B',
  },
  {
    id: 4,
    text: 'Trong SWOT bản thân, yếu tố nào thuộc môi trường bên ngoài?',
    difficulty: 'TRUNG BÌNH',
    answer: 'Opportunities + Threats (phải đủ cả hai)',
    options: [
      { label: 'A', text: 'Strengths + Weaknesses' },
      { label: 'B', text: 'Opportunities + Threats' },
      { label: 'C', text: 'Strengths + Opportunities' },
      { label: 'D', text: 'Weaknesses + Threats' },
    ],
    correct: 'B',
  },
  {
    id: 5,
    text: 'Kế hoạch hành động là bước thứ 2 trong quy trình định vị bản thân — Đúng hay Sai?',
    difficulty: 'KHÓ (CÓ BẪY)',
    answer: 'Sai — là bước thứ 3, bước 2 là SWOT',
    options: [
      { label: 'A', text: 'Đúng' },
      { label: 'B', text: 'Sai' },
    ],
    correct: 'B',
  },
];

export const ROUND1_DIFFICULTY_COLORS = {
  'DỄ': 'var(--accent-green)',
  'DỄ (CÓ BẪY)': 'var(--accent-orange)',
  'TRUNG BÌNH': 'var(--accent-blue)',
  'KHÓ (CÓ BẪY)': 'var(--accent-red)',
};

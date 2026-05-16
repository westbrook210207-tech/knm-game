function getPodiumLabel(index) {
  if (index === 0) return 'Vô địch';
  if (index === 1) return 'Á quân';
  if (index === 2) return 'Top 3';
  return `#${index + 1}`;
}

export default function AdminResultsPanel({ snapshot }) {
  const leaderboard = snapshot?.leaderboard || [];
  const topThree = leaderboard.slice(0, 3);

  return (
    <>
      <div className="route-info-card route-round1-card route-round1-card--wide">
        <h2>Khu Vực Công Bố Kết Quả</h2>
        <p>
          Khi phase chuyển sang <strong>results</strong>, presenter và team sẽ đọc leaderboard cuối từ đây.
        </p>
        <p className="route-muted-text">
          Sau khi công bố xong, admin có thể dùng nút reset dữ liệu chơi để chuẩn bị cho buổi test hoặc event kế tiếp.
        </p>
      </div>

      <div className="route-results-podium">
        {topThree.map((score, index) => (
          <div className="route-results-podium-card" key={score.id}>
            <span className="route-status-pill route-status-pill--warning">
              {getPodiumLabel(index)}
            </span>
            <h3>
              #{index + 1} {score.teams?.icon} {score.teams?.display_name}
            </h3>
            <p className="route-muted-text">
              V1: {score.round1_score} · V2: {score.round2_score}
            </p>
            <div className="route-results-total">{score.total_score} điểm</div>
          </div>
        ))}
      </div>
    </>
  );
}

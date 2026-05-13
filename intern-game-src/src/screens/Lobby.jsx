import { useState } from 'react';
import { useGame } from '../hooks/useGameContext';
import { createSession } from '../api';
import Typewriter from '../components/Typewriter';
import './Lobby.css';

const TEAMS = [
  { id: 'finance',    name: 'Phòng Tài Chính',          icon: '💰' },
  { id: 'business',  name: 'Phòng Kinh Doanh',          icon: '📊' },
  { id: 'marketing', name: 'Phòng Marketing',            icon: '📣' },
  { id: 'logistics', name: 'Phòng Logistics',            icon: '🚚' },
  { id: 'it',        name: 'Phòng CNTT',                 icon: '💻' },
  { id: 'accounting',name: 'Phòng Kế Toán',              icon: '🗂️' },
  { id: 'legal',     name: 'Phòng Pháp Chế',             icon: '⚖️' },
  { id: 'media',     name: 'Phòng Truyền Thông',         icon: '📡' },
  { id: 'trade',     name: 'Phòng Ngoại Thương',         icon: '🌏' },
];

export default function Lobby() {
  const { dispatch } = useGame();
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [dialogDone, setDialogDone] = useState(false);

  const handleJoin = async () => {
    if (!selectedTeam) return;
    setLoading(true);
    setError('');
    try {
      // Try to connect to backend; fallback for demo mode
      let sessionData;
      try {
        sessionData = await createSession({ teamId: selectedTeam.id });
      } catch {
        // Demo mode: create a local session
        sessionData = { sessionId: 'demo-session-001', teams: TEAMS };
      }
      dispatch({ type: 'SET_SESSION', payload: sessionData });
      dispatch({ type: 'SET_TEAM', payload: selectedTeam });
      dispatch({ type: 'SET_SCREEN', payload: 'round1' });
    } catch (e) {
      setError('Không thể kết nối server. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="lobby screen">
      {/* Background grid */}
      <div className="lobby-grid" />

      {/* Boss character area */}
      <div className="lobby-top">
        <div className="boss-area">
          <div className="boss-avatar">👔</div>
          <div className="dialog-box boss-dialog slide-up">
            <div className="dialog-name">SẾP TỔNG</div>
            <div className="dialog-text">
              <Typewriter
                text="Chúc mừng! Các bạn vừa được nhận vào Tập Đoàn XYZ. Hôm nay là ngày thử việc cuối cùng — tôi sẽ tung ra 3 thử thách liên tiếp. Phòng ban nào chứng minh được năng lực sẽ được THĂNG CHỨC chính thức!"
                speed={25}
                onDone={() => setDialogDone(true)}
              />
            </div>
          </div>
        </div>

        <div className="lobby-title-block">
          <div className="lobby-eyebrow">TẬP ĐOÀN XYZ PRESENTS</div>
          <h1 className="lobby-title glitch">HÀNH TRÌNH<br />THỰC TẬP SINH</h1>
          <div className="lobby-subtitle">Chọn phòng ban của bạn để bắt đầu!</div>
        </div>
      </div>

      {/* Team selection */}
      <div className={`lobby-bottom ${dialogDone ? 'fade-in' : 'hidden'}`}>
        <div className="team-grid">
          {TEAMS.map((team) => (
            <button
              key={team.id}
              className={`team-card ${selectedTeam?.id === team.id ? 'selected' : ''}`}
              onClick={() => setSelectedTeam(team)}
            >
              <span className="team-icon">{team.icon}</span>
              <span className="team-name">{team.name}</span>
            </button>
          ))}
        </div>

        {error && <p className="lobby-error">{error}</p>}

        <button
          className={`btn btn-primary lobby-start ${!selectedTeam ? 'disabled' : 'pulse-glow'}`}
          onClick={handleJoin}
          disabled={!selectedTeam || loading}
        >
          {loading ? '⏳ Đang kết nối...' : selectedTeam ? `✅ Tham gia — ${selectedTeam.name}` : 'Chọn phòng ban trước'}
        </button>

        <div className="lobby-info">
          <span>⏱ ~30 phút</span>
          <span>·</span>
          <span>🏆 Tối đa 12 điểm</span>
          <span>·</span>
          <span>9 phòng ban</span>
        </div>
      </div>
    </div>
  );
}

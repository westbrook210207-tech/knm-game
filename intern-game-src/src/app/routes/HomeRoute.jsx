import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Typewriter from '../../components/Typewriter';
import { TEAMS } from '../../data/teams';
import { useSupabaseRoleSession } from '../../hooks/useSupabaseRoleSession';
import { signOut } from '../../lib/supabase/auth';
import { getDeviceLabel } from '../../lib/supabase/device';
import { joinTeamSession } from '../../lib/supabase/sessions';
import { createTeamSessionToken, storeTeamSession } from '../../lib/teamSession';
import '../../screens/Lobby.css';

function getInitialTeamSelection() {
  if (typeof window === 'undefined') return null;

  const teamId = new URLSearchParams(window.location.search).get('team');
  if (!teamId) return null;

  return TEAMS.find((team) => team.id === teamId) ?? null;
}

function getRoleRoute(profile, selectedTeamId = '') {
  if (!profile?.role) return null;

  if (profile.role === 'admin') return '/admin';
  if (profile.role === 'judge' && profile.judge_code) {
    return `/judge/${profile.judge_code}`;
  }
  if (profile.role === 'team') {
    return selectedTeamId ? `/team/${selectedTeamId}` : '/';
  }

  return null;
}

export default function HomeRoute() {
  const navigate = useNavigate();
  const authState = useSupabaseRoleSession();
  const [selectedTeam, setSelectedTeam] = useState(() => getInitialTeamSelection());
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [dialogDone, setDialogDone] = useState(false);

  const activeTeamId = useMemo(() => selectedTeam?.id || '', [selectedTeam]);
  const signedIntoDifferentRole =
    authState.user && authState.profile?.role && authState.profile.role !== 'team';
  const currentRoleRoute = getRoleRoute(authState.profile, activeTeamId);

  async function handleContinue() {
    if (!selectedTeam) {
      setError('Hãy chọn phòng ban trước khi đăng nhập.');
      return;
    }

    try {
      setSubmitting(true);
      setError('');

      if (!password) {
        setError('Hãy nhập mật khẩu của phòng ban.');
        return;
      }

      const sessionToken = createTeamSessionToken();
      await joinTeamSession({
        teamCode: selectedTeam.id,
        password,
        sessionToken,
        deviceLabel: getDeviceLabel(),
      });
      storeTeamSession({
        teamCode: selectedTeam.id,
        sessionToken,
      });
      navigate(`/team/${selectedTeam.id}`);
    } catch (nextError) {
      setError(nextError?.message || 'Không thể đăng nhập vào phòng ban này.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSignOut() {
    try {
      setError('');
      await signOut();
    } catch (nextError) {
      setError(nextError?.message || 'Không thể đăng xuất lúc này.');
    }
  }

  return (
    <div className="lobby screen">
      <div className="lobby-grid" />

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
          <h1 className="lobby-title glitch">
            HÀNH TRÌNH
            <br />
            THỰC TẬP SINH
          </h1>
          <div className="lobby-subtitle">Chọn phòng ban của bạn để bắt đầu!</div>
        </div>
      </div>

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

        <div className="route-public-auth-card dialog-box fade-in">
          <div className="dialog-name">
            {selectedTeam ? `ĐĂNG NHẬP — ${selectedTeam.name}` : 'CHỌN PHÒNG BAN'}
          </div>
          <div className="dialog-text">
            {selectedTeam
              ? `Alias đăng nhập của đội này là \`${activeTeamId}\`.`
              : 'Mỗi đội chỉ cần chọn đúng phòng ban của mình rồi nhập mật khẩu để tiếp tục.'}
          </div>

          <div className="route-public-auth-form">
            <label className="route-form__group route-public-auth-group">
              <span>Mật khẩu phòng ban</span>
              <input
                className="route-input"
                type="text"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Nhập mật khẩu"
                autoComplete="current-password"
                disabled={!selectedTeam}
              />
            </label>

            <div className="route-inline-actions">
              <button
                className={`btn btn-primary lobby-start ${!selectedTeam ? 'disabled' : 'pulse-glow'}`}
                type="button"
                onClick={handleContinue}
                disabled={!selectedTeam || submitting}
              >
                {submitting
                  ? '⏳ Đang vào đội...'
                  : selectedTeam
                    ? `✅ Vào ${selectedTeam.name}`
                    : 'Chọn phòng ban trước'}
              </button>

              {authState.user ? (
                <button className="btn btn-danger" type="button" onClick={handleSignOut}>
                  Đăng xuất
                </button>
              ) : null}
            </div>
          </div>

          {signedIntoDifferentRole ? (
            <div className="route-info-card" style={{ marginTop: '1rem' }}>
              <h2>Đang Ở Chế Độ Nội Bộ</h2>
              <p className="route-muted-text">
                Bạn đang giữ thêm role `{authState.profile?.role}` trong trình duyệt này. Điều đó không chặn việc tạo phiên team mới cho public route.
              </p>
              <div className="route-inline-actions">
                {currentRoleRoute ? (
                  <button
                    className="btn btn-ghost"
                    type="button"
                    onClick={() => navigate(currentRoleRoute)}
                  >
                    Về đúng màn hiện tại
                  </button>
                ) : null}
                <button className="btn btn-danger" type="button" onClick={handleSignOut}>
                  Đăng xuất để vào team
                </button>
              </div>
            </div>
          ) : null}

          {error ? <p className="route-error-text">{error}</p> : null}
        </div>

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

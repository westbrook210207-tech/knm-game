import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { JUDGES } from '../../data/judges';
import RoleShell from '../layouts/RoleShell';
import RoleLoginCard from '../../components/RoleLoginCard';
import SharedPhaseCard from '../../components/SharedPhaseCard';
import JudgeRound2Panel from '../../components/JudgeRound2Panel';
import { useSupabasePhase } from '../../hooks/useSupabasePhase';
import { getDeviceLabel } from '../../lib/supabase/device';
import { joinJudgeSession, leaveJudgeSession } from '../../lib/supabase/sessions';
import {
  clearStoredJudgeSession,
  createJudgeSessionToken,
  isInvalidJudgeSessionError,
  readStoredJudgeSession,
  storeJudgeSession,
} from '../../lib/judgeSession';

export default function JudgeRoute() {
  const { judgeId } = useParams();
  const judge = JUDGES.find((entry) => entry.id === judgeId);
  const phaseState = useSupabasePhase();
  const storedSession = readStoredJudgeSession();
  const initialSessionToken =
    storedSession.judgeCode === judgeId ? storedSession.sessionToken : '';

  const [sessionToken, setSessionToken] = useState(initialSessionToken);
  const [sessionNotice, setSessionNotice] = useState('');
  const [loginError, setLoginError] = useState('');
  const hasActiveSession = Boolean(sessionToken);

  if (!judge) {
    return (
      <RoleShell
        eyebrow="ROUTE KHÔNG HỢP LỆ"
        title="JUDGE KHÔNG TỒN TẠI"
        subtitle="Judge ID này chưa được khai báo trong shell phase."
        badge="Judge"
      >
        <div className="route-info-card">
          <h2>Judge ID Không Hợp Lệ</h2>
          <p>Hãy dùng một trong các route mẫu: `/judge/judge-1`, `/judge/judge-2`, `/judge/judge-3`.</p>
        </div>
      </RoleShell>
    );
  }

  async function handleLogin({ identifier, password }) {
    try {
      setLoginError('');
      setSessionNotice('');

      if (identifier !== judge.id) {
        setLoginError(`Route này chỉ chấp nhận mã ${judge.id}.`);
        return;
      }

      const nextToken = createJudgeSessionToken();
      await joinJudgeSession({
        judgeCode: judge.id,
        password,
        sessionToken: nextToken,
        deviceLabel: getDeviceLabel(),
      });
      storeJudgeSession({
        judgeCode: judge.id,
        sessionToken: nextToken,
      });
      setSessionToken(nextToken);
      setSessionNotice('Phiên giám khảo đã sẵn sàng. Nếu đăng nhập ở máy khác, máy này sẽ tự mất quyền.');
    } catch (error) {
      setLoginError(error?.message || 'Đăng nhập judge thất bại.');
    }
  }

  async function handleSignOut() {
    try {
      setLoginError('');
      if (sessionToken) {
        await leaveJudgeSession({
          judgeCode: judge.id,
          sessionToken,
        });
      }
    } catch (error) {
      if (!isInvalidJudgeSessionError(error)) {
        setLoginError(error?.message || 'Không thể thoát phiên giám khảo.');
        return;
      }
    }

    clearStoredJudgeSession();
    setSessionToken('');
    setSessionNotice('');
  }

  function handleSessionInvalid() {
    clearStoredJudgeSession();
    setSessionToken('');
    setSessionNotice(
      'Phiên giám khảo đã được mở ở thiết bị khác. Vui lòng đăng nhập lại để tiếp tục chấm.'
    );
  }

  return (
    <RoleShell
      eyebrow="BAN GIÁM KHẢO"
      title={judge.name.toUpperCase()}
      subtitle="Màn hình dành cho ban giám khảo. Judge giờ dùng session-token đơn giản giống team: đăng nhập nhẹ, single active session, và tự mất quyền nếu mở ở máy khác."
      badge="Judge"
    >
      <div className="route-info-grid">
        <SharedPhaseCard roleLabel={`judge:${judge.id}`} phaseState={phaseState} />
        {!hasActiveSession ? (
          <>
            <RoleLoginCard
              title="Đăng Nhập Giám Khảo"
              description="Giám khảo đăng nhập bằng mã judge và mật khẩu. Mỗi giám khảo chỉ có một phiên active tại một thời điểm."
              accentLabel={`Mã judge hiện tại: ${judge.id}`}
              loading={false}
              error={loginError}
              inputLabel="Mã giám khảo"
              inputPlaceholder={`Nhập \`${judge.id}\``}
              defaultIdentifier={judge.id}
              onSubmit={handleLogin}
            />
            {sessionNotice ? (
              <div className="route-info-card">
                <h2>Thông Báo Phiên</h2>
                <p className="route-muted-text">{sessionNotice}</p>
              </div>
            ) : null}
          </>
        ) : (
          <div className="route-info-card">
            <h2>Phiên Giám Khảo</h2>
            <p>Mã giám khảo: {judge.id}</p>
            <p>Trạng thái: active</p>
            <p>Loại phiên: single active session</p>
            {sessionNotice ? <p className="route-phase-success">{sessionNotice}</p> : null}
            <div className="route-inline-actions">
              <button className="btn btn-danger" type="button" onClick={handleSignOut}>
                Thoát phiên
              </button>
            </div>
          </div>
        )}
        {hasActiveSession ? (
          <JudgeRound2Panel
            judgeId={judge.id}
            phase={phaseState.phase}
            sessionToken={sessionToken}
            onSessionInvalid={handleSessionInvalid}
          />
        ) : (
          <div className="route-info-card route-round1-card route-round1-card--wide">
            <h2>Chấm Điểm Round 2</h2>
            <p>Đăng nhập phiên giám khảo trước để xem rubric chấm điểm và nộp điểm cho đội đang active.</p>
          </div>
        )}
        <div className="route-info-card">
          <h2>Phạm Vi Judge</h2>
          <p>Judge hiện tại: {judge.id}. Route này giữ nguyên UI chấm điểm, nhưng engine đăng nhập đã đổi sang session-token nhẹ giống team để đỡ phụ thuộc Supabase Auth.</p>
        </div>
      </div>
    </RoleShell>
  );
}

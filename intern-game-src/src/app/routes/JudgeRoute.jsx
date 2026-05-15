import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { JUDGES } from '../../data/judges';
import RoleShell from '../layouts/RoleShell';
import RoleIdentityCard from '../../components/RoleIdentityCard';
import RoleLoginCard from '../../components/RoleLoginCard';
import SharedPhaseCard from '../../components/SharedPhaseCard';
import { useSupabaseRoleSession } from '../../hooks/useSupabaseRoleSession';
import { signInWithAccount, signOut } from '../../lib/supabase/auth';

export default function JudgeRoute() {
  const { judgeId } = useParams();
  const judge = JUDGES.find((entry) => entry.id === judgeId);
  const authState = useSupabaseRoleSession();
  const [loginError, setLoginError] = useState('');

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
      await signInWithAccount({ identifier, password });
    } catch (error) {
      setLoginError(error?.message || 'Đăng nhập judge thất bại.');
    }
  }

  async function handleSignOut() {
    await signOut();
  }

  const isJudge = authState.profile?.role === 'judge';
  const judgeCodeMatches =
    !authState.profile?.judge_code || authState.profile.judge_code === judgeId;

  return (
    <RoleShell
      eyebrow="BAN GIÁM KHẢO"
      title={judge.name.toUpperCase()}
      subtitle="Màn hình dành cho ban giám khảo. Ở phase 004, route này tập trung vào identity/login để chuẩn bị cho phase chấm điểm sau."
      badge="Judge"
    >
      <div className="route-info-grid">
        <SharedPhaseCard roleLabel={`judge:${judge.id}`} />
        {!authState.user ? (
          <RoleLoginCard
            title="Đăng Nhập Giám Khảo"
            description="Giám khảo đăng nhập bằng mã judge và mật khẩu. Route này hiện dùng để xác lập danh tính cho phase chấm điểm sau."
            accentLabel={`Mã judge hiện tại: ${judge.id}`}
            loading={authState.loading}
            error={loginError || authState.error}
            inputLabel="Mã giám khảo"
            inputPlaceholder={`Nhập \`${judge.id}\``}
            defaultIdentifier={judge.id}
            onSubmit={handleLogin}
          />
        ) : !isJudge || !judgeCodeMatches ? (
          <div className="route-info-card">
            <h2>Không Được Truy Cập</h2>
            <p>Tài khoản hiện tại không hợp lệ cho judge route này.</p>
            <button className="btn btn-danger" type="button" onClick={handleSignOut}>
              Đăng xuất
            </button>
          </div>
        ) : (
          <RoleIdentityCard
            title="Danh Tính Giám Khảo"
            user={authState.user}
            profile={authState.profile}
            roleHint={`Mã giám khảo: ${authState.profile?.judge_code || 'chưa-có'}`}
          >
            <div className="route-inline-actions">
              <button className="btn btn-danger" type="button" onClick={handleSignOut}>
                Đăng xuất
              </button>
            </div>
          </RoleIdentityCard>
        )}
        <div className="route-info-card">
          <h2>Phạm Vi Judge</h2>
          <p>Judge hiện tại: {judge.id}. Route đã sẵn sàng để nhận session và scoring UI ở phase sau.</p>
        </div>
      </div>
    </RoleShell>
  );
}

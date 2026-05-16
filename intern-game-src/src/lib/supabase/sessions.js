import { requireSupabaseClient } from './client';
import { getSupabaseEnv } from './env';

function requireEventSlug() {
  const { eventSlug } = getSupabaseEnv();
  return eventSlug;
}

export async function joinTeamSession({
  teamCode,
  password,
  sessionToken,
  deviceLabel,
}) {
  const supabase = requireSupabaseClient();
  const { data, error } = await supabase.rpc('join_team_session', {
    target_event_slug: requireEventSlug(),
    target_team_code: teamCode,
    target_password: password,
    target_session_token: sessionToken,
    device_label: deviceLabel,
  });

  if (error) throw error;
  return data;
}

export async function leaveTeamSession(sessionToken) {
  const supabase = requireSupabaseClient();
  const { data, error } = await supabase.rpc('leave_team_session', {
    target_event_slug: requireEventSlug(),
    target_session_token: sessionToken,
  });

  if (error) throw error;
  return data;
}

export async function joinJudgeSession({
  judgeCode,
  password,
  sessionToken,
  deviceLabel,
}) {
  const supabase = requireSupabaseClient();
  const { data, error } = await supabase.rpc('join_judge_session', {
    target_event_slug: requireEventSlug(),
    target_judge_code: judgeCode,
    target_password: password,
    target_session_token: sessionToken,
    device_label: deviceLabel,
  });

  if (error) throw error;
  return data;
}

export async function leaveJudgeSession({ judgeCode, sessionToken }) {
  const supabase = requireSupabaseClient();
  const { data, error } = await supabase.rpc('leave_judge_session', {
    target_event_slug: requireEventSlug(),
    target_judge_code: judgeCode,
    target_session_token: sessionToken,
  });

  if (error) throw error;
  return data;
}

export async function revokeTeamSession(sessionId) {
  const supabase = requireSupabaseClient();
  const { data, error } = await supabase
    .from('team_sessions')
    .update({
      status: 'revoked',
      is_primary: false,
      can_control: false,
      revoked_at: new Date().toISOString(),
    })
    .eq('id', sessionId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function listAdminTeamSessions() {
  const supabase = requireSupabaseClient();
  const { data, error } = await supabase.rpc('get_admin_team_sessions_snapshot');

  if (error) throw error;
  return data || [];
}

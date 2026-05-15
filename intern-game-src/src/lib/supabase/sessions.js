import { requireSupabaseClient } from './client';
import { getCurrentUser } from './auth';

export async function getMyTeamSessions(teamId) {
  const supabase = requireSupabaseClient();
  const user = await getCurrentUser();

  if (!user) return [];

  const { data, error } = await supabase
    .from('team_sessions')
    .select('*')
    .eq('team_id', teamId)
    .eq('auth_user_id', user.id)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function getActiveTeamSession(teamId) {
  const sessions = await getMyTeamSessions(teamId);
  return sessions.find((session) => session.status === 'active') || null;
}

export async function getCurrentDeviceTeamSession(teamId, deviceFingerprint) {
  const supabase = requireSupabaseClient();
  const user = await getCurrentUser();

  if (!user || !deviceFingerprint) return null;

  const { data, error } = await supabase
    .from('team_sessions')
    .select('*')
    .eq('team_id', teamId)
    .eq('auth_user_id', user.id)
    .eq('device_fingerprint', deviceFingerprint)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function claimTeamSession({ teamId, deviceLabel, deviceFingerprint }) {
  const supabase = requireSupabaseClient();
  const { data, error } = await supabase.rpc('claim_team_session', {
    target_team_code: teamId,
    device_label: deviceLabel,
    device_fingerprint: deviceFingerprint,
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
  const { data, error } = await supabase
    .from('team_sessions')
    .select(
      `
        *,
        teams (
          team_code,
          display_name
        )
      `
    )
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export function subscribeToTeamSessions(onChange) {
  const supabase = requireSupabaseClient();
  const channel = supabase
    .channel(`team_sessions:${Date.now()}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'team_sessions',
      },
      onChange
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

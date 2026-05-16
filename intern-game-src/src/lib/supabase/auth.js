import { requireSupabaseClient } from './client';

const SEEDED_LOGIN_EMAILS = {
  admin: 'phase004admin@mailinator.com',
  finance: 'phase004-team-finance@mailinator.com',
  business: 'phase005-team-business@mailinator.com',
  marketing: 'phase005-team-marketing@mailinator.com',
  'judge-1': 'phase004-judge-1@mailinator.com',
  'judge-2': 'phase004-judge-2@mailinator.com',
  'judge-3': 'phase004-judge-3@mailinator.com',
};

function resolveLoginEmail(identifier) {
  const normalized = identifier.trim().toLowerCase();

  if (normalized.includes('@')) {
    return normalized;
  }

  return SEEDED_LOGIN_EMAILS[normalized] || null;
}

export async function getCurrentSession() {
  const supabase = requireSupabaseClient();
  const { data, error } = await supabase.auth.getSession();

  if (error) throw error;
  return data.session;
}

export async function getCurrentUser() {
  const supabase = requireSupabaseClient();
  const { data, error } = await supabase.auth.getUser();

  if (error) throw error;
  return data.user;
}

export async function signInWithPassword({ email, password }) {
  const supabase = requireSupabaseClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw error;
  return data;
}

export async function signInWithAccount({ identifier, password }) {
  const email = resolveLoginEmail(identifier || '');

  if (!email) {
    throw new Error(
      'Tài khoản này chưa được seed cho phase 004/005. Hãy dùng đúng mã `admin`, `finance`, `business`, `marketing`, hoặc `judge-1` đến `judge-3`.'
    );
  }

  return signInWithPassword({ email, password });
}

export async function signOut() {
  const supabase = requireSupabaseClient();
  const { error } = await supabase.auth.signOut();

  if (error) throw error;
}

export async function getMyRoleProfile() {
  const supabase = requireSupabaseClient();
  const user = await getCurrentUser();

  if (!user) return null;

  const { data, error } = await supabase
    .from('role_profiles')
    .select('*')
    .eq('auth_user_id', user.id)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export function subscribeToAuthState(onChange) {
  const supabase = requireSupabaseClient();
  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange((event, session) => {
    onChange({ event, session });
  });

  return () => {
    subscription.unsubscribe();
  };
}

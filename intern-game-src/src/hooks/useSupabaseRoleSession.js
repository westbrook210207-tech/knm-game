import { useEffect, useState } from 'react';
import {
  getCurrentSession,
  getCurrentUser,
  getMyRoleProfile,
  subscribeToAuthState,
} from '../lib/supabase/auth';
import { getSupabaseEnv } from '../lib/supabase/env';

export function useSupabaseRoleSession() {
  const [state, setState] = useState({
    session: null,
    user: null,
    profile: null,
    loading: getSupabaseEnv().isConfigured,
    error: '',
  });

  useEffect(() => {
    const { isConfigured } = getSupabaseEnv();

    if (!isConfigured) {
      setState({
        session: null,
        user: null,
        profile: null,
        loading: false,
        error: 'Supabase chưa được cấu hình trong environment.',
      });
      return undefined;
    }

    let alive = true;

    async function load() {
      try {
        const [session, user] = await Promise.all([
          getCurrentSession(),
          getCurrentUser(),
        ]);
        const profile = user ? await getMyRoleProfile() : null;

        if (!alive) return;

        setState({
          session,
          user,
          profile,
          loading: false,
          error: '',
        });
      } catch (error) {
        if (!alive) return;

        setState((current) => ({
          ...current,
          loading: false,
          error: error?.message || 'Không tải được auth session.',
        }));
      }
    }

    load();

    const unsubscribe = subscribeToAuthState(() => {
      if (!alive) return;

      setState((current) => ({ ...current, loading: true }));
      void load();
    });

    return () => {
      alive = false;
      unsubscribe();
    };
  }, []);

  return state;
}

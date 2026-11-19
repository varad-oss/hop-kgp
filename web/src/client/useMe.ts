'use client';
import { useEffect, useState } from 'react';
import { api, ApiError } from './api';

export type Me = { id: string; nexconnId: string; name: string; hall: string | null; hasPhone: boolean; isDemo: boolean };

/** state: loading → ready (signed in) | anon (needs sign-in) | error */
export function useMe() {
  const [state, setState] = useState<{ status: 'loading' | 'ready' | 'anon' | 'error'; me: Me | null }>({ status: 'loading', me: null });
  useEffect(() => {
    let live = true;
    api
      .get<Me>('/api/me')
      .then((me) => live && setState({ status: 'ready', me }))
      .catch((e) => live && setState({ status: e instanceof ApiError && e.status === 401 ? 'anon' : 'error', me: null }));
    return () => {
      live = false;
    };
  }, []);
  return { ...state, refresh: () => api.get<Me>('/api/me').then((me) => setState({ status: 'ready', me })) };
}

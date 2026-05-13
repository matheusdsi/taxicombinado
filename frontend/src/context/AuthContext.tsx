'use client';

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { api, syncLocalQuotes } from '@/lib/api';
import { getUnsyncedLocalQuotes, markLocalQuotesSynced } from '@/lib/localQuotes';

interface Driver {
  id: string;
  name: string | null;
  email: string;
  role: string;
  quoteCount: number;
}

interface AuthContextValue {
  driver: Driver | null;
  loading: boolean;
  refresh: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  driver: null,
  loading: true,
  refresh: async () => {},
  logout: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [driver, setDriver] = useState<Driver | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const res = await api.get('/api/auth/driver/me');
      setDriver(res.data.data);
      // Sync any local quotes accumulated before login
      const unsynced = getUnsyncedLocalQuotes();
      if (unsynced.length > 0) {
        syncLocalQuotes(unsynced).then(() => markLocalQuotesSynced()).catch(() => {});
      }
    } catch {
      setDriver(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.post('/api/auth/driver/logout');
    } catch {
      // ignore
    }
    setDriver(null);
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  return (
    <AuthContext.Provider value={{ driver, loading, refresh, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

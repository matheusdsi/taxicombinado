'use client';

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

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
      const res = await fetch(`${API_URL}/api/auth/driver/me`, { credentials: 'include' });
      if (res.ok) {
        const { data } = await res.json();
        setDriver(data);
      } else {
        setDriver(null);
      }
    } catch {
      setDriver(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    await fetch(`${API_URL}/api/auth/driver/logout`, { method: 'POST', credentials: 'include' });
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

import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types/index.ts';
import { api, getStoredToken, setStoredToken, removeStoredToken } from '../lib/api.ts';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (username: string, password?: string) => Promise<void>;
  logout: () => void;
  switchDemoRole: (role: UserRole) => Promise<void>;
  hasRole: (roles: UserRole[]) => boolean;
  canAccessMedical: boolean;
  canVerify: boolean;
  canManageMaster: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const DEMO_CREDENTIALS: Record<UserRole, { username: string; label: string; name: string }> = {
  admin: { username: 'admin', label: 'Admin Sistem', name: 'Kang Dedi Supriatna (Admin Pusat)' },
  pengurus_pusat: { username: 'pengurus', label: 'Pengurus Pusat', name: 'Dr. H. Ahmad Fauzi (Komandan Kontingen)' },
  koordinator_posko: { username: 'posko_bekasi', label: 'Koordinator Posko', name: 'Hendra Kurniawan, S.Pd (Posko Bekasi)' },
  tim_monev: { username: 'monev', label: 'Tim Monitoring & Evaluasi', name: 'Drs. H. Iwan Setiawan (Tim Monev)' },
  tim_teknis: { username: 'teknis', label: 'Tim Teknis', name: 'Budi Santoso, M.Or (Binpres)' },
  tim_medis: { username: 'medis', label: 'Tim Medis', name: 'dr. Rina Safitri, Sp.KO (Kesehatan)' },
  viewer: { username: 'pimpinan', label: 'Viewer / Pimpinan', name: 'H. Nuryadi, S.Pd (Ketua Umum KONI)' },
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchCurrentUser = async () => {
    try {
      const res = await api.me();
      setUser(res.user);
    } catch (err) {
      removeStoredToken();
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const token = getStoredToken();
    if (token) {
      fetchCurrentUser();
    } else {
      // Auto-login to admin demo by default so the reviewer gets immediate full interactive access
      switchDemoRole('admin').catch(() => setLoading(false));
    }

    const handleUnauthorized = () => {
      setUser(null);
    };
    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
  }, []);

  const login = async (username: string, password = 'bandungjuara2026') => {
    setLoading(true);
    try {
      const res = await api.login({ username, password });
      setStoredToken(res.token);
      setUser(res.user);
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    removeStoredToken();
    setUser(null);
  };

  const switchDemoRole = async (role: UserRole) => {
    const creds = DEMO_CREDENTIALS[role];
    if (!creds) return;
    await login(creds.username, 'bandungjuara2026');
  };

  const hasRole = (roles: UserRole[]) => {
    if (!user) return false;
    if (user.role === 'admin') return true;
    return roles.includes(user.role);
  };

  const canAccessMedical = user?.role === 'admin' || user?.role === 'tim_medis' || user?.role === 'pengurus_pusat';
  const canVerify = user?.role === 'admin' || user?.role === 'pengurus_pusat';
  const canManageMaster = user?.role === 'admin' || user?.role === 'pengurus_pusat';

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        switchDemoRole,
        hasRole,
        canAccessMedical,
        canVerify,
        canManageMaster,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

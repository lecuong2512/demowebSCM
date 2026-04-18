import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { api, saveToken, removeToken, type User } from '../services/api';

export type UserRole = 'admin' | 'purchasing' | 'warehouse' | 'finance' | 'manager';
export type { User };

interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  isAuthenticated: boolean;
  /** Lưu tên + avatar lên server (SQLite) — đổi ảnh mới sẽ ghi đè ảnh cũ trong DB */
  updateProfile: (updates: { fullName?: string; avatarUrl?: string | null }) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const stored = localStorage.getItem('scm_user');
    if (!stored) return null;
    try {
      return JSON.parse(stored) as User;
    } catch {
      return null;
    }
  });

  /** Đồng bộ hồ sơ từ DB khi còn token (F5 hoặc mở lại tab) */
  useEffect(() => {
    const tok = localStorage.getItem('scm_auth_token');
    if (!tok) return;
    let cancelled = false;
    (async () => {
      try {
        const u = await api.users.me.get();
        if (cancelled) return;
        setUser(u);
        localStorage.setItem('scm_user', JSON.stringify(u));
      } catch {
        if (cancelled) return;
        setUser(null);
        removeToken();
        localStorage.removeItem('scm_user');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const login = async (username: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const result = await api.auth.login(username, password);
      setUser(result.user);
      saveToken(result.token);
      localStorage.setItem('scm_user', JSON.stringify(result.user));
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Đăng nhập thất bại' };
    }
  };

  const logout = () => {
    setUser(null);
    removeToken();
    localStorage.removeItem('scm_user');
    localStorage.removeItem('scm_local_profile');
  };

  const updateProfile = async (updates: { fullName?: string; avatarUrl?: string | null }) => {
    const body: { fullName?: string; avatarUrl?: string | null } = {};
    if (updates.fullName !== undefined) body.fullName = updates.fullName.trim();
    if (updates.avatarUrl !== undefined) body.avatarUrl = updates.avatarUrl;
    if (Object.keys(body).length === 0) return;
    const next = await api.users.me.patch(body);
    setUser(next);
    localStorage.setItem('scm_user', JSON.stringify(next));
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};

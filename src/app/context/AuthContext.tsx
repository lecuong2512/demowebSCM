import React, { createContext, useContext, useState, ReactNode } from 'react';

export type UserRole = 'admin' | 'purchasing' | 'warehouse' | 'finance' | 'manager';

export interface User {
  id: string;
  username: string;
  fullName: string;
  role: UserRole;
  email: string;
}

interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mock users data
const mockUsers: Record<string, { password: string; user: User }> = {
  admin: {
    password: 'admin123',
    user: {
      id: '1',
      username: 'admin',
      fullName: 'Lê Văn An',
      role: 'admin',
      email: 'admin@mwg.vn'
    }
  },
  purchasing: {
    password: 'pur123',
    user: {
      id: '2',
      username: 'purchasing',
      fullName: 'Lê Hoàng Hà',
      role: 'purchasing',
      email: 'purchasing@mwg.vn'
    }
  },
  warehouse: {
    password: 'wh123',
    user: {
      id: '3',
      username: 'warehouse',
      fullName: 'Đặng Hữu Hiệp',
      role: 'warehouse',
      email: 'warehouse@mwg.vn'
    }
  },
  finance: {
    password: 'fin123',
    user: {
      id: '4',
      username: 'finance',
      fullName: 'Bùi Đình Tuấn',
      role: 'finance',
      email: 'finance@mwg.vn'
    }
  },
  manager: {
    password: 'mgr123',
    user: {
      id: '5',
      username: 'manager',
      fullName: 'Lê Việt Cường',
      role: 'manager',
      email: 'manager@mwg.vn'
    }
  }
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    // Check if user is stored in localStorage
    const storedUser = localStorage.getItem('scm_user');
    return storedUser ? JSON.parse(storedUser) : null;
  });

  const login = async (username: string, password: string): Promise<{ success: boolean; error?: string }> => {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 500));

    const userCredentials = mockUsers[username.toLowerCase()];
    
    if (!userCredentials) {
      return { success: false, error: 'Tên đăng nhập không tồn tại' };
    }

    if (userCredentials.password !== password) {
      return { success: false, error: 'Mật khẩu không chính xác' };
    }

    // Login successful
    setUser(userCredentials.user);
    localStorage.setItem('scm_user', JSON.stringify(userCredentials.user));
    return { success: true };
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('scm_user');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

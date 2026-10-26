import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, UserRole } from '../types';
import { storage } from '../services/storage';

interface AuthContextType {
  currentUser: User | null;
  role: UserRole;
  isTeacher: boolean;
  isAssistant: boolean;
  isTeacherOrAssistant: boolean;
  isStudent: boolean;
  isParent: boolean;
  isAdmin: boolean;
  login: (email: string, password?: string) => { success: boolean; error?: string };
  register: (params: {
    name: string;
    email: string;
    role: UserRole;
    phone?: string;
    subject?: string;
    grade?: string;
    school?: string;
  }) => { success: boolean; error?: string };
  logout: () => void;
  switchUser: (user: User) => void;
  switchRoleQuick: (role: UserRole) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(() => storage.getCurrentUser());

  useEffect(() => {
    const unsubscribe = storage.subscribe(() => {
      const u = storage.getCurrentUser();
      setCurrentUser(u);
    });
    return unsubscribe;
  }, []);

  const login = (email: string, _password?: string) => {
    const res = storage.loginUser(email);
    if (res.success && res.user) {
      setCurrentUser(res.user);
      return { success: true };
    }
    return { success: false, error: res.error || 'فشل تسجيل الدخول' };
  };

  const register = (params: {
    name: string;
    email: string;
    role: UserRole;
    phone?: string;
    subject?: string;
    grade?: string;
    school?: string;
  }) => {
    const res = storage.registerUser(params);
    if (res.success && res.user) {
      setCurrentUser(res.user);
      return { success: true };
    }
    return { success: false, error: res.error || 'فشل إنشاء الحساب' };
  };

  const logout = () => {
    storage.setCurrentUser(null);
    setCurrentUser(null);
  };

  const switchUser = (user: User) => {
    storage.setCurrentUser(user);
    setCurrentUser(user);
  };

  const switchRoleQuick = (targetRole: UserRole) => {
    const users = storage.getUsers();
    const found = users.find((u) => u.role === targetRole && u.status === 'active');
    if (found) {
      switchUser(found);
    }
  };

  const role = currentUser?.role || 'teacher';

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        role,
        isTeacher: role === 'teacher',
        isAssistant: role === 'assistant',
        isTeacherOrAssistant: role === 'teacher' || role === 'assistant',
        isStudent: role === 'student',
        isParent: role === 'parent',
        isAdmin: role === 'admin',
        login,
        register,
        logout,
        switchUser,
        switchRoleQuick,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

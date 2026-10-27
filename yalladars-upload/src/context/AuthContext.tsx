import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { storage } from '../services/storage';
import { syncEngine } from '../services/syncEngine';

interface AuthContextType {
  currentUser: User | null;
  role: UserRole;
  isDemoMode: boolean;
  canUseDemoMode: boolean;
  setIsDemoMode: (enabled: boolean) => void;
  login: (
    email: string,
    password?: string,
    isDemoQuickLogin?: boolean
  ) => Promise<{ success: boolean; error?: string }>;
  register: (params: {
    name: string;
    email: string;
    password?: string;
    role: UserRole;
    phone?: string;
    subject?: string;
    city?: string;
    grade?: string;
    school?: string;
  }) => Promise<{ success: boolean; error?: string }>;
  changePassword: (
    currentPassword: string,
    newPassword: string
  ) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  switchRoleQuick: (role: UserRole) => Promise<void>;
  switchUser: (user: User) => Promise<void>;
  isTeacher: boolean;
  isAssistant: boolean;
  isTeacherOrAssistant: boolean;
  isStudent: boolean;
  isParent: boolean;
  isAdmin: boolean;
}

const DEMO_MODE_KEY = 'yd_demo_mode_enabled_v2';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const canUseDemoMode =
    typeof import.meta !== 'undefined' && import.meta.env
      ? import.meta.env.VITE_ENABLE_DEMO_MODE !== 'false'
      : true;

  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const storedUser = storage.getCurrentUser();
    const token = syncEngine.getAuthToken();
    if (!storedUser || !token) {
      return null;
    }
    return storedUser;
  });

  const [isDemoMode, setIsDemoModeState] = useState<boolean>(() => {
    if (!canUseDemoMode) return false;
    try {
      return localStorage.getItem(DEMO_MODE_KEY) === 'true';
    } catch {
      return false;
    }
  });

  const setIsDemoMode = (enabled: boolean) => {
    const allowed = canUseDemoMode ? enabled : false;
    setIsDemoModeState(allowed);
    try {
      localStorage.setItem(DEMO_MODE_KEY, allowed ? 'true' : 'false');
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    const unsubscribe = storage.subscribe(() => {
      const latest = storage.getCurrentUser();
      setCurrentUser(latest);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const storedUser = storage.getCurrentUser();
    const token = syncEngine.getAuthToken();

    if (!storedUser || !token) {
      if (storedUser && !token) {
        storage.setCurrentUser(null);
      }
      setCurrentUser(null);
      return;
    }

    // Verify existing JWT session with server when online
    fetch('/api/auth/me', {
      method: 'GET',
      headers: syncEngine.getAuthHeaders(),
    })
      .then(async (res) => {
        if (res.status === 401 || res.status === 403) {
          storage.setCurrentUser(null);
          syncEngine.setAuthToken(null);
          setCurrentUser(null);
          return;
        }
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.user) {
            storage.setCurrentUser(data.user);
            setCurrentUser(data.user);
            syncEngine.syncNow();
          }
        }
      })
      .catch(() => {
        // Offline: keep existing valid local session
      });
  }, []);

  const login = async (
    email: string,
    password?: string,
    isDemoQuickLogin = false
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, isDemoQuickLogin }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        return { success: false, error: data.error || 'خطأ في تسجيل الدخول' };
      }

      if (data.token && data.user) {
        syncEngine.setAuthToken(data.token);
        storage.setCurrentUser(data.user);
        setCurrentUser(data.user);
        await syncEngine.syncNow();
        return { success: true };
      }
      return { success: false, error: 'استجابة غير صالحة من الخادم' };
    } catch {
      // Offline fallback only when server is unreachable
      const localRes = storage.loginUser(email, password, isDemoQuickLogin);
      if (localRes.success && localRes.user) {
        setCurrentUser(localRes.user);
      }
      return { success: localRes.success, error: localRes.error };
    }
  };

  const register = async (params: {
    name: string;
    email: string;
    password?: string;
    role: UserRole;
    phone?: string;
    subject?: string;
    city?: string;
    grade?: string;
    school?: string;
  }): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        return { success: false, error: data.error || 'خطأ في إنشاء الحساب' };
      }

      if (data.token && data.user) {
        syncEngine.setAuthToken(data.token);
        // Save locally with canonical server id and linkingCode
        storage.registerUser({
          ...params,
          id: data.user.id,
          linkingCode: data.linkingCode,
        });
        storage.setCurrentUser(data.user);
        setCurrentUser(data.user);
        await syncEngine.syncNow();
        return { success: true };
      }
      return { success: false, error: 'استجابة غير صالحة من الخادم' };
    } catch {
      // Offline fallback only when server is unreachable
      syncEngine.setAuthToken(null);
      const localRes = storage.registerUser(params);
      if (localRes.success && localRes.user) {
        setCurrentUser(localRes.user);
      }
      return { success: localRes.success, error: localRes.error };
    }
  };

  const changePassword = async (
    currentPassword: string,
    newPassword: string
  ): Promise<{ success: boolean; error?: string }> => {
    if (!currentUser) {
      return { success: false, error: 'يجب تسجيل الدخول أولاً' };
    }

    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: syncEngine.getAuthHeaders(),
        body: JSON.stringify({
          userId: currentUser.id,
          currentPassword,
          newPassword,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        return { success: false, error: data.error || 'فشل تغيير كلمة المرور' };
      }
      storage.changeUserPassword(currentUser.id, '', newPassword);
      return { success: true };
    } catch {
      return storage.changeUserPassword(currentUser.id, currentPassword, newPassword);
    }
  };

  const logout = () => {
    storage.setCurrentUser(null);
    syncEngine.setAuthToken(null);
    setCurrentUser(null);
  };

  const switchRoleQuick = async (targetRole: UserRole) => {
    if (!canUseDemoMode) return;
    const demoEmailsByRole: Record<UserRole, string> = {
      teacher: 'teacher@yalladars.com',
      assistant: 'assistant@yalladars.com',
      student: 'student@yalladars.com',
      parent: 'hamdi@yalladars.com',
      admin: 'admin@yalladars.com',
    };
    const targetEmail = demoEmailsByRole[targetRole];
    if (targetEmail) {
      await login(targetEmail, undefined, true);
    }
  };

  const switchUser = async (user: User) => {
    if (!canUseDemoMode) return;
    await login(user.email, undefined, true);
  };

  const role: UserRole = currentUser?.role || 'teacher';

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        role,
        isDemoMode,
        canUseDemoMode,
        setIsDemoMode,
        login,
        register,
        changePassword,
        logout,
        switchRoleQuick,
        switchUser,
        isTeacher: Boolean(currentUser && role === 'teacher'),
        isAssistant: Boolean(currentUser && role === 'assistant'),
        isTeacherOrAssistant: Boolean(currentUser && (role === 'teacher' || role === 'assistant')),
        isStudent: Boolean(currentUser && role === 'student'),
        isParent: Boolean(currentUser && role === 'parent'),
        isAdmin: Boolean(currentUser && role === 'admin'),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
};

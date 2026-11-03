import React, { createContext, useContext, useState } from 'react';
import { apiService } from '../services/api';
import { mockUsers } from '../data/mock';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  // Akun default login awal: Super Admin (untuk kemudahan demonstrasi akses penuh)
  const [currentUser, setCurrentUser] = useState(() => {
    return mockUsers.find((u) => u.role === 'super_admin') || mockUsers[0];
  });
  const [isAuthenticated, setIsAuthenticated] = useState(true);

  const login = async (username, password) => {
    try {
      const res = await apiService.login(username, password);
      if (res.success) {
        setCurrentUser(res.user);
        setIsAuthenticated(true);
        return { success: true, user: res.user };
      }
      return { success: false, message: 'Gagal melakukan login.' };
    } catch (err) {
      return { success: false, message: err.message };
    }
  };

  const register = async (payload) => {
    try {
      const res = await apiService.register(payload);
      if (res.success) {
        return { success: true, user: res.user, message: res.message };
      }
      return { success: false, message: 'Gagal melakukan registrasi.' };
    } catch (err) {
      return { success: false, message: err.message };
    }
  };

  const logout = () => {
    setIsAuthenticated(false);
    setCurrentUser(null);
  };

  /**
   * Cepat berganti peran (khusus demonstrasi tugas kuliah / presentasi)
   * @param {'super_admin'|'admin'|'user'} roleKey
   */
  const switchDemoRole = (roleKey) => {
    const target = mockUsers.find((u) => u.role === roleKey);
    if (target) {
      setCurrentUser(target);
      setIsAuthenticated(true);
    }
  };

  const isRole = (allowedRoles) => {
    if (!currentUser) return false;
    // Super Admin otomatis memiliki akses ke semua peran
    if (currentUser.role === 'super_admin') return true;

    if (Array.isArray(allowedRoles)) {
      return allowedRoles.includes(currentUser.role);
    }
    return currentUser.role === allowedRoles;
  };

  // Helper flags hak akses hierarkis
  const isSuperAdmin = currentUser?.role === 'super_admin';
  const isAdmin = currentUser?.role === 'admin' || isSuperAdmin;
  const isUser = currentUser?.role === 'user';
  const canModifyEverything = isSuperAdmin; // Super admin dapat mengubah SEMUA yang ada di website

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isAuthenticated,
        login,
        register,
        logout,
        switchDemoRole,
        isRole,
        role: currentUser?.role,
        isSuperAdmin,
        isAdmin,
        isUser,
        canModifyEverything,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

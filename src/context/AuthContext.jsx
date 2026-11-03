import React, { createContext, useContext, useState } from 'react';
import { mockUsers } from '../data/mock';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  // Akun default login awal: Bendahara (untuk melihat dashboard dan verifikasi kasir)
  const [currentUser, setCurrentUser] = useState(() => {
    return mockUsers.find((u) => u.role === 'bendahara') || mockUsers[0];
  });
  const [isAuthenticated, setIsAuthenticated] = useState(true);

  const login = (username, password) => {
    const user = mockUsers.find((u) => u.username.toLowerCase() === username.toLowerCase());
    if (user) {
      setCurrentUser(user);
      setIsAuthenticated(true);
      return { success: true, user };
    }
    return { success: false, message: 'Username atau password salah (Gunakan admin, bendahara, kepsek, atau ortu).' };
  };

  const logout = () => {
    setIsAuthenticated(false);
    setCurrentUser(null);
  };

  /**
   * Cepat berganti peran (khusus demonstrasi tugas kuliah / presentasi)
   * @param {'admin'|'bendahara'|'kepala_sekolah'|'orang_tua'} roleKey
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
    if (Array.isArray(allowedRoles)) {
      return allowedRoles.includes(currentUser.role);
    }
    return currentUser.role === allowedRoles;
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isAuthenticated,
        login,
        logout,
        switchDemoRole,
        isRole,
        role: currentUser?.role,
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


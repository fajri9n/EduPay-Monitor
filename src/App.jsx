import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { DataProvider } from './context/DataContext';

import AppLayout from './components/layout/AppLayout';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Overdue from './pages/Overdue';
import Bills from './pages/Bills';
import Transactions from './pages/Transactions';
import CashReports from './pages/CashReports';
import Budget from './pages/Budget';
import Notifications from './pages/Notifications';
import Users from './pages/Users';
import Students from './pages/Students';
import SystemSettings from './pages/SystemSettings';

// Route Guard dengan Privilege Super Admin
function ProtectedRoute({ children, allowedRoles }) {
  const { isAuthenticated, currentUser } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Super Admin memiliki akses mutlak ke SEMUA halaman
  if (currentUser?.role === 'super_admin') {
    return children;
  }

  if (allowedRoles && !allowedRoles.includes(currentUser?.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <DataProvider>
          <BrowserRouter>
            <Routes>
              {/* Public Routes: Login & Register */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />

              {/* Protected App Routes */}
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <AppLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<Dashboard />} />
                <Route
                  path="overdue"
                  element={
                    <ProtectedRoute allowedRoles={['admin', 'super_admin']}>
                      <Overdue />
                    </ProtectedRoute>
                  }
                />
                <Route path="bills" element={<Bills />} />
                <Route
                  path="students"
                  element={
                    <ProtectedRoute allowedRoles={['admin', 'super_admin']}>
                      <Students />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="transactions"
                  element={
                    <ProtectedRoute allowedRoles={['admin', 'super_admin']}>
                      <Transactions />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="cash-reports"
                  element={
                    <ProtectedRoute allowedRoles={['admin', 'super_admin']}>
                      <CashReports />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="budget"
                  element={
                    <ProtectedRoute allowedRoles={['admin', 'super_admin']}>
                      <Budget />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="notifications"
                  element={
                    <ProtectedRoute allowedRoles={['admin', 'super_admin']}>
                      <Notifications />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="users"
                  element={
                    <ProtectedRoute allowedRoles={['admin', 'super_admin']}>
                      <Users />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="settings"
                  element={
                    <ProtectedRoute allowedRoles={['super_admin']}>
                      <SystemSettings />
                    </ProtectedRoute>
                  }
                />
              </Route>

              {/* Catch-all */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        </DataProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

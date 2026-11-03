import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  AlertTriangle,
  Receipt,
  ArrowLeftRight,
  TrendingUp,
  PieChart,
  BellRing,
  Users,
  GraduationCap,
  ChevronLeft,
  ChevronRight,
  X
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';

export default function Sidebar({
  isCollapsed,
  setIsCollapsed,
  mobileOpen,
  setMobileOpen
}) {
  const { currentUser, isRole } = useAuth();
  const { overdueCount } = useData();

  // Definisi navigasi dengan batasan otorisasi peran
  const navigationItems = [
    {
      name: 'Dashboard Utama',
      path: '/',
      icon: LayoutDashboard,
      allowedRoles: ['admin', 'bendahara', 'kepala_sekolah', 'orang_tua'],
    },
    {
      name: 'Overdue Tracking',
      path: '/overdue',
      icon: AlertTriangle,
      badge: overdueCount > 0 ? overdueCount : null,
      badgeColor: 'bg-rose-500 text-white',
      allowedRoles: ['admin', 'bendahara', 'kepala_sekolah'],
    },
    {
      name: 'Tagihan Siswa',
      path: '/bills',
      icon: Receipt,
      allowedRoles: ['admin', 'bendahara', 'kepala_sekolah', 'orang_tua'],
    },
    {
      name: 'Transaksi & Verifikasi',
      path: '/transactions',
      icon: ArrowLeftRight,
      allowedRoles: ['admin', 'bendahara', 'kepala_sekolah'],
    },
    {
      name: 'Laporan Kas',
      path: '/cash-reports',
      icon: TrendingUp,
      allowedRoles: ['admin', 'bendahara', 'kepala_sekolah'],
    },
    {
      name: 'Monitoring Anggaran',
      path: '/budget',
      icon: PieChart,
      allowedRoles: ['admin', 'bendahara', 'kepala_sekolah'],
    },
    {
      name: 'Log Notifikasi',
      path: '/notifications',
      icon: BellRing,
      allowedRoles: ['admin', 'bendahara', 'kepala_sekolah'],
    },
    {
      name: 'Manajemen User',
      path: '/users',
      icon: Users,
      allowedRoles: ['admin'],
    },
  ];

  const filteredItems = navigationItems.filter((item) =>
    item.allowedRoles.includes(currentUser?.role || 'bendahara')
  );

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-xs lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 flex flex-col bg-slate-900 text-slate-200 transition-all duration-300 ease-in-out border-r border-slate-800 ${
          mobileOpen ? 'translate-x-0 w-64' : '-translate-x-full lg:translate-x-0'
        } ${isCollapsed ? 'lg:w-20' : 'lg:w-64'}`}
      >
        {/* Header / Brand */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-slate-800/80">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-teal-400 flex items-center justify-center text-white shadow-md shadow-indigo-500/20 shrink-0">
              <GraduationCap className="w-6 h-6" />
            </div>
            {!isCollapsed && (
              <div className="flex flex-col min-w-0">
                <span className="font-bold text-base tracking-tight text-white truncate">
                  EduPay <span className="text-teal-400 font-extrabold">Monitor</span>
                </span>
                <span className="text-[10px] text-slate-400 truncate">Sistem Keuangan Kampus/Sekolah</span>
              </div>
            )}
          </div>

          {/* Close button on mobile */}
          <button
            onClick={() => setMobileOpen(false)}
            className="lg:hidden p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
          {filteredItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-sm transition-all group relative ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30 font-semibold'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/70'
                  }`
                }
              >
                <Icon className={`w-5 h-5 shrink-0 transition-transform group-hover:scale-105`} />
                {!isCollapsed && <span className="truncate flex-1">{item.name}</span>}

                {/* Badge (Misal Overdue count) */}
                {item.badge && !isCollapsed && (
                  <span
                    className={`ml-auto px-2 py-0.5 rounded-full text-xs font-bold shrink-0 ${item.badgeColor}`}
                  >
                    {item.badge}
                  </span>
                )}

                {/* Tooltip on collapsed desktop */}
                {isCollapsed && (
                  <div className="hidden lg:group-hover:block fixed left-20 ml-2 px-3 py-1.5 bg-slate-800 text-white text-xs rounded-md shadow-lg z-50 whitespace-nowrap border border-slate-700 pointer-events-none">
                    {item.name}
                    {item.badge && ` (${item.badge})`}
                  </div>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Footer Sidebar / Collapse Toggle */}
        <div className="p-3 border-t border-slate-800/80 hidden lg:flex items-center justify-between">
          {!isCollapsed && (
            <div className="text-[11px] text-slate-500 font-mono">
              v1.0 • TA 2026/2027
            </div>
          )}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className={`p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors ${
              isCollapsed ? 'mx-auto' : ''
            }`}
            aria-label={isCollapsed ? 'Perlebar Sidebar' : 'Ciutkan Sidebar'}
          >
            {isCollapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
          </button>
        </div>
      </aside>
    </>
  );
}


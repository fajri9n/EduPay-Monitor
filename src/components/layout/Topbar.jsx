import React, { useState, useRef, useEffect } from 'react';
import {
  Menu,
  Search,
  Bell,
  Sun,
  Moon,
  LogOut,
  ShieldCheck,
  ChevronDown,
  AlertTriangle,
  Clock,
  UserCheck
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useData } from '../../context/DataContext';
import { Link, useNavigate } from 'react-router-dom';

export default function Topbar({ setMobileOpen }) {
  const { currentUser, switchDemoRole, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const { overdueCount, transactions } = useData();
  const navigate = useNavigate();

  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  const roleRef = useRef();
  const notifRef = useRef();
  const profileRef = useRef();

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (roleRef.current && !roleRef.current.contains(event.target)) {
        setRoleDropdownOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setNotifDropdownOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setProfileDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const pendingCount = transactions.filter((t) => t.verification_status === 'Pending').length;

  const handleRoleChange = (newRole) => {
    switchDemoRole(newRole);
    setRoleDropdownOpen(false);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-30 h-16 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors">
      <div className="h-full px-4 sm:px-6 flex items-center justify-between gap-4">
        {/* Left Side: Mobile Menu & Global Search */}
        <div className="flex items-center gap-3 flex-1 max-w-lg">
          <button
            onClick={() => setMobileOpen(true)}
            className="lg:hidden p-2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
            aria-label="Buka Menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="relative w-full hidden sm:block">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Cari siswa, NIS, atau nomor tagihan..."
              className="w-full pl-9 pr-4 py-2 text-sm bg-slate-100/80 dark:bg-slate-800/80 border-0 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
            />
          </div>
        </div>

        {/* Right Side: Demo Role Switcher, Alerts, Theme, Profile */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Quick Demo Role Switcher (Sangat berguna untuk Presentasi Tugas Kuliah) */}
          <div className="relative" ref={roleRef}>
            <button
              onClick={() => setRoleDropdownOpen(!roleDropdownOpen)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors"
              title="Ganti Peran Demo Langsung"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              <span className="hidden md:inline">Peran:</span>
              <span className="capitalize">{currentUser?.role?.replace('_', ' ')}</span>
              <ChevronDown className="w-3 h-3 ml-0.5" />
            </button>

            {roleDropdownOpen && (
              <div className="absolute right-0 mt-2 w-52 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 py-1.5 z-50 animate-fade-in">
                <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 dark:border-slate-800">
                  Pilih Peran Demo
                </div>
                {[
                  { role: 'admin', label: 'Admin (Konfigurasi & User)' },
                  { role: 'bendahara', label: 'Bendahara (Verifikasi & Kas)' },
                  { role: 'kepala_sekolah', label: 'Kepala Sekolah (Eksekutif)' },
                  { role: 'orang_tua', label: 'Orang Tua (Budi Pratama - X-A)' },
                ].map((item) => (
                  <button
                    key={item.role}
                    onClick={() => handleRoleChange(item.role)}
                    className={`w-full text-left px-3.5 py-2 text-xs flex items-center justify-between transition-colors ${
                      currentUser?.role === item.role
                        ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300 font-semibold'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    <span>{item.label}</span>
                    {currentUser?.role === item.role && <UserCheck className="w-3.5 h-3.5" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Notifikasi Overdue & Pending */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => setNotifDropdownOpen(!notifDropdownOpen)}
              className="relative p-2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              aria-label="Pusat Notifikasi"
            >
              <Bell className="w-5 h-5" />
              {overdueCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-rose-500 rounded-full ring-2 ring-white dark:ring-slate-900 animate-pulse" />
              )}
            </button>

            {notifDropdownOpen && (
              <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 p-2 z-50">
                <div className="p-2 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <span className="font-semibold text-xs text-slate-900 dark:text-slate-100">
                    Notifikasi Sistem
                  </span>
                  <span className="text-[10px] bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full text-slate-500">
                    Hari ini: 03 Nov 2026
                  </span>
                </div>

                <div className="py-2 space-y-1.5">
                  {overdueCount > 0 && (
                    <Link
                      to="/overdue"
                      onClick={() => setNotifDropdownOpen(false)}
                      className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                    >
                      <div className="p-1.5 rounded-lg bg-rose-100 dark:bg-rose-900/40 text-rose-600 dark:text-rose-400 shrink-0">
                        <AlertTriangle className="w-4 h-4" />
                      </div>
                      <div className="text-xs">
                        <p className="font-semibold text-rose-900 dark:text-rose-300">
                          {overdueCount} Tagihan Jatuh Tempo (Overdue)
                        </p>
                        <p className="text-slate-500 dark:text-slate-400 text-[11px] mt-0.5">
                          Memerlukan pengiriman pengingat ke wali siswa.
                        </p>
                      </div>
                    </Link>
                  )}

                  {pendingCount > 0 && (
                    <Link
                      to="/transactions"
                      onClick={() => setNotifDropdownOpen(false)}
                      className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-amber-50 dark:hover:bg-amber-950/30 transition-colors"
                    >
                      <div className="p-1.5 rounded-lg bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 shrink-0">
                        <Clock className="w-4 h-4" />
                      </div>
                      <div className="text-xs">
                        <p className="font-semibold text-amber-900 dark:text-amber-300">
                          {pendingCount} Transaksi Menunggu Verifikasi
                        </p>
                        <p className="text-slate-500 dark:text-slate-400 text-[11px] mt-0.5">
                          Menunggu persetujuan bukti bayar dari bendahara.
                        </p>
                      </div>
                    </Link>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Dark / Light Mode Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label={isDark ? 'Beralih ke Mode Terang' : 'Beralih ke Mode Gelap'}
          >
            {isDark ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-slate-600" />}
          </button>

          {/* User Profile Avatar & Menu */}
          <div className="relative" ref={profileRef}>
            <button
              onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
              className="flex items-center gap-2.5 pl-1.5 pr-2 py-1 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <img
                src={currentUser?.avatar || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=120&auto=format&fit=crop&q=80'}
                alt={currentUser?.nama_lengkap}
                className="w-8 h-8 rounded-full object-cover ring-2 ring-indigo-500/20"
              />
              <div className="hidden sm:block text-left">
                <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 leading-tight">
                  {currentUser?.nama_lengkap?.split(' ')[0]}
                </p>
                <p className="text-[10px] text-slate-400 dark:text-slate-400 capitalize">
                  {currentUser?.role_name || currentUser?.role}
                </p>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
            </button>

            {profileDropdownOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 p-3 z-50">
                <div className="flex items-center gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                  <img
                    src={currentUser?.avatar}
                    alt={currentUser?.nama_lengkap}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
                      {currentUser?.nama_lengkap}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                      {currentUser?.email}
                    </p>
                    <span className="inline-block mt-1 px-2 py-0.5 text-[10px] font-medium rounded-full bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                      {currentUser?.role_name}
                    </span>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    Keluar dari Sistem
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}


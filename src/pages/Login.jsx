import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  GraduationCap,
  ShieldCheck,
  UserCheck,
  Lock,
  User,
  ArrowRight,
  AlertCircle,
  Eye,
  EyeOff
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Button from '../components/ui/Button';

export default function Login() {
  const navigate = useNavigate();
  const { login, switchDemoRole } = useAuth();

  const [username, setUsername] = useState('bendahara');
  const [password, setPassword] = useState('password123');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    setTimeout(() => {
      const res = login(username, password);
      setLoading(false);
      if (res.success) {
        navigate('/');
      } else {
        setError(res.message);
      }
    }, 200);
  };

  const handleQuickDemo = (roleKey, defaultUsername) => {
    setUsername(defaultUsername);
    setPassword('password123');
    switchDemoRole(roleKey);
    navigate('/');
  };

  const demoRoles = [
    {
      role: 'admin',
      username: 'admin',
      title: 'Admin Sistem',
      desc: 'Konfigurasi penuh, audit log & manajemen user',
      color: 'border-purple-200 dark:border-purple-900 bg-purple-50/50 dark:bg-purple-950/20 text-purple-700 dark:text-purple-300',
    },
    {
      role: 'bendahara',
      username: 'bendahara',
      title: 'Bendahara Sekolah',
      desc: 'Verifikasi kasir, catat transaksi & rekap kas',
      color: 'border-indigo-200 dark:border-indigo-900 bg-indigo-50/50 dark:bg-indigo-950/20 text-indigo-700 dark:text-indigo-300',
    },
    {
      role: 'kepala_sekolah',
      username: 'kepsek',
      title: 'Kepala Sekolah',
      desc: 'Monitoring eksekutif penerimaan & anggaran',
      color: 'border-teal-200 dark:border-teal-900 bg-teal-50/50 dark:bg-teal-950/20 text-teal-700 dark:text-teal-300',
    },
    {
      role: 'orang_tua',
      username: 'ortu',
      title: 'Orang Tua Siswa',
      desc: 'Portal wali siswa an. Budi Pratama (X-A)',
      color: 'border-amber-200 dark:border-amber-900 bg-amber-50/50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-300',
    },
  ];

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-gradient-to-b from-indigo-600/20 via-teal-500/10 to-transparent blur-3xl pointer-events-none" />

      {/* Brand Header */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center z-10">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 to-teal-400 text-white shadow-xl shadow-indigo-500/30 mb-4">
          <GraduationCap className="w-8 h-8" />
        </div>
        <h2 className="text-3xl font-extrabold tracking-tight text-white">
          EduPay <span className="text-teal-400">Monitor</span>
        </h2>
        <p className="mt-2 text-sm text-slate-400">
          Sistem Terintegrasi Monitoring Pembayaran SPP & Anggaran Institusi
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-xl z-10 px-4">
        <div className="bg-white dark:bg-slate-900/95 py-8 px-6 sm:px-10 shadow-2xl rounded-3xl border border-slate-200 dark:border-slate-800">
          {/* Form Login */}
          <form className="space-y-4" onSubmit={handleSubmit}>
            {error && (
              <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Username / Identitas Pengguna
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                  placeholder="Contoh: bendahara atau admin"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Kata Sandi
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-11 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                  placeholder="Masukkan kata sandi..."
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              loading={loading}
              className="w-full mt-2 py-2.5 text-sm font-semibold rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white shadow-lg shadow-indigo-600/30"
            >
              Masuk ke Dashboard
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </form>

          {/* Quick Demo Selector */}
          <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-indigo-500" />
                Akses Demo Cepat (1-Klik untuk Presentasi)
              </span>
              <span className="text-[10px] text-slate-400">Password: password123</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {demoRoles.map((d) => (
                <button
                  key={d.role}
                  type="button"
                  onClick={() => handleQuickDemo(d.role, d.username)}
                  className={`text-left p-3 rounded-xl border transition-all hover:scale-[1.02] hover:shadow-sm ${d.color}`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold">{d.title}</span>
                    <UserCheck className="w-3.5 h-3.5 opacity-70" />
                  </div>
                  <p className="text-[11px] opacity-80 mt-1 line-clamp-1">{d.desc}</p>
                  <div className="text-[10px] font-mono mt-1 opacity-60">user: {d.username}</div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Institusi Footer */}
        <p className="text-center text-xs text-slate-500 mt-6">
          SMA Nusantara Mandiri • Tahun Ajaran 2026/2027 • Asia/Jakarta
        </p>
      </div>
    </div>
  );
}


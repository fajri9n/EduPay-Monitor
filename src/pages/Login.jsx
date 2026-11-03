import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  GraduationCap,
  ShieldAlert,
  ShieldCheck,
  User,
  Lock,
  ArrowRight,
  AlertCircle,
  Eye,
  EyeOff,
  UserPlus,
  CheckCircle2,
  TrendingUp,
  Receipt,
  Sparkles,
  School
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import Button from '../components/ui/Button';

export default function Login() {
  const navigate = useNavigate();
  const { login, switchDemoRole } = useAuth();
  const { systemSettings } = useData();

  const [username, setUsername] = useState('superadmin');
  const [password, setPassword] = useState('password123');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await login(username, password);
      setLoading(false);
      if (res.success) {
        navigate('/');
      } else {
        setError(res.message);
      }
    } catch (err) {
      setLoading(false);
      setError(err.message || 'Gagal melakukan login.');
    }
  };

  const handleQuickDemo = async (roleKey, defaultUsername) => {
    setUsername(defaultUsername);
    setPassword('password123');
    switchDemoRole(roleKey);
    navigate('/');
  };

  const demoAccounts = [
    {
      role: 'super_admin',
      username: 'superadmin',
      title: 'Super Admin',
      badge: 'Akses Penuh Total',
      desc: 'Wewenang mutlak untuk mengubah SEMUA data, pengaturan institusi, kelola user & website.',
      badgeStyle: 'bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300 border-purple-300',
      cardStyle: 'border-purple-300 dark:border-purple-800 bg-purple-50/50 dark:bg-purple-950/30 hover:border-purple-500 hover:shadow-purple-500/10',
      icon: ShieldAlert,
      iconColor: 'text-purple-600 dark:text-purple-400',
    },
    {
      role: 'admin',
      username: 'admin',
      title: 'Admin',
      badge: 'Operasional',
      desc: 'Verifikasi kasir, catat transaksi bayar, rekap kas harian, dan monitoring anggaran.',
      badgeStyle: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300 border-indigo-300',
      cardStyle: 'border-indigo-300 dark:border-indigo-800 bg-indigo-50/50 dark:bg-indigo-950/30 hover:border-indigo-500 hover:shadow-indigo-500/10',
      icon: ShieldCheck,
      iconColor: 'text-indigo-600 dark:text-indigo-400',
    },
    {
      role: 'user',
      username: 'user',
      title: 'User',
      badge: 'Siswa / Wali',
      desc: 'Portal siswa & orang tua untuk cek rincian tagihan SPP pribadi dan histori cicilan.',
      badgeStyle: 'bg-teal-100 text-teal-700 dark:bg-teal-900/50 dark:text-teal-300 border-teal-300',
      cardStyle: 'border-teal-300 dark:border-teal-800 bg-teal-50/50 dark:bg-teal-950/30 hover:border-teal-500 hover:shadow-teal-500/10',
      icon: User,
      iconColor: 'text-teal-600 dark:text-teal-400',
    },
  ];

  const institutionName = systemSettings?.institutionName || 'SMA Nusantara Mandiri';
  const academicYear = systemSettings?.academicYear || '2026/2027';

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center relative overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute top-0 left-1/4 -translate-x-1/2 w-[800px] h-[500px] bg-gradient-to-br from-indigo-600/20 via-purple-600/15 to-transparent blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 translate-x-1/2 w-[700px] h-[400px] bg-gradient-to-tl from-teal-500/15 via-indigo-600/10 to-transparent blur-3xl pointer-events-none" />

      <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">

          {/* SISI KIRI: BRANDING & ROLE PRIVILEGE SHOWCASE */}
          <div className="lg:col-span-5 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-950 p-8 sm:p-10 text-white flex flex-col justify-between relative border-b lg:border-b-0 lg:border-r border-slate-800">
            {/* Top Brand */}
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-500 to-teal-400 flex items-center justify-center text-white shadow-lg shadow-indigo-500/30">
                  <GraduationCap className="w-7 h-7" />
                </div>
                <div>
                  <span className="font-extrabold text-xl tracking-tight text-white block">
                    EduPay <span className="text-teal-400">Monitor</span>
                  </span>
                  <span className="text-xs text-slate-400 flex items-center gap-1">
                    <School className="w-3 h-3 text-slate-400" />
                    {institutionName}
                  </span>
                </div>
              </div>

              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 text-xs font-semibold mb-4">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                Sistem Terintegrasi SPP & Anggaran
              </div>

              <h1 className="text-2xl sm:text-3xl font-extrabold leading-tight text-white mb-3">
                Monitoring Transaksi Pendidikan Lebih Akurat & Transparan
              </h1>
              <p className="text-sm text-slate-300 leading-relaxed mb-6">
                Platform cerdas untuk memantau status kelunasan siswa, peringatan otomatis tagihan overdue, dan realisasi anggaran operasional institusi.
              </p>

              {/* Feature Highlights */}
              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10">
                  <div className="p-2 rounded-lg bg-purple-500/20 text-purple-300">
                    <ShieldAlert className="w-4 h-4" />
                  </div>
                  <div className="text-xs">
                    <p className="font-bold text-white">Super Admin Full Control</p>
                    <p className="text-slate-400 text-[11px]">Dapat mengubah semua konfigurasi institusi & data website.</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10">
                  <div className="p-2 rounded-lg bg-indigo-500/20 text-indigo-300">
                    <Receipt className="w-4 h-4" />
                  </div>
                  <div className="text-xs">
                    <p className="font-bold text-white">Overdue Tracking Real-time</p>
                    <p className="text-slate-400 text-[11px]">Deteksi keterlambatan H-7, H-3, H-1 & kirim pesan otomatis.</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10">
                  <div className="p-2 rounded-lg bg-teal-500/20 text-teal-300">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                  <div className="text-xs">
                    <p className="font-bold text-white">Rekapitulasi Kas & Anggaran</p>
                    <p className="text-slate-400 text-[11px]">Analisis penerimaan kas harian & penyerapan belanja operasional.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Meta */}
            <div className="pt-6 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
              <span>Tahun Ajaran {academicYear}</span>
              <span>WIB (Asia/Jakarta)</span>
            </div>
          </div>

          {/* SISI KANAN: FORM LOGIN & QUICK DEMO SELECTOR */}
          <div className="lg:col-span-7 p-8 sm:p-10 flex flex-col justify-between">
            <div>
              {/* Header Tab Pilihan: Masuk vs Daftar */}
              <div className="flex items-center justify-between pb-4 mb-6 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                  <button
                    type="button"
                    className="px-4 py-1.5 text-xs font-bold rounded-lg bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs"
                  >
                    Masuk (Login)
                  </button>
                  <Link
                    to="/register"
                    className="px-4 py-1.5 text-xs font-semibold rounded-lg text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
                  >
                    Daftar Akun Baru
                  </Link>
                </div>

                <Link
                  to="/register"
                  className="hidden sm:inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  Belum punya akun?
                </Link>
              </div>

              <div className="mb-6">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                  Selamat Datang Kembali
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                  Masukkan identitas pengguna Anda untuk mengakses sistem dashboard.
                </p>
              </div>

              {/* Form Input */}
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2.5 animate-shake">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                    Username
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium"
                      placeholder="Contoh: superadmin, admin, atau user"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                      Kata Sandi
                    </label>
                    <span className="text-[11px] text-slate-400">Default: password123</span>
                  </div>
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
                      aria-label="Tampilkan sandi"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs pt-1">
                  <label className="flex items-center gap-2 cursor-pointer text-slate-600 dark:text-slate-400 select-none">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="h-4 w-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 dark:border-slate-700"
                    />
                    Ingat sesi saya
                  </label>
                  <span className="text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 cursor-pointer">
                    Bantuan Akun
                  </span>
                </div>

                <Button
                  type="submit"
                  loading={loading}
                  size="lg"
                  className="w-full py-3 text-sm font-bold rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-700 to-teal-600 hover:opacity-95 text-white shadow-xl shadow-indigo-600/25 mt-2"
                >
                  Masuk ke Portal Dashboard
                  <ArrowRight className="w-4 h-4 ml-1.5" />
                </Button>
              </form>

              {/* QUICK DEMO SWITCHER CARDS (1-KLIK UNTUK PRESENTASI TUGAS KULIAH) */}
              <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-purple-500" />
                    Pilihan Peran Demo (1-Klik Langsung Masuk)
                  </span>
                  <span className="text-[11px] text-slate-400">Klik kartu untuk login</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {demoAccounts.map((d) => {
                    const Icon = d.icon;
                    return (
                      <div
                        key={d.role}
                        onClick={() => handleQuickDemo(d.role, d.username)}
                        className={`cursor-pointer p-3.5 rounded-2xl border transition-all hover:scale-[1.02] hover:shadow-md flex flex-col justify-between ${d.cardStyle}`}
                      >
                        <div>
                          <div className="flex items-center justify-between mb-1.5">
                            <Icon className={`w-4 h-4 ${d.iconColor}`} />
                            <span className={`text-[10px] px-2 py-0.5 rounded-md font-bold uppercase tracking-wider border ${d.badgeStyle}`}>
                              {d.badge}
                            </span>
                          </div>
                          <div className="text-xs font-bold text-slate-900 dark:text-white">{d.title}</div>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-2 leading-tight">
                            {d.desc}
                          </p>
                        </div>
                        <div className="text-[10px] font-mono mt-2 pt-1.5 border-t border-slate-200/60 dark:border-slate-800 flex items-center justify-between text-slate-500">
                          <span>user: {d.username}</span>
                          <span className="text-indigo-600 dark:text-indigo-400 font-bold">Masuk →</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Link Footer */}
            <div className="mt-6 pt-4 text-center text-xs text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800">
              Belum punya akun?{' '}
              <Link to="/register" className="font-bold text-indigo-600 dark:text-indigo-400 hover:underline">
                Daftar Akun Baru di sini
              </Link>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

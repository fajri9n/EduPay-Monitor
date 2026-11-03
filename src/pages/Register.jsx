import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  GraduationCap,
  ShieldAlert,
  ShieldCheck,
  User,
  Lock,
  Mail,
  Phone,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  ArrowRight,
  Sparkles,
  School,
  Sliders,
  Receipt,
  TrendingUp
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import Button from '../components/ui/Button';

export default function Register() {
  const navigate = useNavigate();
  const { register, login } = useAuth();
  const { systemSettings } = useData();

  const [formData, setFormData] = useState({
    nama_lengkap: '',
    username: '',
    email: '',
    phone: '',
    role: 'user', // default: user
    password: '',
    confirmPassword: '',
    termsAgreed: true,
  });

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const institutionName = systemSettings?.institutionName || 'SMA Nusantara Mandiri';
  const academicYear = systemSettings?.academicYear || '2026/2027';

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    setError('');
  };

  const handleRoleSelect = (roleKey) => {
    setFormData((prev) => ({ ...prev, role: roleKey }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    // Validasi Formulir
    if (!formData.nama_lengkap.trim() || !formData.username.trim() || !formData.email.trim()) {
      setError('Harap lengkapi semua kolom yang bertanda bintang (*).');
      return;
    }

    if (formData.username.length < 3) {
      setError('Username minimal harus 3 karakter.');
      return;
    }

    if (formData.password.length < 6) {
      setError('Kata sandi minimal harus 6 karakter.');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Konfirmasi kata sandi tidak cocok.');
      return;
    }

    if (!formData.termsAgreed) {
      setError('Anda harus menyetujui ketentuan layanan sistem.');
      return;
    }

    setLoading(true);

    try {
      const res = await register({
        nama_lengkap: formData.nama_lengkap,
        username: formData.username,
        email: formData.email,
        phone: formData.phone,
        role: formData.role,
        password: formData.password,
      });

      setLoading(false);

      if (res.success) {
        setSuccessMsg(res.message);
        // Otomatis langsung masuk dan redirect ke dashboard
        setTimeout(async () => {
          await login(formData.username, formData.password);
          navigate('/');
        }, 1200);
      } else {
        setError(res.message);
      }
    } catch (err) {
      setLoading(false);
      setError(err.message || 'Terjadi kesalahan saat pendaftaran.');
    }
  };

  const roleOptions = [
    {
      id: 'super_admin',
      title: 'Super Admin',
      badge: 'Akses Mutlak',
      badgeStyle: 'bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300 border-purple-300',
      activeStyle: 'border-purple-500 ring-2 ring-purple-500/30 bg-purple-50/70 dark:bg-purple-950/40',
      icon: ShieldAlert,
      iconColor: 'text-purple-600 dark:text-purple-400',
      desc: 'Wewenang penuh untuk mengubah SEMUA yang ada di website (Pengaturan institusi, rekening bank, toleransi overdue, dan manajemen user).',
    },
    {
      id: 'admin',
      title: 'Admin',
      badge: 'Operasional',
      badgeStyle: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300 border-indigo-300',
      activeStyle: 'border-indigo-500 ring-2 ring-indigo-500/30 bg-indigo-50/70 dark:bg-indigo-950/40',
      icon: ShieldCheck,
      iconColor: 'text-indigo-600 dark:text-indigo-400',
      desc: 'Pengelolaan operasional harian: verifikasi bukti bayar kasir, monitoring tagihan siswa, dan rekap penerimaan kas.',
    },
    {
      id: 'user',
      title: 'User',
      badge: 'Siswa / Ortu',
      badgeStyle: 'bg-teal-100 text-teal-700 dark:bg-teal-900/50 dark:text-teal-300 border-teal-300',
      activeStyle: 'border-teal-500 ring-2 ring-teal-500/30 bg-teal-50/70 dark:bg-teal-950/40',
      icon: User,
      iconColor: 'text-teal-600 dark:text-teal-400',
      desc: 'Akses portal siswa & wali untuk mengecek kewajiban tagihan SPP pribadi, riwayat pembayaran, dan upload bukti transfer.',
    },
  ];

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center relative overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute top-0 right-1/4 translate-x-1/2 w-[850px] h-[500px] bg-gradient-to-bl from-purple-600/20 via-indigo-600/15 to-transparent blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 -translate-x-1/2 w-[700px] h-[400px] bg-gradient-to-tr from-teal-500/15 via-indigo-600/10 to-transparent blur-3xl pointer-events-none" />

      <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">

          {/* SISI KIRI: BRANDING & ROLE EXPLANATION */}
          <div className="lg:col-span-5 bg-gradient-to-br from-slate-900 via-purple-950 to-slate-950 p-8 sm:p-10 text-white flex flex-col justify-between relative border-b lg:border-b-0 lg:border-r border-slate-800">
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

              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 border border-purple-400/30 text-xs font-semibold mb-4">
                <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                Registrasi Pengguna Multi-Role
              </div>

              <h1 className="text-2xl sm:text-3xl font-extrabold leading-tight text-white mb-3">
                Buat Akun Baru & Dapatkan Akses Sesuai Peran
              </h1>
              <p className="text-sm text-slate-300 leading-relaxed mb-6">
                Pilih peran yang Anda butuhkan untuk mencoba seluruh kemampuan sistem pengelolaan keuangan pendidikan ini.
              </p>

              {/* Rincian Wewenang 3 Peran */}
              <div className="space-y-3 mb-6">
                <div className="p-3.5 rounded-xl bg-purple-900/30 border border-purple-700/40">
                  <div className="flex items-center gap-2 mb-1">
                    <ShieldAlert className="w-4 h-4 text-purple-400" />
                    <span className="text-xs font-bold text-purple-200">Peran: Super Admin</span>
                  </div>
                  <p className="text-[11px] text-purple-200/80 leading-relaxed">
                    Memiliki hak akses mutlak untuk <b>mengubah SEMUA data & konfigurasi website</b>: nama sekolah, rekening bank, toleransi overdue, dan manajemen hak akses user.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-indigo-900/30 border border-indigo-700/40">
                  <div className="flex items-center gap-2 mb-1">
                    <ShieldCheck className="w-4 h-4 text-indigo-400" />
                    <span className="text-xs font-bold text-indigo-200">Peran: Admin</span>
                  </div>
                  <p className="text-[11px] text-indigo-200/80 leading-relaxed">
                    Operasional penuh: verifikasi transaksi pembayaran, ekspor laporan kas harian/bulanan, dan pengiriman notifikasi pengingat tunggakan.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-teal-900/30 border border-teal-700/40">
                  <div className="flex items-center gap-2 mb-1">
                    <User className="w-4 h-4 text-teal-400" />
                    <span className="text-xs font-bold text-teal-200">Peran: User (Siswa/Wali)</span>
                  </div>
                  <p className="text-[11px] text-teal-200/80 leading-relaxed">
                    Portal terfokus bagi siswa dan orang tua untuk melihat sisa tagihan SPP pribadi, batas waktu jatuh tempo, dan riwayat cicilan.
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
              <span>Tahun Ajaran {academicYear}</span>
              <span>Zona Waktu Asia/Jakarta</span>
            </div>
          </div>

          {/* SISI KANAN: FORM REGISTRASI LENGKAP */}
          <div className="lg:col-span-7 p-8 sm:p-10 flex flex-col justify-between">
            <div>
              {/* Header Tab Pilihan */}
              <div className="flex items-center justify-between pb-4 mb-6 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                  <Link
                    to="/login"
                    className="px-4 py-1.5 text-xs font-semibold rounded-lg text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
                  >
                    Masuk (Login)
                  </Link>
                  <button
                    type="button"
                    className="px-4 py-1.5 text-xs font-bold rounded-lg bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs"
                  >
                    Daftar Akun Baru
                  </button>
                </div>

                <Link
                  to="/login"
                  className="hidden sm:inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
                >
                  Sudah punya akun? Masuk
                </Link>
              </div>

              <div className="mb-5">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                  Formulir Pendaftaran
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                  Pilih peran dan isi biodata Anda di bawah untuk membuat akun baru.
                </p>
              </div>

              {/* Feedback Alerts */}
              {error && (
                <div className="mb-4 p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2.5 animate-shake">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {successMsg && (
                <div className="mb-4 p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2.5">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                  <div>
                    <p className="font-bold">{successMsg}</p>
                    <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-0.5">
                      Mengalihkan otomatis ke sistem dashboard...
                    </p>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* 1. PEMILIH PERAN (ROLE) DENGAN KARTU INTERAKTIF */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
                    Pilih Peran Akun yang Didaftarkan <span className="text-rose-500">*</span>
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    {roleOptions.map((opt) => {
                      const Icon = opt.icon;
                      const isSelected = formData.role === opt.id;
                      return (
                        <div
                          key={opt.id}
                          onClick={() => handleRoleSelect(opt.id)}
                          className={`cursor-pointer p-3 rounded-2xl border transition-all select-none relative flex flex-col justify-between ${
                            isSelected
                              ? opt.activeStyle
                              : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50/50 dark:bg-slate-850'
                          }`}
                        >
                          <div>
                            <div className="flex items-center justify-between mb-1.5">
                              <div className="flex items-center gap-1.5">
                                <Icon className={`w-4 h-4 ${opt.iconColor}`} />
                                <span className="font-bold text-xs text-slate-900 dark:text-white">
                                  {opt.title}
                                </span>
                              </div>
                              {isSelected && (
                                <CheckCircle2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                              )}
                            </div>
                            <span className={`inline-block px-1.5 py-0.2 rounded text-[9px] font-bold uppercase tracking-wider border mb-1.5 ${opt.badgeStyle}`}>
                              {opt.badge}
                            </span>
                            <p className="text-[10px] text-slate-500 dark:text-slate-400 line-clamp-2 leading-tight">
                              {opt.desc}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 2. NAMA LENGKAP & USERNAME */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                      Nama Lengkap <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        required
                        name="nama_lengkap"
                        value={formData.nama_lengkap}
                        onChange={handleChange}
                        placeholder="Contoh: Muhammad Fajri"
                        className="w-full pl-10 pr-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                      Username <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <span className="text-xs font-mono text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2">@</span>
                      <input
                        type="text"
                        required
                        name="username"
                        value={formData.username}
                        onChange={handleChange}
                        placeholder="username_anda"
                        className="w-full pl-8 pr-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </div>
                </div>

                {/* 3. EMAIL & NO WHATSAPP */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                      Alamat Email <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="email"
                        required
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="nama@email.com"
                        className="w-full pl-10 pr-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                      Nomor WhatsApp / HP
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        placeholder="081234567890"
                        className="w-full pl-10 pr-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </div>
                </div>

                {/* 4. PASSWORD & KONFIRMASI */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                      Kata Sandi <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        placeholder="Min. 6 karakter"
                        className="w-full pl-10 pr-10 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                      Ulangi Kata Sandi <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        placeholder="Ketik ulang kata sandi"
                        className="w-full pl-10 pr-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Checkbox Ketentuan */}
                <div className="flex items-start gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="terms"
                    name="termsAgreed"
                    checked={formData.termsAgreed}
                    onChange={handleChange}
                    className="mt-0.5 h-4 w-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 dark:border-slate-700"
                  />
                  <label htmlFor="terms" className="text-xs text-slate-600 dark:text-slate-400 leading-snug cursor-pointer select-none">
                    Saya menyetujui ketentuan layanan dan kebijakan akses sistem pembayaran SPP & anggaran {institutionName}.
                  </label>
                </div>

                <Button
                  type="submit"
                  loading={loading}
                  size="lg"
                  className="w-full py-3 text-sm font-bold rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-700 to-teal-600 hover:opacity-95 text-white shadow-xl shadow-indigo-600/25 mt-2"
                >
                  Daftar Akun Sebagai {formData.role === 'super_admin' ? 'Super Admin (Akses Mutlak)' : formData.role === 'admin' ? 'Admin Operasional' : 'User (Siswa/Wali)'}
                  <ArrowRight className="w-4 h-4 ml-1.5" />
                </Button>
              </form>
            </div>

            {/* Link Footer ke Login */}
            <div className="mt-6 pt-4 text-center text-xs text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800">
              Sudah memiliki akun terdaftar?{' '}
              <Link to="/login" className="font-bold text-indigo-600 dark:text-indigo-400 hover:underline">
                Masuk di sini
              </Link>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

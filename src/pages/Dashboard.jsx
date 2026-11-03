import React from 'react';
import Card, { CardContent } from '../components/ui/Card';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { formatRupiah } from '../utils/formatRupiah';
import {
  LayoutDashboard,
  Users,
  AlertTriangle,
  Sliders,
  Receipt,
  ShieldAlert,
  ArrowRight
} from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Dashboard() {
  const { currentUser, isSuperAdmin, isUser } = useAuth();
  const { overdueCount, dashboardSummary, systemSettings, loading } = useData();

  if (loading || !dashboardSummary) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-10 bg-slate-200 dark:bg-slate-800 rounded-lg w-1/3" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-slate-200 dark:bg-slate-800 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  const { kpi } = dashboardSummary;

  return (
    <div className="space-y-6">
      {/* Super Admin Full Control Banner */}
      {isSuperAdmin && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-900/90 via-indigo-900/90 to-purple-950/90 text-white border border-purple-500/40 shadow-lg flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-600/60 border border-purple-400/40 flex items-center justify-center shrink-0">
              <ShieldAlert className="w-5 h-5 text-purple-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-purple-100">Super Admin Mode Aktif</span>
                <span className="px-2 py-0.2 rounded-full text-[10px] font-extrabold uppercase bg-purple-500 text-white">
                  Akses Mutlak
                </span>
              </div>
              <p className="text-xs text-purple-200/80 mt-0.5">
                Anda memiliki izin penuh untuk mengubah seluruh konfigurasi website, identitas sekolah, rekening kas, tagihan, dan data pengguna.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Link
              to="/settings"
              className="px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-md"
            >
              <Sliders className="w-3.5 h-3.5" />
              Ubah Pengaturan Website
            </Link>
            <Link
              to="/users"
              className="px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold flex items-center gap-1.5 transition-all border border-white/20"
            >
              <Users className="w-3.5 h-3.5" />
              Kelola Pengguna
            </Link>
          </div>
        </div>
      )}

      {/* Welcome Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-indigo-700 via-indigo-600 to-teal-600 text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-white/10 backdrop-blur-md text-xs font-medium mb-2 border border-white/20">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              {systemSettings?.institutionName || 'SMA Nusantara Mandiri'} • TA {systemSettings?.academicYear || '2026/2027'} • Tanggal: 03 Nov 2026
            </div>
            <h1 className="text-2xl font-bold">
              Selamat Datang, {currentUser?.nama_lengkap}
            </h1>
            <p className="text-indigo-100 text-sm mt-1 max-w-xl">
              {isUser
                ? 'Portal monitoring tagihan SPP dan riwayat pembayaran biaya pendidikan ananda.'
                : 'Platform monitoring tagihan SPP siswa, deteksi dini tunggakan jatuh tempo, dan realisasi anggaran operasional institusi pendidikan.'}
            </p>
          </div>

          <div className="flex items-center gap-3">
            {isUser ? (
              <Link
                to="/bills"
                className="px-4 py-2.5 rounded-xl bg-white text-indigo-700 font-semibold text-xs shadow-md hover:bg-indigo-50 transition-all flex items-center gap-1.5"
              >
                <Receipt className="w-4 h-4 text-indigo-600" />
                Lihat Tagihan Saya
              </Link>
            ) : (
              <Link
                to="/overdue"
                className="px-4 py-2.5 rounded-xl bg-white text-indigo-700 font-semibold text-xs shadow-md hover:bg-indigo-50 transition-all flex items-center gap-1.5"
              >
                <AlertTriangle className="w-4 h-4 text-rose-500" />
                Lihat {overdueCount} Overdue
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* 4 KPI Cards Preview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-indigo-500">
          <CardContent className="p-5">
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Total Tagihan (Kewajiban)</p>
            <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">
              {formatRupiah(kpi.totalTagihan)}
            </h3>
            <span className="inline-block mt-2 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
              {kpi.tagihanTrend} vs semester lalu
            </span>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-emerald-500">
          <CardContent className="p-5">
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Total Terbayar (Verified)</p>
            <h3 className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">
              {formatRupiah(kpi.totalTerbayar)}
            </h3>
            <span className="inline-block mt-2 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
              {kpi.terbayarTrend} penerimaan kas
            </span>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-rose-500">
          <CardContent className="p-5">
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Total Tunggakan Sisa</p>
            <h3 className="text-2xl font-extrabold text-rose-600 dark:text-rose-400 mt-1">
              {formatRupiah(kpi.totalTunggakan)}
            </h3>
            <span className="inline-block mt-2 text-[11px] font-semibold text-rose-500">
              {overdueCount} tagihan lewat jatuh tempo
            </span>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-teal-500">
          <CardContent className="p-5">
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Kolektibilitas SPP</p>
            <h3 className="text-2xl font-extrabold text-teal-600 dark:text-teal-400 mt-1">
              {kpi.kolektibilitas}%
            </h3>
            <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full mt-2 overflow-hidden">
              <div
                className="bg-teal-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.min(kpi.kolektibilitas, 100)}%` }}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Info Box Peran & Akses */}
      <Card className="bg-gradient-to-br from-indigo-50/50 to-teal-50/50 dark:from-slate-900 dark:to-slate-800 border-indigo-200/60 dark:border-slate-700">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0">
              <LayoutDashboard className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                Sistem Autentikasi & Otorisasi RBAC 3 Tingkat
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                Aplikasi kini mendukung pendaftaran akun baru (<b>Register</b>) dan login dengan 3 peran utama:{' '}
                <span className="font-semibold text-purple-600 dark:text-purple-400">Super Admin</span> (kontrol penuh mengubah seluruh website),{' '}
                <span className="font-semibold text-indigo-600 dark:text-indigo-400">Admin</span> (operasional kasir & verifikasi), dan{' '}
                <span className="font-semibold text-teal-600 dark:text-teal-400">User</span> (akses siswa & wali).
              </p>
              <div className="mt-4 flex flex-wrap gap-2 text-xs">
                <span className="px-3 py-1 bg-white dark:bg-slate-800 rounded-lg border border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300 font-bold">
                  ✓ Role: Super Admin (Ubah Semua Website)
                </span>
                <span className="px-3 py-1 bg-white dark:bg-slate-800 rounded-lg border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 font-bold">
                  ✓ Role: Admin Operasional
                </span>
                <span className="px-3 py-1 bg-white dark:bg-slate-800 rounded-lg border border-teal-200 dark:border-teal-800 text-teal-700 dark:text-teal-300 font-bold">
                  ✓ Role: User / Siswa
                </span>
                <span className="px-3 py-1 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 font-mono">
                  ✓ Halaman Login & Register Terhubung
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

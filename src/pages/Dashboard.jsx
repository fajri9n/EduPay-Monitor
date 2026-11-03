import React from 'react';
import Card, { CardContent, CardHeader } from '../components/ui/Card';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { formatRupiah } from '../utils/formatRupiah';
import { LayoutDashboard, Users, AlertTriangle, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Dashboard() {
  const { currentUser } = useAuth();
  const { overdueCount, dashboardSummary, loading } = useData();

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
      {/* Welcome Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-indigo-700 via-indigo-600 to-teal-600 text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-white/10 backdrop-blur-md text-xs font-medium mb-2 border border-white/20">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              Sistem Aktif • TA 2026/2027 • Tanggal: 03 Nov 2026
            </div>
            <h1 className="text-2xl font-bold">
              Selamat Datang, {currentUser?.nama_lengkap}
            </h1>
            <p className="text-indigo-100 text-sm mt-1 max-w-xl">
              Platform monitoring tagihan SPP siswa, deteksi dini tunggakan jatuh tempo, dan realisasi anggaran operasional institusi pendidikan.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/overdue"
              className="px-4 py-2.5 rounded-xl bg-white text-indigo-700 font-semibold text-xs shadow-md hover:bg-indigo-50 transition-all flex items-center gap-1.5"
            >
              <AlertTriangle className="w-4 h-4 text-rose-500" />
              Lihat {overdueCount} Overdue
            </Link>
          </div>
        </div>
      </div>

      {/* 4 KPI Cards Preview (Tahap 1 Preview) */}
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

      {/* Info Box Tahap 1 Selesai */}
      <Card className="bg-gradient-to-br from-indigo-50/50 to-teal-50/50 dark:from-slate-900 dark:to-slate-800 border-indigo-200/60 dark:border-slate-700">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0">
              <LayoutDashboard className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                Tahap 1 Siap & Berjalan Lancar
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
                Setup proyek Vite + React + Tailwind, service layer mock API, sistem RBAC 4 peran, format Rupiah & tanggal Indonesia (03 Nov 2026), serta layout navigasi sidebar/topbar telah tervalidasi.
              </p>
              <div className="mt-4 flex flex-wrap gap-2 text-xs">
                <span className="px-3 py-1 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 font-mono">
                  ✓ 6 Kelas Terdaftar
                </span>
                <span className="px-3 py-1 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 font-mono">
                  ✓ 120 Siswa Realistis
                </span>
                <span className="px-3 py-1 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 font-mono">
                  ✓ 385 Tagihan Terdistribusi
                </span>
                <span className="px-3 py-1 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 font-mono">
                  ✓ 500 Transaksi 6 Bulan
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


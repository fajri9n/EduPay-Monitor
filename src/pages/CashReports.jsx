import React, { useState, useMemo } from 'react';
import Card, { CardContent, CardHeader } from '../components/ui/Card';
import Button from '../components/ui/Button';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { formatRupiah } from '../utils/formatRupiah';
import { formatDate } from '../utils/formatDate';
import { exportToCsv } from '../utils/exportCsv';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import {
  TrendingUp,
  Calendar,
  Download,
  Printer,
  CreditCard,
  Building2,
  CheckCircle2,
  Receipt,
  FileSpreadsheet,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';

export default function CashReports() {
  const { isSuperAdmin, isAdmin } = useAuth();
  const { transactions, systemSettings } = useData();

  // Mode & Periode State
  const [reportMode, setReportMode] = useState('monthly'); // 'daily' | 'monthly'
  const [selectedDate, setSelectedDate] = useState('2026-11-03');
  const [selectedMonth, setSelectedMonth] = useState('2026-11');

  // Filter HANYA transaksi yang 'Verified' (Sesuai Kebutuhan F3)
  const verifiedTransactions = useMemo(() => {
    return transactions.filter((t) => t.verification_status === 'Verified');
  }, [transactions]);

  // Transaksi sesuai periode terpilih
  const periodTransactions = useMemo(() => {
    if (reportMode === 'daily') {
      return verifiedTransactions.filter((t) =>
        t.transaction_date.startsWith(selectedDate)
      );
    } else {
      return verifiedTransactions.filter((t) =>
        t.transaction_date.startsWith(selectedMonth)
      );
    }
  }, [verifiedTransactions, reportMode, selectedDate, selectedMonth]);

  // Metrik KPI
  const totalPenerimaan = useMemo(() => {
    return periodTransactions.reduce((sum, t) => sum + Number(t.amount_paid), 0);
  }, [periodTransactions]);

  const totalTransaksi = periodTransactions.length;
  const rataRataTransaksi = totalTransaksi > 0 ? Math.round(totalPenerimaan / totalTransaksi) : 0;

  // Breakdown per Metode Pembayaran
  const methodStats = useMemo(() => {
    const stats = { 'Transfer Bank': 0, 'E-Wallet': 0, Cash: 0 };
    periodTransactions.forEach((t) => {
      if (stats[t.payment_method] !== undefined) {
        stats[t.payment_method] += Number(t.amount_paid);
      }
    });
    return [
      {
        method: 'Transfer Bank',
        total: stats['Transfer Bank'],
        percentage: totalPenerimaan > 0 ? ((stats['Transfer Bank'] / totalPenerimaan) * 100).toFixed(1) : 0,
        color: 'bg-indigo-600',
      },
      {
        method: 'E-Wallet',
        total: stats['E-Wallet'],
        percentage: totalPenerimaan > 0 ? ((stats['E-Wallet'] / totalPenerimaan) * 100).toFixed(1) : 0,
        color: 'bg-cyan-500',
      },
      {
        method: 'Cash (Loket)',
        total: stats.Cash,
        percentage: totalPenerimaan > 0 ? ((stats.Cash / totalPenerimaan) * 100).toFixed(1) : 0,
        color: 'bg-emerald-500',
      },
    ];
  }, [periodTransactions, totalPenerimaan]);

  // Data Grafik Batang
  const chartData = useMemo(() => {
    if (reportMode === 'monthly') {
      // 30 hari dalam sebulan
      const days = [];
      for (let day = 1; day <= 30; day++) {
        const dayStr = `${selectedMonth}-${String(day).padStart(2, '0')}`;
        const dayTxs = periodTransactions.filter((t) => t.transaction_date.startsWith(dayStr));
        const dayTotal = dayTxs.reduce((sum, t) => sum + Number(t.amount_paid), 0);
        days.push({
          label: `${day}`,
          dateStr,
          Penerimaan: dayTotal,
          count: dayTxs.length,
        });
      }
      return days;
    } else {
      // Breakdown metode jika harian
      return methodStats.map((m) => ({
        label: m.method,
        Penerimaan: m.total,
      }));
    }
  }, [reportMode, selectedMonth, periodTransactions, methodStats]);

  // Handler Print View
  const handlePrint = () => {
    window.print();
  };

  // Handler Export CSV
  const handleExportCsv = () => {
    const exportData = periodTransactions.map((t) => ({
      'No Referensi': t.reference_number,
      Tanggal: t.transaction_date,
      NIS: t.student?.nis || '',
      'Nama Siswa': t.student?.nama || '',
      Kelas: t.student?.kelas || '',
      'Nama Tagihan': t.fee?.fee_name || '',
      'Nominal Kas': t.amount_paid,
      'Metode Pembayaran': t.payment_method,
      'Status Verifikasi': 'Verified',
    }));
    exportToCsv(`Laporan_Kas_${reportMode}_${reportMode === 'daily' ? selectedDate : selectedMonth}`, exportData);
  };

  const institutionName = systemSettings?.institutionName || 'SMA Nusantara Mandiri';
  const academicYear = systemSettings?.academicYear || '2026/2027';

  return (
    <div className="space-y-6">
      {/* Print View Header Khusus saat dicetak */}
      <div className="hidden print:block text-center border-b pb-4 mb-6">
        <h1 className="text-xl font-bold uppercase">{institutionName}</h1>
        <p className="text-xs text-slate-600">
          REKAPITULASI PENERIMAAN KAS PENDIDIKAN TAHUN AJARAN {academicYear}
        </p>
        <p className="text-xs text-slate-500 font-mono mt-1">
          Periode: {reportMode === 'daily' ? formatDate(selectedDate) : `Bulan ${selectedMonth}`} • Dicetak pada: 03 Nov 2026 11:45 WIB
        </p>
      </div>

      {/* Header Halaman (Disembunyikan saat print) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            Rekapitulasi Penerimaan Kas Institusi
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Rekap kas harian & bulanan institusi berdasarkan transaksi berstatus <b>Verified</b> sesuai standar akuntansi sekolah.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrint}
            className="text-xs py-2 px-3 flex items-center gap-1.5"
          >
            <Printer className="w-4 h-4" />
            Cetak Laporan
          </Button>

          <Button
            size="sm"
            onClick={handleExportCsv}
            className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs py-2 px-3.5 shadow-md flex items-center gap-1.5"
          >
            <Download className="w-4 h-4" />
            Ekspor CSV
          </Button>
        </div>
      </div>

      {/* Control Panel: Toggle Harian / Bulanan & Pemilih Tanggal */}
      <Card className="print:hidden">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            {/* Toggle Mode */}
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
              <button
                onClick={() => setReportMode('daily')}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  reportMode === 'daily'
                    ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                Laporan Kas Harian
              </button>
              <button
                onClick={() => setReportMode('monthly')}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  reportMode === 'monthly'
                    ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                Laporan Kas Bulanan
              </button>
            </div>

            {/* Pemilih Tanggal / Bulan */}
            <div className="flex items-center gap-2 text-xs">
              <Calendar className="w-4 h-4 text-slate-400" />
              <span className="font-semibold text-slate-600 dark:text-slate-400">
                Pilih {reportMode === 'daily' ? 'Tanggal:' : 'Bulan:'}
              </span>
              {reportMode === 'daily' ? (
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              ) : (
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-medium text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="2026-11">November 2026</option>
                  <option value="2026-10">Oktober 2026</option>
                  <option value="2026-09">September 2026</option>
                  <option value="2026-08">Agustus 2026</option>
                  <option value="2026-07">Juli 2026</option>
                </select>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 3 KPI Cards Ringkasan Kas */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-l-4 border-l-emerald-500">
          <CardContent className="p-5">
            <p className="text-xs font-semibold text-slate-500">
              Total Penerimaan Kas ({reportMode === 'daily' ? 'Hari Ini' : 'Bulan Ini'})
            </p>
            <h3 className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">
              {formatRupiah(totalPenerimaan)}
            </h3>
            <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1 mt-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              100% Terverifikasi Kasir
            </span>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-indigo-500">
          <CardContent className="p-5">
            <p className="text-xs font-semibold text-slate-500">Jumlah Transaksi Masuk</p>
            <h3 className="text-2xl font-extrabold text-indigo-600 dark:text-indigo-400 mt-1">
              {totalTransaksi}
            </h3>
            <span className="text-[11px] text-slate-400 font-semibold mt-1 inline-block">
              Setoran tervalidasi
            </span>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-teal-500">
          <CardContent className="p-5">
            <p className="text-xs font-semibold text-slate-500">Rata-Rata per Transaksi</p>
            <h3 className="text-2xl font-extrabold text-teal-600 dark:text-teal-400 mt-1">
              {formatRupiah(rataRataTransaksi)}
            </h3>
            <span className="text-[11px] text-slate-400 font-semibold mt-1 inline-block">
              Nominal rata-rata siswa
            </span>
          </CardContent>
        </Card>
      </div>

      {/* Baris Grafik & Rincian Metode */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Grafik Batang Penerimaan Kas */}
        <div className="lg:col-span-8">
          <Card className="h-full">
            <CardHeader
              title={`Grafik Penerimaan Kas ${reportMode === 'daily' ? 'Harian' : 'Bulanan'}`}
              subtitle={
                reportMode === 'monthly'
                  ? `Tren penerimaan harian per tanggal selama bulan ${selectedMonth}`
                  : `Distribusi penerimaan kas pada tanggal ${formatDate(selectedDate)}`
              }
            />
            <CardContent className="p-4 pt-0">
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 15, right: 10, left: -10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis
                      dataKey="label"
                      tick={{ fontSize: 10, fill: '#64748b' }}
                      tickLine={false}
                      axisLine={{ stroke: '#cbd5e1' }}
                    />
                    <YAxis
                      tick={{ fontSize: 10, fill: '#64748b' }}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(val) => {
                        if (val >= 1000000) return `${(val / 1000000).toFixed(0)}jt`;
                        if (val >= 1000) return `${(val / 1000).toFixed(0)}rb`;
                        return val;
                      }}
                    />
                    <Tooltip
                      formatter={(val) => [formatRupiah(val), 'Penerimaan Kas']}
                      labelFormatter={(lbl) =>
                        reportMode === 'monthly'
                          ? `Tanggal: ${lbl} ${selectedMonth}`
                          : `Metode: ${lbl}`
                      }
                      contentStyle={{
                        backgroundColor: '#0f172a',
                        borderRadius: '12px',
                        color: '#fff',
                        fontSize: '12px',
                      }}
                    />
                    <Bar dataKey="Penerimaan" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Komposisi Metode Pembayaran */}
        <div className="lg:col-span-4">
          <Card className="h-full">
            <CardHeader
              title="Rincian per Metode"
              subtitle="Komposisi penyaluran pembayaran kas"
            />
            <CardContent className="p-4 pt-0 space-y-4">
              {methodStats.map((item, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-2 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      {item.method}
                    </span>
                    <span className="font-extrabold font-mono text-indigo-600 dark:text-indigo-400">
                      {formatRupiah(item.total)}
                    </span>
                  </div>

                  <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                    <div
                      className={`${item.color} h-full rounded-full transition-all duration-500`}
                      style={{ width: `${item.percentage}%` }}
                    />
                  </div>

                  <div className="flex justify-between text-[11px] text-slate-400">
                    <span>Porsi Penerimaan:</span>
                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                      {item.percentage}%
                    </span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Tabel Rincian Transaksi Kas Terverifikasi */}
      <Card>
        <CardHeader
          title="Daftar Transaksi Kas Terverifikasi"
          subtitle={`Rincian mutasi kas masuk ${reportMode === 'daily' ? formatDate(selectedDate) : `Bulan ${selectedMonth}`}`}
        />
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-bold uppercase tracking-wider">
                  <th className="p-3.5">No Referensi</th>
                  <th className="p-3.5">Tanggal / Jam</th>
                  <th className="p-3.5">Siswa</th>
                  <th className="p-3.5">Tagihan</th>
                  <th className="p-3.5">Metode Bayar</th>
                  <th className="p-3.5 text-right">Nominal Setoran</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {periodTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-400">
                      Tidak ada transaksi kas terverifikasi pada periode yang dipilih.
                    </td>
                  </tr>
                ) : (
                  periodTransactions.slice(0, 15).map((t) => (
                    <tr
                      key={t.transaction_id}
                      className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="p-3.5 font-mono font-bold text-slate-900 dark:text-white">
                        {t.reference_number || `TRX-${t.transaction_id}`}
                      </td>
                      <td className="p-3.5 text-slate-500">
                        {formatDate(t.transaction_date, true)}
                      </td>
                      <td className="p-3.5">
                        <div className="font-semibold text-slate-900 dark:text-white">
                          {t.student?.nama}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {t.student?.nis} • Kelas {t.student?.kelas}
                        </div>
                      </td>
                      <td className="p-3.5 font-medium text-slate-700 dark:text-slate-300">
                        {t.fee?.fee_name}
                      </td>
                      <td className="p-3.5">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                          {t.payment_method}
                        </span>
                      </td>
                      <td className="p-3.5 text-right font-mono font-extrabold text-emerald-600 dark:text-emerald-400">
                        {formatRupiah(t.amount_paid)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Lembar Pengesahan saat dicetak */}
      <div className="hidden print:grid grid-cols-2 gap-8 pt-8 mt-12 text-center text-xs">
        <div>
          <p className="text-slate-500">Mengetahui,</p>
          <p className="font-bold mt-1">Kepala Sekolah</p>
          <div className="h-16" />
          <p className="font-bold underline">Drs. H. Ahmad Dahlan, M.Pd</p>
          <p className="text-slate-400">NIP. 19750812 199903 1 002</p>
        </div>
        <div>
          <p className="text-slate-500">Dibuat oleh,</p>
          <p className="font-bold mt-1">Bendahara Sekolah</p>
          <div className="h-16" />
          <p className="font-bold underline">Hj. Siti Aminah, S.E.</p>
          <p className="text-slate-400">NIP. 19820415 200604 2 011</p>
        </div>
      </div>
    </div>
  );
}

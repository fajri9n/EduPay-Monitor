import React, { useState } from 'react';
import Card, { CardContent, CardHeader } from '../components/ui/Card';
import StatusBadge from '../components/ui/StatusBadge';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { formatRupiah } from '../utils/formatRupiah';
import { formatDate, getDueCountdown } from '../utils/formatDate';
import { notificationService } from '../services/notificationService';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  LayoutDashboard,
  Users,
  AlertTriangle,
  Sliders,
  Receipt,
  ShieldAlert,
  ArrowRight,
  CreditCard,
  Building2,
  CheckCircle2,
  Clock,
  TrendingUp,
  TrendingDown,
  Filter,
  Send,
  Calendar,
  Wallet,
  ArrowUpRight,
  Sparkles,
  Copy,
  Check,
  RotateCcw,
} from 'lucide-react';
import { Link } from 'react-router-dom';

// Custom Tooltip untuk Grafik Status per Kelas
const ClassStatusTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const total = payload.reduce((sum, entry) => sum + (Number(entry.value) || 0), 0);
    return (
      <div className="bg-slate-900 text-white p-3 rounded-xl shadow-xl text-xs border border-slate-700 space-y-1.5 min-w-[180px]">
        <p className="font-bold text-slate-200 border-b border-slate-700/80 pb-1">
          Kelas: {label}
        </p>
        <div className="space-y-1 pt-1">
          {payload.map((entry, index) => (
            <div key={`item-${index}`} className="flex items-center justify-between gap-3">
              <span className="flex items-center gap-1.5">
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: entry.color }}
                />
                <span className="text-slate-300">{entry.name}:</span>
              </span>
              <span className="font-bold font-mono text-white">
                {entry.value} tagihan
              </span>
            </div>
          ))}
          <div className="pt-1.5 mt-1.5 border-t border-slate-700/80 flex items-center justify-between text-[11px]">
            <span className="text-slate-400">Total Tagihan:</span>
            <span className="font-bold text-indigo-400">{total} tagihan</span>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

// Custom Tooltip untuk Grafik Tren Kas
const CashTrendTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-slate-900 text-white p-3 rounded-xl shadow-xl text-xs border border-slate-700 space-y-1">
        <p className="font-semibold text-slate-300">
          Tanggal: {formatDate(data.date)}
        </p>
        <p className="font-mono text-sm font-extrabold text-emerald-400">
          {formatRupiah(data.total)}
        </p>
        <p className="text-[11px] text-slate-400">
          {data.count} transaksi terverifikasi
        </p>
      </div>
    );
  }
  return null;
};

// Custom Tooltip untuk Donut Chart Metode Bayar
const PaymentMethodTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0];
    return (
      <div className="bg-slate-900 text-white p-3 rounded-xl shadow-xl text-xs border border-slate-700 space-y-1">
        <p className="font-semibold text-slate-300">{data.name}</p>
        <p className="font-mono text-sm font-extrabold text-indigo-400">
          {formatRupiah(data.value)}
        </p>
      </div>
    );
  }
  return null;
};

export default function Dashboard() {
  const { currentUser, isSuperAdmin, isAdmin, isUser } = useAuth();
  const {
    overdueCount,
    dashboardSummary,
    systemSettings,
    bills,
    loading,
    filterClass,
    setFilterClass,
    filterPeriod,
    setFilterPeriod,
    sendNotification,
    recordTransaction,
  } = useData();

  // State Reminder Modal
  const [selectedBillForReminder, setSelectedBillForReminder] = useState(null);
  const [reminderChannel, setReminderChannel] = useState('WhatsApp');
  const [customReminderMessage, setCustomReminderMessage] = useState('');
  const [sendingReminder, setSendingReminder] = useState(false);
  const [reminderSuccess, setReminderSuccess] = useState(false);

  // State Copy Rekening Feedback
  const [copiedAccount, setCopiedAccount] = useState('');

  // State Quick Payment Modal untuk User
  const [selectedBillForPay, setSelectedBillForPay] = useState(null);
  const [payAmount, setPayAmount] = useState('');
  const [payMethod, setPayMethod] = useState('Transfer Bank');
  const [paying, setPaying] = useState(false);
  const [paySuccess, setPaySuccess] = useState(false);

  if (loading || !dashboardSummary) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-10 bg-slate-200 dark:bg-slate-800 rounded-lg w-1/3" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-slate-200 dark:bg-slate-800 rounded-xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-80 bg-slate-200 dark:bg-slate-800 rounded-2xl" />
          <div className="h-80 bg-slate-200 dark:bg-slate-800 rounded-2xl" />
        </div>
      </div>
    );
  }

  const { kpi, classStatusData, cashTrendData, paymentMethodData, upcomingBills } = dashboardSummary;

  // Personal metrics jika login sebagai User / Siswa
  const userBills = isUser
    ? bills.filter((b) => b.student_id === (currentUser?.student_id || 1))
    : [];
  const userTotalTagihan = userBills.reduce((s, b) => s + (b.fee?.amount || 0), 0);
  const userTotalTunggakan = userBills.reduce((s, b) => s + Number(b.amount_due), 0);
  const userTotalTerbayar = userTotalTagihan - userTotalTunggakan;
  const userKolektibilitas =
    userTotalTagihan > 0 ? ((userTotalTerbayar / userTotalTagihan) * 100).toFixed(1) : 0;

  // Warna Donut Chart
  const METHOD_COLORS = {
    'Transfer Bank': '#6366f1', // Indigo
    'E-Wallet': '#06b6d4',      // Cyan
    'Cash': '#10b981',          // Emerald
  };

  const institutionName = systemSettings?.institutionName || 'SMA Nusantara Mandiri';
  const academicYear = systemSettings?.academicYear || '2026/2027';
  const bankAccounts = systemSettings?.bankAccounts || [
    { bank: 'Bank Mandiri', accountNo: '123-00-9876543-1', holder: 'Yayasan Nusantara Mandiri' },
    { bank: 'BCA', accountNo: '882-019-2831', holder: 'Yayasan Nusantara Mandiri' },
  ];

  // Handler Buka Modal Pengingat
  const handleOpenReminder = (bill) => {
    setSelectedBillForReminder(bill);
    setReminderChannel('WhatsApp');
    const defaultMsg = notificationService.generateMessage(bill, 'WhatsApp');
    setCustomReminderMessage(defaultMsg);
    setReminderSuccess(false);
  };

  // Handler Ganti Channel Modal
  const handleChannelChange = (channel) => {
    setReminderChannel(channel);
    if (selectedBillForReminder) {
      const msg = notificationService.generateMessage(selectedBillForReminder, channel);
      setCustomReminderMessage(msg);
    }
  };

  // Handler Kirim Pengingat
  const handleSendReminder = async () => {
    if (!selectedBillForReminder) return;
    try {
      setSendingReminder(true);
      await sendNotification(
        selectedBillForReminder.bill_id,
        reminderChannel,
        customReminderMessage
      );
      setReminderSuccess(true);
      setTimeout(() => {
        setSelectedBillForReminder(null);
        setReminderSuccess(false);
      }, 1500);
    } catch (err) {
      alert('Gagal mengirim pengingat: ' + err.message);
    } finally {
      setSendingReminder(false);
    }
  };

  // Handler Copy Rekening
  const handleCopyAccount = (accountNo) => {
    navigator.clipboard.writeText(accountNo.replace(/-/g, ''));
    setCopiedAccount(accountNo);
    setTimeout(() => setCopiedAccount(''), 2000);
  };

  // Handler Bayar Tagihan (Untuk User)
  const handleOpenPayModal = (bill) => {
    setSelectedBillForPay(bill);
    setPayAmount(String(bill.amount_due));
    setPayMethod('Transfer Bank');
    setPaySuccess(false);
  };

  const handleProcessPayment = async (e) => {
    e.preventDefault();
    if (!selectedBillForPay) return;
    const amountNum = Number(payAmount);
    if (!amountNum || amountNum <= 0) {
      alert('Nominal pembayaran harus lebih besar dari Rp 0');
      return;
    }
    if (amountNum > selectedBillForPay.amount_due) {
      alert('Nominal melebihi sisa tagihan.');
      return;
    }

    try {
      setPaying(true);
      await recordTransaction({
        bill_id: selectedBillForPay.bill_id,
        amount_paid: amountNum,
        payment_method: payMethod,
        transaction_date: '2026-11-03 14:00:00',
        verification_status: 'Pending',
      });
      setPaySuccess(true);
      setTimeout(() => {
        setSelectedBillForPay(null);
        setPaySuccess(false);
      }, 1500);
    } catch (err) {
      alert('Gagal mengirim bukti pembayaran: ' + err.message);
    } finally {
      setPaying(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Super Admin Full Control Banner */}
      {isSuperAdmin && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-900/95 via-indigo-900/90 to-purple-950/95 text-white border border-purple-500/40 shadow-lg flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-600/60 border border-purple-400/40 flex items-center justify-center shrink-0">
              <ShieldAlert className="w-5 h-5 text-purple-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-purple-100">Super Admin Mode Aktif</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-purple-500 text-white tracking-wider">
                  Akses Mutlak
                </span>
              </div>
              <p className="text-xs text-purple-200/80 mt-0.5">
                Anda memiliki izin penuh untuk mengelola dan melihat seluruh tagihan, mengubah pengaturan website, identitas sekolah, dan rekening kas.
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
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-radial from-white/10 to-transparent pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-white/15 backdrop-blur-md text-xs font-medium mb-2 border border-white/20">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              {institutionName} • TA {academicYear} • 03 Nov 2026 (WIB)
            </div>
            <h1 className="text-2xl font-bold">
              Selamat Datang, {currentUser?.nama_lengkap}
            </h1>
            <p className="text-indigo-100 text-sm mt-1 max-w-xl">
              {isUser
                ? `Portal tagihan SPP dan riwayat pembayaran ananda (${currentUser?.student_nis || 'NIS 20260001'}). Periksa rincian kewajiban Anda di bawah.`
                : 'Pantau arus penerimaan SPP, lacak tunggakan jatuh tempo seluruh kelas, dan realisasi anggaran operasional institusi.'}
            </p>
          </div>

          <div className="flex items-center gap-3">
            {isUser ? (
              <Link
                to="/bills"
                className="px-4 py-2.5 rounded-xl bg-white text-indigo-700 font-semibold text-xs shadow-md hover:bg-indigo-50 transition-all flex items-center gap-1.5"
              >
                <Receipt className="w-4 h-4 text-indigo-600" />
                Buka Tagihan Saya
              </Link>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/overdue"
                  className="px-3.5 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-semibold text-xs shadow-md transition-all flex items-center gap-1.5"
                >
                  <AlertTriangle className="w-4 h-4" />
                  {overdueCount} Overdue
                </Link>
                <Link
                  to="/bills"
                  className="px-3.5 py-2.5 rounded-xl bg-white text-indigo-700 font-semibold text-xs shadow-md hover:bg-indigo-50 transition-all flex items-center gap-1.5"
                >
                  <Receipt className="w-4 h-4 text-indigo-600" />
                  Kelola Tagihan Siswa
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* FILTER GLOBAL DASHBOARD (Khusus Admin & Super Admin) */}
      {!isUser && (
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
            <Filter className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span>Filter Statistik Dashboard:</span>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Filter Kelas */}
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-slate-500 dark:text-slate-400">Kelas:</span>
              <select
                value={filterClass}
                onChange={(e) => setFilterClass(e.target.value)}
                className="px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="all">Semua Kelas (6 Kelas)</option>
                <option value="X-A">Kelas X-A</option>
                <option value="X-B">Kelas X-B</option>
                <option value="XI-MIPA">Kelas XI-MIPA</option>
                <option value="XI-IPS">Kelas XI-IPS</option>
                <option value="XII-MIPA">Kelas XII-MIPA</option>
                <option value="XII-IPS">Kelas XII-IPS</option>
              </select>
            </div>

            {/* Filter Periode */}
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-slate-500 dark:text-slate-400">Periode:</span>
              <select
                value={filterPeriod}
                onChange={(e) => setFilterPeriod(e.target.value)}
                className="px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="all">Semua Periode</option>
                <option value="current_month">Bulan Ini (November 2026)</option>
                <option value="last_month">Bulan Lalu (Oktober 2026)</option>
                <option value="semester">Semester Ganjil 2026/2027</option>
              </select>
            </div>

            {/* Reset Filter Button */}
            {(filterClass !== 'all' || filterPeriod !== 'all') && (
              <button
                onClick={() => {
                  setFilterClass('all');
                  setFilterPeriod('all');
                }}
                className="px-2.5 py-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 rounded-lg flex items-center gap-1 transition-all"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Reset Filter
              </button>
            )}
          </div>
        </div>
      )}

      {/* 4 KPI Cards (Disesuaikan berdasarkan Peran: Personal untuk User, Institusi untuk Admin/Super Admin) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Tagihan */}
        <Card className="border-l-4 border-l-indigo-500 hover:shadow-md transition-shadow">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                {isUser ? 'Total Kewajiban Saya' : 'Total Tagihan Diterbitkan'}
              </p>
              <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                <Receipt className="w-4 h-4" />
              </div>
            </div>
            <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white mt-2">
              {formatRupiah(isUser ? userTotalTagihan : kpi.totalTagihan)}
            </h3>
            <div className="flex items-center gap-1.5 mt-2">
              <span className="flex items-center gap-0.5 text-[11px] font-bold text-indigo-600 dark:text-indigo-400">
                <TrendingUp className="w-3 h-3" />
                {isUser ? `${userBills.length} Tagihan` : kpi.tagihanTrend}
              </span>
              <span className="text-[11px] text-slate-400">
                {isUser ? 'terdaftar di sistem' : 'vs semester lalu'}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Card 2: Total Terbayar */}
        <Card className="border-l-4 border-l-emerald-500 hover:shadow-md transition-shadow">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                {isUser ? 'Sudah Saya Bayar' : 'Total Kas Terbayar'}
              </p>
              <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>
            <h3 className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-2">
              {formatRupiah(isUser ? userTotalTerbayar : kpi.totalTerbayar)}
            </h3>
            <div className="flex items-center gap-1.5 mt-2">
              <span className="flex items-center gap-0.5 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                <TrendingUp className="w-3 h-3" />
                {isUser ? 'Lunas / Terverifikasi' : kpi.terbayarTrend}
              </span>
              <span className="text-[11px] text-slate-400">
                {isUser ? 'tata usaha' : 'transaksi verified'}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Card 3: Total Tunggakan */}
        <Card className="border-l-4 border-l-rose-500 hover:shadow-md transition-shadow">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                {isUser ? 'Sisa Tunggakan Saya' : 'Total Tunggakan Sisa'}
              </p>
              <div className="w-9 h-9 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center">
                <AlertTriangle className="w-4 h-4" />
              </div>
            </div>
            <h3 className="text-2xl font-extrabold text-rose-600 dark:text-rose-400 mt-2">
              {formatRupiah(isUser ? userTotalTunggakan : kpi.totalTunggakan)}
            </h3>
            <div className="flex items-center gap-1.5 mt-2">
              <span className="flex items-center gap-0.5 text-[11px] font-bold text-rose-600 dark:text-rose-400">
                <TrendingDown className="w-3 h-3" />
                {isUser
                  ? `${userBills.filter((b) => b.payment_status === 'Overdue').length} Overdue`
                  : `${overdueCount} tagihan`}
              </span>
              <span className="text-[11px] text-slate-400">
                {isUser ? 'perlu dibayar' : 'melewati jatuh tempo'}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Card 4: Kolektibilitas */}
        <Card className="border-l-4 border-l-teal-500 hover:shadow-md transition-shadow">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                {isUser ? 'Tingkat Kelunasan Saya' : 'Kolektibilitas SPP'}
              </p>
              <div className="w-9 h-9 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 flex items-center justify-center">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <h3 className="text-2xl font-extrabold text-teal-600 dark:text-teal-400 mt-2">
              {isUser ? userKolektibilitas : kpi.kolektibilitas}%
            </h3>
            <div className="mt-2.5 space-y-1">
              <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-teal-500 h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${Math.min(isUser ? userKolektibilitas : kpi.kolektibilitas, 100)}%`,
                  }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-slate-400">
                <span>Target: 85%</span>
                <span className="font-semibold text-teal-600 dark:text-teal-400">
                  {Number(isUser ? userKolektibilitas : kpi.kolektibilitas) >= 85 ? 'Tercapai' : 'Proses'}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* =========================================================================
          KONTEN KHUSUS ADMIN & SUPER ADMIN: GRAFIK & ANALITIK LENGKAP
          ========================================================================= */}
      {!isUser && (
        <>
          {/* BARIS GRAFIK 1: Stacked Bar Chart Status per Kelas & Area Chart Tren Kas 30 Hari */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Stacked Bar Chart: Status Pembayaran per Kelas (7 Kolom) */}
            <div className="lg:col-span-7">
              <Card className="h-full">
                <CardHeader
                  title="Status Pembayaran per Kelas"
                  subtitle="Komposisi tagihan Lunas, Cicilan (Partial), dan Menunggak (Unpaid/Overdue)"
                  action={
                    <span className="text-[11px] font-semibold text-slate-400">
                      Total 6 Kelas
                    </span>
                  }
                />
                <CardContent className="p-4 pt-0">
                  <div className="h-72 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={classStatusData}
                        margin={{ top: 20, right: 10, left: -15, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                        <XAxis
                          dataKey="kelas"
                          tick={{ fontSize: 11, fill: '#64748b' }}
                          tickLine={false}
                          axisLine={{ stroke: '#cbd5e1' }}
                        />
                        <YAxis
                          tick={{ fontSize: 11, fill: '#64748b' }}
                          tickLine={false}
                          axisLine={false}
                        />
                        <Tooltip content={<ClassStatusTooltip />} />
                        <Legend
                          verticalAlign="top"
                          align="right"
                          iconType="circle"
                          iconSize={8}
                          wrapperStyle={{ paddingBottom: 15, fontSize: 11 }}
                        />
                        <Bar
                          dataKey="Lunas"
                          name="Lunas"
                          stackId="status"
                          fill="#10b981"
                        />
                        <Bar
                          dataKey="Cicilan"
                          name="Cicilan"
                          stackId="status"
                          fill="#f59e0b"
                        />
                        <Bar
                          dataKey="Menunggak"
                          name="Menunggak"
                          stackId="status"
                          fill="#f43f5e"
                          radius={[4, 4, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Area Chart: Tren Penerimaan Kas 30 Hari Terakhir (5 Kolom) */}
            <div className="lg:col-span-5">
              <Card className="h-full">
                <CardHeader
                  title="Tren Kas 30 Hari Terakhir"
                  subtitle="Akumulasi penerimaan kas terverifikasi per tanggal"
                  action={
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400">
                      Verified
                    </span>
                  }
                />
                <CardContent className="p-4 pt-0">
                  <div className="h-72 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart
                        data={cashTrendData}
                        margin={{ top: 20, right: 10, left: -10, bottom: 5 }}
                      >
                        <defs>
                          <linearGradient id="cashGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                            <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                        <XAxis
                          dataKey="date"
                          tick={{ fontSize: 10, fill: '#64748b' }}
                          tickLine={false}
                          axisLine={{ stroke: '#cbd5e1' }}
                          tickFormatter={(val) => {
                            // Format e.g. "03 Nov"
                            const parts = val.split('-');
                            return `${parts[2]}/${parts[1]}`;
                          }}
                          interval={6}
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
                        <Tooltip content={<CashTrendTooltip />} />
                        <Area
                          type="monotone"
                          dataKey="total"
                          stroke="#4f46e5"
                          strokeWidth={2.5}
                          fillOpacity={1}
                          fill="url(#cashGradient)"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* BARIS GRAFIK 2: Donut Chart Metode Bayar & Widget Segera Jatuh Tempo */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Donut Chart: Metode Pembayaran (4 Kolom) */}
            <div className="lg:col-span-4">
              <Card className="h-full flex flex-col justify-between">
                <CardHeader
                  title="Metode Pembayaran"
                  subtitle="Komposisi nominal transaksi verified"
                />
                <CardContent className="p-4 pt-0 flex-1 flex flex-col justify-center">
                  <div className="h-56 w-full relative">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={paymentMethodData}
                          cx="50%"
                          cy="50%"
                          innerRadius={55}
                          outerRadius={80}
                          paddingAngle={4}
                          dataKey="value"
                        >
                          {paymentMethodData.map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={METHOD_COLORS[entry.name] || '#94a3b8'}
                            />
                          ))}
                        </Pie>
                        <Tooltip content={<PaymentMethodTooltip />} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                      <span className="text-[10px] text-slate-400 font-medium">Total Kas</span>
                      <span className="text-xs font-mono font-extrabold text-slate-800 dark:text-slate-100">
                        {formatRupiah(kpi.totalTerbayar)}
                      </span>
                    </div>
                  </div>

                  {/* Legend Rincian */}
                  <div className="space-y-2 mt-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                    {paymentMethodData.map((item, idx) => {
                      const pct =
                        kpi.totalTerbayar > 0
                          ? ((item.value / kpi.totalTerbayar) * 100).toFixed(1)
                          : 0;
                      return (
                        <div key={idx} className="flex items-center justify-between">
                          <span className="flex items-center gap-2">
                            <span
                              className="w-2.5 h-2.5 rounded-full"
                              style={{ backgroundColor: METHOD_COLORS[item.name] || '#94a3b8' }}
                            />
                            <span className="text-slate-600 dark:text-slate-400">
                              {item.name}
                            </span>
                          </span>
                          <div className="text-right">
                            <span className="font-mono font-bold text-slate-900 dark:text-white">
                              {formatRupiah(item.value)}
                            </span>
                            <span className="text-[10px] text-slate-400 ml-1.5">
                              ({pct}%)
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Widget Segera Jatuh Tempo: 5 Teratas (8 Kolom) */}
            <div className="lg:col-span-8">
              <Card className="h-full">
                <CardHeader
                  title="Segera Jatuh Tempo & Menunggak"
                  subtitle="5 tagihan teratas yang paling mendesak untuk ditindaklanjuti"
                  action={
                    <Link
                      to="/overdue"
                      className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                    >
                      Buka Overdue Tracking ({overdueCount}) →
                    </Link>
                  }
                />
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-bold uppercase tracking-wider">
                          <th className="p-3.5">Siswa</th>
                          <th className="p-3.5">Tagihan</th>
                          <th className="p-3.5">Sisa Tagihan</th>
                          <th className="p-3.5">Jatuh Tempo</th>
                          <th className="p-3.5">Hitung Mundur</th>
                          <th className="p-3.5 text-center">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {upcomingBills.map((b) => {
                          const countdown = getDueCountdown(b.fee?.due_date);
                          return (
                            <tr
                              key={b.bill_id}
                              className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                            >
                              <td className="p-3.5">
                                <div className="font-semibold text-slate-900 dark:text-white">
                                  {b.student?.nama}
                                </div>
                                <div className="text-[11px] text-slate-400">
                                  NIS {b.student?.nis} • Kelas {b.student?.kelas}
                                </div>
                              </td>
                              <td className="p-3.5 font-medium text-slate-700 dark:text-slate-300">
                                {b.fee?.fee_name}
                              </td>
                              <td className="p-3.5 font-mono font-bold text-rose-600 dark:text-rose-400">
                                {formatRupiah(b.amount_due)}
                              </td>
                              <td className="p-3.5 text-slate-500">
                                {formatDate(b.fee?.due_date)}
                              </td>
                              <td className="p-3.5">
                                <span
                                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                    countdown.isOverdue
                                      ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400'
                                      : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-400'
                                  }`}
                                >
                                  {countdown.text}
                                </span>
                              </td>
                              <td className="p-3.5 text-center">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleOpenReminder(b)}
                                  className="text-[11px] py-1 px-2.5 h-auto text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/40"
                                >
                                  <Send className="w-3 h-3 mr-1" />
                                  Kirim Pengingat
                                </Button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </>
      )}

      {/* =========================================================================
          KONTEN KHUSUS USER (SISWA / ORANG TUA): PORTAL PRIBADI & REKENING SEKOLAH
          ========================================================================= */}
      {isUser && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Daftar Tagihan Aktif User (8 Kolom) */}
          <div className="lg:col-span-8 space-y-6">
            <Card>
              <CardHeader
                title="Daftar Tagihan Pendidikan Anda"
                subtitle="Tagihan semester ganjil TA 2026/2027 yang diterbitkan atas nama ananda"
                action={
                  <Link
                    to="/bills"
                    className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                  >
                    Buka Halaman Tagihan Saya →
                  </Link>
                }
              />
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-bold uppercase tracking-wider">
                        <th className="p-3.5">Nama Tagihan</th>
                        <th className="p-3.5">Nominal Tagihan</th>
                        <th className="p-3.5">Sisa Tagihan</th>
                        <th className="p-3.5">Jatuh Tempo</th>
                        <th className="p-3.5">Status</th>
                        <th className="p-3.5 text-center">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {userBills.map((b) => (
                        <tr
                          key={b.bill_id}
                          className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                        >
                          <td className="p-3.5">
                            <span className="font-semibold text-slate-900 dark:text-white">
                              {b.fee?.fee_name}
                            </span>
                          </td>
                          <td className="p-3.5 text-slate-600 dark:text-slate-300">
                            {formatRupiah(b.fee?.amount)}
                          </td>
                          <td className="p-3.5 font-mono font-bold text-rose-600 dark:text-rose-400">
                            {formatRupiah(b.amount_due)}
                          </td>
                          <td className="p-3.5 text-slate-500">
                            {formatDate(b.fee?.due_date)}
                          </td>
                          <td className="p-3.5">
                            <StatusBadge status={b.payment_status} size="sm" />
                          </td>
                          <td className="p-3.5 text-center">
                            {b.amount_due > 0 ? (
                              <Button
                                size="sm"
                                onClick={() => handleOpenPayModal(b)}
                                className="text-[11px] py-1 px-3 h-auto bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
                              >
                                <CreditCard className="w-3 h-3 mr-1" />
                                Bayar
                              </Button>
                            ) : (
                              <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center justify-center gap-1">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                Lunas
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* Riwayat Pembayaran Pribadi */}
            <Card>
              <CardHeader
                title="Riwayat Pembayaran Terbaru"
                subtitle="Catatan setoran yang telah dikirimkan ke pihak tata usaha"
              />
              <CardContent className="p-4">
                <div className="space-y-3">
                  {userBills
                    .flatMap((b) => (b.transactions || []).map((t) => ({ ...t, feeName: b.fee?.fee_name })))
                    .sort((a, b) => new Date(b.transaction_date) - new Date(a.transaction_date))
                    .slice(0, 4)
                    .map((tx, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold ${
                              tx.verification_status === 'Verified'
                                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400'
                                : tx.verification_status === 'Pending'
                                ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400'
                                : 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400'
                            }`}
                          >
                            <Receipt className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="font-semibold text-slate-900 dark:text-white">
                              {tx.feeName || 'Pembayaran Tagihan'}
                            </p>
                            <p className="text-[11px] text-slate-400">
                              {formatDate(tx.transaction_date)} • Metode: {tx.payment_method}
                            </p>
                          </div>
                        </div>

                        <div className="text-right">
                          <p className="font-mono font-bold text-slate-900 dark:text-white">
                            {formatRupiah(tx.amount_paid)}
                          </p>
                          <StatusBadge status={tx.verification_status} type="verification" size="sm" />
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Rekening Bank Resmi Institusi (4 Kolom) */}
          <div className="lg:col-span-4 space-y-6">
            <Card className="border-indigo-200 dark:border-indigo-900 shadow-md">
              <CardHeader
                title="Rekening Resmi Sekolah"
                subtitle="Salurkan pembayaran via transfer ke rekening di bawah"
                action={<Building2 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />}
              />
              <CardContent className="p-4 space-y-3.5">
                {bankAccounts.map((acc, i) => (
                  <div
                    key={i}
                    className="p-3.5 rounded-xl bg-gradient-to-br from-slate-50 to-indigo-50/30 dark:from-slate-800 dark:to-indigo-950/30 border border-indigo-100 dark:border-slate-700"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-indigo-700 dark:text-indigo-300 uppercase tracking-wider">
                        {acc.bank}
                      </span>
                      <button
                        onClick={() => handleCopyAccount(acc.accountNo)}
                        className="text-[10px] font-semibold text-indigo-600 dark:text-indigo-400 flex items-center gap-1 hover:underline"
                        title="Salin nomor rekening"
                      >
                        {copiedAccount === acc.accountNo ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-600" />
                            Tersalin!
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            Salin
                          </>
                        )}
                      </button>
                    </div>
                    <p className="text-base font-mono font-extrabold text-slate-900 dark:text-white mt-1">
                      {acc.accountNo}
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      a.n. {acc.holder}
                    </p>
                  </div>
                ))}

                <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 text-amber-800 dark:text-amber-300 text-xs leading-relaxed">
                  <p className="font-bold flex items-center gap-1.5 mb-1">
                    <Sparkles className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                    Panduan Pembayaran
                  </p>
                  Sertakan <b>NIS Siswa ({currentUser?.student_nis || '20260001'})</b> pada berita transfer. Setelah transfer, klik tombol "Bayar" untuk mencatatkan setoran agar segera diverifikasi kasir.
                </div>
              </CardContent>
            </Card>

            {/* Profil Singkat Siswa */}
            <Card>
              <CardHeader title="Informasi Siswa" />
              <CardContent className="p-4 space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-400">Nama Siswa</span>
                  <span className="font-semibold text-slate-900 dark:text-white">{currentUser?.nama_lengkap}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-400">NIS</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">{currentUser?.student_nis || '20260001'}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-400">Kelas</span>
                  <span className="font-semibold text-slate-900 dark:text-white">{currentUser?.student_kelas || 'X-A'}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-400">Tahun Ajaran</span>
                  <span className="font-semibold text-slate-900 dark:text-white">{academicYear}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: KIRIM PENGINGAT (SIMULASI WHATSAPP / EMAIL)
          ========================================================================= */}
      {selectedBillForReminder && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedBillForReminder(null)}
          title="Kirim Pengingat Tagihan (Simulasi)"
          size="lg"
        >
          <div className="space-y-4">
            {reminderSuccess ? (
              <div className="p-6 text-center space-y-2">
                <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 mx-auto flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h4 className="text-base font-bold text-slate-900 dark:text-white">
                  Notifikasi Berhasil Dikirim!
                </h4>
                <p className="text-xs text-slate-500">
                  Pesan pengingat ke orang tua telah dicatatkan ke dalam log notifikasi sistem.
                </p>
              </div>
            ) : (
              <>
                {/* Rincian Siswa & Tagihan */}
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-slate-400">Siswa / Wali:</span>
                    <p className="font-semibold text-slate-900 dark:text-white">
                      {selectedBillForReminder.student?.nama} (Wali: {selectedBillForReminder.student?.nama_orang_tua})
                    </p>
                    <p className="text-[11px] text-slate-400">
                      WhatsApp: {selectedBillForReminder.student?.no_hp_ortu || '0812-3456-7890'}
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-400">Tagihan:</span>
                    <p className="font-semibold text-slate-900 dark:text-white">
                      {selectedBillForReminder.fee?.fee_name}
                    </p>
                    <p className="font-mono font-bold text-rose-600">
                      Sisa: {formatRupiah(selectedBillForReminder.amount_due)}
                    </p>
                  </div>
                </div>

                {/* Pemilih Channel */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Pilih Saluran Pengiriman:
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => handleChannelChange('WhatsApp')}
                      className={`p-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                        reminderChannel === 'WhatsApp'
                          ? 'border-emerald-500 bg-emerald-50/60 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300'
                          : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
                      }`}
                    >
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                      WhatsApp Otomatis
                    </button>
                    <button
                      type="button"
                      onClick={() => handleChannelChange('Email')}
                      className={`p-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                        reminderChannel === 'Email'
                          ? 'border-indigo-500 bg-indigo-50/60 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300'
                          : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
                      }`}
                    >
                      <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
                      Email Resmi Institusi
                    </button>
                  </div>
                </div>

                {/* Pratinjau & Edit Isi Pesan */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Pratinjau Pesan yang Akan Diterima Orang Tua:
                  </label>
                  <textarea
                    rows={6}
                    value={customReminderMessage}
                    onChange={(e) => setCustomReminderMessage(e.target.value)}
                    className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedBillForReminder(null)}
                    disabled={sendingReminder}
                  >
                    Batal
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleSendReminder}
                    disabled={sendingReminder}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white"
                  >
                    <Send className="w-3.5 h-3.5 mr-1.5" />
                    {sendingReminder ? 'Mengirim...' : 'Kirim Sekarang (Simulasi)'}
                  </Button>
                </div>
              </>
            )}
          </div>
        </Modal>
      )}

      {/* =========================================================================
          MODAL: BAYAR TAGIHAN (USER / SISWA)
          ========================================================================= */}
      {selectedBillForPay && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedBillForPay(null)}
          title="Konfirmasi Pembayaran Tagihan"
          size="md"
        >
          {paySuccess ? (
            <div className="p-6 text-center space-y-2">
              <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 mx-auto flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h4 className="text-base font-bold text-slate-900 dark:text-white">
                Pembayaran Berhasil Dikirimkan!
              </h4>
              <p className="text-xs text-slate-500">
                Bukti pembayaran telah masuk ke antrean verifikasi kasir/bendahara sekolah.
              </p>
            </div>
          ) : (
            <form onSubmit={handleProcessPayment} className="space-y-4">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs space-y-1">
                <p className="text-slate-500">Tagihan:</p>
                <p className="font-bold text-slate-900 dark:text-white text-sm">
                  {selectedBillForPay.fee?.fee_name}
                </p>
                <p className="text-rose-600 font-mono font-bold">
                  Sisa Kewajiban: {formatRupiah(selectedBillForPay.amount_due)}
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Nominal yang Dibayarkan (Rp):
                </label>
                <input
                  type="number"
                  required
                  min={10000}
                  max={selectedBillForPay.amount_due}
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Metode Pembayaran:
                </label>
                <select
                  value={payMethod}
                  onChange={(e) => setPayMethod(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="Transfer Bank">Transfer Bank (Mandiri / BCA)</option>
                  <option value="E-Wallet">E-Wallet (GoPay, OVO, ShopeePay)</option>
                  <option value="Cash">Tunai di Loket Kasir</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedBillForPay(null)}
                  disabled={paying}
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={paying}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  {paying ? 'Memproses...' : 'Kirim Konfirmasi Bayar'}
                </Button>
              </div>
            </form>
          )}
        </Modal>
      )}
    </div>
  );
}

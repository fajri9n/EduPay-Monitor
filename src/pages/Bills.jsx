import React, { useState, useMemo } from 'react';
import Card, { CardContent, CardHeader, CardFooter } from '../components/ui/Card';
import Button from '../components/ui/Button';
import StatusBadge from '../components/ui/StatusBadge';
import Modal from '../components/ui/Modal';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { formatRupiah } from '../utils/formatRupiah';
import { formatDate, getDueCountdown, getDaysDifference } from '../utils/formatDate';
import { exportToCsv } from '../utils/exportCsv';
import {
  Receipt,
  Search,
  Filter,
  Download,
  Eye,
  Send,
  Plus,
  Trash2,
  Edit3,
  CreditCard,
  CheckCircle2,
  AlertTriangle,
  Clock,
  User,
  School,
  ArrowRight,
  ShieldAlert,
  ShieldCheck,
  Building2,
  Upload,
  Calendar
} from 'lucide-react';

export default function Bills() {
  const { currentUser, isSuperAdmin, isAdmin, isUser } = useAuth();
  const {
    bills,
    systemSettings,
    sendNotification,
    recordTransaction,
    refreshData,
  } = useData();

  // Filter State (Khusus Admin / Super Admin)
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClass, setSelectedClass] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Modals state
  const [selectedBillForDetail, setSelectedBillForDetail] = useState(null);
  const [selectedBillForPay, setSelectedBillForPay] = useState(null);
  const [selectedBillForReminder, setSelectedBillForReminder] = useState(null);
  const [showAddBillModal, setShowAddBillModal] = useState(false);

  // Form Bayar State (Untuk User / Siswa)
  const [payAmount, setPayAmount] = useState('');
  const [payMethod, setPayMethod] = useState('Transfer Bank');
  const [payProof, setPayProof] = useState('bukti_transfer_user.jpg');
  const [paySubmitting, setPaySubmitting] = useState(false);
  const [paySuccessMsg, setPaySuccessMsg] = useState('');

  // Form Kirim Pengingat State (Untuk Admin / Super Admin)
  const [reminderChannel, setReminderChannel] = useState('WhatsApp');
  const [reminderSending, setReminderSending] = useState(false);

  // Form Tambah Tagihan Baru (Khusus Super Admin)
  const [newBillForm, setNewBillForm] = useState({
    student_id: 1,
    fee_name: 'Iuran Semester Baru',
    amount: 650000,
    due_date: '2026-11-20',
  });

  // Filter Data berdasarkan Role
  // Jika role = 'user', hanya ambil tagihan milik student terkait (default student_id = 1 / Budi Pratama)
  const displayedBills = useMemo(() => {
    if (isUser) {
      const studentId = currentUser?.student_id || 1;
      return bills.filter((b) => b.student_id === studentId);
    }

    // Jika Admin / Super Admin: tampilkan semua dengan filter
    return bills.filter((b) => {
      const matchSearch =
        searchQuery === '' ||
        b.student?.nama?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.student?.nis?.includes(searchQuery) ||
        b.fee?.fee_name?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchClass =
        selectedClass === 'all' || b.student?.kelas === selectedClass;

      const matchStatus =
        selectedStatus === 'all' || b.payment_status === selectedStatus;

      return matchSearch && matchClass && matchStatus;
    });
  }, [bills, isUser, currentUser, searchQuery, selectedClass, selectedStatus]);

  // Pagination untuk Admin
  const totalPages = Math.ceil(displayedBills.length / itemsPerPage);
  const paginatedBills = useMemo(() => {
    if (isUser) return displayedBills; // User biasanya hanya punya 3-10 tagihan
    const start = (currentPage - 1) * itemsPerPage;
    return displayedBills.slice(start, start + itemsPerPage);
  }, [displayedBills, currentPage, isUser]);

  // Statistik Ringkas Tagihan
  const billStats = useMemo(() => {
    const list = displayedBills;
    const totalKewajiban = list.reduce((sum, b) => sum + (b.fee?.amount || 0), 0);
    const totalTunggakan = list.reduce((sum, b) => sum + Number(b.amount_due), 0);
    const totalTerbayar = totalKewajiban - totalTunggakan;
    const lunasCount = list.filter((b) => b.payment_status === 'Paid').length;
    const overdueCount = list.filter((b) => b.payment_status === 'Overdue').length;

    return {
      totalKewajiban,
      totalTunggakan,
      totalTerbayar,
      lunasCount,
      overdueCount,
      persentaseLunas: totalKewajiban > 0 ? ((totalTerbayar / totalKewajiban) * 100).toFixed(1) : 0,
    };
  }, [displayedBills]);

  // Handler Submit Pembayaran oleh Siswa/User
  const handleUserPaymentSubmit = async (e) => {
    e.preventDefault();
    if (!payAmount || Number(payAmount) <= 0) {
      alert('Masukkan nominal pembayaran yang valid.');
      return;
    }

    setPaySubmitting(true);
    try {
      await recordTransaction({
        bill_id: selectedBillForPay.bill_id,
        amount_paid: Number(payAmount),
        payment_method: payMethod,
        proof_file: payProof,
        verification_status: 'Pending', // Masuk antrean verifikasi bendahara
      });

      setPaySubmitting(false);
      setPaySuccessMsg('Pembayaran berhasil dikirim! Menunggu verifikasi bukti oleh bendahara.');
      setTimeout(() => {
        setPaySuccessMsg('');
        setSelectedBillForPay(null);
        setPayAmount('');
      }, 1500);
    } catch (err) {
      setPaySubmitting(false);
      alert('Gagal mengirim pembayaran: ' + err.message);
    }
  };

  // Handler Kirim Pengingat Tunggakan oleh Admin
  const handleSendReminder = async () => {
    if (!selectedBillForReminder) return;
    setReminderSending(true);
    try {
      await sendNotification(selectedBillForReminder.bill_id, reminderChannel);
      setReminderSending(false);
      alert(`Pengingat ${reminderChannel} berhasil dikirim ke orang tua ${selectedBillForReminder.student.nama}!`);
      setSelectedBillForReminder(null);
    } catch (err) {
      setReminderSending(false);
      alert('Gagal mengirim notifikasi: ' + err.message);
    }
  };

  // Handler Ekspor CSV
  const handleExportCsv = () => {
    const columns = [
      { key: 'bill_id', label: 'ID Tagihan' },
      { key: 'nis', label: 'NIS', formatter: (_, b) => b.student?.nis },
      { key: 'nama_siswa', label: 'Nama Siswa', formatter: (_, b) => b.student?.nama },
      { key: 'kelas', label: 'Kelas', formatter: (_, b) => b.student?.kelas },
      { key: 'fee_name', label: 'Nama Tagihan', formatter: (_, b) => b.fee?.fee_name },
      { key: 'amount', label: 'Nominal Asli (Rp)', formatter: (_, b) => b.fee?.amount },
      { key: 'amount_due', label: 'Sisa Tagihan (Rp)', formatter: (v) => v },
      { key: 'due_date', label: 'Jatuh Tempo', formatter: (_, b) => b.fee?.due_date },
      { key: 'payment_status', label: 'Status Pembayaran', formatter: (v) => v },
    ];
    exportToCsv(displayedBills, columns, isUser ? 'tagihan-saya' : 'master-tagihan-siswa');
  };

  const institutionName = systemSettings?.institutionName || 'SMA Nusantara Mandiri';
  const bankAccounts = systemSettings?.bankAccounts || [
    { bank: 'Bank Mandiri', accountNo: '123-00-9876543-1', holder: 'Yayasan Nusantara Mandiri' },
    { bank: 'BCA', accountNo: '882-019-2831', holder: 'Yayasan Nusantara Mandiri' },
  ];

  return (
    <div className="space-y-6">
      {/* ========================================================================= */}
      {/* 1. HEADER SECTION DENGAN SPESIFIKASI PERAN */}
      {/* ========================================================================= */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2.5">
              <Receipt className="w-7 h-7 text-indigo-600 dark:text-indigo-400" />
              {isUser ? 'Tagihan Pembayaran Saya' : 'Kelola & Monitoring Tagihan Seluruh Siswa'}
            </h1>
            <span
              className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                isSuperAdmin
                  ? 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950 dark:text-purple-300'
                  : isAdmin
                  ? 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950 dark:text-indigo-300'
                  : 'bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-950 dark:text-teal-300'
              }`}
            >
              {isSuperAdmin ? 'Super Admin' : isAdmin ? 'Admin' : 'User (Siswa/Wali)'}
            </span>
          </div>

          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {isUser
              ? `Portal tagihan SPP & iuran akademik siswa an. ${currentUser?.nama_lengkap || 'Budi Pratama'}. Lakukan pembayaran sebelum tanggal jatuh tempo.`
              : 'Admin & Super Admin: Memonitor status pembayaran seluruh kelas, melacak tunggakan, dan mengelola tagihan institusi.'}
          </p>
        </div>

        {/* Action Header Buttons */}
        <div className="flex items-center gap-2.5">
          <Button variant="outline" size="sm" onClick={handleExportCsv} icon={Download}>
            Ekspor CSV
          </Button>

          {isSuperAdmin && (
            <Button
              size="sm"
              onClick={() => setShowAddBillModal(true)}
              className="bg-purple-600 hover:bg-purple-700 text-white shadow-md shadow-purple-600/20"
              icon={Plus}
            >
              Tambah Tagihan Siswa
            </Button>
          )}
        </div>
      </div>

      {/* Super Admin Notice */}
      {isSuperAdmin && (
        <div className="p-3.5 rounded-2xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 text-purple-900 dark:text-purple-200 text-xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <ShieldAlert className="w-5 h-5 text-purple-600 dark:text-purple-400 shrink-0" />
            <span>
              <b>Hak Super Admin Aktif:</b> Anda memiliki wewenang untuk melihat seluruh tagihan, menambah struktur tagihan baru, mengedit, serta menghapus data tagihan jika terjadi kesalahan sistem.
            </span>
          </div>
        </div>
      )}

      {/* User Information Card (Jika login sebagai User/Siswa) */}
      {isUser && (
        <Card className="bg-gradient-to-r from-teal-500/10 via-indigo-500/10 to-transparent border-teal-200 dark:border-teal-900">
          <CardContent className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-teal-600 text-white flex items-center justify-center font-bold text-lg shadow-md">
                <User className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  Budi Pratama <span className="text-xs text-slate-500 font-normal">(NIS: 20260001)</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Kelas: <span className="font-semibold text-slate-800 dark:text-slate-200">X-A</span> • Wali: Bambang Pratama • {institutionName}
                </p>
              </div>
            </div>

            <div className="text-left sm:text-right">
              <p className="text-xs text-slate-500">Total Sisa Tunggakan Anda</p>
              <p className="text-2xl font-extrabold text-rose-600 dark:text-rose-400">
                {formatRupiah(billStats.totalTunggakan)}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ========================================================================= */}
      {/* 2. KARTU STATISTIK KPI TAGIHAN */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-indigo-500">
          <CardContent className="p-4">
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              {isUser ? 'Total Kewajiban Saya' : 'Total Tagihan Diterbitkan'}
            </p>
            <h3 className="text-xl font-extrabold text-slate-900 dark:text-white mt-1">
              {formatRupiah(billStats.totalKewajiban)}
            </h3>
            <span className="text-[11px] text-slate-400 mt-1 block">
              {displayedBills.length} Item tagihan tercatat
            </span>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-emerald-500">
          <CardContent className="p-4">
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              {isUser ? 'Sudah Saya Bayar' : 'Total Kas Terverifikasi'}
            </p>
            <h3 className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">
              {formatRupiah(billStats.totalTerbayar)}
            </h3>
            <span className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1 block">
              {billStats.lunasCount} tagihan berstatus Lunas
            </span>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-rose-500">
          <CardContent className="p-4">
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              {isUser ? 'Sisa Tunggakan Belum Bayar' : 'Sisa Tunggakan Keseluruhan'}
            </p>
            <h3 className="text-xl font-extrabold text-rose-600 dark:text-rose-400 mt-1">
              {formatRupiah(billStats.totalTunggakan)}
            </h3>
            <span className="text-[11px] text-rose-500 mt-1 block">
              {billStats.overdueCount} tagihan lewat jatuh tempo
            </span>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-teal-500">
          <CardContent className="p-4">
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              {isUser ? 'Tingkat Kelunasan Saya' : 'Persentase Kolektibilitas'}
            </p>
            <h3 className="text-xl font-extrabold text-teal-600 dark:text-teal-400 mt-1">
              {billStats.persentaseLunas}%
            </h3>
            <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full mt-2 overflow-hidden">
              <div
                className="bg-teal-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.min(billStats.persentaseLunas, 100)}%` }}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ========================================================================= */}
      {/* 3. FILTER BAR (HANYA DITAMPILKAN UNTUK ADMIN & SUPER ADMIN) */}
      {/* ========================================================================= */}
      {!isUser && (
        <Card className="p-4 bg-white dark:bg-slate-900">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari siswa, NIS, atau tagihan..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Filter Kelas */}
            <div>
              <select
                value={selectedClass}
                onChange={(e) => {
                  setSelectedClass(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
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

            {/* Filter Status */}
            <div>
              <select
                value={selectedStatus}
                onChange={(e) => {
                  setSelectedStatus(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="all">Semua Status Kelunasan</option>
                <option value="Paid">Lunas (Paid)</option>
                <option value="Partial">Cicilan (Partial)</option>
                <option value="Unpaid">Menunggak (Unpaid)</option>
                <option value="Overdue">Lewat Jatuh Tempo (Overdue)</option>
              </select>
            </div>

            {/* Reset Filter Button */}
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                className="w-full text-xs"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedClass('all');
                  setSelectedStatus('all');
                  setCurrentPage(1);
                }}
              >
                Reset Filter
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* ========================================================================= */}
      {/* 4. TABEL DAFTAR TAGIHAN */}
      {/* ========================================================================= */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100/75 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold uppercase tracking-wider">
                {!isUser && <th className="p-3.5">Siswa</th>}
                <th className="p-3.5">Nama Tagihan</th>
                <th className="p-3.5">Nominal Biaya</th>
                <th className="p-3.5">Sisa Tagihan</th>
                <th className="p-3.5">Jatuh Tempo</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {paginatedBills.length === 0 ? (
                <tr>
                  <td colSpan={isUser ? 6 : 7} className="p-8 text-center text-slate-400">
                    Tidak ada tagihan yang sesuai dengan kriteria filter.
                  </td>
                </tr>
              ) : (
                paginatedBills.map((b) => {
                  const countdown = getDueCountdown(b.fee?.due_date);
                  const isPaid = b.payment_status === 'Paid';
                  return (
                    <tr
                      key={b.bill_id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-850 transition-colors"
                    >
                      {/* Kolom Siswa (hanya tampil jika Admin/Super Admin) */}
                      {!isUser && (
                        <td className="p-3.5">
                          <div className="font-semibold text-slate-900 dark:text-slate-100">
                            {b.student?.nama}
                          </div>
                          <div className="text-[11px] text-slate-400 font-mono">
                            {b.student?.nis} • Kelas {b.student?.kelas}
                          </div>
                        </td>
                      )}

                      {/* Nama Tagihan */}
                      <td className="p-3.5">
                        <div className="font-semibold text-slate-900 dark:text-slate-100">
                          {b.fee?.fee_name}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          Diterbitkan: {formatDate(b.created_at)}
                        </div>
                      </td>

                      {/* Nominal Awal */}
                      <td className="p-3.5 font-medium text-slate-700 dark:text-slate-300">
                        {formatRupiah(b.fee?.amount)}
                      </td>

                      {/* Sisa Tagihan (Amount Due) */}
                      <td className="p-3.5 font-bold">
                        {b.amount_due > 0 ? (
                          <span className="text-rose-600 dark:text-rose-400">
                            {formatRupiah(b.amount_due)}
                          </span>
                        ) : (
                          <span className="text-emerald-600 dark:text-emerald-400">Rp 0 (Lunas)</span>
                        )}
                      </td>

                      {/* Jatuh Tempo & Countdown */}
                      <td className="p-3.5">
                        <div className="text-slate-800 dark:text-slate-200">
                          {formatDate(b.fee?.due_date)}
                        </div>
                        {!isPaid && (
                          <span
                            className={`inline-block text-[10px] font-bold ${
                              countdown.isOverdue
                                ? 'text-rose-600 dark:text-rose-400'
                                : 'text-amber-600 dark:text-amber-400'
                            }`}
                          >
                            {countdown.label}
                          </span>
                        )}
                      </td>

                      {/* Status Kelunasan */}
                      <td className="p-3.5">
                        <StatusBadge
                          status={b.payment_status}
                          type="payment"
                          overdueDays={Math.abs(countdown.daysDiff)}
                          size="sm"
                        />
                      </td>

                      {/* Kolom Aksi Berdasarkan Peran */}
                      <td className="p-3.5 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {isUser ? (
                            // AKSI USER: BAYAR SEKARANG ATAU LIHAT DETAIL
                            <>
                              {!isPaid && (
                                <Button
                                  size="sm"
                                  onClick={() => setSelectedBillForPay(b)}
                                  className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs text-xs px-3"
                                  icon={CreditCard}
                                >
                                  Bayar Sekarang
                                </Button>
                              )}
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setSelectedBillForDetail(b)}
                                title="Lihat Rincian Cicilan"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </Button>
                            </>
                          ) : (
                            // AKSI ADMIN / SUPER ADMIN: DETAIL, PENGINGAT, EDIT
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setSelectedBillForDetail(b)}
                                title="Lihat Detail Tagihan & Riwayat Cicilan"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </Button>

                              {!isPaid && (
                                <Button
                                  size="sm"
                                  variant="secondary"
                                  onClick={() => setSelectedBillForReminder(b)}
                                  title="Kirim Notifikasi Pengingat ke Orang Tua"
                                  className="text-amber-700 hover:text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200"
                                >
                                  <Send className="w-3.5 h-3.5" />
                                </Button>
                              )}

                              {isSuperAdmin && (
                                <button
                                  type="button"
                                  onClick={() => alert(`Super Admin: Mengubah struktur tagihan #${b.bill_id}`)}
                                  className="p-1.5 text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-950/40 rounded-lg transition-colors"
                                  title="Super Admin: Edit Tagihan"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer (Untuk Admin / Super Admin) */}
        {!isUser && totalPages > 1 && (
          <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
            <span>
              Menampilkan {(currentPage - 1) * itemsPerPage + 1} -{' '}
              {Math.min(currentPage * itemsPerPage, displayedBills.length)} dari {displayedBills.length} tagihan
            </span>
            <div className="flex items-center gap-1.5">
              <Button
                size="sm"
                variant="outline"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => p - 1)}
              >
                Sebelumnya
              </Button>
              <span className="px-3 py-1 font-bold">
                {currentPage} / {totalPages}
              </span>
              <Button
                size="sm"
                variant="outline"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => p + 1)}
              >
                Selanjutnya
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Info Rekening Sekolah untuk Pembayaran (Tampil untuk Siswa/User) */}
      {isUser && (
        <Card>
          <CardHeader
            title="Kanal Pembayaran Resmi Sekolah"
            subtitle="Gunakan rekening di bawah ini untuk transfer biaya pendidikan Anda"
            action={<Building2 className="w-5 h-5 text-teal-600" />}
          />
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {bankAccounts.map((acc, i) => (
              <div
                key={i}
                className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between"
              >
                <div>
                  <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                    {acc.bank}
                  </span>
                  <div className="text-base font-mono font-extrabold text-slate-900 dark:text-white mt-0.5">
                    {acc.accountNo}
                  </div>
                  <div className="text-[11px] text-slate-400">a.n. {acc.holder}</div>
                </div>
                <div className="p-2 rounded-xl bg-white dark:bg-slate-900 shadow-xs border border-slate-200 dark:border-slate-700">
                  <CreditCard className="w-6 h-6 text-slate-600 dark:text-slate-300" />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* ========================================================================= */}
      {/* 5. MODAL BAYAR SEKARANG (KHUSUS USER / SISWA) */}
      {/* ========================================================================= */}
      {selectedBillForPay && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedBillForPay(null)}
          title={`Konfirmasi Pembayaran ${selectedBillForPay.fee?.fee_name}`}
          subtitle={`Sisa tagihan yang harus dibayar: ${formatRupiah(selectedBillForPay.amount_due)}`}
        >
          {paySuccessMsg ? (
            <div className="p-6 text-center space-y-3">
              <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto animate-bounce" />
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                Bukti Pembayaran Terkirim!
              </h3>
              <p className="text-xs text-slate-500">{paySuccessMsg}</p>
            </div>
          ) : (
            <form onSubmit={handleUserPaymentSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Nominal Pembayaran (Rp)
                </label>
                <input
                  type="number"
                  required
                  max={selectedBillForPay.amount_due}
                  min={50000}
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  placeholder={`Contoh: ${selectedBillForPay.amount_due}`}
                  className="w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 font-bold"
                />
                <div className="flex gap-2 mt-1.5">
                  <button
                    type="button"
                    onClick={() => setPayAmount(selectedBillForPay.amount_due)}
                    className="text-[11px] text-indigo-600 hover:underline font-semibold"
                  >
                    Bayar Lunas ({formatRupiah(selectedBillForPay.amount_due)})
                  </button>
                  <button
                    type="button"
                    onClick={() => setPayAmount(Math.round(selectedBillForPay.amount_due / 2))}
                    className="text-[11px] text-slate-500 hover:underline"
                  >
                    Cicil 50% ({formatRupiah(Math.round(selectedBillForPay.amount_due / 2))})
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Metode Pembayaran
                </label>
                <select
                  value={payMethod}
                  onChange={(e) => setPayMethod(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100"
                >
                  <option value="Transfer Bank">Transfer Bank (Mandiri / BCA / BRI)</option>
                  <option value="E-Wallet">E-Wallet (Dana / GoPay / OVO)</option>
                  <option value="Cash">Tunai di Loket Tata Usaha</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Upload Bukti Transfer / Resi
                </label>
                <div className="p-4 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl text-center bg-slate-50 dark:bg-slate-800/40">
                  <Upload className="w-6 h-6 text-slate-400 mx-auto mb-1" />
                  <p className="text-xs text-slate-500">Klik atau seret file bukti transfer ke sini</p>
                  <span className="text-[10px] text-slate-400 font-mono mt-1 block">
                    File: {payProof} (Format: JPG, PNG, PDF maks. 5MB)
                  </span>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <Button variant="outline" size="sm" onClick={() => setSelectedBillForPay(null)}>
                  Batal
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  loading={paySubmitting}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  Kirim Bukti Pembayaran
                </Button>
              </div>
            </form>
          )}
        </Modal>
      )}

      {/* ========================================================================= */}
      {/* 6. MODAL DETAIL RIWAYAT CICILAN & SISWA */}
      {/* ========================================================================= */}
      {selectedBillForDetail && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedBillForDetail(null)}
          title={`Detail Tagihan: ${selectedBillForDetail.fee?.fee_name}`}
          subtitle={`Siswa: ${selectedBillForDetail.student?.nama} (${selectedBillForDetail.student?.nis})`}
          maxWidth="max-w-2xl"
        >
          <div className="space-y-5">
            {/* Informasi Siswa & Orang Tua */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <span className="text-slate-400 block text-[10px]">Kelas Siswa</span>
                <span className="font-bold">{selectedBillForDetail.student?.kelas}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Nama Wali</span>
                <span className="font-bold">{selectedBillForDetail.student?.nama_orang_tua}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">WhatsApp Wali</span>
                <span className="font-mono">{selectedBillForDetail.student?.no_hp_ortu}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Total Biaya</span>
                <span className="font-bold">{formatRupiah(selectedBillForDetail.fee?.amount)}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Sisa Tunggakan</span>
                <span className="font-bold text-rose-600">
                  {formatRupiah(selectedBillForDetail.amount_due)}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Status</span>
                <StatusBadge status={selectedBillForDetail.payment_status} size="sm" />
              </div>
            </div>

            {/* Riwayat Pembayaran untuk Tagihan ini */}
            <div>
              <h4 className="font-bold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
                Riwayat Transaksi Pembayaran Tagihan Ini
              </h4>

              {selectedBillForDetail.transactions && selectedBillForDetail.transactions.length > 0 ? (
                <div className="space-y-2">
                  {selectedBillForDetail.transactions.map((tx) => (
                    <div
                      key={tx.transaction_id}
                      className="p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs"
                    >
                      <div>
                        <div className="font-semibold text-slate-900 dark:text-white">
                          {formatRupiah(tx.amount_paid)} • {tx.payment_method}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                          {tx.reference_number} • {formatDate(tx.transaction_date)}
                        </div>
                      </div>
                      <StatusBadge status={tx.verification_status} type="verification" size="sm" />
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400 p-4 text-center bg-slate-50 dark:bg-slate-800 rounded-xl">
                  Belum ada transaksi pembayaran yang dicatat untuk tagihan ini.
                </p>
              )}
            </div>
          </div>
        </Modal>
      )}

      {/* ========================================================================= */}
      {/* 7. MODAL PENGINGAT (KHUSUS ADMIN / SUPER ADMIN) */}
      {/* ========================================================================= */}
      {selectedBillForReminder && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedBillForReminder(null)}
          title={`Kirim Pengingat Tunggakan`}
          subtitle={`Wali: ${selectedBillForReminder.student?.nama_orang_tua} • Siswa: ${selectedBillForReminder.student?.nama}`}
        >
          <div className="space-y-4">
            <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs">
              <p className="font-bold text-amber-900 dark:text-amber-200">
                Sisa Tunggakan: {formatRupiah(selectedBillForReminder.amount_due)}
              </p>
              <p className="text-[11px] text-amber-700 dark:text-amber-300 mt-0.5">
                Tagihan {selectedBillForReminder.fee?.fee_name} jatuh tempo pada {formatDate(selectedBillForReminder.fee?.due_date)}.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Kanal Pengiriman
              </label>
              <div className="flex gap-3">
                {['WhatsApp', 'Email'].map((ch) => (
                  <button
                    key={ch}
                    type="button"
                    onClick={() => setReminderChannel(ch)}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all ${
                      reminderChannel === ch
                        ? 'bg-indigo-50 border-indigo-500 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600'
                    }`}
                  >
                    {ch}
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setSelectedBillForReminder(null)}>
                Batal
              </Button>
              <Button
                size="sm"
                loading={reminderSending}
                onClick={handleSendReminder}
                className="bg-indigo-600 hover:bg-indigo-700 text-white"
                icon={Send}
              >
                Kirim Pengingat Sekarang
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* ========================================================================= */}
      {/* 8. MODAL TAMBAH TAGIHAN (KHUSUS SUPER ADMIN) */}
      {/* ========================================================================= */}
      {showAddBillModal && isSuperAdmin && (
        <Modal
          isOpen={true}
          onClose={() => setShowAddBillModal(false)}
          title="Tambah Tagihan Baru (Hak Super Admin)"
          subtitle="Super Admin dapat membuat struktur tagihan baru untuk siswa"
        >
          <div className="space-y-3.5">
            <div>
              <label className="block text-xs font-semibold mb-1">Nama Tagihan</label>
              <input
                type="text"
                value={newBillForm.fee_name}
                onChange={(e) => setNewBillForm({ ...newBillForm, fee_name: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border rounded-xl"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1">Nominal Biaya (Rp)</label>
              <input
                type="number"
                value={newBillForm.amount}
                onChange={(e) => setNewBillForm({ ...newBillForm, amount: Number(e.target.value) })}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border rounded-xl"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1">Tanggal Jatuh Tempo</label>
              <input
                type="date"
                value={newBillForm.due_date}
                onChange={(e) => setNewBillForm({ ...newBillForm, due_date: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border rounded-xl"
              />
            </div>

            <div className="pt-3 flex items-center justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setShowAddBillModal(false)}>
                Batal
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  alert('Tagihan baru berhasil diterbitkan oleh Super Admin!');
                  setShowAddBillModal(false);
                }}
                className="bg-purple-600 hover:bg-purple-700 text-white"
              >
                Simpan & Terbitkan Tagihan
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

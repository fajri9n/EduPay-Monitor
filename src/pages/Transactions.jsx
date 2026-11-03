import React, { useState, useMemo } from 'react';
import Card, { CardContent, CardHeader } from '../components/ui/Card';
import Button from '../components/ui/Button';
import StatusBadge from '../components/ui/StatusBadge';
import Modal from '../components/ui/Modal';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { formatRupiah } from '../utils/formatRupiah';
import { formatDate } from '../utils/formatDate';
import { exportToCsv } from '../utils/exportCsv';
import {
  ArrowLeftRight,
  Search,
  Filter,
  Download,
  CheckCircle2,
  XCircle,
  Clock,
  Plus,
  Eye,
  AlertTriangle,
  Receipt,
  CreditCard,
  Building2,
  Calendar,
  Check,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

export default function Transactions() {
  const { currentUser, isSuperAdmin, isAdmin } = useAuth();
  const {
    transactions,
    bills,
    students,
    verifyTransaction,
    rejectTransaction,
    recordTransaction,
  } = useData();

  // Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all'); // 'all', 'Pending', 'Verified', 'Rejected'
  const [selectedMethod, setSelectedMethod] = useState('all'); // 'all', 'Transfer Bank', 'E-Wallet', 'Cash'
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  // Modals State
  const [showAddPaymentModal, setShowAddPaymentModal] = useState(false);
  const [rejectingTx, setRejectingTx] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('Bukti pembayaran tidak sesuai dengan mutasi rekening');
  const [viewingTx, setViewingTx] = useState(null);

  // Form Tambah Pembayaran Kasir State
  const [formStudentId, setFormStudentId] = useState('');
  const [formBillId, setFormBillId] = useState('');
  const [formAmount, setFormAmount] = useState('');
  const [formMethod, setFormMethod] = useState('Cash');
  const [formNotes, setFormNotes] = useState('');
  const [submittingPayment, setSubmittingPayment] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const triggerToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  // Daftar tagihan milik siswa yang dipilih di form
  const availableBillsForSelectedStudent = useMemo(() => {
    if (!formStudentId) return [];
    return bills.filter(
      (b) => b.student_id === Number(formStudentId) && b.amount_due > 0
    );
  }, [bills, formStudentId]);

  // Filter Transaksi
  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => {
      const matchSearch =
        t.student?.nama?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.student?.nis?.includes(searchQuery) ||
        t.reference_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.fee?.fee_name?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchStatus =
        selectedStatus === 'all' || t.verification_status === selectedStatus;
      const matchMethod =
        selectedMethod === 'all' || t.payment_method === selectedMethod;

      return matchSearch && matchStatus && matchMethod;
    });
  }, [transactions, searchQuery, selectedStatus, selectedMethod]);

  // Pagination
  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage) || 1;
  const paginatedTransactions = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredTransactions.slice(start, start + itemsPerPage);
  }, [filteredTransactions, currentPage]);

  // Statistik KPI Transaksi
  const verifiedTxs = transactions.filter((t) => t.verification_status === 'Verified');
  const totalKasVerified = verifiedTxs.reduce((s, t) => s + Number(t.amount_paid), 0);
  const pendingCount = transactions.filter((t) => t.verification_status === 'Pending').length;
  const rejectedCount = transactions.filter((t) => t.verification_status === 'Rejected').length;

  // Handle Verifikasi Real-time
  const handleVerify = async (tx) => {
    try {
      await verifyTransaction(tx.transaction_id, currentUser?.user_id || 2);
      triggerToast(`Transaksi ${tx.reference_number} berhasil diverifikasi!`);
    } catch (err) {
      alert('Gagal memverifikasi transaksi: ' + err.message);
    }
  };

  // Handle Tolak Real-time
  const handleRejectSubmit = async (e) => {
    e.preventDefault();
    if (!rejectingTx) return;
    try {
      await rejectTransaction(rejectingTx.transaction_id, rejectionReason);
      setRejectingTx(null);
      triggerToast(`Transaksi ${rejectingTx.reference_number} telah ditolak.`);
    } catch (err) {
      alert('Gagal menolak transaksi: ' + err.message);
    }
  };

  // Handle Catat Pembayaran Baru oleh Kasir/Admin
  const handleCreatePaymentSubmit = async (e) => {
    e.preventDefault();
    if (!formBillId || !formAmount || Number(formAmount) <= 0) {
      alert('Silakan pilih tagihan dan isi nominal pembayaran yang valid.');
      return;
    }

    try {
      setSubmittingPayment(true);
      await recordTransaction({
        bill_id: Number(formBillId),
        amount_paid: Number(formAmount),
        payment_method: formMethod,
        transaction_date: '2026-11-03 11:30:00',
        verification_status: 'Verified', // Kasir langsung memverifikasi transaksi yang dicatat di loket
      });

      setShowAddPaymentModal(false);
      setFormStudentId('');
      setFormBillId('');
      setFormAmount('');
      setFormNotes('');
      triggerToast('Pembayaran kasir berhasil dicatat dan status tagihan terbarui!');
    } catch (err) {
      alert('Gagal mencatat pembayaran: ' + err.message);
    } finally {
      setSubmittingPayment(false);
    }
  };

  // Ekspor CSV
  const handleExportCsv = () => {
    const exportData = filteredTransactions.map((t) => ({
      'No Referensi': t.reference_number,
      Tanggal: t.transaction_date,
      NIS: t.student?.nis || '',
      'Nama Siswa': t.student?.nama || '',
      Kelas: t.student?.kelas || '',
      'Nama Tagihan': t.fee?.fee_name || '',
      'Nominal Bayar': t.amount_paid,
      'Metode Pembayaran': t.payment_method,
      'Status Verifikasi': t.verification_status,
      Alasan: t.rejection_reason || '',
    }));
    exportToCsv('Laporan_Transaksi_Pembayaran', exportData);
    triggerToast('Data transaksi berhasil diekspor.');
  };

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-600 text-white px-4 py-3 rounded-xl shadow-xl flex items-center gap-2 text-xs font-semibold animate-bounce">
          <CheckCircle2 className="w-4 h-4" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Halaman */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <ArrowLeftRight className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            Transaksi & Verifikasi Kasir
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Validasi setoran SPP siswa, persetujuan bukti transfer bank / e-wallet, dan pencatatan pembayaran loket tunai secara real-time.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCsv}
            className="text-xs py-2 px-3 flex items-center gap-1.5"
          >
            <Download className="w-4 h-4" />
            Ekspor CSV
          </Button>

          <Button
            size="sm"
            onClick={() => setShowAddPaymentModal(true)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs py-2 px-3.5 shadow-md shadow-emerald-600/20 flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            Catat Pembayaran Baru
          </Button>
        </div>
      </div>

      {/* 4 Kartu KPI Transaksi */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-emerald-500">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500">Kas Terverifikasi</p>
              <h3 className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">
                {formatRupiah(totalKasVerified)}
              </h3>
              <span className="text-[10px] text-emerald-600 font-semibold">
                {verifiedTxs.length} Transaksi Sah
              </span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-amber-500">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500">Menunggu Verifikasi</p>
              <h3 className="text-2xl font-extrabold text-amber-600 dark:text-amber-400 mt-1">
                {pendingCount}
              </h3>
              <span className="text-[10px] text-amber-600 font-semibold">Perlu Tindakan Kasir</span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-rose-500">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500">Setoran Ditolak</p>
              <h3 className="text-2xl font-extrabold text-rose-600 dark:text-rose-400 mt-1">
                {rejectedCount}
              </h3>
              <span className="text-[10px] text-rose-500 font-semibold">Bukti Tidak Valid</span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center">
              <XCircle className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-indigo-500">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500">Total Seluruh Transaksi</p>
              <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">
                {transactions.length}
              </h3>
              <span className="text-[10px] text-indigo-500 font-semibold">Semester Ganjil 2026/2027</span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 flex items-center justify-center">
              <Receipt className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter & Search Bar */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Cari no referensi, siswa, NIS, atau nama tagihan..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={selectedStatus}
                onChange={(e) => {
                  setSelectedStatus(e.target.value);
                  setCurrentPage(1);
                }}
                className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="all">Semua Status Verifikasi</option>
                <option value="Pending">Menunggu Verifikasi (Pending)</option>
                <option value="Verified">Terverifikasi (Verified)</option>
                <option value="Rejected">Ditolak (Rejected)</option>
              </select>

              <select
                value={selectedMethod}
                onChange={(e) => {
                  setSelectedMethod(e.target.value);
                  setCurrentPage(1);
                }}
                className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="all">Semua Metode</option>
                <option value="Transfer Bank">Transfer Bank</option>
                <option value="E-Wallet">E-Wallet</option>
                <option value="Cash">Tunai (Cash)</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabel Transaksi */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-bold uppercase tracking-wider">
                  <th className="p-3.5">No Referensi / Tanggal</th>
                  <th className="p-3.5">Siswa</th>
                  <th className="p-3.5">Tagihan</th>
                  <th className="p-3.5">Nominal Bayar</th>
                  <th className="p-3.5">Metode Bayar</th>
                  <th className="p-3.5">Status Verifikasi</th>
                  <th className="p-3.5 text-center">Aksi Kasir</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {paginatedTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-400">
                      Tidak ada transaksi yang cocok dengan filter pencarian.
                    </td>
                  </tr>
                ) : (
                  paginatedTransactions.map((tx) => (
                    <tr
                      key={tx.transaction_id}
                      className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      {/* No Referensi & Tanggal */}
                      <td className="p-3.5">
                        <div className="font-mono font-bold text-slate-900 dark:text-white">
                          {tx.reference_number || `TRX-${tx.transaction_id}`}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {formatDate(tx.transaction_date, true)}
                        </div>
                      </td>

                      {/* Siswa Info */}
                      <td className="p-3.5">
                        <div className="font-semibold text-slate-900 dark:text-white">
                          {tx.student?.nama}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          NIS {tx.student?.nis} • Kelas {tx.student?.kelas}
                        </div>
                      </td>

                      {/* Tagihan */}
                      <td className="p-3.5 font-medium text-slate-700 dark:text-slate-300">
                        {tx.fee?.fee_name}
                      </td>

                      {/* Nominal Bayar */}
                      <td className="p-3.5 font-mono font-extrabold text-emerald-600 dark:text-emerald-400">
                        {formatRupiah(tx.amount_paid)}
                      </td>

                      {/* Metode Bayar */}
                      <td className="p-3.5">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                          <CreditCard className="w-3 h-3 text-slate-500" />
                          {tx.payment_method}
                        </span>
                      </td>

                      {/* Status Verifikasi */}
                      <td className="p-3.5">
                        <StatusBadge status={tx.verification_status} type="verification" size="sm" />
                        {tx.rejection_reason && (
                          <div className="text-[10px] text-rose-500 font-medium mt-1 truncate max-w-[150px]">
                            Alasan: {tx.rejection_reason}
                          </div>
                        )}
                      </td>

                      {/* Aksi Kasir */}
                      <td className="p-3.5 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {tx.verification_status === 'Pending' ? (
                            <>
                              <button
                                onClick={() => handleVerify(tx)}
                                className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] flex items-center gap-1 transition-colors shadow-xs"
                                title="Setujui dan Verifikasi Pembayaran"
                              >
                                <Check className="w-3 h-3" />
                                Verifikasi
                              </button>
                              <button
                                onClick={() => {
                                  setRejectingTx(tx);
                                  setRejectionReason('Bukti transfer tidak sesuai dengan mutasi rekening');
                                }}
                                className="px-2.5 py-1 rounded-lg bg-rose-500 hover:bg-rose-600 text-white font-bold text-[11px] flex items-center gap-1 transition-colors shadow-xs"
                                title="Tolak Bukti Pembayaran"
                              >
                                <XCircle className="w-3 h-3" />
                                Tolak
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={() => setViewingTx(tx)}
                              className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-slate-800 rounded-lg transition-colors"
                              title="Lihat Detail Kwitansi"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="p-3.5 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
              <span>
                Menampilkan {(currentPage - 1) * itemsPerPage + 1} -{' '}
                {Math.min(currentPage * itemsPerPage, filteredTransactions.length)} dari{' '}
                {filteredTransactions.length} transaksi
              </span>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="py-1 px-2 h-auto"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </Button>
                <span className="px-2 font-semibold text-slate-700 dark:text-slate-300">
                  {currentPage} / {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  className="py-1 px-2 h-auto"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* =========================================================================
          MODAL: CATAT PEMBAYARAN BARU (KASIR MANUAL ENTRY)
          ========================================================================= */}
      {showAddPaymentModal && (
        <Modal
          isOpen={true}
          onClose={() => setShowAddPaymentModal(false)}
          title="Catat Pembayaran Kasir Baru"
          size="md"
        >
          <form onSubmit={handleCreatePaymentSubmit} className="space-y-4">
            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-xs text-emerald-800 dark:text-emerald-300">
              Transaksi yang dicatatkan di loket kasir otomatis berstatus <b>Terverifikasi (Verified)</b> dan mengurangi tunggakan siswa secara langsung.
            </div>

            {/* Pilih Siswa */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Pilih Siswa:
              </label>
              <select
                required
                value={formStudentId}
                onChange={(e) => {
                  setFormStudentId(e.target.value);
                  setFormBillId('');
                  setFormAmount('');
                }}
                className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">-- Pilih Siswa Pembayar --</option>
                {students.map((s) => (
                  <option key={s.student_id} value={s.student_id}>
                    {s.nis} - {s.nama} ({s.kelas})
                  </option>
                ))}
              </select>
            </div>

            {/* Pilih Tagihan */}
            {formStudentId && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Pilih Tagihan yang Dibayarkan:
                </label>
                {availableBillsForSelectedStudent.length === 0 ? (
                  <p className="text-xs text-emerald-600 font-semibold p-2 bg-emerald-50 rounded-lg">
                    Siswa ini tidak memiliki tunggakan tagihan aktif (Seluruhnya Lunas).
                  </p>
                ) : (
                  <select
                    required
                    value={formBillId}
                    onChange={(e) => {
                      const bId = e.target.value;
                      setFormBillId(bId);
                      const billObj = availableBillsForSelectedStudent.find(
                        (b) => b.bill_id === Number(bId)
                      );
                      if (billObj) {
                        setFormAmount(String(billObj.amount_due));
                      }
                    }}
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">-- Pilih Tagihan Siswa --</option>
                    {availableBillsForSelectedStudent.map((b) => (
                      <option key={b.bill_id} value={b.bill_id}>
                        {b.fee?.fee_name} - Sisa: {formatRupiah(b.amount_due)}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            )}

            {/* Nominal Setoran */}
            {formBillId && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Nominal Pembayaran (Rp):
                </label>
                <input
                  type="number"
                  required
                  min={10000}
                  value={formAmount}
                  onChange={(e) => setFormAmount(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            )}

            {/* Metode Bayar */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Metode Pembayaran:
              </label>
              <select
                value={formMethod}
                onChange={(e) => setFormMethod(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="Cash">Tunai di Loket Kasir</option>
                <option value="Transfer Bank">Transfer Bank Resmi</option>
                <option value="E-Wallet">E-Wallet (GoPay, OVO, ShopeePay)</option>
              </select>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowAddPaymentModal(false)}
                disabled={submittingPayment}
              >
                Batal
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={submittingPayment || !formBillId}
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                {submittingPayment ? 'Menyimpan...' : 'Simpan & Sahkan Transaksi'}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* =========================================================================
          MODAL: TOLAK TRANSAKSI (DENGAN ALASAN)
          ========================================================================= */}
      {rejectingTx && (
        <Modal
          isOpen={true}
          onClose={() => setRejectingTx(null)}
          title={`Tolak Transaksi: ${rejectingTx.reference_number}`}
          size="sm"
        >
          <form onSubmit={handleRejectSubmit} className="space-y-4">
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-xs text-rose-800 dark:text-rose-300">
              Siswa an. <b>{rejectingTx.student?.nama}</b> ({formatRupiah(rejectingTx.amount_paid)}) akan menerima status ditolak beserta alasan penolakan di portal mereka.
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Alasan Penolakan:
              </label>
              <textarea
                required
                rows={3}
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setRejectingTx(null)}
              >
                Batal
              </Button>
              <Button
                type="submit"
                size="sm"
                className="bg-rose-600 hover:bg-rose-700 text-white"
              >
                Konfirmasi Penolakan
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* =========================================================================
          MODAL: DETAIL KWITANSI TRANSAKSI
          ========================================================================= */}
      {viewingTx && (
        <Modal
          isOpen={true}
          onClose={() => setViewingTx(null)}
          title={`Bukti Transaksi #${viewingTx.reference_number}`}
          size="md"
        >
          <div className="space-y-4 text-xs">
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-2">
              <div className="flex justify-between items-center pb-2 border-b border-slate-200 dark:border-slate-700">
                <span className="font-bold text-slate-700 dark:text-slate-300">Status Transaksi</span>
                <StatusBadge status={viewingTx.verification_status} type="verification" size="sm" />
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Nama Siswa:</span>
                <span className="font-bold text-slate-900 dark:text-white">{viewingTx.student?.nama}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">NIS / Kelas:</span>
                <span className="text-slate-900 dark:text-white">{viewingTx.student?.nis} ({viewingTx.student?.kelas})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Tagihan:</span>
                <span className="font-semibold text-slate-900 dark:text-white">{viewingTx.fee?.fee_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Metode Bayar:</span>
                <span className="font-semibold text-indigo-600">{viewingTx.payment_method}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Tanggal Transaksi:</span>
                <span className="text-slate-900 dark:text-white">{formatDate(viewingTx.transaction_date, true)}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-slate-200 dark:border-slate-700">
                <span className="font-bold text-slate-900 dark:text-white">Nominal Terbayar:</span>
                <span className="font-mono font-extrabold text-emerald-600 text-sm">{formatRupiah(viewingTx.amount_paid)}</span>
              </div>
            </div>

            <div className="flex justify-end">
              <Button variant="outline" size="sm" onClick={() => setViewingTx(null)}>
                Tutup
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

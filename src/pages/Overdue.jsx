import React, { useState, useMemo } from 'react';
import Card, { CardContent, CardHeader } from '../components/ui/Card';
import Button from '../components/ui/Button';
import StatusBadge from '../components/ui/StatusBadge';
import Modal from '../components/ui/Modal';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { formatRupiah } from '../utils/formatRupiah';
import { formatDate, getDueCountdown, getDaysDifference } from '../utils/formatDate';
import { getOverdueSeverityStyle } from '../utils/statusHelpers';
import { exportToCsv } from '../utils/exportCsv';
import { notificationService } from '../services/notificationService';
import {
  AlertTriangle,
  Search,
  Filter,
  Download,
  Send,
  Eye,
  CheckCircle2,
  Clock,
  Calendar,
  Phone,
  Mail,
  User,
  CheckSquare,
  Square,
  Sparkles,
} from 'lucide-react';

export default function Overdue() {
  const { isSuperAdmin, isAdmin } = useAuth();
  const {
    bills,
    classes,
    sendNotification,
    sendBulkNotifications,
    overdueCount,
  } = useData();

  // State Tabs & Filters
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'h7', 'h3_h1', 'overdue'
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClass, setSelectedClass] = useState('all');
  const [selectedOverdueRange, setSelectedOverdueRange] = useState('all'); // '1-7', '8-30', '>30'

  // Multi-select Checkbox State
  const [selectedBillIds, setSelectedBillIds] = useState([]);

  // Modals State
  const [reminderModalBill, setReminderModalBill] = useState(null);
  const [reminderChannel, setReminderChannel] = useState('WhatsApp');
  const [customMessage, setCustomMessage] = useState('');
  const [sendingSingle, setSendingSingle] = useState(false);

  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkChannel, setBulkChannel] = useState('WhatsApp');
  const [sendingBulk, setSendingBulk] = useState(false);

  const [detailModalBill, setDetailModalBill] = useState(null);
  const [toastMessage, setToastMessage] = useState('');

  const triggerToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  // Filter Data yang memiliki amount_due > 0 (tunggakan aktif atau mendekati jatuh tempo)
  const urgentBills = useMemo(() => {
    return bills
      .filter((b) => b.amount_due > 0)
      .map((b) => {
        const countdown = getDueCountdown(b.fee?.due_date);
        const daysDiff = getDaysDifference(b.fee?.due_date); // < 0 jika overdue
        const overdueDays = daysDiff < 0 ? Math.abs(daysDiff) : 0;
        return {
          ...b,
          countdown,
          daysDiff,
          overdueDays,
        };
      });
  }, [bills]);

  // Tab Filtering Logic
  const filteredBills = useMemo(() => {
    return urgentBills.filter((b) => {
      // Filter Tab
      let tabMatch = true;
      if (activeTab === 'h7') {
        tabMatch = b.daysDiff > 3 && b.daysDiff <= 7;
      } else if (activeTab === 'h3_h1') {
        tabMatch = b.daysDiff >= 0 && b.daysDiff <= 3;
      } else if (activeTab === 'overdue') {
        tabMatch = b.daysDiff < 0 || b.payment_status === 'Overdue';
      }

      // Filter Overdue Severity Range
      let rangeMatch = true;
      if (selectedOverdueRange === '1-7') {
        rangeMatch = b.overdueDays >= 1 && b.overdueDays <= 7;
      } else if (selectedOverdueRange === '8-30') {
        rangeMatch = b.overdueDays >= 8 && b.overdueDays <= 30;
      } else if (selectedOverdueRange === '>30') {
        rangeMatch = b.overdueDays > 30;
      }

      // Search Query
      const searchMatch =
        b.student?.nama?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.student?.nis?.includes(searchQuery) ||
        b.fee?.fee_name?.toLowerCase().includes(searchQuery.toLowerCase());

      // Filter Kelas
      const classMatch = selectedClass === 'all' || b.student?.kelas === selectedClass;

      return tabMatch && rangeMatch && searchMatch && classMatch;
    });
  }, [urgentBills, activeTab, selectedOverdueRange, searchQuery, selectedClass]);

  // Hitung jumlah untuk label tabs
  const countH7 = urgentBills.filter((b) => b.daysDiff > 3 && b.daysDiff <= 7).length;
  const countH3H1 = urgentBills.filter((b) => b.daysDiff >= 0 && b.daysDiff <= 3).length;
  const countOverdueOnly = urgentBills.filter(
    (b) => b.daysDiff < 0 || b.payment_status === 'Overdue'
  ).length;

  // Handler Multi-select
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedBillIds(filteredBills.map((b) => b.bill_id));
    } else {
      setSelectedBillIds([]);
    }
  };

  const handleToggleSelectRow = (billId) => {
    setSelectedBillIds((prev) =>
      prev.includes(billId) ? prev.filter((id) => id !== billId) : [...prev, billId]
    );
  };

  // Handler Buka Modal Pengingat Individual
  const handleOpenReminder = (bill) => {
    setReminderModalBill(bill);
    setReminderChannel('WhatsApp');
    const msg = notificationService.generateMessage(bill, 'WhatsApp');
    setCustomMessage(msg);
  };

  const handleChannelSwitch = (channel) => {
    setReminderChannel(channel);
    if (reminderModalBill) {
      const msg = notificationService.generateMessage(reminderModalBill, channel);
      setCustomMessage(msg);
    }
  };

  // Kirim Pengingat Tunggal Real-time
  const handleSendSingleReminder = async () => {
    if (!reminderModalBill) return;
    try {
      setSendingSingle(true);
      await sendNotification(reminderModalBill.bill_id, reminderChannel, customMessage);
      setReminderModalBill(null);
      triggerToast(`Pengingat ${reminderChannel} berhasil dikirim ke orang tua siswa!`);
    } catch (err) {
      alert('Gagal mengirim pengingat: ' + err.message);
    } finally {
      setSendingSingle(false);
    }
  };

  // Kirim Pengingat Massal Real-time
  const handleSendBulkReminders = async () => {
    if (selectedBillIds.length === 0) return;
    try {
      setSendingBulk(true);
      await sendBulkNotifications(selectedBillIds, bulkChannel);
      setShowBulkModal(false);
      const count = selectedBillIds.length;
      setSelectedBillIds([]);
      triggerToast(`${count} pengingat massal (${bulkChannel}) berhasil dikirimkan!`);
    } catch (err) {
      alert('Gagal mengirim pengingat massal: ' + err.message);
    } finally {
      setSendingBulk(false);
    }
  };

  // Export CSV
  const handleExportCsv = () => {
    const exportData = filteredBills.map((b) => ({
      NIS: b.student?.nis || '',
      'Nama Siswa': b.student?.nama || '',
      Kelas: b.student?.kelas || '',
      'Nama Tagihan': b.fee?.fee_name || '',
      'Nominal Tagihan': b.fee?.amount || 0,
      'Sisa Tagihan': b.amount_due || 0,
      'Jatuh Tempo': b.fee?.due_date || '',
      Keterlambatan: b.overdueDays > 0 ? `${b.overdueDays} Hari` : b.countdown.text,
      Status: b.payment_status,
      'Nama Orang Tua': b.student?.nama_orang_tua || '',
      'No HP': b.student?.no_hp_ortu || '',
      Email: b.student?.email_ortu || '',
    }));
    exportToCsv('Laporan_Overdue_Tracking', exportData);
    triggerToast('Data overdue berhasil diekspor ke format CSV.');
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
            <AlertTriangle className="w-6 h-6 text-rose-500" />
            Overdue Tracking & Pengingat Tagihan
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Monitoring tagihan mendekati jatuh tempo (H-7, H-3, H-1) dan tunggakan lewat tanggal jatuh tempo dengan notifikasi otomatis ke orang tua siswa.
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
          {selectedBillIds.length > 0 && (
            <Button
              size="sm"
              onClick={() => setShowBulkModal(true)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs py-2 px-3.5 shadow-md flex items-center gap-1.5"
            >
              <Send className="w-3.5 h-3.5" />
              Kirim Notifikasi Massal ({selectedBillIds.length})
            </Button>
          )}
        </div>
      </div>

      {/* 4 Kartu KPI Overdue */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-rose-500">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500">Total Tagihan Overdue</p>
              <h3 className="text-2xl font-extrabold text-rose-600 dark:text-rose-400 mt-1">
                {countOverdueOnly}
              </h3>
              <span className="text-[10px] text-rose-500 font-semibold">Telah Melewati Jatuh Tempo</span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-amber-500">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500">Mendesak (H-3 / H-1)</p>
              <h3 className="text-2xl font-extrabold text-amber-600 dark:text-amber-400 mt-1">
                {countH3H1}
              </h3>
              <span className="text-[10px] text-amber-600 font-semibold">Batas Waktu Segera Tiba</span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-indigo-500">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500">Mendekati (H-7)</p>
              <h3 className="text-2xl font-extrabold text-indigo-600 dark:text-indigo-400 mt-1">
                {countH7}
              </h3>
              <span className="text-[10px] text-indigo-500 font-semibold">Pengingat Awal SPP</span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 flex items-center justify-center">
              <Calendar className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-emerald-500">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500">Total Nominal Tertunggak</p>
              <h3 className="text-lg font-extrabold text-slate-900 dark:text-white mt-1">
                {formatRupiah(urgentBills.reduce((s, b) => s + Number(b.amount_due), 0))}
              </h3>
              <span className="text-[10px] text-slate-400 font-semibold">Potensi Kas Tertunda</span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs Navigasi Kategori Urgensi */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2 overflow-x-auto text-xs">
        <button
          onClick={() => {
            setActiveTab('all');
            setSelectedOverdueRange('all');
          }}
          className={`px-3 py-2 rounded-xl font-bold flex items-center gap-2 transition-all ${
            activeTab === 'all'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <span>Semua Perhatian</span>
          <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-white/20">
            {urgentBills.length}
          </span>
        </button>

        <button
          onClick={() => {
            setActiveTab('overdue');
            setSelectedOverdueRange('all');
          }}
          className={`px-3 py-2 rounded-xl font-bold flex items-center gap-2 transition-all ${
            activeTab === 'overdue'
              ? 'bg-rose-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <span>Sudah Lewat (Overdue)</span>
          <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-white/20">
            {countOverdueOnly}
          </span>
        </button>

        <button
          onClick={() => {
            setActiveTab('h3_h1');
            setSelectedOverdueRange('all');
          }}
          className={`px-3 py-2 rounded-xl font-bold flex items-center gap-2 transition-all ${
            activeTab === 'h3_h1'
              ? 'bg-amber-500 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <span>Mendesak (H-3 / H-1)</span>
          <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-white/20">
            {countH3H1}
          </span>
        </button>

        <button
          onClick={() => {
            setActiveTab('h7');
            setSelectedOverdueRange('all');
          }}
          className={`px-3 py-2 rounded-xl font-bold flex items-center gap-2 transition-all ${
            activeTab === 'h7'
              ? 'bg-indigo-500 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <span>Mendekati (H-7)</span>
          <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-white/20">
            {countH7}
          </span>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Cari nama siswa, NIS, atau jenis tagihan..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="all">Semua Kelas</option>
                {classes.map((cls) => (
                  <option key={cls} value={cls}>
                    Kelas {cls}
                  </option>
                ))}
              </select>

              {activeTab === 'overdue' && (
                <select
                  value={selectedOverdueRange}
                  onChange={(e) => setSelectedOverdueRange(e.target.value)}
                  className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="all">Semua Durasi Overdue</option>
                  <option value="1-7">Ringan (1–7 Hari)</option>
                  <option value="8-30">Sedang (8–30 Hari)</option>
                  <option value=">30">Kritis (&gt;30 Hari)</option>
                </select>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Floating Bulk Action Bar */}
      {selectedBillIds.length > 0 && (
        <div className="p-3.5 rounded-2xl bg-indigo-900 text-white shadow-xl flex items-center justify-between gap-4 border border-indigo-700">
          <div className="flex items-center gap-2 text-xs font-bold">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
            <span>{selectedBillIds.length} Siswa Terpilih</span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={() => {
                setBulkChannel('WhatsApp');
                setShowBulkModal(true);
              }}
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs py-1.5 px-3"
            >
              Kirim WhatsApp Massal
            </Button>
            <Button
              size="sm"
              onClick={() => {
                setBulkChannel('Email');
                setShowBulkModal(true);
              }}
              className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs py-1.5 px-3"
            >
              Kirim Email Massal
            </Button>
            <button
              onClick={() => setSelectedBillIds([])}
              className="text-xs text-indigo-200 hover:text-white px-2 py-1 font-semibold"
            >
              Batal Pilih
            </button>
          </div>
        </div>
      )}

      {/* Tabel Overdue & Tunggakan */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-bold uppercase tracking-wider">
                  <th className="p-3.5 w-10 text-center">
                    <input
                      type="checkbox"
                      checked={
                        filteredBills.length > 0 &&
                        selectedBillIds.length === filteredBills.length
                      }
                      onChange={handleSelectAll}
                      className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                    />
                  </th>
                  <th className="p-3.5">Siswa</th>
                  <th className="p-3.5">Tagihan</th>
                  <th className="p-3.5">Sisa Tagihan</th>
                  <th className="p-3.5">Jatuh Tempo</th>
                  <th className="p-3.5">Tingkat Keterlambatan</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredBills.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-slate-400">
                      Tidak ada tagihan yang memerlukan tindakan pada filter ini.
                    </td>
                  </tr>
                ) : (
                  filteredBills.map((b) => {
                    const isSelected = selectedBillIds.includes(b.bill_id);
                    const severity = getOverdueSeverityStyle(b.overdueDays);

                    return (
                      <tr
                        key={b.bill_id}
                        className={`transition-colors ${
                          isSelected
                            ? 'bg-indigo-50/70 dark:bg-indigo-950/40'
                            : b.overdueDays > 30
                            ? 'bg-rose-50/40 dark:bg-rose-950/20'
                            : 'hover:bg-slate-50/70 dark:hover:bg-slate-800/40'
                        }`}
                      >
                        {/* Checkbox */}
                        <td className="p-3.5 text-center">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleToggleSelectRow(b.bill_id)}
                            className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                          />
                        </td>

                        {/* Siswa Info */}
                        <td className="p-3.5">
                          <div className="font-semibold text-slate-900 dark:text-white">
                            {b.student?.nama}
                          </div>
                          <div className="text-[11px] text-slate-400">
                            NIS {b.student?.nis} • Kelas {b.student?.kelas}
                          </div>
                          <div className="text-[10px] text-slate-500 mt-0.5">
                            Wali: {b.student?.nama_orang_tua} ({b.student?.no_hp_ortu})
                          </div>
                        </td>

                        {/* Nama Tagihan */}
                        <td className="p-3.5 font-medium text-slate-800 dark:text-slate-200">
                          {b.fee?.fee_name}
                        </td>

                        {/* Sisa Tagihan */}
                        <td className="p-3.5 font-mono font-extrabold text-rose-600 dark:text-rose-400">
                          {formatRupiah(b.amount_due)}
                        </td>

                        {/* Tanggal Jatuh Tempo */}
                        <td className="p-3.5 text-slate-500 font-medium">
                          {formatDate(b.fee?.due_date)}
                        </td>

                        {/* Tingkat Keterlambatan dengan Indikator Warna Bertingkat */}
                        <td className="p-3.5">
                          {b.overdueDays > 0 ? (
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold border ${severity.badgeClass}`}
                            >
                              <AlertTriangle className="w-3 h-3 shrink-0" />
                              Terlambat {b.overdueDays} Hari
                            </span>
                          ) : (
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                                b.daysDiff <= 3
                                  ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-400'
                                  : 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-400'
                              }`}
                            >
                              <Clock className="w-3 h-3 shrink-0" />
                              {b.countdown.text}
                            </span>
                          )}
                        </td>

                        {/* Status Badge */}
                        <td className="p-3.5">
                          <StatusBadge status={b.payment_status} size="sm" />
                        </td>

                        {/* Aksi Kolom */}
                        <td className="p-3.5 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleOpenReminder(b)}
                              className="text-[11px] py-1 px-2.5 h-auto text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/40"
                              title="Kirim pengingat pesan ke orang tua"
                            >
                              <Send className="w-3 h-3 mr-1" />
                              Pengingat
                            </Button>
                            <button
                              onClick={() => setDetailModalBill(b)}
                              className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-slate-800 rounded-lg transition-colors"
                              title="Lihat Detail Riwayat"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* =========================================================================
          MODAL: KIRIM PENGINGAT INDIVIDUAL (EDIT PESAN & CHANNEL)
          ========================================================================= */}
      {reminderModalBill && (
        <Modal
          isOpen={true}
          onClose={() => setReminderModalBill(null)}
          title="Kirim Pengingat Tagihan ke Orang Tua"
          size="lg"
        >
          <div className="space-y-4">
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs grid grid-cols-2 gap-3">
              <div>
                <p className="text-slate-400">Penerima Pesan:</p>
                <p className="font-bold text-slate-900 dark:text-white">
                  {reminderModalBill.student?.nama_orang_tua}
                </p>
                <p className="text-[11px] text-slate-500">
                  Orang Tua dari: {reminderModalBill.student?.nama} (Kelas {reminderModalBill.student?.kelas})
                </p>
                <p className="text-[11px] text-indigo-600 font-mono mt-0.5">
                  WA: {reminderModalBill.student?.no_hp_ortu} • Email: {reminderModalBill.student?.email_ortu}
                </p>
              </div>

              <div>
                <p className="text-slate-400">Rincian Tunggakan:</p>
                <p className="font-bold text-slate-900 dark:text-white">
                  {reminderModalBill.fee?.fee_name}
                </p>
                <p className="font-mono font-bold text-rose-600 text-sm">
                  Sisa: {formatRupiah(reminderModalBill.amount_due)}
                </p>
                <p className="text-[11px] text-slate-400">
                  Jatuh Tempo: {formatDate(reminderModalBill.fee?.due_date)}
                </p>
              </div>
            </div>

            {/* Pemilih Saluran */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Saluran Notifikasi:
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => handleChannelSwitch('WhatsApp')}
                  className={`p-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                    reminderChannel === 'WhatsApp'
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300'
                      : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  <Phone className="w-3.5 h-3.5 text-emerald-600" />
                  WhatsApp Otomatis
                </button>
                <button
                  type="button"
                  onClick={() => handleChannelSwitch('Email')}
                  className={`p-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                    reminderChannel === 'Email'
                      ? 'border-indigo-500 bg-indigo-50 text-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-300'
                      : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  <Mail className="w-3.5 h-3.5 text-indigo-600" />
                  Email Institusi
                </button>
              </div>
            </div>

            {/* Pratinjau & Edit Pesan */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Isi Draf Pesan (Dapat Diedit):
              </label>
              <textarea
                rows={7}
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setReminderModalBill(null)}
                disabled={sendingSingle}
              >
                Batal
              </Button>
              <Button
                size="sm"
                onClick={handleSendSingleReminder}
                disabled={sendingSingle}
                className="bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                <Send className="w-3.5 h-3.5 mr-1.5" />
                {sendingSingle ? 'Mengirim...' : 'Kirim Sekarang (Simulasi)'}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* =========================================================================
          MODAL: KIRIM PENGINGAT MASSAL
          ========================================================================= */}
      {showBulkModal && (
        <Modal
          isOpen={true}
          onClose={() => setShowBulkModal(false)}
          title={`Kirim Pengingat Massal (${selectedBillIds.length} Siswa)`}
          size="md"
        >
          <div className="space-y-4">
            <div className="p-3.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-900 text-xs text-indigo-900 dark:text-indigo-200">
              Sistem akan memproses pengiriman notifikasi pengingat secara terjadwal/otomatis kepada <b>{selectedBillIds.length} orang tua siswa</b> dengan rincian tunggakan masing-masing.
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Pilih Saluran Pengiriman Massal:
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setBulkChannel('WhatsApp')}
                  className={`p-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                    bulkChannel === 'WhatsApp'
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300'
                      : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  <Phone className="w-3.5 h-3.5 text-emerald-600" />
                  WhatsApp Gateway
                </button>
                <button
                  type="button"
                  onClick={() => setBulkChannel('Email')}
                  className={`p-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                    bulkChannel === 'Email'
                      ? 'border-indigo-500 bg-indigo-50 text-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-300'
                      : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  <Mail className="w-3.5 h-3.5 text-indigo-600" />
                  Email SMTP Sekolah
                </button>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowBulkModal(false)}
                disabled={sendingBulk}
              >
                Batal
              </Button>
              <Button
                size="sm"
                onClick={handleSendBulkReminders}
                disabled={sendingBulk}
                className="bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                {sendingBulk ? 'Sedang Memproses...' : `Kirim ke ${selectedBillIds.length} Siswa`}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* =========================================================================
          MODAL: DETAIL RIWAYAT TAGIHAN SISWA
          ========================================================================= */}
      {detailModalBill && (
        <Modal
          isOpen={true}
          onClose={() => setDetailModalBill(null)}
          title={`Detail Tunggakan: ${detailModalBill.student?.nama}`}
          size="md"
        >
          <div className="space-y-4 text-xs">
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-400">NIS Siswa:</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white">
                  {detailModalBill.student?.nis}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Kelas:</span>
                <span className="font-semibold text-slate-900 dark:text-white">
                  {detailModalBill.student?.kelas}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Nama Tagihan:</span>
                <span className="font-semibold text-slate-900 dark:text-white">
                  {detailModalBill.fee?.fee_name}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Total Biaya:</span>
                <span className="font-mono font-semibold text-slate-900 dark:text-white">
                  {formatRupiah(detailModalBill.fee?.amount)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Sisa Belum Dibayar:</span>
                <span className="font-mono font-extrabold text-rose-600">
                  {formatRupiah(detailModalBill.amount_due)}
                </span>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDetailModalBill(null)}
              >
                Tutup
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

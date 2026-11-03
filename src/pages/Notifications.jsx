import React, { useState, useMemo } from 'react';
import Card, { CardContent, CardHeader } from '../components/ui/Card';
import Button from '../components/ui/Button';
import StatusBadge from '../components/ui/StatusBadge';
import Modal from '../components/ui/Modal';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { formatDate } from '../utils/formatDate';
import { exportToCsv } from '../utils/exportCsv';
import {
  BellRing,
  Phone,
  Mail,
  Search,
  Filter,
  Download,
  Send,
  Eye,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
  MessageSquare,
  Plus,
  ExternalLink,
} from 'lucide-react';
import { createWhatsAppUrl, createMailtoUrl, createSmsUrl } from '../utils/notificationUtils';

export default function Notifications() {
  const { isSuperAdmin, isAdmin } = useAuth();
  const { notificationLogs, bills, sendNotification, updateStudentContact } = useData();

  // Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedChannel, setSelectedChannel] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');

  // Modals State
  const [viewingLog, setViewingLog] = useState(null);
  const [showManualModal, setShowManualModal] = useState(false);
  const [manualBillId, setManualBillId] = useState('');
  const [manualChannel, setManualChannel] = useState('WhatsApp');
  const [manualRecipient, setManualRecipient] = useState('');
  const [manualMessage, setManualMessage] = useState('');
  const [submittingManual, setSubmittingManual] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const triggerToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  // Filter Logs
  const filteredLogs = useMemo(() => {
    return notificationLogs.filter((log) => {
      const matchSearch =
        log.recipient?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.isi_pesan?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchChannel =
        selectedChannel === 'all' || log.channel === selectedChannel;
      const matchStatus =
        selectedStatus === 'all' ||
        log.status?.toLowerCase() === selectedStatus.toLowerCase() ||
        (selectedStatus === 'Sent' && log.status === 'Terkirim') ||
        (selectedStatus === 'Failed' && log.status === 'Gagal');

      return matchSearch && matchChannel && matchStatus;
    });
  }, [notificationLogs, searchQuery, selectedChannel, selectedStatus]);

  // Statistik Notifikasi
  const totalLogs = notificationLogs.length;
  const totalWhatsApp = notificationLogs.filter((l) => l.channel === 'WhatsApp').length;
  const totalEmail = notificationLogs.filter((l) => l.channel === 'Email').length;
  const totalSuccess = notificationLogs.filter(
    (l) => l.status === 'Terkirim' || l.status === 'Sent'
  ).length;
  const successRate = totalLogs > 0 ? ((totalSuccess / totalLogs) * 100).toFixed(1) : '100';

  // Handler Kirim Notifikasi Manual
  const handleSendManual = async (e) => {
    e.preventDefault();
    if (!manualBillId || !manualMessage.trim()) {
      alert('Pilih tagihan dan isi pesan notifikasi.');
      return;
    }

    try {
      setSubmittingManual(true);
      await sendNotification(Number(manualBillId), manualChannel, manualMessage, manualRecipient);

      // Sinkronkan kontak ke profil siswa
      const bill = bills.find((b) => b.bill_id === Number(manualBillId));
      if (bill?.student_id && manualRecipient.trim()) {
        await updateStudentContact(
          bill.student_id,
          manualChannel === 'WhatsApp'
            ? { no_hp_ortu: manualRecipient.trim() }
            : { email_ortu: manualRecipient.trim() }
        );
      }

      setShowManualModal(false);
      setManualBillId('');
      setManualMessage('');
      setManualRecipient('');
      triggerToast(`Notifikasi manual (${manualChannel}) berhasil dikirimkan!`);
    } catch (err) {
      alert('Gagal mengirim notifikasi: ' + err.message);
    } finally {
      setSubmittingManual(false);
    }
  };

  // Handler Resend
  const handleResend = async (log) => {
    try {
      await sendNotification(log.bill_id || 1, log.channel, log.isi_pesan);
      triggerToast(`Notifikasi berhasil dikirim ulang ke ${log.recipient}!`);
    } catch (err) {
      alert('Gagal mengirim ulang: ' + err.message);
    }
  };

  // Export CSV
  const handleExportCsv = () => {
    const exportData = filteredLogs.map((l) => ({
      'ID Notifikasi': l.notification_id,
      Saluran: l.channel,
      Penerima: l.recipient,
      'Waktu Kirim': l.waktu_kirim,
      Status: l.status,
      'Isi Pesan': l.isi_pesan,
    }));
    exportToCsv('Log_Notifikasi_Pengingat', exportData);
    triggerToast('Log notifikasi berhasil diekspor.');
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
            <BellRing className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            Log Riwayat Notifikasi Pengingat
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Audit trail riwayat transmisi pengingat jatuh tempo & tunggakan melalui WhatsApp Gateway dan Email resmi sekolah.
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
            Ekspor Log CSV
          </Button>

          <Button
            size="sm"
            onClick={() => setShowManualModal(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs py-2 px-3.5 shadow-md flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            Kirim Notifikasi Manual
          </Button>
        </div>
      </div>

      {/* 4 Kartu KPI Notifikasi */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-indigo-600">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500">Total Transmisi</p>
              <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">
                {totalLogs}
              </h3>
              <span className="text-[10px] text-indigo-600 font-semibold">Tercatat di Audit Log</span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 flex items-center justify-center">
              <MessageSquare className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-emerald-600">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500">WhatsApp Gateway</p>
              <h3 className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">
                {totalWhatsApp}
              </h3>
              <span className="text-[10px] text-emerald-600 font-semibold">Notifikasi WA Terkirim</span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center">
              <Phone className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-teal-600">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500">Email SMTP Institusi</p>
              <h3 className="text-2xl font-extrabold text-teal-600 dark:text-teal-400 mt-1">
                {totalEmail}
              </h3>
              <span className="text-[10px] text-teal-600 font-semibold">Email Pengingat Terkirim</span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 flex items-center justify-center">
              <Mail className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-600">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500">Tingkat Keberhasilan</p>
              <h3 className="text-2xl font-extrabold text-purple-600 dark:text-purple-400 mt-1">
                {successRate}%
              </h3>
              <span className="text-[10px] text-purple-600 font-semibold">Delivery Rate</span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
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
                placeholder="Cari nomor HP, email penerima, atau kata kunci pesan..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={selectedChannel}
                onChange={(e) => setSelectedChannel(e.target.value)}
                className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="all">Semua Saluran</option>
                <option value="WhatsApp">WhatsApp</option>
                <option value="Email">Email</option>
              </select>

              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="all">Semua Status</option>
                <option value="Sent">Terkirim (Sent)</option>
                <option value="Failed">Gagal (Failed)</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabel Log Riwayat */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-bold uppercase tracking-wider">
                  <th className="p-3.5">ID / Waktu Transmisi</th>
                  <th className="p-3.5">Saluran</th>
                  <th className="p-3.5">Penerima (Orang Tua)</th>
                  <th className="p-3.5">Cuplikan Isi Pesan</th>
                  <th className="p-3.5">Status Pengiriman</th>
                  <th className="p-3.5 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-400">
                      Tidak ada log notifikasi yang sesuai dengan kriteria pencarian.
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map((log) => (
                    <tr
                      key={log.notification_id}
                      className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      {/* ID & Waktu */}
                      <td className="p-3.5">
                        <div className="font-mono font-bold text-slate-900 dark:text-white">
                          #{log.notification_id}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {formatDate(log.waktu_kirim, true)}
                        </div>
                      </td>

                      {/* Saluran */}
                      <td className="p-3.5">
                        {log.channel === 'WhatsApp' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400">
                            <Phone className="w-3 h-3 text-emerald-600" />
                            WhatsApp
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-400">
                            <Mail className="w-3 h-3 text-indigo-600" />
                            Email
                          </span>
                        )}
                      </td>

                      {/* Penerima */}
                      <td className="p-3.5">
                        <div className="font-mono font-medium text-slate-900 dark:text-white">
                          {log.recipient}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          ID Tagihan: #{log.bill_id || 'N/A'}
                        </div>
                      </td>

                      {/* Cuplikan Pesan */}
                      <td className="p-3.5 max-w-md">
                        <p className="line-clamp-2 text-slate-600 dark:text-slate-300 font-sans">
                          {log.isi_pesan}
                        </p>
                      </td>

                      {/* Status */}
                      <td className="p-3.5">
                        <StatusBadge status={log.status} type="notification" size="sm" />
                      </td>

                      {/* Aksi */}
                      <td className="p-3.5 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => setViewingLog(log)}
                            className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-slate-800 rounded-lg transition-colors"
                            title="Baca Pesan Lengkap"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleResend(log)}
                            className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-slate-800 rounded-lg transition-colors"
                            title="Kirim Ulang Pesan"
                          >
                            <Send className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* =========================================================================
          MODAL: LIHAT PESAN LENGKAP
          ========================================================================= */}
      {viewingLog && (
        <Modal
          isOpen={true}
          onClose={() => setViewingLog(null)}
          title={`Detail Pesan #${viewingLog.notification_id}`}
          size="md"
        >
          <div className="space-y-4 text-xs">
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-400">Saluran:</span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {viewingLog.channel}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Tujuan Penerima:</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white">
                  {viewingLog.recipient}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Waktu Kirim:</span>
                <span className="text-slate-900 dark:text-white">
                  {formatDate(viewingLog.waktu_kirim, true)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Status Transmisi:</span>
                <StatusBadge status={viewingLog.status} type="notification" size="sm" />
              </div>
            </div>

            <div>
              <p className="font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Isi Pesan Transmisi:
              </p>
              <div className="p-3.5 rounded-xl bg-slate-900 text-slate-200 font-mono text-xs whitespace-pre-wrap leading-relaxed border border-slate-800">
                {viewingLog.isi_pesan}
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2 flex-wrap">
                {viewingLog.channel === 'WhatsApp' ? (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        const url = createWhatsAppUrl(viewingLog.recipient, viewingLog.isi_pesan);
                        window.open(url, '_blank');
                      }}
                      className="px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 border border-emerald-300 dark:border-emerald-800 text-xs font-bold flex items-center gap-1.5"
                    >
                      <ExternalLink className="w-3.5 h-3.5 text-emerald-600" />
                      Buka WhatsApp (wa.me)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const url = createSmsUrl(viewingLog.recipient, viewingLog.isi_pesan);
                        window.location.href = url;
                      }}
                      className="px-2.5 py-1.5 rounded-xl bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 hover:bg-teal-100 border border-teal-300 dark:border-teal-800 text-xs font-bold flex items-center gap-1.5"
                    >
                      <MessageSquare className="w-3.5 h-3.5 text-teal-600" />
                      Kirim SMS
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      const url = createMailtoUrl(viewingLog.recipient, 'Pengingat Tagihan SPP', viewingLog.isi_pesan);
                      window.location.href = url;
                    }}
                    className="px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 border border-indigo-300 dark:border-indigo-800 text-xs font-bold flex items-center gap-1.5"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-indigo-600" />
                    Buka Aplikasi Email
                  </button>
                )}
              </div>

              <Button variant="outline" size="sm" onClick={() => setViewingLog(null)}>
                Tutup
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* =========================================================================
          MODAL: KIRIM NOTIFIKASI MANUAL
          ========================================================================= */}
      {showManualModal && (
        <Modal
          isOpen={true}
          onClose={() => setShowManualModal(false)}
          title="Kirim Notifikasi Pengingat Manual"
          size="md"
        >
          <form onSubmit={handleSendManual} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Pilih Tagihan Siswa:
              </label>
              <select
                required
                value={manualBillId}
                onChange={(e) => {
                  const bId = e.target.value;
                  setManualBillId(bId);
                  const bill = bills.find((b) => b.bill_id === Number(bId));
                  if (bill) {
                    setManualMessage(
                      `Yth. ${bill.student?.nama_orang_tua},\nPengingat kewajiban SPP an. ${bill.student?.nama} (${bill.student?.kelas}) untuk ${bill.fee?.fee_name} dengan sisa Rp ${Number(bill.amount_due).toLocaleString('id-ID')}.\nMohon segera diselesaikan.`
                    );
                  }
                }}
                className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">-- Pilih Siswa & Tagihan --</option>
                {bills
                  .filter((b) => b.amount_due > 0)
                  .slice(0, 40)
                  .map((b) => (
                    <option key={b.bill_id} value={b.bill_id}>
                      {b.student?.nama} ({b.student?.kelas}) - {b.fee?.fee_name} (Sisa: Rp {Number(b.amount_due).toLocaleString('id-ID')})
                    </option>
                  ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Saluran Pengiriman:
              </label>
              <select
                value={manualChannel}
                onChange={(e) => {
                  const ch = e.target.value;
                  setManualChannel(ch);
                  if (manualBillId) {
                    const bill = bills.find((b) => b.bill_id === Number(manualBillId));
                    if (bill) {
                      setManualRecipient(
                        ch === 'WhatsApp' ? bill.student?.no_hp_ortu || '' : bill.student?.email_ortu || ''
                      );
                    }
                  }
                }}
                className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="WhatsApp">WhatsApp Gateway / HP</option>
                <option value="Email">Email SMTP Sekolah</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {manualChannel === 'WhatsApp' ? 'Nomor WhatsApp Tujuan (HP):' : 'Alamat Email Tujuan:'}
              </label>
              <input
                type="text"
                required
                value={manualRecipient}
                onChange={(e) => setManualRecipient(e.target.value)}
                placeholder={manualChannel === 'WhatsApp' ? 'Contoh: 0812-3456-7890' : 'ortu@gmail.com'}
                className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Isi Pesan Notifikasi:
              </label>
              <textarea
                required
                rows={5}
                value={manualMessage}
                onChange={(e) => setManualMessage(e.target.value)}
                placeholder="Tuliskan isi pesan pengingat..."
                className="w-full p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2 flex-wrap">
                {manualChannel === 'WhatsApp' ? (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        if (!manualRecipient) {
                          alert('Isi nomor WhatsApp tujuan terlebih dahulu.');
                          return;
                        }
                        const url = createWhatsAppUrl(manualRecipient, manualMessage);
                        window.open(url, '_blank');
                      }}
                      className="px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-300 text-xs font-bold flex items-center gap-1.5"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      Buka WhatsApp Langsung
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (!manualRecipient) {
                          alert('Isi nomor telepon tujuan terlebih dahulu.');
                          return;
                        }
                        const url = createSmsUrl(manualRecipient, manualMessage);
                        window.location.href = url;
                      }}
                      className="px-2.5 py-1.5 rounded-xl bg-teal-50 text-teal-700 border border-teal-300 text-xs font-bold flex items-center gap-1.5"
                    >
                      <MessageSquare className="w-3.5 h-3.5 text-teal-600" />
                      Kirim SMS
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      if (!manualRecipient) {
                        alert('Isi alamat email tujuan terlebih dahulu.');
                        return;
                      }
                      const url = createMailtoUrl(manualRecipient, 'Pengingat Tagihan SPP', manualMessage);
                      window.location.href = url;
                    }}
                    className="px-3 py-1.5 rounded-xl bg-indigo-50 text-indigo-700 border border-indigo-300 text-xs font-bold flex items-center gap-1.5"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    Buka Email Langsung
                  </button>
                )}
              </div>

              <div className="flex items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowManualModal(false)}
                  disabled={submittingManual}
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={submittingManual || !manualBillId}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white"
                >
                  {submittingManual ? 'Mengirim...' : 'Kirim & Catat ke Sistem'}
                </Button>
              </div>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

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
import { createWhatsAppUrl, createMailtoUrl, createSmsUrl } from '../utils/notificationUtils';
import { notificationService } from '../services/notificationService';
import {
  GraduationCap,
  Users,
  UserPlus,
  Search,
  Filter,
  Download,
  Send,
  Eye,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Phone,
  Mail,
  ExternalLink,
  MessageSquare,
  Sparkles,
  BookOpen,
  Receipt,
  UserCheck,
  UserX,
  CreditCard,
  RotateCcw,
} from 'lucide-react';

export default function Students() {
  const { isSuperAdmin } = useAuth();
  const {
    students,
    bills,
    classes,
    createStudent,
    updateStudent,
    deleteStudent,
    toggleStudentStatus,
    sendNotification,
  } = useData();

  // Filter & Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClass, setSelectedClass] = useState('all');
  const [selectedPaymentStatus, setSelectedPaymentStatus] = useState('all'); // 'all', 'paid', 'unpaid', 'overdue'
  const [selectedActiveStatus, setSelectedActiveStatus] = useState('all'); // 'all', 'active', 'inactive'

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Modals State
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [deletingStudent, setDeletingStudent] = useState(null);
  const [viewingStudentDetail, setViewingStudentDetail] = useState(null);

  // Reminder Modal State
  const [reminderStudent, setReminderStudent] = useState(null);
  const [reminderTargetBill, setReminderTargetBill] = useState(null);
  const [reminderChannel, setReminderChannel] = useState('WhatsApp');
  const [reminderPhone, setReminderPhone] = useState('');
  const [reminderEmail, setReminderEmail] = useState('');
  const [reminderMessage, setReminderMessage] = useState('');
  const [sendingReminder, setSendingReminder] = useState(false);

  // Form Tambah Siswa State
  const [addForm, setAddForm] = useState({
    nis: '',
    nama: '',
    kelas: 'X-A',
    nama_orang_tua: '',
    no_hp_ortu: '',
    email_ortu: '',
    autoCreateBills: true,
  });
  const [addingSubmitting, setAddingSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const triggerToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  // ---------------------------------------------------------------------------
  // 1. DATA COMPUTATION: Agregasi Tagihan untuk Setiap Siswa
  // ---------------------------------------------------------------------------
  const studentsWithBilling = useMemo(() => {
    return students.map((student) => {
      const studentBills = bills.filter((b) => b.student_id === student.student_id);
      const totalKewajiban = studentBills.reduce((acc, b) => acc + (b.fee?.amount || 0), 0);
      const totalSisaTunggakan = studentBills.reduce(
        (acc, b) => acc + (Number(b.amount_due) || 0),
        0
      );
      const totalTerbayar = totalKewajiban - totalSisaTunggakan;
      const overdueBills = studentBills.filter(
        (b) => b.payment_status === 'Overdue' || (b.daysDiff !== undefined && b.daysDiff < 0)
      );

      let paymentStatus = 'Lunas';
      if (studentBills.length === 0) {
        paymentStatus = 'Tidak Ada Tagihan';
      } else if (totalSisaTunggakan === 0) {
        paymentStatus = 'Lunas';
      } else if (overdueBills.length > 0) {
        paymentStatus = 'Overdue';
      } else if (totalTerbayar > 0) {
        paymentStatus = 'Partial';
      } else {
        paymentStatus = 'Unpaid';
      }

      return {
        ...student,
        bills: studentBills,
        totalKewajiban,
        totalSisaTunggakan,
        totalTerbayar,
        overdueCount: overdueBills.length,
        paymentStatus,
      };
    });
  }, [students, bills]);

  // ---------------------------------------------------------------------------
  // 2. FILTERING
  // ---------------------------------------------------------------------------
  const filteredStudents = useMemo(() => {
    return studentsWithBilling.filter((s) => {
      // Search
      const q = searchQuery.toLowerCase();
      const matchSearch =
        !q ||
        s.nama.toLowerCase().includes(q) ||
        s.nis.includes(q) ||
        (s.nama_orang_tua && s.nama_orang_tua.toLowerCase().includes(q)) ||
        (s.no_hp_ortu && s.no_hp_ortu.includes(q)) ||
        (s.email_ortu && s.email_ortu.toLowerCase().includes(q));

      // Filter Kelas
      const matchClass = selectedClass === 'all' || s.kelas === selectedClass;

      // Filter Status Pembayaran
      let matchPayment = true;
      if (selectedPaymentStatus === 'paid') {
        matchPayment = s.totalSisaTunggakan === 0;
      } else if (selectedPaymentStatus === 'unpaid') {
        matchPayment = s.totalSisaTunggakan > 0;
      } else if (selectedPaymentStatus === 'overdue') {
        matchPayment = s.overdueCount > 0;
      }

      // Filter Status Siswa Aktif / Nonaktif
      let matchActive = true;
      if (selectedActiveStatus === 'active') {
        matchActive = s.status_aktif !== false;
      } else if (selectedActiveStatus === 'inactive') {
        matchActive = s.status_aktif === false;
      }

      return matchSearch && matchClass && matchPayment && matchActive;
    });
  }, [studentsWithBilling, searchQuery, selectedClass, selectedPaymentStatus, selectedActiveStatus]);

  // ---------------------------------------------------------------------------
  // 3. PAGINATION
  // ---------------------------------------------------------------------------
  const totalPages = Math.ceil(filteredStudents.length / itemsPerPage) || 1;
  const paginatedStudents = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredStudents.slice(start, start + itemsPerPage);
  }, [filteredStudents, currentPage]);

  // ---------------------------------------------------------------------------
  // 4. KPI STATISTIK SISWA
  // ---------------------------------------------------------------------------
  const stats = useMemo(() => {
    const total = studentsWithBilling.length;
    const lunas = studentsWithBilling.filter((s) => s.totalSisaTunggakan === 0).length;
    const menunggak = studentsWithBilling.filter((s) => s.totalSisaTunggakan > 0).length;
    const overdue = studentsWithBilling.filter((s) => s.overdueCount > 0).length;
    const totalTunggakanNominal = studentsWithBilling.reduce(
      (sum, s) => sum + s.totalSisaTunggakan,
      0
    );

    return {
      total,
      lunas,
      menunggak,
      overdue,
      totalTunggakanNominal,
      persenTertib: total > 0 ? ((lunas / total) * 100).toFixed(1) : 0,
    };
  }, [studentsWithBilling]);

  // ---------------------------------------------------------------------------
  // 5. HANDLERS
  // ---------------------------------------------------------------------------
  const handleOpenAddModal = () => {
    const nextNis = `2026${String(students.length + 1).padStart(4, '0')}`;
    setAddForm({
      nis: nextNis,
      nama: '',
      kelas: classes[0] || 'X-A',
      nama_orang_tua: '',
      no_hp_ortu: '',
      email_ortu: '',
      autoCreateBills: true,
    });
    setShowAddModal(true);
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    if (!addForm.nama.trim()) {
      alert('Nama lengkap siswa wajib diisi.');
      return;
    }
    try {
      setAddingSubmitting(true);
      await createStudent(addForm);
      setShowAddModal(false);
      triggerToast(`Siswa baru ${addForm.nama} (${addForm.kelas}) berhasil ditambahkan!`);
    } catch (err) {
      alert('Gagal menambahkan siswa: ' + err.message);
    } finally {
      setAddingSubmitting(false);
    }
  };

  const handleOpenEdit = (student) => {
    setEditingStudent({ ...student });
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editingStudent) return;
    try {
      await updateStudent(editingStudent.student_id, editingStudent);
      setEditingStudent(null);
      triggerToast(`Data siswa ${editingStudent.nama} berhasil diperbarui!`);
    } catch (err) {
      alert('Gagal memperbarui siswa: ' + err.message);
    }
  };

  const handleDeleteSubmit = async () => {
    if (!deletingStudent) return;
    try {
      await deleteStudent(deletingStudent.student_id);
      setDeletingStudent(null);
      triggerToast(`Data siswa ${deletingStudent.nama} berhasil dihapus.`);
    } catch (err) {
      alert('Gagal menghapus siswa: ' + err.message);
    }
  };

  const handleToggleStatus = async (student) => {
    try {
      await toggleStudentStatus(student.student_id);
      triggerToast(
        `Status siswa ${student.nama} diubah menjadi ${student.status_aktif ? 'Nonaktif' : 'Aktif'}.`
      );
    } catch (err) {
      alert('Gagal mengubah status: ' + err.message);
    }
  };

  // Handler Buka Modal Pengingat untuk Siswa
  const handleOpenReminder = (student) => {
    const unpaidBill = student.bills.find((b) => b.amount_due > 0) || student.bills[0];
    setReminderStudent(student);
    setReminderTargetBill(unpaidBill);
    setReminderChannel('WhatsApp');
    setReminderPhone(student.no_hp_ortu || '0812-3456-7890');
    setReminderEmail(student.email_ortu || 'ortu@gmail.com');

    if (unpaidBill) {
      const msg = notificationService.generateMessage(unpaidBill, 'WhatsApp');
      setReminderMessage(msg);
    } else {
      setReminderMessage(
        `Yth. ${student.nama_orang_tua},\nKami informasikan terkait status administrasi siswa an. ${student.nama} (${student.kelas}).\nTerima kasih.`
      );
    }
  };

  const handleSendReminder = async () => {
    if (!reminderStudent || !reminderTargetBill) return;
    try {
      setSendingReminder(true);
      await sendNotification(
        reminderTargetBill.bill_id,
        reminderChannel,
        reminderMessage,
        reminderChannel === 'WhatsApp' ? reminderPhone : reminderEmail
      );
      setReminderStudent(null);
      triggerToast(`Pengingat ${reminderChannel} berhasil dikirim ke orang tua ${reminderStudent.nama}!`);
    } catch (err) {
      alert('Gagal mengirim pengingat: ' + err.message);
    } finally {
      setSendingReminder(false);
    }
  };

  // Export CSV Seluruh Data Siswa
  const handleExportCsv = () => {
    const exportData = filteredStudents.map((s, index) => ({
      No: index + 1,
      NIS: s.nis,
      'Nama Siswa': s.nama,
      Kelas: s.kelas,
      'Nama Orang Tua / Wali': s.nama_orang_tua || '-',
      'No HP / WhatsApp': s.no_hp_ortu || '-',
      'Email Wali': s.email_ortu || '-',
      'Total Kewajiban (Rp)': s.totalKewajiban,
      'Sisa Tunggakan (Rp)': s.totalSisaTunggakan,
      'Status SPP': s.paymentStatus,
      'Status Siswa': s.status_aktif !== false ? 'Aktif' : 'Nonaktif',
    }));
    exportToCsv('Data_Siswa_EduPay_Monitor', exportData);
    triggerToast('Data seluruh siswa berhasil diekspor ke CSV.');
  };

  return (
    <div className="space-y-6">
      {/* Toast Notifikasi */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 p-4 rounded-xl shadow-2xl bg-slate-900 text-white border border-slate-700 flex items-center gap-3 animate-bounce">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-xs font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* Header Halaman */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2.5">
            <GraduationCap className="w-7 h-7 text-indigo-600 dark:text-indigo-400" />
            Kelola Data Siswa
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Manajemen data seluruh siswa, kontak wali murid, dan ringkasan status pembayaran SPP secara *real-time*.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCsv}
            className="flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Ekspor CSV</span>
          </Button>

          <Button
            size="sm"
            onClick={handleOpenAddModal}
            className="bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-1.5 shadow-sm"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Tambah Siswa Baru</span>
          </Button>
        </div>
      </div>

      {/* KPI Cards Ringkasan Siswa */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Siswa */}
        <Card className="border border-slate-200 dark:border-slate-800 shadow-xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Total Siswa Terdaftar
              </p>
              <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">
                {stats.total}{' '}
                <span className="text-xs font-normal text-slate-400">Siswa</span>
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Tersebar di {classes.length || 6} rombel kelas
              </p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 flex items-center justify-center shrink-0">
              <Users className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        {/* Card 2: Lunas / Bebas Tunggakan */}
        <Card className="border border-slate-200 dark:border-slate-800 shadow-xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Siswa Lunas (Tertib)
              </p>
              <h3 className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">
                {stats.lunas}{' '}
                <span className="text-xs font-normal text-slate-400">Siswa</span>
              </h3>
              <p className="text-[11px] text-emerald-600 font-semibold mt-0.5">
                {stats.persenTertib}% tingkat kepatuhan
              </p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        {/* Card 3: Memiliki Tunggakan */}
        <Card className="border border-slate-200 dark:border-slate-800 shadow-xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Memiliki Tunggakan
              </p>
              <h3 className="text-2xl font-extrabold text-amber-600 dark:text-amber-400 mt-1">
                {stats.menunggak}{' '}
                <span className="text-xs font-normal text-slate-400">Siswa</span>
              </h3>
              <p className="text-[11px] text-amber-600 font-mono mt-0.5">
                Total: {formatRupiah(stats.totalTunggakanNominal)}
              </p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 flex items-center justify-center shrink-0">
              <Clock className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        {/* Card 4: Siswa Overdue */}
        <Card className="border border-slate-200 dark:border-slate-800 shadow-xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Tagihan Lewat Jatuh Tempo
              </p>
              <h3 className="text-2xl font-extrabold text-rose-600 dark:text-rose-400 mt-1">
                {stats.overdue}{' '}
                <span className="text-xs font-normal text-slate-400">Siswa</span>
              </h3>
              <p className="text-[11px] text-rose-600 font-medium mt-0.5">
                Memerlukan atensi pengingat
              </p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter & Kontrol Pencarian */}
      <Card className="border border-slate-200 dark:border-slate-800 shadow-xs">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            {/* Input Cari */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Cari Nama, NIS, Wali, No. HP..."
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="all">Semua Kelas ({classes.length} Rombel)</option>
                {classes.map((c) => (
                  <option key={c} value={c}>
                    Kelas {c}
                  </option>
                ))}
              </select>
            </div>

            {/* Filter Status SPP */}
            <div>
              <select
                value={selectedPaymentStatus}
                onChange={(e) => {
                  setSelectedPaymentStatus(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="all">Semua Status Pembayaran</option>
                <option value="paid">Lunas (Rp 0)</option>
                <option value="unpaid">Ada Tunggakan</option>
                <option value="overdue">Overdue (Lewat Jatuh Tempo)</option>
              </select>
            </div>

            {/* Filter Status Aktif */}
            <div>
              <select
                value={selectedActiveStatus}
                onChange={(e) => {
                  setSelectedActiveStatus(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="all">Semua Status Siswa</option>
                <option value="active">Siswa Aktif</option>
                <option value="inactive">Siswa Nonaktif / Mutasi</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabel Data Seluruh Siswa */}
      <Card className="border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <CardHeader className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">
              Daftar Siswa Terdaftar
            </h3>
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold">
              {filteredStudents.length} Data
            </span>
          </div>

          <span className="text-[11px] text-slate-400">
            Halaman {currentPage} dari {totalPages}
          </span>
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-semibold">
                <tr>
                  <th className="p-3.5 text-center w-12">#</th>
                  <th className="p-3.5">NIS & Nama Siswa</th>
                  <th className="p-3.5">Kelas</th>
                  <th className="p-3.5">Nama Orang Tua / Kontak</th>
                  <th className="p-3.5">Total Biaya</th>
                  <th className="p-3.5">Sisa Tunggakan</th>
                  <th className="p-3.5">Status SPP</th>
                  <th className="p-3.5 text-center">Status</th>
                  <th className="p-3.5 text-center w-36">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {paginatedStudents.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="p-8 text-center text-slate-400">
                      Tidak ada data siswa yang cocok dengan filter pencarian.
                    </td>
                  </tr>
                ) : (
                  paginatedStudents.map((s, idx) => {
                    const rowNumber = (currentPage - 1) * itemsPerPage + idx + 1;
                    const isOverdue = s.overdueCount > 0;

                    return (
                      <tr
                        key={s.student_id}
                        className={`transition-colors hover:bg-slate-50/70 dark:hover:bg-slate-800/40 ${
                          isOverdue ? 'bg-rose-50/20 dark:bg-rose-950/10' : ''
                        }`}
                      >
                        {/* No */}
                        <td className="p-3.5 text-center font-mono text-slate-400">
                          {rowNumber}
                        </td>

                        {/* Nama & NIS */}
                        <td className="p-3.5">
                          <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                            <span>{s.nama}</span>
                            {s.status_aktif === false && (
                              <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                                Nonaktif
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] font-mono text-slate-400 mt-0.5">
                            NIS: {s.nis}
                          </div>
                        </td>

                        {/* Kelas */}
                        <td className="p-3.5">
                          <span className="inline-flex px-2 py-0.5 rounded-md font-semibold text-[11px] bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-900">
                            {s.kelas}
                          </span>
                        </td>

                        {/* Wali & Kontak */}
                        <td className="p-3.5">
                          <div className="font-medium text-slate-800 dark:text-slate-200">
                            {s.nama_orang_tua || '-'}
                          </div>
                          <div className="flex items-center gap-2 mt-1 flex-wrap text-[11px]">
                            {/* WhatsApp link */}
                            <a
                              href={createWhatsAppUrl(
                                s.no_hp_ortu,
                                `Halo Bpk/Ibu ${s.nama_orang_tua || 'Wali Murid'}, ini dari Bagian Keuangan Sekolah terkait tagihan SPP ananda ${s.nama} (${s.kelas}).`
                              )}
                              target="_blank"
                              rel="noreferrer"
                              className="font-mono text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
                              title="Buka Chat WhatsApp"
                            >
                              <Phone className="w-3 h-3 text-emerald-500" />
                              <span>{s.no_hp_ortu || '-'}</span>
                            </a>

                            {/* Email link */}
                            {s.email_ortu && (
                              <a
                                href={createMailtoUrl(
                                  s.email_ortu,
                                  `Informasi Biaya Pendidikan - ${s.nama} (${s.kelas})`,
                                  `Yth. Bpk/Ibu ${s.nama_orang_tua},\n\nBerikut kami sampaikan informasi tagihan biaya pendidikan untuk ananda ${s.nama}.`
                                )}
                                className="text-slate-400 hover:text-indigo-600"
                                title={s.email_ortu}
                              >
                                <Mail className="w-3 h-3" />
                              </a>
                            )}
                          </div>
                        </td>

                        {/* Total Biaya */}
                        <td className="p-3.5 font-medium text-slate-700 dark:text-slate-300">
                          {formatRupiah(s.totalKewajiban)}
                        </td>

                        {/* Sisa Tunggakan */}
                        <td className="p-3.5 font-mono font-bold">
                          {s.totalSisaTunggakan > 0 ? (
                            <span className="text-rose-600 dark:text-rose-400">
                              {formatRupiah(s.totalSisaTunggakan)}
                            </span>
                          ) : (
                            <span className="text-emerald-600 dark:text-emerald-400">
                              Rp 0 (Lunas)
                            </span>
                          )}
                        </td>

                        {/* Status SPP */}
                        <td className="p-3.5">
                          <StatusBadge status={s.paymentStatus} size="sm" />
                        </td>

                        {/* Status Keaktifan Siswa */}
                        <td className="p-3.5 text-center">
                          <button
                            type="button"
                            onClick={() => handleToggleStatus(s)}
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold transition-all border ${
                              s.status_aktif !== false
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-400'
                                : 'bg-slate-100 text-slate-500 border-slate-300 dark:bg-slate-800'
                            }`}
                            title="Klik untuk mengubah status aktif/nonaktif"
                          >
                            {s.status_aktif !== false ? 'Aktif' : 'Nonaktif'}
                          </button>
                        </td>

                        {/* Tombol Aksi */}
                        <td className="p-3.5 text-center">
                          <div className="flex items-center justify-center gap-1">
                            {/* Lihat Detail & Riwayat Tagihan Siswa */}
                            <button
                              type="button"
                              onClick={() => setViewingStudentDetail(s)}
                              className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-slate-800 rounded-lg transition-colors"
                              title="Lihat Rincian Tagihan & Transaksi Siswa"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>

                            {/* Kirim Pengingat jika ada tunggakan */}
                            {s.totalSisaTunggakan > 0 && (
                              <button
                                type="button"
                                onClick={() => handleOpenReminder(s)}
                                className="p-1.5 text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/40 rounded-lg transition-colors"
                                title="Kirim Pengingat WhatsApp / Email ke Orang Tua"
                              >
                                <Send className="w-3.5 h-3.5" />
                              </button>
                            )}

                            {/* Edit Data Siswa */}
                            <button
                              type="button"
                              onClick={() => handleOpenEdit(s)}
                              className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-slate-800 rounded-lg transition-colors"
                              title="Ubah Data Siswa & Kontak Wali"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>

                            {/* Hapus Siswa (Hak Admin & Super Admin) */}
                            <button
                              type="button"
                              onClick={() => setDeletingStudent(s)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors"
                              title="Hapus Data Siswa"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
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

          {/* Kontrol Pagination */}
          <div className="p-3.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
            <span>
              Menampilkan {(currentPage - 1) * itemsPerPage + 1} s.d.{' '}
              {Math.min(currentPage * itemsPerPage, filteredStudents.length)} dari{' '}
              {filteredStudents.length} siswa
            </span>

            <div className="flex items-center gap-1.5">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                disabled={currentPage === 1}
              >
                Sebelumnya
              </Button>
              <span className="px-2 font-bold text-slate-700 dark:text-slate-300">
                {currentPage} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                disabled={currentPage === totalPages}
              >
                Selanjutnya
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* =========================================================================
          MODAL: TAMBAH SISWA BARU
          ========================================================================= */}
      {showAddModal && (
        <Modal
          isOpen={true}
          onClose={() => setShowAddModal(false)}
          title="Tambah Siswa Baru"
          subtitle="Masukkan data identitas siswa dan kontak orang tua / wali"
          size="md"
        >
          <form onSubmit={handleAddSubmit} className="space-y-3.5 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Nomor Induk Siswa (NIS) *
                </label>
                <input
                  type="text"
                  required
                  value={addForm.nis}
                  onChange={(e) => setAddForm({ ...addForm, nis: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Kelas Rombel *
                </label>
                <select
                  value={addForm.kelas}
                  onChange={(e) => setAddForm({ ...addForm, kelas: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-semibold"
                >
                  {classes.map((c) => (
                    <option key={c} value={c}>
                      Kelas {c}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Nama Lengkap Siswa *
              </label>
              <input
                type="text"
                required
                value={addForm.nama}
                onChange={(e) => setAddForm({ ...addForm, nama: e.target.value })}
                placeholder="Contoh: Muhammad Fajri"
                className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Nama Orang Tua / Wali
              </label>
              <input
                type="text"
                value={addForm.nama_orang_tua}
                onChange={(e) => setAddForm({ ...addForm, nama_orang_tua: e.target.value })}
                placeholder="Contoh: Bpk. Haryanto"
                className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-emerald-600" />
                  No. WhatsApp / HP
                </label>
                <input
                  type="text"
                  value={addForm.no_hp_ortu}
                  onChange={(e) => setAddForm({ ...addForm, no_hp_ortu: e.target.value })}
                  placeholder="Contoh: 0812-3456-7890"
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5 text-indigo-600" />
                  Email Orang Tua
                </label>
                <input
                  type="email"
                  value={addForm.email_ortu}
                  onChange={(e) => setAddForm({ ...addForm, email_ortu: e.target.value })}
                  placeholder="wali@gmail.com"
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="p-3 rounded-xl bg-indigo-50/60 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-900">
              <label className="flex items-center gap-2 cursor-pointer select-none text-xs text-indigo-900 dark:text-indigo-200 font-medium">
                <input
                  type="checkbox"
                  checked={addForm.autoCreateBills}
                  onChange={(e) => setAddForm({ ...addForm, autoCreateBills: e.target.checked })}
                  className="rounded border-indigo-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                />
                <span>Otomatis terbitkan tagihan SPP semester berjalan untuk siswa baru ini</span>
              </label>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowAddModal(false)}
                disabled={addingSubmitting}
              >
                Batal
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={addingSubmitting}
                className="bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                {addingSubmitting ? 'Menyimpan...' : 'Simpan Siswa'}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* =========================================================================
          MODAL: EDIT DATA SISWA & KONTAK WALI
          ========================================================================= */}
      {editingStudent && (
        <Modal
          isOpen={true}
          onClose={() => setEditingStudent(null)}
          title={`Ubah Data Siswa: ${editingStudent.nama}`}
          size="md"
        >
          <form onSubmit={handleEditSubmit} className="space-y-3.5 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  NIS Siswa
                </label>
                <input
                  type="text"
                  required
                  value={editingStudent.nis}
                  onChange={(e) => setEditingStudent({ ...editingStudent, nis: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-mono text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Kelas
                </label>
                <select
                  value={editingStudent.kelas}
                  onChange={(e) => setEditingStudent({ ...editingStudent, kelas: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-semibold"
                >
                  {classes.map((c) => (
                    <option key={c} value={c}>
                      Kelas {c}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Nama Lengkap Siswa
              </label>
              <input
                type="text"
                required
                value={editingStudent.nama}
                onChange={(e) => setEditingStudent({ ...editingStudent, nama: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-semibold"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Nama Orang Tua / Wali
              </label>
              <input
                type="text"
                value={editingStudent.nama_orang_tua || ''}
                onChange={(e) =>
                  setEditingStudent({ ...editingStudent, nama_orang_tua: e.target.value })
                }
                className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-emerald-600" />
                  No. WhatsApp / HP Ortu
                </label>
                <input
                  type="text"
                  value={editingStudent.no_hp_ortu || ''}
                  onChange={(e) =>
                    setEditingStudent({ ...editingStudent, no_hp_ortu: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-mono text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5 text-indigo-600" />
                  Email Orang Tua
                </label>
                <input
                  type="email"
                  value={editingStudent.email_ortu || ''}
                  onChange={(e) =>
                    setEditingStudent({ ...editingStudent, email_ortu: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Status Keaktifan Siswa
              </label>
              <select
                value={editingStudent.status_aktif !== false ? 'true' : 'false'}
                onChange={(e) =>
                  setEditingStudent({
                    ...editingStudent,
                    status_aktif: e.target.value === 'true',
                  })
                }
                className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-semibold"
              >
                <option value="true">Siswa Aktif</option>
                <option value="false">Siswa Nonaktif / Mutasi</option>
              </select>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setEditingStudent(null)}
              >
                Batal
              </Button>
              <Button type="submit" size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white">
                Simpan Perubahan
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* =========================================================================
          MODAL: DETAIL RINCIAN TAGIHAN & TRANSAKSI SISWA (STUDENT LEDGER)
          ========================================================================= */}
      {viewingStudentDetail && (
        <Modal
          isOpen={true}
          onClose={() => setViewingStudentDetail(null)}
          title={`Buku Kas Siswa: ${viewingStudentDetail.nama}`}
          subtitle={`NIS: ${viewingStudentDetail.nis} • Kelas: ${viewingStudentDetail.kelas}`}
          size="lg"
        >
          <div className="space-y-4 text-xs">
            {/* Header Ringkasan Siswa */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <span className="text-slate-400 block text-[10px]">Wali Murid</span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {viewingStudentDetail.nama_orang_tua || '-'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">WhatsApp</span>
                <span className="font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
                  {viewingStudentDetail.no_hp_ortu || '-'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Total Tagihan</span>
                <span className="font-bold font-mono text-slate-900 dark:text-white">
                  {formatRupiah(viewingStudentDetail.totalKewajiban)}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Sisa Tunggakan</span>
                <span className="font-bold font-mono text-rose-600 dark:text-rose-400">
                  {formatRupiah(viewingStudentDetail.totalSisaTunggakan)}
                </span>
              </div>
            </div>

            {/* Daftar Tagihan Siswa */}
            <div>
              <h4 className="font-bold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
                Daftar Tagihan SPP & Biaya Pendidikan
              </h4>
              <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 dark:bg-slate-800 font-semibold text-slate-600 dark:text-slate-300">
                    <tr>
                      <th className="p-2.5">Nama Tagihan</th>
                      <th className="p-2.5">Nominal Asli</th>
                      <th className="p-2.5">Jatuh Tempo</th>
                      <th className="p-2.5">Sisa Tagihan</th>
                      <th className="p-2.5">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {viewingStudentDetail.bills && viewingStudentDetail.bills.length > 0 ? (
                      viewingStudentDetail.bills.map((b) => (
                        <tr key={b.bill_id}>
                          <td className="p-2.5 font-semibold text-slate-900 dark:text-white">
                            {b.fee?.fee_name}
                          </td>
                          <td className="p-2.5 font-mono">{formatRupiah(b.fee?.amount)}</td>
                          <td className="p-2.5 text-slate-500">{formatDate(b.fee?.due_date)}</td>
                          <td className="p-2.5 font-mono font-bold text-rose-600">
                            {formatRupiah(b.amount_due)}
                          </td>
                          <td className="p-2.5">
                            <StatusBadge status={b.payment_status} size="sm" />
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="p-4 text-center text-slate-400">
                          Belum ada tagihan yang diterbitkan untuk siswa ini.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Tombol Aksi di Modal Detail */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                {viewingStudentDetail.totalSisaTunggakan > 0 && (
                  <Button
                    size="sm"
                    onClick={() => {
                      const s = viewingStudentDetail;
                      setViewingStudentDetail(null);
                      handleOpenReminder(s);
                    }}
                    className="bg-amber-600 hover:bg-amber-700 text-white flex items-center gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Kirim Pengingat Tunggakan</span>
                  </Button>
                )}
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setViewingStudentDetail(null)}
              >
                Tutup
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* =========================================================================
          MODAL: KONFIRMASI HAPUS SISWA
          ========================================================================= */}
      {deletingStudent && (
        <Modal
          isOpen={true}
          onClose={() => setDeletingStudent(null)}
          title="Konfirmasi Hapus Siswa"
          size="sm"
        >
          <div className="space-y-4 text-xs">
            <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-900 dark:text-rose-200">
              Apakah Anda yakin ingin menghapus siswa <b>{deletingStudent.nama}</b> (NIS: {deletingStudent.nis})?
              Semua catatan tagihan terkait siswa ini juga akan dibersihkan dari sistem.
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDeletingStudent(null)}
              >
                Batal
              </Button>
              <Button
                size="sm"
                onClick={handleDeleteSubmit}
                className="bg-rose-600 hover:bg-rose-700 text-white"
              >
                Hapus Siswa
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* =========================================================================
          MODAL: KIRIM PENGINGAT WHATSAPP & EMAIL
          ========================================================================= */}
      {reminderStudent && (
        <Modal
          isOpen={true}
          onClose={() => setReminderStudent(null)}
          title="Kirim Notifikasi Pengingat Tagihan"
          subtitle={`Wali: ${reminderStudent.nama_orang_tua || 'Orang Tua'} • Siswa: ${reminderStudent.nama}`}
          size="md"
        >
          <div className="space-y-4 text-xs">
            <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 flex justify-between items-center">
              <div>
                <p className="font-bold text-amber-900 dark:text-amber-200">
                  Total Tunggakan: {formatRupiah(reminderStudent.totalSisaTunggakan)}
                </p>
                <p className="text-[11px] text-amber-700 dark:text-amber-300 mt-0.5">
                  Siswa: {reminderStudent.nama} ({reminderStudent.kelas})
                </p>
              </div>
              <StatusBadge status={reminderStudent.paymentStatus} size="sm" />
            </div>

            {/* Pilihan Kanal */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Pilih Saluran Pengiriman:
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setReminderChannel('WhatsApp')}
                  className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                    reminderChannel === 'WhatsApp'
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 shadow-xs'
                      : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  <Phone className="w-3.5 h-3.5 text-emerald-600" />
                  <span>WhatsApp Gateway</span>
                </button>
                <button
                  type="button"
                  onClick={() => setReminderChannel('Email')}
                  className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                    reminderChannel === 'Email'
                      ? 'border-indigo-500 bg-indigo-50 text-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-300 shadow-xs'
                      : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  <Mail className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Email Resmi</span>
                </button>
              </div>
            </div>

            {/* Input Kontak Tujuan */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {reminderChannel === 'WhatsApp' ? 'Nomor WhatsApp / HP Wali:' : 'Alamat Email Wali:'}
              </label>
              <input
                type="text"
                required
                value={reminderChannel === 'WhatsApp' ? reminderPhone : reminderEmail}
                onChange={(e) =>
                  reminderChannel === 'WhatsApp'
                    ? setReminderPhone(e.target.value)
                    : setReminderEmail(e.target.value)
                }
                className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-mono font-bold text-slate-900 dark:text-white"
              />
            </div>

            {/* Isi Pesan */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Draf Isi Pesan Pengingat:
              </label>
              <textarea
                rows={5}
                value={reminderMessage}
                onChange={(e) => setReminderMessage(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono text-slate-900 dark:text-white"
              />
            </div>

            {/* Tombol Aksi Langsung & Kirim */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                {reminderChannel === 'WhatsApp' ? (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        const url = createWhatsAppUrl(reminderPhone, reminderMessage);
                        window.open(url, '_blank');
                      }}
                      className="px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-300 text-xs font-bold flex items-center gap-1.5"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      Buka di WhatsApp (wa.me)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const url = createSmsUrl(reminderPhone, reminderMessage);
                        window.location.href = url;
                      }}
                      className="px-2.5 py-1.5 rounded-xl bg-teal-50 text-teal-700 border border-teal-300 text-xs font-bold flex items-center gap-1.5"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      Kirim SMS
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      const url = createMailtoUrl(
                        reminderEmail,
                        `Pengingat Tagihan SPP - ${reminderStudent.nama}`,
                        reminderMessage
                      );
                      window.location.href = url;
                    }}
                    className="px-3 py-1.5 rounded-xl bg-indigo-50 text-indigo-700 border border-indigo-300 text-xs font-bold flex items-center gap-1.5"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    Buka Aplikasi Email
                  </button>
                )}
              </div>

              <div className="flex items-center justify-end gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setReminderStudent(null)}
                  disabled={sendingReminder}
                >
                  Batal
                </Button>
                <Button
                  size="sm"
                  onClick={handleSendReminder}
                  disabled={sendingReminder}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white"
                >
                  {sendingReminder ? 'Mengirim...' : 'Kirim & Catat ke Sistem'}
                </Button>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}


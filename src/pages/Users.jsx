import React, { useState, useMemo } from 'react';
import Card, { CardContent, CardHeader } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import {
  Users as UsersIcon,
  UserPlus,
  ShieldAlert,
  ShieldCheck,
  UserCheck,
  UserX,
  Search,
  Filter,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Mail,
  User,
  Sparkles,
  KeyRound,
} from 'lucide-react';

export default function Users() {
  const { currentUser, isSuperAdmin } = useAuth();
  const {
    users,
    students,
    createUser,
    updateUser,
    toggleUserStatus,
    deleteUser,
  } = useData();

  // Filter & Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Modals State
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [deletingUser, setDeletingUser] = useState(null);

  // Form State Tambah User
  const [formData, setFormData] = useState({
    nama_lengkap: '',
    username: '',
    email: '',
    password: '',
    role: 'user',
    student_id: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successToast, setSuccessToast] = useState('');

  // Notifikasi toast auto-hide
  const triggerSuccess = (msg) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(''), 3000);
  };

  // Filter Data User
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchSearch =
        u.nama_lengkap?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchRole = roleFilter === 'all' || u.role === roleFilter;
      const matchStatus =
        statusFilter === 'all' ||
        (statusFilter === 'active' && u.status_aktif) ||
        (statusFilter === 'inactive' && !u.status_aktif);

      return matchSearch && matchRole && matchStatus;
    });
  }, [users, searchQuery, roleFilter, statusFilter]);

  // Statistik Role
  const totalSuperAdmin = users.filter((u) => u.role === 'super_admin').length;
  const totalAdmin = users.filter((u) => u.role === 'admin').length;
  const totalUser = users.filter((u) => u.role === 'user').length;
  const totalActive = users.filter((u) => u.status_aktif).length;

  // Handle Tambah User
  const handleCreateUser = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    if (!formData.nama_lengkap || !formData.username || !formData.email || !formData.password) {
      setErrorMessage('Semua field wajib diisi.');
      return;
    }

    try {
      setSubmitting(true);
      await createUser({
        ...formData,
        student_id: formData.role === 'user' && formData.student_id ? Number(formData.student_id) : null,
      });
      setShowAddModal(false);
      setFormData({
        nama_lengkap: '',
        username: '',
        email: '',
        password: '',
        role: 'user',
        student_id: '',
      });
      triggerSuccess('Pengguna baru berhasil ditambahkan!');
    } catch (err) {
      setErrorMessage(err.message || 'Gagal menambahkan pengguna.');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Edit User
  const handleUpdateUser = async (e) => {
    e.preventDefault();
    if (!editingUser) return;
    try {
      setSubmitting(true);
      await updateUser(editingUser.user_id, editingUser);
      setEditingUser(null);
      triggerSuccess('Data pengguna berhasil diperbarui!');
    } catch (err) {
      alert('Gagal memperbarui pengguna: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Toggle Status Aktif
  const handleToggleStatus = async (user) => {
    if (user.user_id === currentUser?.user_id) {
      alert('Anda tidak dapat menonaktifkan akun yang sedang digunakan.');
      return;
    }
    try {
      await toggleUserStatus(user.user_id);
      triggerSuccess(`Status akun ${user.nama_lengkap} berhasil diubah.`);
    } catch (err) {
      alert('Gagal mengubah status: ' + err.message);
    }
  };

  // Handle Hapus User
  const handleConfirmDelete = async () => {
    if (!deletingUser) return;
    if (deletingUser.user_id === currentUser?.user_id) {
      alert('Anda tidak dapat menghapus akun Anda sendiri.');
      return;
    }
    try {
      setSubmitting(true);
      await deleteUser(deletingUser.user_id);
      setDeletingUser(null);
      triggerSuccess('Pengguna berhasil dihapus.');
    } catch (err) {
      alert('Gagal menghapus pengguna: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {successToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-600 text-white px-4 py-3 rounded-xl shadow-xl flex items-center gap-2 text-xs font-semibold animate-bounce">
          <CheckCircle2 className="w-4 h-4" />
          <span>{successToast}</span>
        </div>
      )}

      {/* Header Halaman */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <UsersIcon className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            Manajemen Pengguna & Otorisasi
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Kelola akun pengguna, peran hak akses sistem (Super Admin, Admin, User), dan aktivasi akun secara real-time.
          </p>
        </div>

        <Button
          onClick={() => setShowAddModal(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-600/20 py-2.5 px-4"
        >
          <UserPlus className="w-4 h-4 mr-1.5" />
          Tambah Pengguna Baru
        </Button>
      </div>

      {/* 4 Kartu KPI Statistik Pengguna */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-purple-600">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500">Super Administrator</p>
              <h3 className="text-2xl font-extrabold text-purple-700 dark:text-purple-400 mt-1">
                {totalSuperAdmin}
              </h3>
              <span className="text-[10px] text-purple-500 font-semibold">Akses Penuh / Mutlak</span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-950/60 text-purple-600 flex items-center justify-center">
              <ShieldAlert className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-indigo-600">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500">Administrator / Kasir</p>
              <h3 className="text-2xl font-extrabold text-indigo-700 dark:text-indigo-400 mt-1">
                {totalAdmin}
              </h3>
              <span className="text-[10px] text-indigo-500 font-semibold">Operasional Tagihan</span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-teal-600">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500">User (Siswa / Orang Tua)</p>
              <h3 className="text-2xl font-extrabold text-teal-700 dark:text-teal-400 mt-1">
                {totalUser}
              </h3>
              <span className="text-[10px] text-teal-500 font-semibold">Pemilik Tagihan Pribadi</span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-teal-100 dark:bg-teal-950/60 text-teal-600 flex items-center justify-center">
              <User className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-emerald-600">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500">Total Akun Aktif</p>
              <h3 className="text-2xl font-extrabold text-emerald-700 dark:text-emerald-400 mt-1">
                {totalActive} <span className="text-xs text-slate-400 font-normal">/ {users.length}</span>
              </h3>
              <span className="text-[10px] text-emerald-600 font-semibold">Status Login Aktif</span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center">
              <UserCheck className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter & Search Bar */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Cari berdasarkan nama, username, atau email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Role Filter */}
            <div className="flex items-center gap-2">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="all">Semua Peran</option>
                <option value="super_admin">Super Admin</option>
                <option value="admin">Admin</option>
                <option value="user">User / Siswa</option>
              </select>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="all">Semua Status</option>
                <option value="active">Aktif</option>
                <option value="inactive">Nonaktif</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabel Pengguna */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-bold uppercase tracking-wider">
                  <th className="p-3.5">Pengguna</th>
                  <th className="p-3.5">Username / Email</th>
                  <th className="p-3.5">Peran (Role)</th>
                  <th className="p-3.5">Keterkaitan Siswa</th>
                  <th className="p-3.5">Status Akun</th>
                  <th className="p-3.5 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-400">
                      Tidak ada pengguna yang sesuai dengan filter pencarian.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((u) => {
                    const isSelf = u.user_id === currentUser?.user_id;
                    return (
                      <tr
                        key={u.user_id}
                        className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                      >
                        {/* Pengguna Info */}
                        <td className="p-3.5">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center font-bold text-slate-700 dark:text-slate-200 shrink-0 uppercase">
                              {u.nama_lengkap?.slice(0, 2) || 'US'}
                            </div>
                            <div>
                              <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                                {u.nama_lengkap}
                                {isSelf && (
                                  <span className="px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-400">
                                    Anda
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] text-slate-400">ID: #{u.user_id}</div>
                            </div>
                          </div>
                        </td>

                        {/* Username & Email */}
                        <td className="p-3.5">
                          <div className="font-mono font-medium text-slate-800 dark:text-slate-200">
                            @{u.username}
                          </div>
                          <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                            <Mail className="w-3 h-3" />
                            {u.email}
                          </div>
                        </td>

                        {/* Role Badge */}
                        <td className="p-3.5">
                          {u.role === 'super_admin' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                              <Sparkles className="w-3 h-3 text-purple-600" />
                              Super Admin
                            </span>
                          ) : u.role === 'admin' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                              <ShieldCheck className="w-3 h-3 text-indigo-600" />
                              Administrator
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-teal-100 text-teal-800 dark:bg-teal-950/60 dark:text-teal-300 border border-teal-200 dark:border-teal-800">
                              <User className="w-3 h-3 text-teal-600" />
                              User / Siswa
                            </span>
                          )}
                        </td>

                        {/* Keterkaitan Siswa */}
                        <td className="p-3.5">
                          {u.role === 'user' ? (
                            <div>
                              <span className="font-semibold text-slate-800 dark:text-slate-200">
                                {u.student_nis ? `NIS ${u.student_nis}` : 'NIS 20260001'}
                              </span>
                              <div className="text-[11px] text-slate-400">
                                Kelas: {u.student_kelas || 'X-A'}
                              </div>
                            </div>
                          ) : (
                            <span className="text-slate-400 italic">Bukan Siswa (Staf Institusi)</span>
                          )}
                        </td>

                        {/* Status Akun */}
                        <td className="p-3.5">
                          <button
                            onClick={() => handleToggleStatus(u)}
                            disabled={isSelf}
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold transition-all ${
                              u.status_aktif
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400 hover:bg-rose-100 hover:text-rose-800'
                                : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 hover:bg-emerald-100 hover:text-emerald-800'
                            }`}
                            title={isSelf ? 'Tidak bisa nonaktifkan akun sendiri' : 'Klik untuk mengubah status'}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                u.status_aktif ? 'bg-emerald-500' : 'bg-slate-400'
                              }`}
                            />
                            {u.status_aktif ? 'Aktif' : 'Nonaktif'}
                          </button>
                        </td>

                        {/* Aksi */}
                        <td className="p-3.5 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => setEditingUser({ ...u })}
                              className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-slate-800 rounded-lg transition-colors"
                              title="Edit Pengguna"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setDeletingUser(u)}
                              disabled={isSelf}
                              className={`p-1.5 rounded-lg transition-colors ${
                                isSelf
                                  ? 'text-slate-300 dark:text-slate-700 cursor-not-allowed'
                                  : 'text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-800'
                              }`}
                              title={isSelf ? 'Tidak dapat menghapus akun sendiri' : 'Hapus Pengguna'}
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
        </CardContent>
      </Card>

      {/* =========================================================================
          MODAL: TAMBAH PENGGUNA BARU
          ========================================================================= */}
      {showAddModal && (
        <Modal
          isOpen={true}
          onClose={() => setShowAddModal(false)}
          title="Tambah Pengguna Baru"
          size="md"
        >
          <form onSubmit={handleCreateUser} className="space-y-4">
            {errorMessage && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Nama Lengkap:
              </label>
              <input
                type="text"
                required
                placeholder="Contoh: Rahmat Hidayat, S.Pd"
                value={formData.nama_lengkap}
                onChange={(e) => setFormData({ ...formData, nama_lengkap: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Username:
                </label>
                <input
                  type="text"
                  required
                  placeholder="username_baru"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value.toLowerCase().trim() })}
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Email:
                </label>
                <input
                  type="email"
                  required
                  placeholder="user@sekolah.sch.id"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Kata Sandi Default:
              </label>
              <input
                type="password"
                required
                placeholder="Minimal 6 karakter"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Peran Hak Akses (RBAC):
              </label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {isSuperAdmin && (
                  <option value="super_admin">Super Administrator (Akses Mutlak Website & Keuangan)</option>
                )}
                <option value="admin">Administrator (Operasional Tagihan, Kasir & Verifikasi)</option>
                <option value="user">User / Siswa / Orang Tua (Hanya Melihat & Bayar Tagihan Pribadi)</option>
              </select>
            </div>

            {formData.role === 'user' && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Kaitkan dengan Profil Siswa:
                </label>
                <select
                  value={formData.student_id}
                  onChange={(e) => setFormData({ ...formData, student_id: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">Pilih Siswa (Opsional / Otomatis Siswa 1)</option>
                  {students.slice(0, 30).map((s) => (
                    <option key={s.student_id} value={s.student_id}>
                      {s.nis} - {s.nama} ({s.kelas})
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowAddModal(false)}
                disabled={submitting}
              >
                Batal
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={submitting}
                className="bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                {submitting ? 'Menyimpan...' : 'Simpan Pengguna'}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* =========================================================================
          MODAL: EDIT PENGGUNA
          ========================================================================= */}
      {editingUser && (
        <Modal
          isOpen={true}
          onClose={() => setEditingUser(null)}
          title={`Edit Pengguna: ${editingUser.nama_lengkap}`}
          size="md"
        >
          <form onSubmit={handleUpdateUser} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Nama Lengkap:
              </label>
              <input
                type="text"
                required
                value={editingUser.nama_lengkap}
                onChange={(e) => setEditingUser({ ...editingUser, nama_lengkap: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Email:
              </label>
              <input
                type="email"
                required
                value={editingUser.email}
                onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Peran Hak Akses (Role):
              </label>
              <select
                value={editingUser.role}
                onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value })}
                disabled={!isSuperAdmin && editingUser.role === 'super_admin'}
                className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {isSuperAdmin && <option value="super_admin">Super Administrator</option>}
                <option value="admin">Administrator</option>
                <option value="user">User / Siswa</option>
              </select>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setEditingUser(null)}
                disabled={submitting}
              >
                Batal
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={submitting}
                className="bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                {submitting ? 'Memperbarui...' : 'Simpan Perubahan'}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* =========================================================================
          MODAL: KONFIRMASI HAPUS PENGGUNA
          ========================================================================= */}
      {deletingUser && (
        <Modal
          isOpen={true}
          onClose={() => setDeletingUser(null)}
          title="Konfirmasi Hapus Pengguna"
          size="sm"
        >
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-300 text-xs space-y-1">
              <p className="font-bold flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                Peringatan Penghapusan Akun
              </p>
              <p>
                Apakah Anda yakin ingin menghapus akun <b>{deletingUser.nama_lengkap}</b> (@{deletingUser.username})? Tindakan ini tidak dapat dibatalkan.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setDeletingUser(null)}
                disabled={submitting}
              >
                Batal
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={handleConfirmDelete}
                disabled={submitting}
                className="bg-rose-600 hover:bg-rose-700 text-white"
              >
                {submitting ? 'Menghapus...' : 'Ya, Hapus Pengguna'}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

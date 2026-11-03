import React, { useState, useEffect } from 'react';
import Card, { CardContent, CardHeader, CardFooter } from '../components/ui/Card';
import Button from '../components/ui/Button';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import {
  ShieldAlert,
  Building2,
  Calendar,
  CreditCard,
  Sliders,
  CheckCircle2,
  Save,
  Plus,
  Trash2,
  Sparkles,
  AlertTriangle
} from 'lucide-react';

export default function SystemSettings() {
  const { isSuperAdmin } = useAuth();
  const { systemSettings, updateSystemSettings } = useData();

  const [form, setForm] = useState({
    institutionName: '',
    institutionMotto: '',
    academicYear: '',
    systemDate: '',
    address: '',
    phone: '',
    whatsappContact: '',
    email: '',
    overdueGraceDays: 3,
    maintenanceMode: false,
    bankAccounts: [],
  });

  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (systemSettings) {
      setForm({
        institutionName: systemSettings.institutionName || 'SMA Nusantara Mandiri',
        institutionMotto: systemSettings.institutionMotto || '',
        academicYear: systemSettings.academicYear || '2026/2027',
        systemDate: systemSettings.systemDate || '2026-11-03',
        address: systemSettings.address || '',
        phone: systemSettings.phone || '',
        whatsappContact: systemSettings.whatsappContact || '',
        email: systemSettings.email || '',
        overdueGraceDays: systemSettings.overdueGraceDays || 3,
        maintenanceMode: systemSettings.maintenanceMode || false,
        bankAccounts: systemSettings.bankAccounts || [],
      });
    }
  }, [systemSettings]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    setSuccess(false);
  };

  const handleBankChange = (index, field, value) => {
    const updated = [...form.bankAccounts];
    updated[index][field] = value;
    setForm((prev) => ({ ...prev, bankAccounts: updated }));
    setSuccess(false);
  };

  const handleAddBank = () => {
    setForm((prev) => ({
      ...prev,
      bankAccounts: [
        ...prev.bankAccounts,
        { bank: 'Bank Baru', accountNo: '000-000-000', holder: form.institutionName },
      ],
    }));
    setSuccess(false);
  };

  const handleDeleteBank = (index) => {
    setForm((prev) => ({
      ...prev,
      bankAccounts: prev.bankAccounts.filter((_, i) => i !== index),
    }));
    setSuccess(false);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateSystemSettings(form);
      setSaving(false);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setSaving(false);
      alert('Gagal menyimpan perubahan: ' + err.message);
    }
  };

  if (!isSuperAdmin) {
    return (
      <div className="p-8 text-center">
        <AlertTriangle className="w-12 h-12 text-rose-500 mx-auto mb-3" />
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Akses Terbatas</h2>
        <p className="text-slate-500 text-sm mt-1">
          Hanya peran <b>Super Admin</b> yang memiliki hak akses untuk mengubah konfigurasi website ini.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Super Admin Privilege Header */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 text-white shadow-xl relative overflow-hidden border border-purple-500/30">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/20 text-purple-200 border border-purple-400/30 text-xs font-semibold mb-2">
              <ShieldAlert className="w-3.5 h-3.5 text-purple-400" />
              Wewenang Mutlak Super Admin Aktif
            </div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              Kontrol Penuh & Pengaturan Website
            </h1>
            <p className="text-purple-200/80 text-sm mt-1 max-w-2xl leading-relaxed">
              Sebagai Super Admin, Anda memiliki hak penuh untuk mengubah identitas institusi, tahun akademik, nomor rekening pembayaran sekolah, toleransi keterlambatan, dan seluruh parameter sistem.
            </p>
          </div>

          <Button
            onClick={handleSave}
            loading={saving}
            className="bg-purple-600 hover:bg-purple-500 text-white shadow-lg shadow-purple-600/30 shrink-0"
            icon={Save}
          >
            Simpan Seluruh Perubahan
          </Button>
        </div>
      </div>

      {success && (
        <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-sm flex items-center gap-3 animate-fade-in shadow-sm">
          <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
          <div>
            <p className="font-bold">Perubahan Website Berhasil Disimpan!</p>
            <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-0.5">
              Nama institusi, rekening pembayaran, dan konfigurasi akademik telah diperbarui secara global di seluruh halaman sistem.
            </p>
          </div>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* 1. Identitas Institusi */}
        <Card>
          <CardHeader
            title="Identitas & Branding Institusi"
            subtitle="Nama dan informasi ini akan tampil di header, kuitansi bayar, dan laporan kas"
            action={<Building2 className="w-5 h-5 text-purple-500" />}
          />
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Nama Institusi Pendidikan
                </label>
                <input
                  type="text"
                  required
                  name="institutionName"
                  value={form.institutionName}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Slogan / Motto Institusi
                </label>
                <input
                  type="text"
                  name="institutionMotto"
                  value={form.institutionMotto}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Alamat Kampus / Sekolah
              </label>
              <input
                type="text"
                name="address"
                value={form.address}
                onChange={handleChange}
                className="w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Email Resmi
                </label>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  No. Telepon Kantor
                </label>
                <input
                  type="text"
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  No. WhatsApp Layanan SPP
                </label>
                <input
                  type="text"
                  name="whatsappContact"
                  value={form.whatsappContact}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 2. Tahun Ajaran & Kebijakan Overdue */}
        <Card>
          <CardHeader
            title="Konfigurasi Akademik & Toleransi Jatuh Tempo"
            subtitle="Menentukan tahun ajaran aktif dan parameter kalkulasi keterlambatan"
            action={<Calendar className="w-5 h-5 text-indigo-500" />}
          />
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Tahun Ajaran Aktif
                </label>
                <input
                  type="text"
                  required
                  name="academicYear"
                  value={form.academicYear}
                  onChange={handleChange}
                  placeholder="Contoh: 2026/2027"
                  className="w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500 font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Tanggal Acuan Sistem (Anchor Date)
                </label>
                <input
                  type="date"
                  name="systemDate"
                  value={form.systemDate}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Masa Toleransi Overdue (Hari)
                </label>
                <input
                  type="number"
                  name="overdueGraceDays"
                  value={form.overdueGraceDays}
                  onChange={handleChange}
                  min="0"
                  max="14"
                  className="w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500 font-semibold"
                />
                <span className="text-[11px] text-slate-400 mt-1 block">Hari sebelum denda/surat peringatan terbit</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 3. Rekening Bank Pembayaran Resmi */}
        <Card>
          <CardHeader
            title="Rekening Bank & Kanal Pembayaran Resmi Institusi"
            subtitle="Rekening yang ditampilkan kepada siswa dan orang tua saat melakukan pembayaran"
            action={
              <Button
                size="sm"
                variant="outline"
                onClick={handleAddBank}
                icon={Plus}
              >
                Tambah Rekening
              </Button>
            }
          />
          <CardContent className="space-y-3">
            {form.bankAccounts.map((b, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row items-center gap-3"
              >
                <div className="w-full sm:w-1/4">
                  <label className="block text-[11px] text-slate-500 mb-1">Nama Bank / E-Wallet</label>
                  <input
                    type="text"
                    value={b.bank}
                    onChange={(e) => handleBankChange(idx, 'bank', e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg font-semibold text-slate-900 dark:text-slate-100"
                  />
                </div>
                <div className="w-full sm:w-1/3">
                  <label className="block text-[11px] text-slate-500 mb-1">Nomor Rekening / VA</label>
                  <input
                    type="text"
                    value={b.accountNo}
                    onChange={(e) => handleBankChange(idx, 'accountNo', e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg font-mono font-bold text-slate-900 dark:text-slate-100"
                  />
                </div>
                <div className="w-full sm:w-1/3">
                  <label className="block text-[11px] text-slate-500 mb-1">Atas Nama Pemilik</label>
                  <input
                    type="text"
                    value={b.holder}
                    onChange={(e) => handleBankChange(idx, 'holder', e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => handleDeleteBank(idx)}
                  className="p-2 text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors mt-4 sm:mt-0"
                  title="Hapus Rekening"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Action Button */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Button
            type="submit"
            loading={saving}
            size="lg"
            className="bg-purple-600 hover:bg-purple-700 text-white shadow-xl shadow-purple-600/25 px-8"
            icon={Save}
          >
            Terapkan Seluruh Pengaturan Website
          </Button>
        </div>
      </form>
    </div>
  );
}


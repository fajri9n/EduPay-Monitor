import React, { useState } from 'react';
import Card, { CardContent, CardHeader } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { formatRupiah } from '../utils/formatRupiah';
import { formatDate } from '../utils/formatDate';
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
  PieChart as PieChartIcon,
  Plus,
  TrendingDown,
  DollarSign,
  AlertTriangle,
  CheckCircle2,
  Receipt,
  FileText,
  Calendar,
  Wallet,
  Sparkles,
} from 'lucide-react';

export default function Budget() {
  const { isSuperAdmin, isAdmin } = useAuth();
  const { budgetData, addExpenditure } = useData();

  // Modals & Form State
  const [showAddModal, setShowAddModal] = useState(false);
  const [formAllocationId, setFormAllocationId] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formNominal, setFormNominal] = useState('');
  const [formDate, setFormDate] = useState('2026-11-03');
  const [formProof, setFormProof] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const triggerToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  const allocations = budgetData?.allocations || [];
  const expenditures = budgetData?.expenditures || [];

  // Metrik KPI
  const totalAlokasi = allocations.reduce((s, a) => s + Number(a.nominal_alokasi), 0);
  const totalRealisasi = allocations.reduce((s, a) => s + Number(a.total_realisasi || 0), 0);
  const sisaPagu = totalAlokasi - totalRealisasi;
  const serapanPersen = totalAlokasi > 0 ? Number(((totalRealisasi / totalAlokasi) * 100).toFixed(1)) : 0;

  // Data Perbandingan Alokasi vs Realisasi untuk Recharts
  const chartData = allocations.map((a) => ({
    name: a.kategori.length > 15 ? a.kategori.slice(0, 15) + '...' : a.kategori,
    fullName: a.kategori,
    Alokasi: a.nominal_alokasi,
    Realisasi: a.total_realisasi || 0,
    persentase: a.persentase_realisasi || 0,
  }));

  // Handle Submit Tambah Pengeluaran Real-time
  const handleAddExpenditure = async (e) => {
    e.preventDefault();
    if (!formAllocationId || !formNominal || Number(formNominal) <= 0 || !formDescription) {
      alert('Mohon lengkapi seluruh field dengan data yang valid.');
      return;
    }

    try {
      setSubmitting(true);
      await addExpenditure({
        allocation_id: Number(formAllocationId),
        deskripsi: formDescription,
        nominal: Number(formNominal),
        tanggal: formDate,
        bukti: formProof || `KW-${Date.now().toString().slice(-6)}.pdf`,
      });

      setShowAddModal(false);
      setFormAllocationId('');
      setFormDescription('');
      setFormNominal('');
      setFormProof('');
      triggerToast('Pengeluaran operasional berhasil dicatat & serapan anggaran terbarui!');
    } catch (err) {
      alert('Gagal menambah pengeluaran: ' + err.message);
    } finally {
      setSubmitting(false);
    }
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
            <PieChartIcon className="w-6 h-6 text-teal-600 dark:text-teal-400" />
            Monitoring Anggaran Operasional Institusi
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Pengawasan alokasi pagu anggaran tahun berjalan vs realisasi belanja berkuitansi resmi per kategori.
          </p>
        </div>

        <Button
          size="sm"
          onClick={() => setShowAddModal(true)}
          className="bg-teal-600 hover:bg-teal-700 text-white text-xs py-2 px-3.5 shadow-md shadow-teal-600/20 flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" />
          Tambah Pengeluaran Baru
        </Button>
      </div>

      {/* 4 Kartu KPI Anggaran */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-indigo-600">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500">Total Pagu Alokasi</p>
              <h3 className="text-xl font-extrabold text-slate-900 dark:text-white mt-1">
                {formatRupiah(totalAlokasi)}
              </h3>
              <span className="text-[10px] text-indigo-600 font-semibold">Tahun Ajaran 2026/2027</span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 flex items-center justify-center">
              <Wallet className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-emerald-600">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500">Total Realisasi Belanja</p>
              <h3 className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">
                {formatRupiah(totalRealisasi)}
              </h3>
              <span className="text-[10px] text-emerald-600 font-semibold">{serapanPersen}% Terserap</span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-teal-600">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500">Sisa Pagu Anggaran</p>
              <h3 className="text-xl font-extrabold text-teal-600 dark:text-teal-400 mt-1">
                {formatRupiah(sisaPagu)}
              </h3>
              <span className="text-[10px] text-teal-600 font-semibold">Saldo Pagu Belum Dipakai</span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 flex items-center justify-center">
              <DollarSign className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-amber-500">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500">Kesehatan Serapan</p>
              <h3 className="text-2xl font-extrabold text-amber-600 dark:text-amber-400 mt-1">
                {serapanPersen}%
              </h3>
              <span className="text-[10px] text-slate-400 font-semibold">
                {serapanPersen < 75 ? 'Zona Aman (<75%)' : serapanPersen <= 90 ? 'Zona Waspada' : 'Zona Kritis'}
              </span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Grafik Perbandingan Alokasi vs Realisasi */}
      <Card>
        <CardHeader
          title="Perbandingan Alokasi Pagu vs Realisasi per Kategori"
          subtitle="Evaluasi penyerapan anggaran operasional institusi semester ganjil"
        />
        <CardContent className="p-4 pt-0">
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 15, right: 10, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  tickLine={false}
                  axisLine={{ stroke: '#cbd5e1' }}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: '#64748b' }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(val) => {
                    if (val >= 1000000) return `${(val / 1000000).toFixed(0)}jt`;
                    return val;
                  }}
                />
                <Tooltip
                  formatter={(val) => [formatRupiah(val)]}
                  labelFormatter={(name, items) => items[0]?.payload?.fullName || name}
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderRadius: '12px',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                />
                <Legend
                  verticalAlign="top"
                  align="right"
                  iconType="circle"
                  iconSize={8}
                  wrapperStyle={{ paddingBottom: 15, fontSize: 11 }}
                />
                <Bar dataKey="Alokasi" name="Pagu Alokasi" fill="#6366f1" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Realisasi" name="Realisasi Belanja" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Tabel Alokasi & Progress Bar Serapan (Sesuai Kebutuhan F5) */}
      <Card>
        <CardHeader
          title="Status Serapan Anggaran per Kategori"
          subtitle="Indikator warna: Hijau (<75%), Kuning (75–90%), Merah (>90%)"
        />
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-bold uppercase tracking-wider">
                  <th className="p-3.5">Kategori Anggaran</th>
                  <th className="p-3.5">Pagu Alokasi</th>
                  <th className="p-3.5">Realisasi Belanja</th>
                  <th className="p-3.5">Sisa Pagu</th>
                  <th className="p-3.5 w-60">Persentase Serapan</th>
                  <th className="p-3.5 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {allocations.map((a) => {
                  const pct = a.persentase_realisasi || 0;
                  const isGreen = pct < 75;
                  const isYellow = pct >= 75 && pct <= 90;
                  const isRed = pct > 90;

                  const barColor = isRed
                    ? 'bg-rose-500'
                    : isYellow
                    ? 'bg-amber-500'
                    : 'bg-emerald-500';

                  const badgeClass = isRed
                    ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-400'
                    : isYellow
                    ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-400'
                    : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400';

                  const statusLabel = isRed ? 'Kritis (>90%)' : isYellow ? 'Waspada (75-90%)' : 'Aman (<75%)';

                  return (
                    <tr
                      key={a.allocation_id}
                      className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="p-3.5">
                        <span className="font-bold text-slate-900 dark:text-white">
                          {a.kategori}
                        </span>
                        <div className="text-[11px] text-slate-400">Periode: {a.periode}</div>
                      </td>
                      <td className="p-3.5 font-mono font-medium text-slate-700 dark:text-slate-300">
                        {formatRupiah(a.nominal_alokasi)}
                      </td>
                      <td className="p-3.5 font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        {formatRupiah(a.total_realisasi)}
                      </td>
                      <td className="p-3.5 font-mono font-bold text-slate-900 dark:text-white">
                        {formatRupiah(a.sisa_anggaran)}
                      </td>
                      <td className="p-3.5">
                        <div className="space-y-1">
                          <div className="w-full bg-slate-200 dark:bg-slate-700 h-2.5 rounded-full overflow-hidden">
                            <div
                              className={`${barColor} h-full rounded-full transition-all duration-500`}
                              style={{ width: `${Math.min(pct, 100)}%` }}
                            />
                          </div>
                          <div className="flex justify-between text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                            <span>Terserap:</span>
                            <span className="font-mono">{pct}%</span>
                          </div>
                        </div>
                      </td>
                      <td className="p-3.5 text-center">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold ${badgeClass}`}
                        >
                          {statusLabel}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Tabel Riwayat Pengeluaran Belanja Operasional */}
      <Card>
        <CardHeader
          title="Riwayat Belanja Operasional Sekolah"
          subtitle="Daftar pengeluaran kas berkuitansi resmi yang telah disetujui"
        />
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-bold uppercase tracking-wider">
                  <th className="p-3.5">No Bukti / Invoice</th>
                  <th className="p-3.5">Tanggal</th>
                  <th className="p-3.5">Kategori Alokasi</th>
                  <th className="p-3.5">Deskripsi Pengeluaran</th>
                  <th className="p-3.5 text-right">Nominal Belanja</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {expenditures.slice(0, 15).map((e) => {
                  const alloc = allocations.find((a) => a.allocation_id === e.allocation_id);
                  return (
                    <tr
                      key={e.expenditure_id}
                      className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="p-3.5 font-mono font-bold text-slate-900 dark:text-white">
                        {e.bukti}
                      </td>
                      <td className="p-3.5 text-slate-500">{formatDate(e.tanggal)}</td>
                      <td className="p-3.5 font-medium text-indigo-600 dark:text-indigo-400">
                        {alloc?.kategori || 'Operasional'}
                      </td>
                      <td className="p-3.5 text-slate-800 dark:text-slate-200">{e.deskripsi}</td>
                      <td className="p-3.5 text-right font-mono font-extrabold text-rose-600 dark:text-rose-400">
                        {formatRupiah(e.nominal)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* =========================================================================
          MODAL: TAMBAH PENGELUARAN BARU
          ========================================================================= */}
      {showAddModal && (
        <Modal
          isOpen={true}
          onClose={() => setShowAddModal(false)}
          title="Tambah Pengeluaran Operasional Baru"
          size="md"
        >
          <form onSubmit={handleAddExpenditure} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Pilih Kategori Alokasi:
              </label>
              <select
                required
                value={formAllocationId}
                onChange={(e) => setFormAllocationId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="">-- Pilih Pos Alokasi Pagu --</option>
                {allocations.map((a) => (
                  <option key={a.allocation_id} value={a.allocation_id}>
                    {a.kategori} (Sisa: {formatRupiah(a.sisa_anggaran)})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Deskripsi / Keperluan Belanja:
              </label>
              <input
                type="text"
                required
                placeholder="Contoh: Pembelian Kertas HVS & Tinta Printer Kantor"
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Nominal Pengeluaran (Rp):
                </label>
                <input
                  type="number"
                  required
                  min={1000}
                  value={formNominal}
                  onChange={(e) => setFormNominal(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Tanggal Belanja:
                </label>
                <input
                  type="date"
                  required
                  value={formDate}
                  onChange={(e) => setFormDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Nomor Bukti / Kuitansi:
              </label>
              <input
                type="text"
                placeholder="Contoh: INV-ATK-2026-088.pdf"
                value={formProof}
                onChange={(e) => setFormProof(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

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
                className="bg-teal-600 hover:bg-teal-700 text-white"
              >
                {submitting ? 'Menyimpan...' : 'Simpan Pengeluaran'}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

import React from 'react';
import Card, { CardContent } from '../components/ui/Card';
import { Receipt } from 'lucide-react';
import { useData } from '../context/DataContext';

export default function Bills() {
  const { bills } = useData();
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <Receipt className="w-6 h-6 text-indigo-500" />
          Tagihan Siswa
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Tabel interaktif master tagihan, status kelunasan, filter kelas, dan drawer riwayat cicilan.
        </p>
      </div>

      <Card>
        <CardContent className="p-8 text-center">
          <div className="w-12 h-12 rounded-full bg-indigo-50 dark:bg-indigo-950/40 text-indigo-500 mx-auto flex items-center justify-center mb-3">
            <Receipt className="w-6 h-6" />
          </div>
          <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
            Total {bills.length} Tagihan Terdaftar
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto mt-1">
            Fitur tabel interaktif, pencarian nama/NIS, filter rentang tanggal, ekspor CSV, dan drawer timeline pembayaran siswa akan aktif di Tahap 3.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}


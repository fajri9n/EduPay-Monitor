import React from 'react';
import Card, { CardContent } from '../components/ui/Card';
import { PieChart } from 'lucide-react';

export default function Budget() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <PieChart className="w-6 h-6 text-teal-500" />
          Monitoring Alokasi & Realisasi Anggaran
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Pengawasan alokasi pagu operasional vs realisasi pengeluaran berkuitansi.
        </p>
      </div>
      <Card>
        <CardContent className="p-8 text-center text-slate-500">
          Akan diaktifkan pada Tahap 4 (Progress bar batas persentase, kartu sisa anggaran, dan form tambah pengeluaran).
        </CardContent>
      </Card>
    </div>
  );
}


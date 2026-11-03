import React from 'react';
import Card, { CardContent } from '../components/ui/Card';
import { TrendingUp } from 'lucide-react';

export default function CashReports() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <TrendingUp className="w-6 h-6 text-indigo-500" />
          Laporan Kas Institusi
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Rekapitulasi penerimaan kas harian & bulanan (hanya transaksi berstatus Verified).
        </p>
      </div>
      <Card>
        <CardContent className="p-8 text-center text-slate-500">
          Akan diaktifkan pada Tahap 4 (Grafik penerimaan harian/bulanan, breakdown metode bayar, ekspor CSV & Print Friendly).
        </CardContent>
      </Card>
    </div>
  );
}


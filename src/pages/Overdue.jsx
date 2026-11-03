import React from 'react';
import Card, { CardContent, CardHeader } from '../components/ui/Card';
import { AlertTriangle } from 'lucide-react';
import { useData } from '../context/DataContext';

export default function Overdue() {
  const { overdueCount } = useData();
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <AlertTriangle className="w-6 h-6 text-rose-500" />
          Overdue Tracking & Pengingat Tagihan
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Monitoring tagihan mendekati jatuh tempo (H-7, H-3, H-1) dan tunggakan lewat tanggal jatuh tempo.
        </p>
      </div>

      <Card>
        <CardContent className="p-8 text-center">
          <div className="w-12 h-12 rounded-full bg-rose-50 dark:bg-rose-950/40 text-rose-500 mx-auto flex items-center justify-center mb-3">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
            {overdueCount} Tagihan Memerlukan Tindakan
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto mt-1">
            Fitur lengkap Overdue Tracking (filter tab H-7, H-3, H-1, Overdue bergradasi warna, modal kirim pengingat WhatsApp/Email massal) akan diaktifkan penuh pada Tahap 3.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}


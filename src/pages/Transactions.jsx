import React from 'react';
import Card, { CardContent } from '../components/ui/Card';
import { ArrowLeftRight } from 'lucide-react';
import { useData } from '../context/DataContext';

export default function Transactions() {
  const { transactions } = useData();
  const pendingCount = transactions.filter((t) => t.verification_status === 'Pending').length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <ArrowLeftRight className="w-6 h-6 text-indigo-500" />
          Transaksi & Verifikasi Pembayaran
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Daftar seluruh transaksi masuk, persetujuan bukti bayar bendahara, dan pencatatan kasir baru.
        </p>
      </div>

      <Card>
        <CardContent className="p-8 text-center">
          <div className="w-12 h-12 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-500 mx-auto flex items-center justify-center mb-3">
            <ArrowLeftRight className="w-6 h-6" />
          </div>
          <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
            {pendingCount} Transaksi Menunggu Verifikasi
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto mt-1">
            Fitur verifikasi 1-klik, form penolakan beralasan, dan modal catat bayar baru akan diaktifkan pada Tahap 3.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}


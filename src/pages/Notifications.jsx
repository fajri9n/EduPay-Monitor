import React from 'react';
import Card, { CardContent } from '../components/ui/Card';
import { BellRing } from 'lucide-react';

export default function Notifications() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <BellRing className="w-6 h-6 text-indigo-500" />
          Log Riwayat Notifikasi
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Histori pengiriman pengingat WhatsApp & Email kepada orang tua siswa.
        </p>
      </div>
      <Card>
        <CardContent className="p-8 text-center text-slate-500">
          Akan diaktifkan pada Tahap 4 (Pencarian isi pesan, filter channel WhatsApp/Email, dan status pengiriman).
        </CardContent>
      </Card>
    </div>
  );
}


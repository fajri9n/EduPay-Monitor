import React from 'react';
import Card, { CardContent } from '../components/ui/Card';
import { Users as UsersIcon } from 'lucide-react';

export default function Users() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <UsersIcon className="w-6 h-6 text-purple-500" />
          Manajemen Pengguna (Admin)
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Pengelolaan akun pengguna, peran hak akses (RBAC), dan aktivasi status.
        </p>
      </div>
      <Card>
        <CardContent className="p-8 text-center text-slate-500">
          Akan diaktifkan pada Tahap 4 (Tabel user, modal tambah user baru, dan toggle status aktif/nonaktif).
        </CardContent>
      </Card>
    </div>
  );
}


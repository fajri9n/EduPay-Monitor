/**
 * Konfigurasi badge dan warna status yang KONSISTEN di seluruh sistem
 * Lunas = Hijau (Emerald)
 * Cicilan / Partial = Kuning / Amber
 * Menunggak / Unpaid = Oranye
 * Overdue = Merah (Rose)
 * Pending = Abu-abu / Biru muda
 */

export const PAYMENT_STATUS_CONFIG = {
  Paid: {
    label: 'Lunas',
    variant: 'success',
    colorClasses: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800',
    dotColor: 'bg-emerald-500',
    badgeText: 'LUNAS',
  },
  Partial: {
    label: 'Cicilan',
    variant: 'warning',
    colorClasses: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800',
    dotColor: 'bg-amber-500',
    badgeText: 'CICILAN',
  },
  Unpaid: {
    label: 'Menunggak',
    variant: 'orange',
    colorClasses: 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/40 dark:text-orange-400 dark:border-orange-800',
    dotColor: 'bg-orange-500',
    badgeText: 'BELUM BAYAR',
  },
  Overdue: {
    label: 'Jatuh Tempo (Overdue)',
    variant: 'danger',
    colorClasses: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800',
    dotColor: 'bg-rose-500',
    badgeText: 'OVERDUE',
  },
};

export const VERIFICATION_STATUS_CONFIG = {
  Verified: {
    label: 'Terverifikasi',
    variant: 'success',
    colorClasses: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800',
    dotColor: 'bg-emerald-500',
  },
  Pending: {
    label: 'Menunggu Verifikasi',
    variant: 'neutral',
    colorClasses: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
    dotColor: 'bg-slate-400',
  },
  Rejected: {
    label: 'Ditolak',
    variant: 'danger',
    colorClasses: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800',
    dotColor: 'bg-rose-500',
  },
};

export const NOTIFICATION_STATUS_CONFIG = {
  Sent: {
    label: 'Terkirim',
    variant: 'success',
    colorClasses: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800',
  },
  Failed: {
    label: 'Gagal',
    variant: 'danger',
    colorClasses: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800',
  },
  Pending: {
    label: 'Dalam Antrean',
    variant: 'neutral',
    colorClasses: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800',
  },
};

/**
 * Mendapatkan gaya visual bergradasi untuk baris Overdue berdasarkan jumlah hari keterlambatan
 * @param {number} overdueDays Jumlah hari lewat jatuh tempo
 * @returns {{ rowClass: string, badgeClass: string, textSeverity: string }}
 */
export function getOverdueSeverityStyle(overdueDays) {
  if (overdueDays > 30) {
    return {
      rowClass: 'bg-rose-100/60 hover:bg-rose-100 dark:bg-rose-950/30 dark:hover:bg-rose-950/40 border-l-4 border-l-rose-700 font-medium',
      badgeClass: 'bg-rose-700 text-white border-rose-800 dark:bg-rose-600 dark:text-white font-bold shadow-sm',
      textSeverity: 'Kritis (>30 Hari)',
    };
  }
  if (overdueDays >= 8) {
    return {
      rowClass: 'bg-rose-50/70 hover:bg-rose-50 dark:bg-rose-950/20 dark:hover:bg-rose-950/30 border-l-4 border-l-rose-500',
      badgeClass: 'bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-900/50 dark:text-rose-300 dark:border-rose-700 font-semibold',
      textSeverity: 'Tinggi (8–30 Hari)',
    };
  }
  return {
    rowClass: 'hover:bg-rose-50/30 dark:hover:bg-rose-950/10 border-l-4 border-l-rose-300',
    badgeClass: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800',
    textSeverity: 'Sedang (1–7 Hari)',
  };
}


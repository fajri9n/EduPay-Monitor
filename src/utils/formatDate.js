// Tanggal acuan sistem (Fixed anchor: 03 Nov 2026)
export const SYSTEM_TODAY = new Date('2026-11-03T00:00:00+07:00');

const MONTH_NAMES_ID = [
  'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
  'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'
];

const FULL_MONTH_NAMES_ID = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

/**
 * Format tanggal ke format standar Indonesia: "03 Nov 2026"
 * @param {string|Date} dateInput
 * @returns {string}
 */
export function formatDate(dateInput) {
  if (!dateInput) return '-';
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return '-';

  const day = String(d.getDate()).padStart(2, '0');
  const month = MONTH_NAMES_ID[d.getMonth()];
  const year = d.getFullYear();

  return `${day} ${month} ${year}`;
}

/**
 * Format tanggal dan waktu: "03 Nov 2026, 14:30 WIB"
 * @param {string|Date} dateInput
 * @returns {string}
 */
export function formatDateTime(dateInput) {
  if (!dateInput) return '-';
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return '-';

  const day = String(d.getDate()).padStart(2, '0');
  const month = MONTH_NAMES_ID[d.getMonth()];
  const year = d.getFullYear();
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');

  return `${day} ${month} ${year}, ${hours}:${minutes} WIB`;
}

/**
 * Hitung selisih hari dari SYSTEM_TODAY (2026-11-03) ke tanggal jatuh tempo
 * @param {string|Date} dueDateInput
 * @returns {number} Negatif = lewat jatuh tempo (overdue), Positif = sisa hari
 */
export function getDaysDifference(dueDateInput) {
  if (!dueDateInput) return 0;
  const due = new Date(dueDateInput);
  due.setHours(0, 0, 0, 0);

  const today = new Date(SYSTEM_TODAY);
  today.setHours(0, 0, 0, 0);

  const diffTime = due.getTime() - today.getTime();
  return Math.round(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Menghasilkan label status batas waktu (e.g. "H-3", "Hari ini (H-0)", "Lewat 12 hari")
 * @param {string|Date} dueDateInput
 * @returns {{ label: string, isOverdue: boolean, daysDiff: number, severity: 'normal'|'warning'|'urgent'|'critical' }}
 */
export function getDueCountdown(dueDateInput) {
  const daysDiff = getDaysDifference(dueDateInput);

  if (daysDiff < 0) {
    const overdueDays = Math.abs(daysDiff);
    let severity = 'warning';
    if (overdueDays > 30) severity = 'critical';
    else if (overdueDays > 7) severity = 'urgent';

    return {
      label: `Lewat ${overdueDays} hari`,
      isOverdue: true,
      daysDiff,
      severity,
    };
  }

  if (daysDiff === 0) {
    return {
      label: 'Jatuh Tempo Hari Ini (H-0)',
      isOverdue: false,
      daysDiff: 0,
      severity: 'urgent',
    };
  }

  if (daysDiff === 1) {
    return {
      label: 'H-1 (Besok)',
      isOverdue: false,
      daysDiff: 1,
      severity: 'urgent',
    };
  }

  if (daysDiff <= 3) {
    return {
      label: `H-${daysDiff}`,
      isOverdue: false,
      daysDiff,
      severity: 'warning',
    };
  }

  if (daysDiff <= 7) {
    return {
      label: `H-${daysDiff}`,
      isOverdue: false,
      daysDiff,
      severity: 'normal',
    };
  }

  return {
    label: `${daysDiff} hari lagi`,
    isOverdue: false,
    daysDiff,
    severity: 'normal',
  };
}


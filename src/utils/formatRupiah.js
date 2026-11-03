/**
 * Format angka ke format mata uang Rupiah Indonesia
 * Contoh: 1500000 -> "Rp 1.500.000"
 * @param {number|string} amount
 * @param {boolean} [withPrefix=true]
 * @returns {string}
 */
export function formatRupiah(amount, withPrefix = true) {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return withPrefix ? 'Rp 0' : '0';
  }

  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  const isNegative = num < 0;
  const absoluteValue = Math.abs(Math.round(num));

  const formatted = absoluteValue.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');

  if (withPrefix) {
    return isNegative ? `-Rp ${formatted}` : `Rp ${formatted}`;
  }
  return isNegative ? `-${formatted}` : formatted;
}

/**
 * Format angka ringkas untuk chart atau KPI (e.g., Rp 1,5 Jt, Rp 2,3 M)
 * @param {number} amount
 * @returns {string}
 */
export function formatRupiahCompact(amount) {
  if (!amount || isNaN(amount)) return 'Rp 0';
  const num = Math.abs(amount);
  const prefix = amount < 0 ? '-Rp ' : 'Rp ';

  if (num >= 1_000_000_000) {
    return `${prefix}${(num / 1_000_000_000).toFixed(1).replace('.', ',')} M`;
  }
  if (num >= 1_000_000) {
    return `${prefix}${(num / 1_000_000).toFixed(1).replace('.', ',')} Jt`;
  }
  if (num >= 1_000) {
    return `${prefix}${(num / 1_000).toFixed(0)} Rb`;
  }
  return `${prefix}${num}`;
}


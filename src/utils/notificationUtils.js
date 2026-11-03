/**
 * Utilitas untuk mengaktifkan pengiriman pengingat via WhatsApp dan Email
 */

/**
 * Format nomor telepon Indonesia ke format tautan WhatsApp (wa.me)
 * Contoh: "0812-3456-7890" -> "https://wa.me/6281234567890?text=..."
 * @param {string} phone Nomor HP
 * @param {string} text Isi pesan
 * @returns {string} URL wa.me
 */
export function createWhatsAppUrl(phone, text) {
  if (!phone) return '#';
  let clean = String(phone).replace(/[^0-9]/g, '');
  if (clean.startsWith('0')) {
    clean = '62' + clean.slice(1);
  } else if (!clean.startsWith('62')) {
    clean = '62' + clean;
  }
  return `https://wa.me/${clean}?text=${encodeURIComponent(text)}`;
}

/**
 * Format tautan mailto untuk membuka aplikasi email (Gmail / Outlook / Mail Client)
 * @param {string} email Alamat email penerima
 * @param {string} subject Judul email
 * @param {string} body Isi pesan email
 * @returns {string} mailto: URL
 */
export function createMailtoUrl(email, subject, body) {
  if (!email) return '#';
  return `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

/**
 * Format tautan SMS untuk aplikasi perpesanan SMS
 * @param {string} phone Nomor HP
 * @param {string} text Isi pesan SMS
 * @returns {string} sms: URL
 */
export function createSmsUrl(phone, text) {
  if (!phone) return '#';
  let clean = String(phone).replace(/[^0-9]/g, '');
  return `sms:${clean}?body=${encodeURIComponent(text)}`;
}

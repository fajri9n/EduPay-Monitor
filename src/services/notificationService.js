/**
 * =============================================================================
 * PROYEK: EduPay Monitor - Notification Service
 * Template pesan notifikasi otomatis untuk WhatsApp & Email orang tua siswa
 * =============================================================================
 */

import { apiService } from './api';
import { formatRupiah } from '../utils/formatRupiah';
import { formatDate } from '../utils/formatDate';

export const notificationService = {
  /**
   * Membuat draf pesan pengingat tagihan berbasis jenis urgensi
   * @param {Object} bill Tagihan dengan student dan fee
   * @param {'WhatsApp'|'Email'} channel
   * @returns {string}
   */
  generateMessage(bill, channel = 'WhatsApp') {
    const student = bill.student;
    const fee = bill.fee;
    const dueFormatted = formatDate(fee.due_date);
    const amountFormatted = formatRupiah(bill.amount_due);

    if (bill.payment_status === 'Overdue') {
      if (channel === 'WhatsApp') {
        return (
          `*PEMBERITAHUAN TUNGGAKAN SPP - SMA NUSANTARA MANDIRI*\n\n` +
          `Yth. ${student.nama_orang_tua},\n` +
          `Wali dari siswa *${student.nama}* (Kelas: ${student.kelas}, NIS: ${student.nis}).\n\n` +
          `Kami informasikan bahwa tagihan *${fee.fee_name}* sebesar *${amountFormatted}* telah melewati batas jatuh tempo pada tanggal *${dueFormatted}*.\n\n` +
          `Mohon untuk segera melakukan penyelesaian pembayaran melalui loket tata usaha atau transfer ke rekening virtual sekolah.\n` +
          `Abaikan pesan ini apabila Bapak/Ibu telah melakukan pembayaran dalam 1x24 jam terakhir.\n\n` +
          `Terima kasih atas kerja sama dan perhatiannya.\n` +
          `_EduPay Monitor System_`
        );
      }
      return (
        `Yth. ${student.nama_orang_tua},\n\n` +
        `Melalui surat elektronik ini kami sampaikan pengingat kewajiban administrasi pendidikan untuk siswa an. ${student.nama} (Kelas: ${student.kelas}) tagihan ${fee.fee_name} dengan sisa tunggakan ${amountFormatted} yang telah melewati jatuh tempo (${dueFormatted}).\n\n` +
        `Silakan unggah bukti transfer pada portal EduPay atau konfirmasi ke bendahara sekolah.\n\n` +
        `Salam hormat,\nBagian Keuangan SMA Nusantara Mandiri`
      );
    }

    // Mendekati jatuh tempo (H-7, H-3, H-1)
    if (channel === 'WhatsApp') {
      return (
        `*PENGINGAT JATUH TEMPO BIAYA PENDIDIKAN*\n\n` +
        `Yth. ${student.nama_orang_tua},\n` +
        `Tagihan *${fee.fee_name}* untuk siswa *${student.nama}* (${student.kelas}) sejumlah *${amountFormatted}* akan jatuh tempo pada *${dueFormatted}*.\n\n` +
        `Untuk kelancaran administrasi akademik, mohon dapat melakukan pembayaran sebelum tanggal jatuh tempo. Terima kasih.\n\n` +
        `_Bagian Keuangan Sekolah_`
      );
    }

    return (
      `Yth. ${student.nama_orang_tua},\n\n` +
      `Ini adalah pengingat otomatis bahwa tagihan ${fee.fee_name} untuk ananda ${student.nama} sebesar ${amountFormatted} akan jatuh tempo pada ${dueFormatted}.\n\n` +
      `Terima kasih.`
    );
  },

  /**
   * Kirim notifikasi tunggal (simulasi)
   */
  async sendSingle(billId, channel, customMessage = null, customRecipient = null) {
    return apiService.sendNotification(billId, channel, customMessage, customRecipient);
  },

  /**
   * Kirim notifikasi massal untuk beberapa tagihan sekaligus
   * @param {Array<number>} billIds
   * @param {'WhatsApp'|'Email'} channel
   * @returns {Promise<Array>}
   */
  async sendBulk(billIds, channel = 'WhatsApp') {
    const results = [];
    for (const id of billIds) {
      try {
        const log = await apiService.sendNotification(id, channel);
        results.push({ billId: id, success: true, log });
      } catch (err) {
        results.push({ billId: id, success: false, error: err.message });
      }
    }
    return results;
  },
};


/**
 * =============================================================================
 * PROYEK: EduPay Monitor - API & Service Layer
 * Bertindak sebagai abstraction layer antara komponen frontend dan sumber data.
 * Saat VITE_USE_MOCK=false dan VITE_API_URL aktif, service ini siap disambungkan ke REST API.
 * =============================================================================
 */

import {
  mockClasses,
  mockStudents,
  mockFeeStructures,
  mockStudentBills,
  mockPaymentTransactions,
  mockBudgetAllocations,
  mockBudgetExpenditures,
  mockNotificationLogs,
  mockUsers,
  SYSTEM_DATE,
} from '../data/mock';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const USE_REMOTE_API = import.meta.env.VITE_USE_MOCK === 'false';

// Helper simulasi latency network agar UX loading/skeleton terasa realistis
const simulateDelay = (ms = 120) => new Promise((resolve) => setTimeout(resolve, ms));

// In-Memory Database (clone dari mock data agar perubahan selama sesi berjalan dinamis)
let state = {
  classes: [...mockClasses],
  students: [...mockStudents],
  feeStructures: [...mockFeeStructures],
  bills: JSON.parse(JSON.stringify(mockStudentBills)),
  transactions: JSON.parse(JSON.stringify(mockPaymentTransactions)),
  budgetAllocations: JSON.parse(JSON.stringify(mockBudgetAllocations)),
  budgetExpenditures: JSON.parse(JSON.stringify(mockBudgetExpenditures)),
  notificationLogs: JSON.parse(JSON.stringify(mockNotificationLogs)),
  users: JSON.parse(JSON.stringify(mockUsers)),
};

/**
 * FUNGSI INTI LOGIKA BISNIS:
 * Menghitung ulang sisa tagihan (amount_due) dan status pembayaran secara idempotent
 * berdasarkan transaksi terverifikasi (Verified)
 */
function recalculateBillStatus(billId) {
  const billIndex = state.bills.findIndex((b) => b.bill_id === billId);
  if (billIndex === -1) return;

  const bill = state.bills[billIndex];
  const fee = state.feeStructures.find((f) => f.fee_id === bill.fee_id);
  if (!fee) return;

  // Hitung total transaksi dengan status 'Verified'
  const verifiedPaid = state.transactions
    .filter((t) => t.bill_id === billId && t.verification_status === 'Verified')
    .reduce((sum, t) => sum + Number(t.amount_paid), 0);

  const amountDue = Math.max(0, fee.amount - verifiedPaid);
  let status = 'Unpaid';

  if (amountDue <= 0) {
    status = 'Paid';
  } else if (fee.due_date < SYSTEM_DATE) {
    status = 'Overdue';
  } else if (verifiedPaid > 0) {
    status = 'Partial';
  } else {
    status = 'Unpaid';
  }

  state.bills[billIndex] = {
    ...bill,
    amount_due: amountDue,
    payment_status: status,
  };
}

export const apiService = {
  // ---------------------------------------------------------------------------
  // AUTH
  // ---------------------------------------------------------------------------
  async login(username, password) {
    if (USE_REMOTE_API) {
      const res = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      return res.json();
    }

    await simulateDelay();
    const user = state.users.find((u) => u.username.toLowerCase() === username.toLowerCase());
    if (!user) {
      throw new Error('Username atau kata sandi tidak ditemukan.');
    }
    if (!user.status_aktif) {
      throw new Error('Akun Anda telah dinonaktifkan. Silakan hubungi admin.');
    }
    return {
      success: true,
      token: 'mock-jwt-token-' + user.user_id,
      user,
    };
  },

  // ---------------------------------------------------------------------------
  // DASHBOARD & ANALITIK
  // ---------------------------------------------------------------------------
  async getDashboardSummary(filterClass = 'all', filterPeriod = 'all') {
    if (USE_REMOTE_API) {
      const res = await fetch(`${API_BASE_URL}/dashboard/summary?class=${filterClass}&period=${filterPeriod}`);
      return res.json();
    }

    await simulateDelay();

    // Filter siswa sesuai kelas
    let studentIds = state.students;
    if (filterClass !== 'all') {
      studentIds = studentIds.filter((s) => s.kelas === filterClass);
    }
    const studentIdSet = new Set(studentIds.map((s) => s.student_id));

    // Filter tagihan sesuai kelas & periode
    let filteredBills = state.bills.filter((b) => studentIdSet.has(b.student_id));
    if (filterPeriod !== 'all') {
      filteredBills = filteredBills.filter((b) => b.fee_id === Number(filterPeriod));
    }

    // 1. Total Tagihan (Kewajiban)
    const totalTagihanNominal = filteredBills.reduce((acc, b) => {
      const fee = state.feeStructures.find((f) => f.fee_id === b.fee_id);
      return acc + (fee ? fee.amount : 0);
    }, 0);

    // 2. Total Tunggakan (Sisa Belum Dibayar)
    const totalTunggakanNominal = filteredBills.reduce((acc, b) => acc + Number(b.amount_due), 0);

    // 3. Total Terbayar (Verified)
    const billIdSet = new Set(filteredBills.map((b) => b.bill_id));
    const verifiedTransactions = state.transactions.filter(
      (t) => billIdSet.has(t.bill_id) && t.verification_status === 'Verified'
    );
    const totalTerbayarNominal = verifiedTransactions.reduce((acc, t) => acc + Number(t.amount_paid), 0);

    // 4. Kolektibilitas (%)
    const persentaseKolektibilitas =
      totalTagihanNominal > 0
        ? Number(((totalTerbayarNominal / totalTagihanNominal) * 100).toFixed(1))
        : 0;

    // 5. Status per Kelas (Stacked Bar Chart)
    const classStatusData = state.classes.map((cls) => {
      const classStudents = state.students.filter((s) => s.kelas === cls);
      const cStudentIds = new Set(classStudents.map((s) => s.student_id));
      const cBills = state.bills.filter((b) => cStudentIds.has(b.student_id));

      const lunasCount = cBills.filter((b) => b.payment_status === 'Paid').length;
      const cicilanCount = cBills.filter((b) => b.payment_status === 'Partial').length;
      const menunggakCount = cBills.filter((b) => b.payment_status === 'Unpaid' || b.payment_status === 'Overdue').length;

      return {
        kelas: cls,
        Lunas: lunasCount,
        Cicilan: cicilanCount,
        Menunggak: menunggakCount,
        totalBills: cBills.length,
      };
    });

    // 6. Tren Penerimaan Kas 30 Hari Terakhir (Line / Area Chart)
    const cashTrendMap = {};
    for (let i = 29; i >= 0; i--) {
      const d = new Date('2026-11-03T00:00:00+07:00');
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().slice(0, 10);
      cashTrendMap[dateStr] = { date: dateStr, total: 0, count: 0 };
    }

    verifiedTransactions.forEach((t) => {
      const dateStr = t.transaction_date.slice(0, 10);
      if (cashTrendMap[dateStr]) {
        cashTrendMap[dateStr].total += Number(t.amount_paid);
        cashTrendMap[dateStr].count += 1;
      }
    });
    const cashTrendData = Object.values(cashTrendMap);

    // 7. Komposisi Metode Pembayaran (Donut Chart)
    const paymentMethodStats = { 'Transfer Bank': 0, 'E-Wallet': 0, Cash: 0 };
    verifiedTransactions.forEach((t) => {
      if (paymentMethodStats[t.payment_method] !== undefined) {
        paymentMethodStats[t.payment_method] += Number(t.amount_paid);
      }
    });
    const paymentMethodData = Object.entries(paymentMethodStats).map(([method, total]) => ({
      name: method,
      value: total,
    }));

    // 8. Widget Segera Jatuh Tempo (Top 5 mendekati atau baru jatuh tempo)
    const upcomingBills = filteredBills
      .filter((b) => b.amount_due > 0)
      .map((b) => {
        const student = state.students.find((s) => s.student_id === b.student_id);
        const fee = state.feeStructures.find((f) => f.fee_id === b.fee_id);
        return {
          ...b,
          student,
          fee,
        };
      })
      .sort((a, b) => new Date(a.fee.due_date) - new Date(b.fee.due_date))
      .slice(0, 5);

    return {
      kpi: {
        totalTagihan: totalTagihanNominal,
        totalTerbayar: totalTerbayarNominal,
        totalTunggakan: totalTunggakanNominal,
        kolektibilitas: persentaseKolektibilitas,
        tagihanTrend: '+8.4%',
        terbayarTrend: '+12.1%',
        tunggakanTrend: '-5.2%',
        kolektibilitasTrend: '+3.5%',
      },
      classStatusData,
      cashTrendData,
      paymentMethodData,
      upcomingBills,
    };
  },

  // ---------------------------------------------------------------------------
  // TAGIHAN SISWA
  // ---------------------------------------------------------------------------
  async getBills() {
    if (USE_REMOTE_API) {
      const res = await fetch(`${API_BASE_URL}/bills`);
      return res.json();
    }
    await simulateDelay();

    return state.bills.map((b) => {
      const student = state.students.find((s) => s.student_id === b.student_id);
      const fee = state.feeStructures.find((f) => f.fee_id === b.fee_id);
      const studentTx = state.transactions.filter((t) => t.bill_id === b.bill_id);
      return {
        ...b,
        student,
        fee,
        transactions: studentTx,
      };
    });
  },

  // ---------------------------------------------------------------------------
  // TRANSAKSI & VERIFIKASI
  // ---------------------------------------------------------------------------
  async getTransactions() {
    if (USE_REMOTE_API) {
      const res = await fetch(`${API_BASE_URL}/transactions`);
      return res.json();
    }
    await simulateDelay();

    return state.transactions
      .map((t) => {
        const bill = state.bills.find((b) => b.bill_id === t.bill_id);
        const student = bill ? state.students.find((s) => s.student_id === bill.student_id) : null;
        const fee = bill ? state.feeStructures.find((f) => f.fee_id === bill.fee_id) : null;
        return {
          ...t,
          bill,
          student,
          fee,
        };
      })
      .sort((a, b) => new Date(b.transaction_date) - new Date(a.transaction_date));
  },

  async verifyTransaction(transactionId, verifierUserId = 2) {
    if (USE_REMOTE_API) {
      const res = await fetch(`${API_BASE_URL}/transactions/${transactionId}/verify`, { method: 'POST' });
      return res.json();
    }
    await simulateDelay();

    const txIndex = state.transactions.findIndex((t) => t.transaction_id === transactionId);
    if (txIndex === -1) throw new Error('Transaksi tidak ditemukan.');

    state.transactions[txIndex] = {
      ...state.transactions[txIndex],
      verification_status: 'Verified',
      verified_by: verifierUserId,
      verified_at: '2026-11-03 10:30:00',
      rejection_reason: null,
    };

    // Sinkronisasi status tagihan
    recalculateBillStatus(state.transactions[txIndex].bill_id);

    return state.transactions[txIndex];
  },

  async rejectTransaction(transactionId, reason = 'Bukti pembayaran tidak valid') {
    if (USE_REMOTE_API) {
      const res = await fetch(`${API_BASE_URL}/transactions/${transactionId}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      });
      return res.json();
    }
    await simulateDelay();

    const txIndex = state.transactions.findIndex((t) => t.transaction_id === transactionId);
    if (txIndex === -1) throw new Error('Transaksi tidak ditemukan.');

    state.transactions[txIndex] = {
      ...state.transactions[txIndex],
      verification_status: 'Rejected',
      rejection_reason: reason,
    };

    // Sinkronisasi status tagihan (revert if needed)
    recalculateBillStatus(state.transactions[txIndex].bill_id);

    return state.transactions[txIndex];
  },

  async createTransaction(payload) {
    if (USE_REMOTE_API) {
      const res = await fetch(`${API_BASE_URL}/transactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      return res.json();
    }
    await simulateDelay();

    const newId = Math.max(...state.transactions.map((t) => t.transaction_id), 0) + 1;
    const newTx = {
      transaction_id: newId,
      bill_id: Number(payload.bill_id),
      amount_paid: Number(payload.amount_paid),
      payment_method: payload.payment_method,
      transaction_date: payload.transaction_date || '2026-11-03 10:15:00',
      verification_status: payload.verification_status || 'Pending',
      reference_number: `TRX-2026-${String(newId).padStart(5, '0')}`,
      proof_file: payload.proof_file || 'bukti_bayar_upload.jpg',
    };

    state.transactions.unshift(newTx);
    if (newTx.verification_status === 'Verified') {
      recalculateBillStatus(newTx.bill_id);
    }

    return newTx;
  },

  // ---------------------------------------------------------------------------
  // ANGGARAN OPERASIONAL
  // ---------------------------------------------------------------------------
  async getBudgetData() {
    if (USE_REMOTE_API) {
      const res = await fetch(`${API_BASE_URL}/budget`);
      return res.json();
    }
    await simulateDelay();

    const allocationsWithRealization = state.budgetAllocations.map((alloc) => {
      const relatedExp = state.budgetExpenditures.filter((e) => e.allocation_id === alloc.allocation_id);
      const totalRealisasi = relatedExp.reduce((sum, e) => sum + Number(e.nominal), 0);
      const sisa = alloc.nominal_alokasi - totalRealisasi;
      const persentase = Number(((totalRealisasi / alloc.nominal_alokasi) * 100).toFixed(1));

      return {
        ...alloc,
        total_realisasi: totalRealisasi,
        sisa_anggaran: sisa,
        persentase_realisasi: persentase,
        expenditures: relatedExp,
      };
    });

    return {
      allocations: allocationsWithRealization,
      expenditures: state.budgetExpenditures,
    };
  },

  async addExpenditure(payload) {
    if (USE_REMOTE_API) {
      const res = await fetch(`${API_BASE_URL}/budget/expenditures`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      return res.json();
    }
    await simulateDelay();

    const newId = Math.max(...state.budgetExpenditures.map((e) => e.expenditure_id), 0) + 1;
    const newExp = {
      expenditure_id: newId,
      allocation_id: Number(payload.allocation_id),
      deskripsi: payload.deskripsi,
      nominal: Number(payload.nominal),
      tanggal: payload.tanggal || '2026-11-03',
      bukti: payload.bukti || `INV-BGT-${newId}.pdf`,
    };

    state.budgetExpenditures.unshift(newExp);
    return newExp;
  },

  // ---------------------------------------------------------------------------
  // NOTIFIKASI
  // ---------------------------------------------------------------------------
  async getNotificationLogs() {
    if (USE_REMOTE_API) {
      const res = await fetch(`${API_BASE_URL}/notifications/logs`);
      return res.json();
    }
    await simulateDelay();
    return [...state.notificationLogs].sort((a, b) => new Date(b.waktu_kirim) - new Date(a.waktu_kirim));
  },

  async sendNotification(billId, channel = 'WhatsApp', customMessage = null) {
    if (USE_REMOTE_API) {
      const res = await fetch(`${API_BASE_URL}/notifications/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ billId, channel, customMessage }),
      });
      return res.json();
    }
    await simulateDelay();

    const bill = state.bills.find((b) => b.bill_id === billId);
    if (!bill) throw new Error('Tagihan tidak ditemukan.');
    const student = state.students.find((s) => s.student_id === bill.student_id);
    const fee = state.feeStructures.find((f) => f.fee_id === bill.fee_id);

    const recipient = channel === 'WhatsApp' ? student.no_hp_ortu : student.email_ortu;
    const message =
      customMessage ||
      `Yth. ${student.nama_orang_tua}, tagihan ${fee.fee_name} an. ${student.nama} memiliki sisa tunggakan Rp ${bill.amount_due.toLocaleString('id-ID')}. Jatuh tempo pada ${fee.due_date}.`;

    const newLog = {
      notification_id: Math.max(...state.notificationLogs.map((l) => l.notification_id), 0) + 1,
      bill_id: billId,
      channel,
      recipient,
      status: 'Terkirim',
      isi_pesan: message,
      waktu_kirim: '2026-11-03 10:45:00',
    };

    state.notificationLogs.unshift(newLog);
    return newLog;
  },

  // ---------------------------------------------------------------------------
  // MANAJEMEN PENGGUNA (ADMIN)
  // ---------------------------------------------------------------------------
  async getUsers() {
    if (USE_REMOTE_API) {
      const res = await fetch(`${API_BASE_URL}/users`);
      return res.json();
    }
    await simulateDelay();
    return [...state.users];
  },

  async toggleUserStatus(userId) {
    await simulateDelay();
    const idx = state.users.findIndex((u) => u.user_id === userId);
    if (idx !== -1) {
      state.users[idx].status_aktif = !state.users[idx].status_aktif;
      return state.users[idx];
    }
    throw new Error('User tidak ditemukan.');
  },

  async createUser(payload) {
    await simulateDelay();
    const newId = Math.max(...state.users.map((u) => u.user_id), 0) + 1;
    const newUser = {
      user_id: newId,
      username: payload.username,
      role: payload.role,
      role_name: payload.role_name || payload.role,
      nama_lengkap: payload.nama_lengkap,
      email: payload.email,
      status_aktif: true,
      avatar: `https://images.unsplash.com/photo-${1500000000000 + newId}?w=120&auto=format&fit=crop&q=80`,
    };
    state.users.push(newUser);
    return newUser;
  },
};


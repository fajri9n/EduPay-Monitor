import random
import json
from datetime import datetime, timedelta

random.seed(101)

# Tanggal hari ini: 03 Nov 2026
ANCHOR_DATE = datetime(2026, 11, 3, 10, 0, 0)

classes = ["X-A", "X-B", "XI-MIPA", "XI-IPS", "XII-MIPA", "XII-IPS"]

male_names = [
    "Ahmad", "Budi", "Candra", "Dimas", "Eko", "Fajar", "Gilang", "Hafiz", "Ilham", "Joko",
    "Kurniawan", "Lukman", "Maulana", "Naufal", "Oktavian", "Prasetyo", "Rizky", "Surya", "Teguh", "Wahyu"
]
female_names = [
    "Aisyah", "Bunga", "Citra", "Dian", "Erna", "Fitriani", "Gita", "Hana", "Indah", "Juwita",
    "Kartika", "Lestari", "Maya", "Nurul", "Putri", "Ratna", "Sari", "Tiara", "Utami", "Wulandari"
]
last_names = [
    "Pratama", "Saputra", "Wijaya", "Hidayat", "Santoso", "Setiawan", "Kusuma", "Nugroho",
    "Ramadhan", "Siregar", "Nasution", "Wibowo", "Permana", "Firmansyah", "Gunawan", "Hakim",
    "Irawan", "Mahendra", "Purnomo", "Raharjo", "Subagyo", "Utomo", "Yulianto", "Zulkarnain"
]

# Generate 120 students (20 per class)
students = []
student_id = 1
for c in classes:
    for i in range(20):
        is_male = (i % 2 == 0)
        fname = random.choice(male_names if is_male else female_names)
        lname = random.choice(last_names)
        full_name = f"{fname} {lname}"
        if student_id == 1:
            full_name = "Budi Pratama"
            parent_name = "Bambang Pratama"
        else:
            title = "Bpk. " if random.random() > 0.3 else "Ibu "
            parent_name = f"{title}{random.choice(male_names)} {lname}"
            
        nis = f"2026{student_id:04d}"
        email_clean = f"ortu.{nis}@example.com"
        phone = f"0812{random.randint(10000000, 99999999)}"
        
        students.append({
            "student_id": student_id,
            "nis": nis,
            "nama": full_name,
            "kelas": c,
            "nama_orang_tua": parent_name,
            "email_ortu": email_clean,
            "no_hp_ortu": phone,
            "status_aktif": True
        })
        student_id += 1

# Fee structures
fee_structures = [
    {"fee_id": 1, "fee_name": "SPP Bulan Juni 2026", "amount": 650000, "due_date": "2026-06-10"},
    {"fee_id": 2, "fee_name": "SPP Bulan Juli 2026", "amount": 650000, "due_date": "2026-07-10"},
    {"fee_id": 3, "fee_name": "SPP Bulan Agustus 2026", "amount": 650000, "due_date": "2026-08-10"},
    {"fee_id": 4, "fee_name": "SPP Bulan September 2026", "amount": 650000, "due_date": "2026-09-10"},
    {"fee_id": 5, "fee_name": "SPP Bulan Oktober 2026", "amount": 650000, "due_date": "2026-10-10"},
    {"fee_id": 6, "fee_name": "SPP Bulan November 2026", "amount": 650000, "due_date": "2026-11-10"}, # H-7 due date
    {"fee_id": 7, "fee_name": "Iuran Kegiatan & Praktikum Lab", "amount": 950000, "due_date": "2026-11-06"}, # H-3 due date
    {"fee_id": 8, "fee_name": "Iuran Ujian Akhir Semester Ganjil", "amount": 500000, "due_date": "2026-11-04"} # H-1 due date
]

# Generate bills
# Let's assign bills so that total bills = ±320
# Fees 4, 5, 6 for all 120 students = 360 bills, plus some fee 7 & 8
bills = []
bill_id = 1
for s in students:
    # Everyone has Fee 4 (Sept), Fee 5 (Okt), Fee 6 (Nov)
    for fid in [4, 5, 6]:
        fee = next(f for f in fee_structures if f["fee_id"] == fid)
        created = (datetime.strptime(fee["due_date"], "%Y-%m-%d") - timedelta(days=25)).strftime("%Y-%m-%d")
        bills.append({
            "bill_id": bill_id,
            "student_id": s["student_id"],
            "fee_id": fid,
            "amount_due": fee["amount"],
            "payment_status": "Unpaid",
            "created_at": created
        })
        bill_id += 1

# Plus add fee 7 and 8 to a subset of students to create H-3 and H-1 urgent alerts!
for s in students[0:15]: # 15 students have fee 7 (due Nov 6 -> H-3)
    fee = next(f for f in fee_structures if f["fee_id"] == 7)
    bills.append({
        "bill_id": bill_id,
        "student_id": s["student_id"],
        "fee_id": 7,
        "amount_due": fee["amount"],
        "payment_status": "Unpaid",
        "created_at": "2026-10-15"
    })
    bill_id += 1

for s in students[15:25]: # 10 students have fee 8 (due Nov 4 -> H-1)
    fee = next(f for f in fee_structures if f["fee_id"] == 8)
    bills.append({
        "bill_id": bill_id,
        "student_id": s["student_id"],
        "fee_id": 8,
        "amount_due": fee["amount"],
        "payment_status": "Unpaid",
        "created_at": "2026-10-20"
    })
    bill_id += 1

# Total bills created: 120*3 + 15 + 10 = 385 bills. Perfect!

# Generate transactions
# We need ±500 transactions within the last 6 months (May - Nov 2026)
# Payment methods: 'Transfer Bank', 'E-Wallet', 'Cash'
# Verification: 'Verified', 'Pending', 'Rejected'
methods = ["Transfer Bank", "E-Wallet", "Cash"]
method_weights = [0.55, 0.30, 0.15]

transactions = []
tx_id = 1

# We will assign transactions to bills and compute sisa tagihan
# Bills with September SPP (fee_id=4): mostly Paid or Partial or Overdue
# Bills with October SPP (fee_id=5): mix of Paid, Partial, Overdue (due Oct 10 is past Nov 3 -> Overdue)
# Bills with November SPP (fee_id=6): mix of Paid early, Partial, Pending, Unpaid (due Nov 10 is upcoming -> H-7)

# Let's distribute 500 transactions
bill_payments = {b["bill_id"]: [] for b in bills}

# Group 1: 150 bills paid in full with 1 transaction
for b in bills[0:150]:
    fee = next(f for f in fee_structures if f["fee_id"] == b["fee_id"])
    m = random.choices(methods, weights=method_weights)[0]
    
    # tx date before or on due date
    due = datetime.strptime(fee["due_date"], "%Y-%m-%d")
    tx_date = due - timedelta(days=random.randint(1, 15), hours=random.randint(1, 10))
    if tx_date > ANCHOR_DATE:
        tx_date = ANCHOR_DATE - timedelta(hours=random.randint(2, 40))
        
    tx = {
        "transaction_id": tx_id,
        "bill_id": b["bill_id"],
        "amount_paid": fee["amount"],
        "payment_method": m,
        "transaction_date": tx_date.strftime("%Y-%m-%d %H:%M:%S"),
        "verification_status": "Verified",
        "reference_number": f"TRX-2026-{tx_id:05d}",
        "proof_file": f"bukti_bayar_{tx_id}.jpg"
    }
    transactions.append(tx)
    bill_payments[b["bill_id"]].append(tx)
    tx_id += 1

# Group 2: 70 bills paid in full with 2 partial transactions (140 txs)
for b in bills[150:220]:
    fee = next(f for f in fee_structures if f["fee_id"] == b["fee_id"])
    p1 = 300000
    p2 = fee["amount"] - p1
    m1 = random.choices(methods, weights=method_weights)[0]
    m2 = random.choices(methods, weights=method_weights)[0]
    
    due = datetime.strptime(fee["due_date"], "%Y-%m-%d")
    t1 = due - timedelta(days=random.randint(10, 20))
    t2 = due - timedelta(days=random.randint(1, 5))
    if t2 > ANCHOR_DATE:
        t2 = ANCHOR_DATE - timedelta(days=1)
    if t1 > t2:
        t1 = t2 - timedelta(days=5)
        
    tx1 = {
        "transaction_id": tx_id,
        "bill_id": b["bill_id"],
        "amount_paid": p1,
        "payment_method": m1,
        "transaction_date": t1.strftime("%Y-%m-%d %H:%M:%S"),
        "verification_status": "Verified",
        "reference_number": f"TRX-2026-{tx_id:05d}",
        "proof_file": f"bukti_bayar_{tx_id}.jpg"
    }
    transactions.append(tx1)
    bill_payments[b["bill_id"]].append(tx1)
    tx_id += 1
    
    tx2 = {
        "transaction_id": tx_id,
        "bill_id": b["bill_id"],
        "amount_paid": p2,
        "payment_method": m2,
        "transaction_date": t2.strftime("%Y-%m-%d %H:%M:%S"),
        "verification_status": "Verified",
        "reference_number": f"TRX-2026-{tx_id:05d}",
        "proof_file": f"bukti_bayar_{tx_id}.jpg"
    }
    transactions.append(tx2)
    bill_payments[b["bill_id"]].append(tx2)
    tx_id += 1

# Group 3: 40 bills with 1 partial payment (still partial status) (40 txs)
for b in bills[220:260]:
    m = random.choices(methods, weights=method_weights)[0]
    amt = random.choice([250000, 300000, 400000])
    tx_date = ANCHOR_DATE - timedelta(days=random.randint(2, 45), hours=random.randint(1, 10))
    tx = {
        "transaction_id": tx_id,
        "bill_id": b["bill_id"],
        "amount_paid": amt,
        "payment_method": m,
        "transaction_date": tx_date.strftime("%Y-%m-%d %H:%M:%S"),
        "verification_status": "Verified",
        "reference_number": f"TRX-2026-{tx_id:05d}",
        "proof_file": f"bukti_bayar_{tx_id}.jpg"
    }
    transactions.append(tx)
    bill_payments[b["bill_id"]].append(tx)
    tx_id += 1

# Group 4: 45 bills with Pending transactions (45 txs) - Recent payments waiting for verification
for b in bills[260:305]:
    fee = next(f for f in fee_structures if f["fee_id"] == b["fee_id"])
    m = random.choices(methods, weights=method_weights)[0]
    tx_date = ANCHOR_DATE - timedelta(hours=random.randint(1, 48))
    amt = random.choice([fee["amount"], 350000])
    tx = {
        "transaction_id": tx_id,
        "bill_id": b["bill_id"],
        "amount_paid": amt,
        "payment_method": m,
        "transaction_date": tx_date.strftime("%Y-%m-%d %H:%M:%S"),
        "verification_status": "Pending",
        "reference_number": f"TRX-2026-{tx_id:05d}",
        "proof_file": f"bukti_bayar_{tx_id}.jpg"
    }
    transactions.append(tx)
    bill_payments[b["bill_id"]].append(tx)
    tx_id += 1

# Group 5: 35 bills with Rejected transactions (35 txs) - nominal salah atau bukti transfer buram
for b in bills[305:340]:
    fee = next(f for f in fee_structures if f["fee_id"] == b["fee_id"])
    m = random.choices(methods, weights=method_weights)[0]
    tx_date = ANCHOR_DATE - timedelta(days=random.randint(2, 20))
    tx = {
        "transaction_id": tx_id,
        "bill_id": b["bill_id"],
        "amount_paid": fee["amount"],
        "payment_method": m,
        "transaction_date": tx_date.strftime("%Y-%m-%d %H:%M:%S"),
        "verification_status": "Rejected",
        "rejection_reason": random.choice(["Nominal tidak sesuai", "Bukti transfer tidak terbaca / buram", "Rekening tujuan salah"]),
        "reference_number": f"TRX-2026-{tx_id:05d}",
        "proof_file": f"bukti_bayar_{tx_id}.jpg"
    }
    transactions.append(tx)
    bill_payments[b["bill_id"]].append(tx)
    tx_id += 1

# Total so far: 150 + 140 + 40 + 45 + 35 = 410 txs.
# Add 90 more transactions spread over the last 6 months to reach exactly 500!
for i in range(90):
    b = random.choice(bills[0:220])
    status = random.choices(["Verified", "Pending", "Rejected"], weights=[0.75, 0.15, 0.10])[0]
    m = random.choices(methods, weights=method_weights)[0]
    amt = random.choice([200000, 250000, 300000, 350000])
    tx_date = ANCHOR_DATE - timedelta(days=random.randint(1, 150), hours=random.randint(1, 12))
    
    tx = {
        "transaction_id": tx_id,
        "bill_id": b["bill_id"],
        "amount_paid": amt,
        "payment_method": m,
        "transaction_date": tx_date.strftime("%Y-%m-%d %H:%M:%S"),
        "verification_status": status,
        "reference_number": f"TRX-2026-{tx_id:05d}",
        "proof_file": f"bukti_bayar_{tx_id}.jpg"
    }
    if status == "Rejected":
        tx["rejection_reason"] = "Struk ATM terpotong"
    transactions.append(tx)
    if status == "Verified":
        bill_payments[b["bill_id"]].append(tx)
    tx_id += 1

# Recalculate bill amount_due and payment_status based on verified transactions and due_date
today_str = "2026-11-03"
for b in bills:
    fee = next(f for f in fee_structures if f["fee_id"] == b["fee_id"])
    verified_paid = sum(t["amount_paid"] for t in bill_payments[b["bill_id"]] if t.get("verification_status") == "Verified")
    new_due = max(0, fee["amount"] - verified_paid)
    b["amount_due"] = new_due
    
    if new_due <= 0:
        b["payment_status"] = "Paid"
    elif fee["due_date"] < today_str:
        b["payment_status"] = "Overdue"
    elif verified_paid > 0:
        b["payment_status"] = "Partial"
    else:
        b["payment_status"] = "Unpaid"

# Budget Allocations & Expenditures
budget_allocations = [
    {"allocation_id": 1, "kategori": "Gaji Guru & Tenaga Kependidikan", "periode": "2026/2027", "nominal_alokasi": 320000000},
    {"allocation_id": 2, "kategori": "Utilitas Listrik, Air & Internet", "periode": "2026/2027", "nominal_alokasi": 55000000},
    {"allocation_id": 3, "kategori": "Sarana & Prasarana Laboratorium", "periode": "2026/2027", "nominal_alokasi": 95000000},
    {"allocation_id": 4, "kategori": "Kegiatan Kesiswaan & OSIS", "periode": "2026/2027", "nominal_alokasi": 70000000},
    {"allocation_id": 5, "kategori": "Pengadaan ATK & Modul Pembelajaran", "periode": "2026/2027", "nominal_alokasi": 45000000}
]

budget_expenditures = [
    {"expenditure_id": 1, "allocation_id": 1, "deskripsi": "Gaji & Honorarium Pendidik Bulan Juli 2026", "nominal": 45000000, "tanggal": "2026-07-28", "bukti": "BKT-GJI-0726.pdf"},
    {"expenditure_id": 2, "allocation_id": 1, "deskripsi": "Gaji & Honorarium Pendidik Bulan Agustus 2026", "nominal": 45000000, "tanggal": "2026-08-28", "bukti": "BKT-GJI-0826.pdf"},
    {"expenditure_id": 3, "allocation_id": 1, "deskripsi": "Gaji & Honorarium Pendidik Bulan September 2026", "nominal": 46500000, "tanggal": "2026-09-28", "bukti": "BKT-GJI-0926.pdf"},
    {"expenditure_id": 4, "allocation_id": 1, "deskripsi": "Gaji & Honorarium Pendidik Bulan Oktober 2026", "nominal": 46500000, "tanggal": "2026-10-28", "bukti": "BKT-GJI-1026.pdf"},
    {"expenditure_id": 5, "allocation_id": 2, "deskripsi": "Tagihan Listrik PLN Juli 2026", "nominal": 6200000, "tanggal": "2026-08-04", "bukti": "PLN-0726.pdf"},
    {"expenditure_id": 6, "allocation_id": 2, "deskripsi": "Langganan Internet Dedicated Fiber Optic Juli 2026", "nominal": 4800000, "tanggal": "2026-08-05", "bukti": "ISP-0726.pdf"},
    {"expenditure_id": 7, "allocation_id": 2, "deskripsi": "Tagihan Listrik PLN Agustus 2026", "nominal": 6450000, "tanggal": "2026-09-04", "bukti": "PLN-0826.pdf"},
    {"expenditure_id": 8, "allocation_id": 2, "deskripsi": "Langganan Internet Dedicated Fiber Optic Agustus 2026", "nominal": 4800000, "tanggal": "2026-09-05", "bukti": "ISP-0826.pdf"},
    {"expenditure_id": 9, "allocation_id": 2, "deskripsi": "Tagihan Listrik PLN September 2026", "nominal": 6300000, "tanggal": "2026-10-04", "bukti": "PLN-0926.pdf"},
    {"expenditure_id": 10, "allocation_id": 2, "deskripsi": "Langganan Internet Dedicated Fiber Optic September 2026", "nominal": 4800000, "tanggal": "2026-10-05", "bukti": "ISP-0926.pdf"},
    {"expenditure_id": 11, "allocation_id": 2, "deskripsi": "Tagihan Listrik PLN Oktober 2026", "nominal": 6500000, "tanggal": "2026-11-02", "bukti": "PLN-1026.pdf"},
    {"expenditure_id": 12, "allocation_id": 3, "deskripsi": "Peremajaan 15 Unit PC Lab Komputer & SSD", "nominal": 38000000, "tanggal": "2026-08-15", "bukti": "INV-LAB-01.pdf"},
    {"expenditure_id": 13, "allocation_id": 3, "deskripsi": "Pengadaan Mikroskop Binokuler Lab Biologi 4 Unit", "nominal": 18500000, "tanggal": "2026-09-12", "bukti": "INV-LAB-02.pdf"},
    {"expenditure_id": 14, "allocation_id": 3, "deskripsi": "Perpanjangan Lisensi Software Cisco & OS Lab", "nominal": 14000000, "tanggal": "2026-10-18", "bukti": "INV-LAB-03.pdf"},
    {"expenditure_id": 15, "allocation_id": 4, "deskripsi": "Penyelenggaraan Masa Pengenalan Lingkungan Sekolah (MPLS)", "nominal": 16500000, "tanggal": "2026-07-22", "bukti": "KEG-MPLS.pdf"},
    {"expenditure_id": 16, "allocation_id": 4, "deskripsi": "Peringatan HUT RI & Lomba Kemerdekaan Antar Kelas", "nominal": 12000000, "tanggal": "2026-08-18", "bukti": "KEG-HUTRI.pdf"},
    {"expenditure_id": 17, "allocation_id": 4, "deskripsi": "Latihan Dasar Kepemimpinan Siswa (LDKS) OSIS", "nominal": 19500000, "tanggal": "2026-10-12", "bukti": "KEG-LDKS.pdf"},
    {"expenditure_id": 18, "allocation_id": 5, "deskripsi": "Pengadaan Kertas HVS, Tinta & Toner Printer Kantor", "nominal": 8500000, "tanggal": "2026-08-08", "bukti": "ATK-01.pdf"},
    {"expenditure_id": 19, "allocation_id": 5, "deskripsi": "Cetak Buku Panduan Siswa & Modul Kurikulum Merdeka", "nominal": 22000000, "tanggal": "2026-09-02", "bukti": "ATK-02.pdf"},
    {"expenditure_id": 20, "allocation_id": 5, "deskripsi": "Pengadaan Spidol Whiteboard & Perlengkapan Kelas", "nominal": 6500000, "tanggal": "2026-10-09", "bukti": "ATK-03.pdf"}
]

# Notification logs
notification_logs = [
    {
        "notification_id": 1,
        "bill_id": 361,
        "channel": "WhatsApp",
        "recipient": "081288291021",
        "status": "Terkirim",
        "isi_pesan": "Yth. Bpk. Bambang Pratama, tagihan SPP Bulan November 2026 siswa an. Budi Pratama (Kelas X-A) sebesar Rp 650.000 akan jatuh tempo pada 10 Nov 2026 (H-7). Harap melakukan pembayaran tepat waktu.",
        "waktu_kirim": "2026-11-03 08:30:00"
    },
    {
        "notification_id": 2,
        "bill_id": 372,
        "channel": "Email",
        "recipient": "ortu.20260012@example.com",
        "status": "Terkirim",
        "isi_pesan": "Pemberitahuan: Iuran Kegiatan & Praktikum Lab sebesar Rp 950.000 jatuh tempo pada 06 Nov 2026 (H-3). Silakan selesaikan transaksi melalui portal EduPay.",
        "waktu_kirim": "2026-11-03 08:35:12"
    },
    {
        "notification_id": 3,
        "bill_id": 380,
        "channel": "WhatsApp",
        "recipient": "081299110022",
        "status": "Terkirim",
        "isi_pesan": "Pemberitahuan: Iuran Ujian Akhir Semester Ganjil sebesar Rp 500.000 jatuh tempo besok (04 Nov 2026 / H-1).",
        "waktu_kirim": "2026-11-03 09:10:00"
    },
    {
        "notification_id": 4,
        "bill_id": 240,
        "channel": "WhatsApp",
        "recipient": "081233445566",
        "status": "Gagal",
        "isi_pesan": "Peringatan: Tagihan SPP Bulan Oktober 2026 telah melewati jatuh tempo 24 hari. Mohon segera melunasi tunggakan.",
        "waktu_kirim": "2026-11-02 10:15:00"
    }
]

# Users & Roles Demo Accounts
users = [
    {
        "user_id": 1,
        "username": "admin",
        "role": "admin",
        "role_name": "Administrator",
        "nama_lengkap": "Suryadi Wibisono, S.Kom.",
        "email": "admin@edupay.sch.id",
        "status_aktif": True,
        "avatar": "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=120&auto=format&fit=crop&q=80"
    },
    {
        "user_id": 2,
        "username": "bendahara",
        "role": "bendahara",
        "role_name": "Bendahara Sekolah",
        "nama_lengkap": "Hj. Siti Aminah, S.E.",
        "email": "bendahara@edupay.sch.id",
        "status_aktif": True,
        "avatar": "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=120&auto=format&fit=crop&q=80"
    },
    {
        "user_id": 3,
        "username": "kepsek",
        "role": "kepala_sekolah",
        "role_name": "Kepala Sekolah",
        "nama_lengkap": "Drs. H. Mulyadi, M.Pd.",
        "email": "kepsek@edupay.sch.id",
        "status_aktif": True,
        "avatar": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80"
    },
    {
        "user_id": 4,
        "username": "ortu",
        "role": "orang_tua",
        "role_name": "Orang Tua Siswa",
        "nama_lengkap": "Bambang Pratama (Wali Budi Pratama - X-A)",
        "email": "ortu.20260001@example.com",
        "student_id": 1, # Bound to Budi Pratama
        "status_aktif": True,
        "avatar": "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&auto=format&fit=crop&q=80"
    }
]

# Write out to src/data/mock.js
output_code = f"""// =============================================================================
// PROYEK: EduPay Monitor - Mock Data Lengkap & Realistis
// ANCHOR DATE: 03 Nov 2026 (Asia/Jakarta)
// TOTAL DATA: 6 Kelas, 120 Siswa, {len(bills)} Tagihan, {len(transactions)} Transaksi, 5 Alokasi Anggaran
// =============================================================================

export const SYSTEM_DATE = "2026-11-03";

export const mockClasses = {json.dumps(classes, indent=2)};

export const mockStudents = {json.dumps(students, indent=2)};

export const mockFeeStructures = {json.dumps(fee_structures, indent=2)};

export const mockStudentBills = {json.dumps(bills, indent=2)};

export const mockPaymentTransactions = {json.dumps(transactions, indent=2)};

export const mockBudgetAllocations = {json.dumps(budget_allocations, indent=2)};

export const mockBudgetExpenditures = {json.dumps(budget_expenditures, indent=2)};

export const mockNotificationLogs = {json.dumps(notification_logs, indent=2)};

export const mockUsers = {json.dumps(users, indent=2)};
"""

with open("src/data/mock.js", "w", encoding="utf-8") as f:
    f.write(output_code)

print(f"Generated mock.js successfully! Bills: {len(bills)}, Transactions: {len(transactions)}, Students: {len(students)}")


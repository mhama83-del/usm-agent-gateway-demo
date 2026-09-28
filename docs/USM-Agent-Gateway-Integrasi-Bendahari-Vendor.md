# Integrasi Dokumen Rasmi Bendahari & Pendaftaran Vendor — Rujukan Pembangunan Demo

> Nota rujukan untuk Claude Code. Letak dalam `docs/`. Ia **melengkapkan**
> Spesifikasi Pembangunan v1.0 dan `CLAUDE.md`, bukan menggantikannya. Urutan
> kuasa kekal: (1) `CLAUDE.md`, (2) Spesifikasi v1.0, (3) nota ini, (4) prototaip.
>
> Tujuan: demo mesti **kelihatan seolah-olah dokumen rasmi ini sudah sebahagian
> sistem** — borang & medan sedia terisi dalam data seed, boleh dilihat semasa
> demo kepada pengurusan USM. Kekal **statik sahaja** (tiada backend/DB/API).
> UI dalam **English** (ikut keputusan bahasa terkini).

---

## 1. Sumber

Tiga artifak sebenar daripada proses kewangan USM (bukan rekaan):

| Fail | Maksud |
|---|---|
| `CONTOH_EXCEL_SUBMIT_BENDAHARI.xlsx` | Borang **sebenar** senarai pelajar untuk tuntutan komisen yang dihantar ke Bendahari (contoh terisi). |
| `AGENT_COMMISSION_CLAIM_TEMPLATE.xlsx` | Versi templat kosong borang yang sama. |
| `USM.FIS.AP.B.2023.01` (PDF) | Borang rasmi Bendahari untuk mendaftar ejen sebagai **pembekal bukan perdagangan (non-trade vendor)** supaya boleh dibayar. |

Kedua-dua Excel = **format output** modul tuntutan. PDF = **langkah pendaftaran
vendor** yang kini hilang daripada demo.

---

## 2. PENAMBAHAN #1 — Batch Tuntutan & Eksport Bendahari

### 2.1 Konsep baharu: BATCH
Tuntutan komisen dihantar ke Bendahari **berkelompok mengikut tempoh**
("Batch Date From ___ to ___"), bukan satu-satu. Tambah entiti `CLAIM_BATCHES`
yang mengumpulkan beberapa tuntutan yang diluluskan ke dalam satu penghantaran.

### 2.2 Lajur tepat borang Bendahari (WAJIB padan)
Skrin/eksport batch mesti guna lajur ini, susunan sama:

1. No. of Student
2. Agent Name
3. Student Name
4. Passport No.
5. Student Matric No. *(mandatory)*
6. Student USM ID No. *(mandatory)*
7. Postgraduate (PG) or Undergraduate (UG)
8. Reference Number
9. Name of School / Faculty
10. Name of Programme
11. Total Fee (RM)
12. Total Fee (USD)
13. Date Paid to USM
14. Receipt No.
15. **Feedback From USM** — sub-lajur: `Date` · `Receipt No` · `Amaun (USD)` · `Amaun (RM)`
16. Status Reply From IPS/BPA

Pengepala batch: **"Batch Date From \<start\> to \<end\>"**.
Blok tandatangan bawah: **Disemak Oleh** / **Diluluskan Oleh** — Tandatangan,
Tarikh, Cap Nama & Jawatan. (Ini secara langsung mencerminkan kawalan
**pemisahan kuasa** dalam spesifikasi: penyemak ≠ pelulus.)

### 2.3 Skrin baharu
- `pages/claim-batch.html` — "Commission Claim Batch (Bendahari Submission)".
  Papar satu batch dalam **format jadual Bendahari tepat** di atas, dengan
  header batch + blok sign-off. Sekurang-kurangnya satu batch **sedia dalam
  seed** supaya kelihatan lengkap semasa demo.
- Butang **"Export to Bendahari (CSV)"** — jana fail CSV di pelayar guna
  vanilla JS (dibenarkan; tiada backend). Nama fail: `Bendahari-Claim-Batch-<id>.csv`.
- Butang **"Print / PDF view"** — susun atur mesra cetak (guna `window.print()`).

### 2.4 Dwi-matawang USD/RM
Pelajar antarabangsa bayar dalam **USD**; borang bawa kedua-dua USD dan RM.
Tambah `feeUSD` dan `feeRM` pada setiap tuntutan, dan kadar tukaran rujukan
`CONFIG_DRAFT.currency.usdToRm` (lencana DRAFT).

---

## 3. PENAMBAHAN #2 — Pendaftaran Vendor (Borang USM.FIS.AP.B.2023.01)

Sebelum ejen boleh **dibayar**, mereka mesti didaftar sebagai vendor dengan
**kod pembekal** daripada Bendahari. Tambah skrin `pages/vendor-registration.html`
yang memaparkan borang ini, **sedia terisi** untuk ejen aktif dalam seed.

### 3.1 Medan borang (padan borang rasmi)
**Part A — Agency / Individual Information**
Full Name · Registration/Passport/National ID No · Address · Telephone No. (Malaysia)
· Telephone No. (origin country) · Email Address · Nationality · Contact Person.

**Part B — Banking Information**
Bank Account Holder Name · Bank Full Name · Bank Account No. · Bank Address ·
Swift Code · Bank Branch · *(bank asing:)* Routing Number · IBAN · BSB Code · IFSC Code.

**Part C — Declaration**
Nama penandatangan · Reg/Passport/IC No · Designation · teks akuan · Tandatangan ·
Agency Stamp · Tarikh.

**Section 2 — diisi oleh PTJ (dalam sistem: USAINS)**
Tujuan Permohonan · Nama Pemohon · Nama & Gred Jawatan · Email · Tarikh.

**Section 3 — diisi oleh Bendahari**
Kod pembekal: `TRADE / NONTRADE / GAJI / INVESTMENT / INTERCO / RLKA / LAIN`
(untuk ejen = **NONTRADE**) · Diproses Oleh · Disemak & Disahkan Oleh.
Emel penghantaran rujukan: `evendor@usm.my`.

### 3.2 Status pendaftaran vendor (rantai bayaran)
Tambah pada setiap ejen: `vendorStatus` = `Not Registered` / `Pending Bendahari`
/ `Registered`, plus `supplierCode` (cth `NT-2026-00417`) apabila Registered.

**Peraturan:** rekod bayaran tuntutan **tidak boleh** dibuat kecuali ejen
`vendorStatus = Registered` (ada kod pembekal). Ini menutup gelung antara
"perjanjian ditandatangani" dan "boleh terima komisen". Papar amaran pada skrin
bayaran jika ejen belum berdaftar sebagai vendor.

---

## 4. Perubahan model data (`data/seed.js`)

> Semua rekaan, dilabel demo. Tambah medan sahaja; jangan ubah kunci sedia ada
> tanpa beritahu. Isi nilai supaya demo kelihatan **lengkap**.

**STUDENTS** — tambah: `matricNo` *(mandatory)*, `usmIdNo` *(mandatory)*,
`faculty` (Name of School/Faculty), `feeUSD`, `feeRM`.

**CLAIMS** — tambah: `referenceNumber`, `feeUSD`, `feeRM`, `datePaidToUSM`,
`receiptNo`, dan blok `feedbackFromUSM { date, receiptNo, amountUSD, amountRM }`,
`ipsBpaStatus`, `batchId`.

**AGENTS** — tambah blok `vendor { status, supplierCode, bank: { holderName,
bankName, accountNo, bankAddress, swiftCode, branch, routingNumber, iban, bsb,
ifsc }, ptj: {...}, declaration: {...} }`. Isi penuh untuk ejen **aktif**
(Global Bridge, dll), kosong/`Pending` untuk permohonan baharu.

**Entiti baharu `CLAIM_BATCHES`** — `{ id, dateFrom, dateTo, claimIds[],
preparedBy, checkedBy, approvedBy, status }`. Sekurang-kurangnya **satu batch
lengkap** dalam seed untuk demo.

---

## 5. Nilai DRAF baharu (lencana DRAFT + skrin Settings)

Tambah ke `CONFIG_DRAFT` dan skrin Settings (DRAFT):
- `currency.usdToRm` — kadar tukaran rujukan USD→RM
- `vendor.supplierCodeType` — lalai `NONTRADE`
- `claimBatch.periodMonths` — kekerapan batch (cth 6 bulan)

---

## 6. Skrin & navigasi

Skrin baharu: `claim-batch.html`, `vendor-registration.html`.
Cadangan navigasi ikut peranan:
- **Agent** — nampak borang vendornya sendiri (read-only, Registered) + tuntutannya dalam batch.
- **USAINS / Payment Officer** — konsol batch + eksport Bendahari + Section 2 borang vendor.
- **Super Admin** — semua.

Kekalkan status trail 5-peringkat, chip SLA, lencana DRAFT seperti sedia ada.

---

## 7. Andaian & keputusan owner (sahkan)

1. **Peranan Bendahari** — demo tiada peranan "Bendahari" berasingan; kod
   pembekal (Section 3) dipaparkan sebagai *sudah diberikan* dalam seed. Untuk
   produksi, mungkin perlu peranan/entiti Bendahari. → keputusan owner.
2. **PTJ = USAINS** — Section 2 borang vendor diandaikan diisi oleh USAINS
   sebagai perantara operasi. Sahkan sama ada betul, atau fakulti berasingan.
3. **Kadar tukaran USD→RM** — nilai DRAF; owner tetapkan sumber rasmi.
4. **Matric No / USM ID wajib** — borang Bendahari tanda ia *mandatory*. Dalam
   produksi, tuntutan tak boleh dihantar tanpa kedua-duanya; dalam demo ia
   sedia terisi.

---

## 8. Skop demo vs produksi

**Utama untuk demo (nilai tinggi, buat dahulu):**
- Skrin `claim-batch.html` dalam format Bendahari tepat + eksport CSV.
- Skrin `vendor-registration.html` sedia terisi + status vendor pada ejen.
- Peraturan "tiada kod pembekal = tiada bayaran" (amaran UI).

**Skop produksi (catat dalam spec, tak perlu penuh dalam demo):**
- Aliran kerja pendaftaran vendor tiga peringkat sebenar (Ejen→PTJ→Bendahari).
- Dwi-matawang penuh dengan kadar hidup.
- Penjanaan Excel sebenar (.xlsx) berbanding CSV/paparan.

---

## 9. Larangan (kekal seperti CLAUDE.md §11)

Statik sahaja: tiada backend/DB/API/SSO/gerbang bayaran/e-signature sebenar.
Eksport CSV & `window.print()` dibenarkan (pelayar sahaja). Tiada e-mel sebenar.
Semua data rekaan & dilabel demo. Vanilla JS, namespace `window.USMDEMO`.
Kekal pada branch kerja; jangan sentuh `main` tanpa arahan.

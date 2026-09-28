# USM Agent Gateway — Integrasi Dokumen Bendahari & Pendaftaran Vendor

## Nota rujukan pembangunan

| Perkara | Butiran |
|---|---|
| Versi | 1.0 |
| Tarikh | 28 September 2026 |
| Status | Disahkan owner — asas pembangunan `feature/bendahari-vendor` |
| Kedudukan | Melengkapkan `CLAUDE.md` dan `USM-Agent-Gateway-Spesifikasi-Pembangunan-v1.0.md` |
| Bahasa | Nota ini Bahasa Melayu (dokumen pembangun). UI yang dibina ialah English. |

> **Asal usul nota ini.** Nota ini ditulis daripada **tiga dokumen sumber rasmi**
> yang dibekalkan owner pada 28 Sep 2026. Struktur, nama lajur dan nama medan di
> bawah diekstrak terus daripada fail-fail itu, bukan diringkaskan daripada
> ingatan. Sila rujuk §1 untuk lokasi fail asal.

---

## 1. Dokumen sumber

| # | Fail | Peranan dalam demo |
|---|---|---|
| 1 | `AGENT COMMISSION CLAIM TEMPLATE.xlsx` | Borang **kosong rasmi** tuntutan komisen — **19 lajur (A–S)**. Sumber kebenaran untuk susunan lajur. |
| 2 | `CONTOH EXCEL SUBMIT BENDAHARI.xlsx` | Contoh **terisi** — 18 lajur (tiada `Total Fee (RM)`), tetapi **ada blok sign-off** yang tiada dalam template. |
| 3 | `USM.FIS.AP.B.2023.01- Borang Kod Pembekal Bukan Perdagangan EN.pdf` | Borang pendaftaran vendor bukan perdagangan, 4 muka surat, Jabatan Bendahari. |

Fail asal berada di luar repo (folder kerja owner) dan **tidak** dimasukkan ke
dalam repo kerana mengandungi format dokumen rasmi USM. Nota ini ialah
rakaman strukturnya.

---

## 2. Masalah yang diselesaikan

Sebelum ini demo berhenti pada "tuntutan diluluskan → rekod bayaran". Dalam
proses sebenar, antara kelulusan dan bayaran terdapat **dua halangan pentadbiran
Bendahari** yang tidak wujud dalam demo:

1. Tuntutan mesti dihantar kepada Bendahari dalam **format Excel yang ditetapkan**
   — satu batch pelajar, bukan satu tuntutan satu masa.
2. Ejen mesti **berdaftar sebagai pembekal bukan perdagangan** dan mempunyai
   **Kod Pembekal (supplier code)** sebelum apa-apa bayaran boleh dikreditkan.

Demo perlu kelihatan seolah-olah kedua-dua dokumen ini **sudah** sebahagian
sistem, dengan data seed sedia terisi.

---

## 3. Keputusan owner — 28 September 2026

| ID | Keputusan | Status |
|---|---|---|
| **D-020** | Jadual batch guna **struktur TEMPLATE 19 lajur** (termasuk `Total Fee (RM)` **dan** `Total Fee (USD)`), **dicampur** blok sign-off daripada CONTOH. Tajuk ikut template: *"Foreign Student Recruitment Agent Student List for Commission Claim"*. Susunan lajur mesti **padan tepat** header Excel. | Disahkan |
| **D-021** | **`feeRM` TIDAK ditambah.** `firstYearFee` kekal **sumber tunggal** nilai RM; `feeUSD` **DIKIRA** daripada `CONFIG_DRAFT.currency.usdToRm`. Elak dua sumber kebenaran, dan menyokong hujah utama demo: tukar kadar → semua amaun bergerak (selaras `CLAUDE.md` §3.1(1)). | Disahkan |
| **D-022** | Golden path dipanjangkan: perjanjian ditandatangani → **ACTIVE** → **pendaftaran vendor** → **Bendahari keluarkan supplierCode** → rujukan → tuntutan → **batch** → bayaran. `submitApplication()` mencipta `vendorStatus = 'Not Registered'`. | Disahkan |
| **D-023** | Seksyen 2 & 3 borang vendor (asal Bahasa Melayu) **diterjemah ke English** — satu bahasa satu skrin, selaras keputusan bahasa 8 Sep 2026. Kod dokumen `USM.FIS.AP.B.2023.01` dan label `USM Office Use Only` **kekal seperti asal**. | Disahkan |
| **D-025** | **Label sign-off borang Bendahari turut diterjemah ke English** (28 Sep 2026): `Reviewed By :`, `Approved By :`, `Signature :`, `Date :`, `Name & Position Stamp :`. Ia label borang, bukan kod. **Tiada pengecualian bahasa pada UI** — hanya kod dokumen dan `USM Office Use Only` kekal verbatim. | Disahkan |
| **D-024** | Nota rujukan ini ditulis sebagai sebahagian repo, menjadi rujukan fasa produksi. | Disahkan |

---

## 4. Format borang tuntutan Bendahari

### 4.1 Susunan lajur (TEMPLATE — ikut ini)

Header **dua baris**: baris 3 ialah tajuk lajur, baris 4 ialah sub-tajuk bagi
blok `FEEDBACK FROM USM` (dalam Excel, `O3:R3` bercantum).

| Lajur | Header baris 3 | Header baris 4 | Sumber data demo |
|---|---|---|---|
| A | `No. of Student` | — | nombor berjujukan dalam batch |
| B | `Agent Name` | — | `agent.name` |
| C | `Student Name` | — | `claim.student` |
| D | `Passport No.` | — | `claim.passport` |
| E | `Student Matric No. (mandatory)` | — | `STUDENTS.matricNo` |
| F | `Student USM ID No.       (mandatory)` | — | `STUDENTS.usmIdNo` |
| G | `Postgraduate (PG) or Undergraduate (UG)` | — | `claim.level` |
| H | `REFERENCE NUMBER` | — | `CLAIMS.referenceNumber` |
| I | `Name of School/ Faculty` | — | `STUDENTS.faculty` |
| J | `Name of Programme` | — | `claim.program` |
| K | `Total Fee (RM)` | — | `claim.firstYearFee` |
| L | `Total Fee (USD)` | — | **dikira**: `firstYearFee ÷ currency.usdToRm` |
| M | `Date Paid to USM` | — | `CLAIMS.datePaidToUSMLabel` |
| N | `RECEIPT NO.` | — | `CLAIMS.receiptNo` |
| O | `FEEDBACK FROM USM` | `DATE` | `feedbackFromUSM.dateLabel` |
| P | ″ | `RECEIPT NO` | `feedbackFromUSM.receiptNo` |
| Q | ″ | `AMAUN (USD)` | `feedbackFromUSM.amountUSD` |
| R | ″ | `AMAUN (RM)` | `feedbackFromUSM.amountRM` |
| S | `Status Reply From IPS/BPA` | — | `CLAIMS.ipsBpaStatus` |

> Ejaan dan jarak header **dikekalkan persis** seperti dalam Excel, termasuk
> ruang berganda dalam `Student USM ID No.       (mandatory)` dan garis miring
> tanpa ruang dalam `Name of School/ Faculty`. Ujian memadankan rentetan ini
> secara tepat — jangan "kemas" ejaannya.

### 4.2 Header batch

- Tajuk: `Foreign Student Recruitment Agent Student List for Commission Claim`
- Tempoh: `Batch Date From : <dari> to <hingga>`

### 4.3 Blok sign-off (daripada CONTOH)

| Label asal (Excel) | Label demo (English) | Pihak |
|---|---|---|
| `Disemak Oleh :` | `Reviewed By :` | USAINS |
| `Diluluskan Oleh :` | `Approved By :` | USM LEAP |
| `Tandatangan :` | `Signature :` | kedua-dua pihak |
| `Tarikh :` | `Date :` | kedua-dua pihak |
| `Cap Nama & Jawatan :` | `Name & Position Stamp :` | kedua-dua pihak |

Label sign-off **diterjemah ke English** (keputusan D-025, 28 Sep 2026) kerana
ia label borang, bukan kod. **Tiada pengecualian bahasa pada UI.** Yang kekal
verbatim hanyalah kod dokumen `USM.FIS.AP.B.2023.01` dan label
`USM Office Use Only` — kedua-duanya pengenal dokumen.

### 4.4 Eksport

- **CSV sahaja** (vanilla JS, `Blob` + `URL.createObjectURL`). Tiada penjanaan
  `.xlsx` — itu memerlukan pustaka dan melanggar syarat "statik, vanilla".
- CSV tidak menyokong sel bercantum, jadi eksport mengeluarkan **dua baris
  header** yang meniru baris 3 dan baris 4.
- **Print view** melalui `@media print`.

---

## 5. Format borang pendaftaran vendor

`USM.FIS.AP.B.2023.01` — *Non-Trade Vendor Registration Form*, Office of the
Bursar, Amendment 00, 01.08.2023.

### Seksyen 1 — diisi ejen

| Bahagian | Medan |
|---|---|
| **Part A** — Agency / Individual Information | Full Name · Registration/ Passport/ National Identification Card No · Address · Telephone No. (Malaysia if any) · Telephone No. (Origin country) · Email Address · Nationality · Contact Person (if applicable) |
| **Part B** — Banking Information | Bank Account Holder Name · Bank Full Name · Bank Account No. · Bank Address · Swift Code · Bank Branch<br>*Foreign bank account:* Routing Number · IBAN Number · BSB Code · IFSC Code |
| **Part C** — Declaration | Nama pengaku · Registration/ Passport/ NRIC No · Designation · teks akuan · Signature · Agency Stamp (if applicable) · Date |

### Seksyen 2 — diisi PTJ (`USM Office Use Only`)

Purpose of Application · Applicant Name · Name & Grade of Position ·
Email Address · Date.

### Seksyen 3 — diisi Jabatan Bendahari (`USM Office Use Only`)

- **Non-Trade Supplier Code** (nilai `supplierCode`)
- Kategori: `TRADE` · **`NONTRADE`** · `GAJI` · `INVESTMENT` · `INTERCO` ·
  `RLKA` · `LAIN`
- `Processed By` dan `Checked & Verified By` — Nama, Nama & Gred Jawatan, Tarikh

---

## 6. Model data

### 6.1 Medan baharu

| Entiti | Medan |
|---|---|
| `STUDENTS` | `matricNo`, `usmIdNo`, `faculty` |
| `CLAIMS` | `referenceNumber`, `datePaidToUSMIso` + `datePaidToUSMLabel`, `receiptNo`, `feedbackFromUSM{ dateLabel, receiptNo, amountUSD, amountRM }`, `ipsBpaStatus`, `batchId` |
| `AGENTS` | `vendor{ … }` — lihat §6.2 |

`feeUSD` **tidak disimpan** pada mana-mana entiti (D-021). Ia dikira pada masa
paparan melalui `WF.usdOf(rm)`.

### 6.2 Blok `vendor` pada AGENTS

```
vendor: {
  // Part A
  fullName, registrationNo, address, phoneMalaysia, phoneOrigin,
  email, nationality, contactPerson,
  // Part B
  bankAccountHolder, bankName, bankAccountNo, bankAddress,
  swiftCode, bankBranch, routingNumber, ibanNumber, bsbCode, ifscCode,
  // Part C
  declarationName, declarationIdNo, designation,
  declarationSigned, declarationDateLabel,
  // Seksyen 2 (PTJ)
  ptjVerified, ptjPurpose, ptjApplicantName, ptjGrade, ptjEmail, ptjDateLabel,
  // Seksyen 3 (Bendahari)
  supplierCode, supplierCategory, processedBy, verifiedBy, issuedDateLabel,
  // status keseluruhan
  vendorStatus    // 'Not Registered' | 'Pending' | 'Registered'
}
```

### 6.3 Entiti baharu `CLAIM_BATCHES`

```
{ id, batchNo, agentId, periodFromLabel, periodToLabel,
  claimIds[], batchStatus, preparedBy,
  checkedBy{ name, designation, dateLabel },
  approvedBy{ name, designation, dateLabel },
  createdIso, submittedIso }
```

`batchStatus`: `DRAFT` → `CHECKED` → `APPROVED` → `SUBMITTED_TO_BENDAHARI`.
Jumlah RM dan USD **dikira**, tidak disimpan.

---

## 7. Peraturan perniagaan baharu

| # | Peraturan |
|---|---|
| **R-1** | **Bayaran disekat tanpa Kod Pembekal.** `recordPayment()` gagal jika `agent.vendor.vendorStatus !== 'Registered'` atau `supplierCode` kosong. UI memaparkan amaran dan memautkan ke skrin pendaftaran vendor. |
| **R-2** | Kod Pembekal hanya boleh dikeluarkan (`issueSupplierCode`, peranan Payment Officer/Bendahari) selepas ejen menghantar Seksyen 1 **dan** PTJ mengesahkan Seksyen 2. |
| **R-3** | Hanya ejen **ACTIVE** atau **RENEWED** boleh menghantar borang vendor. |
| **R-4** | Batch hanya boleh mengandungi tuntutan milik **satu ejen** yang sudah melepasi keputusan LEAP (`APPROVED_PENDING_PAYMENT` atau `PAID`). |
| **R-5** | Satu tuntutan hanya boleh berada dalam **satu batch**. |
| **R-6** | Sign-off berjujukan: `checkBatch` (USAINS) mesti mendahului `approveBatch` (USM LEAP); `submitBatchToBendahari` hanya selepas diluluskan. |
| **R-7** | "Tandatangan" pada batch ialah **status demo**, bukan e-signature sah — sama seperti perjanjian. |

---

## 8. Nilai DRAFT baharu

Ditambah ke `CONFIG_DRAFT` dalam `data/seed.js`; muncul automatik dalam skrin
`Settings (DRAFT)` dengan lencana DRAFT.

| Laluan | Nilai seed | Kenapa ia titik keputusan owner |
|---|---|---|
| `currency.usdToRm` | `4.70` | Kadar tukaran USD→RM untuk lajur `Total Fee (USD)`. Belum dimuktamadkan; menggerakkan setiap nilai USD dalam batch. |
| `bendahari.batchPeriodMonths` | `6` | Panjang tempoh batch (CONTOH menggunakan April→Oktober). |
| `vendor.supplierCodeSlaDays` | `14` | SLA Bendahari mengeluarkan Kod Pembekal selepas borang lengkap. |

---

## 9. Skrin baharu

| Skrin | Fail | Peranan yang nampak |
|---|---|---|
| **Claim Batch (Bendahari)** | `pages/claim-batch.html` | USAINS, USM LEAP, Payment Officer, Super Admin |
| **Vendor Registration** | `pages/vendor-registration.html` | Agent, USAINS, Payment Officer, Super Admin |

Kedua-duanya mengekalkan chrome bersama, status trail, chip SLA dan lencana
DRAFT yang konsisten dengan sepuluh skrin sedia ada.

---

## 10. Data seed rekaan

Semua data **rekaan**, selaras `CLAUDE.md` §11 (larangan data USM sebenar).
Nilai sengaja dibuat jelas palsu:

- Kod Pembekal: `NT-2026-0041`
- SWIFT: `DEMOMYKL`
- Nombor akaun bank: bermula `9999-`
- Batch seed: **`BAT-0001`** untuk Global Bridge Education Sdn Bhd (`AG-2041`)
- Tempoh batch ikut garis masa demo (`NOW_ISO` = 2026-08-31), **bukan**
  "April 2025 to Ooctober 2025" daripada CONTOH (tarikh sebenar, dan ada typo)

---

## 11. Kesan pada versi state

`js/store.js` menaikkan `VERSION` daripada `2` kepada `3`. Skema seed berubah
(medan baharu + entiti `CLAIM_BATCHES`), jadi state tersimpan versi 2 mesti
dibuang, bukan digunakan semula. Lihat bahagian *"Naik taraf automatik"* dalam
`README.md`.

---

## 12. Pemetaan ke produksi (CodeIgniter 4)

| Demo | CodeIgniter 4 |
|---|---|
| `pages/claim-batch.html` | satu view + controller batch tuntutan |
| `pages/vendor-registration.html` | satu view + controller profil vendor |
| `CLAIM_BATCHES` | jadual `claim_batches` + jadual pivot `claim_batch_items` |
| `AGENTS.vendor{}` | jadual `vendor_profiles` (1:1 dengan ejen) |
| Eksport CSV | penjana eksport sebenar (CSV **dan** XLSX) di sisi pelayan |
| `CONFIG_DRAFT.currency.usdToRm` | jadual kadar tukaran berversi + audit |
| Gate `supplierCode` | peraturan pengesahan dalam Payment Service |

**Nota penting untuk produksi:** dalam sistem sebenar, kadar tukaran mesti
**dibekukan (snapshot)** pada setiap batch ketika ia dihantar kepada Bendahari,
sama seperti kadar komisen dibekukan pada setiap tuntutan (spesifikasi §15.9).
Demo sengaja memaparkan kadar semasa supaya kesan menukar kadar kelihatan.

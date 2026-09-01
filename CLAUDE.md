# CLAUDE.md — Brief Pembangunan Demo

> Fail ini ialah **kontrak arahan** untuk Claude Code. Baca sepenuhnya sebelum
> menulis apa-apa kod. Ia mengatasi andaian lalai. Jika ada percanggahan dengan
> spesifikasi penuh, ikut urutan: (1) fail ini, (2) `USM Agent Gateway
> Spesifikasi Pembangunan v1.0`, (3) prototaip ZIP.

---

## 1. Apa yang dibina

Satu **DEMO boleh-klik** untuk *USM Agent Gateway* yang menunjukkan
**keseluruhan proses** kitar hayat ejen — dari permohonan hingga pembaharuan —
untuk ditunjuk kepada pihak pengurusan USM bagi mencetuskan **keputusan owner**.

Ini **BUKAN** sistem produksi. Ini demo hadapan (front-end) sahaja.

**Domain akhir:** `agents.durianbytes.com` (subdomain, Hostinger, statik).

---

## 2. Sumber rujukan

| Sumber | Peranan |
|---|---|
| `USM Agent Gateway Spesifikasi Pembangunan v1.0` (.md) | Sumber kebenaran untuk aliran, status, peraturan, label. |
| Prototaip ZIP (`Skop_pembinaan_dashboard_rujukan`) | Rujukan **reka bentuk, aliran skrin & data seed SAHAJA**. |

**PENTING tentang ZIP:** ambil **warna, susun atur, aliran skrin, dan data seed**
sahaja. **JANGAN** guna semula format failnya (`.dc.html`) atau bundle JS besar
(`deck-stage.js`, `doc-page.js`, `support.js`, `image-slot.js`). Bina semula UI
dengan **Bootstrap 5 bersih**. Seed data sudah dikemas dalam `data/seed.js`.

---

## 3. Skop teknikal (peraturan keras)

- **Front-end statik sahaja:** HTML5 + Bootstrap 5 + JavaScript vanilla.
- **TIADA** backend, database, API, login sebenar, e-mel sebenar, e-signature sebenar.
- **Data palsu** dalam JS (`data/seed.js`). State demo disimpan dalam
  **`localStorage`** supaya transisi status **kekal** semasa demo.
- Sediakan butang **"Reset Demo"** yang memulihkan state ke keadaan asal seed.
- Guna **Bootstrap 5 dari CDN** (jsDelivr) — ini keputusan muktamad; demo
  dijalankan melalui pelayan statik, jadi CDN sentiasa boleh dicapai.
- **JANGAN** guna framework front-end berat (React/Vue). Vanilla JS sahaja —
  ini menjaga kebolehgunaan semula sebagai views server-rendered kemudian.
- **JANGAN** guna ES module `import`/`export`; guna `<script>` global (namespace
  `window.USMDEMO`) supaya setiap skrin kekal mudah dipindah menjadi view CI4.
- **Cara demo dijalankan (muktamad):** demo dijalankan melalui **pelayan statik
  lokal** (lihat README) dengan **Bootstrap 5 dari CDN**. Syarat "mesti berfungsi
  dari `file://`" **digugurkan** (keputusan owner, 1 Sep 2026). Di Hostinger ia
  dilayan sebagai laman statik biasa — keadaan yang sama seperti pelayan lokal.

---

### 3.1 Keputusan owner — 1 Sep 2026 (mengatasi teks lama di atas)

1. **Amaun komisen mesti bergerak.** Amaun tuntutan **dikira** daripada
   `CONFIG_DRAFT.commission` — `amaun = yuran tahun pertama × kadar (UG/PG)`.
   Ia bukan angka mati. Menukar kadar dalam skrin **Tetapan (DRAF)** mesti
   menukar amaun serta-merta di semua skrin.
2. **Data rekaan tambahan dibenarkan** dalam `data/seed.js` untuk menyokong
   perjanjian, notifikasi, log aktiviti dan status dokumen — dengan syarat semua
   rekaan, dilabel demo, disenaraikan kepada owner, dan rekod sedia ada tidak
   diubah tanpa memberitahu.
3. **Chip SLA — dua sumber:**
   - permohonan **baharu yang dicipta semasa demo**: chip **dikira** daripada
     `CONFIG_DRAFT.sla` + tarikh, supaya ia bergerak;
   - ejen **sedia ada dalam seed**: medan `sla` ialah sumber paparan (keadaan
     yang dikurasi untuk cerita demo). Jika bercanggah dengan kiraan, **medan
     `sla` menang** untuk ejen seed.
4. **Cara jalan:** pelayan statik lokal + CDN (lihat §3). `file://` digugurkan.

---

## 4. Kebolehgunaan semula (matlamat penting)

Demo ini mesti jadi **kulit** untuk sistem produksi CodeIgniter 4 kemudian —
bukan barang buang. Oleh itu:

- **Setiap skrin = satu fail HTML** yang boleh dipetakan 1:1 kepada satu *view*
  CodeIgniter 4 nanti.
- **Chrome bersama** (top bar, navigasi, penukar peranan, footer) disuntik oleh
  satu komponen JS supaya mudah jadi *partial/layout* CI4 kemudian.
- **Nama status, label BM, dan struktur komponen** (kad, jadual, chip SLA,
  status trail) mesti konsisten dan sepadan dengan spesifikasi.
- Elak logik dalam markup; asingkan data (`data/`), logik aliran (`js/`), dan
  paparan (`pages/`).

---

## 5. Struktur folder (kanonik)

```
usm-agent-gateway-demo/
├── README.md
├── CLAUDE.md
├── .gitignore
├── index.html                # landing → redirect ke pages/dashboard.html
├── assets/
│   ├── css/app.css           # gaya tersuai atas Bootstrap (tema ungu USM)
│   └── img/                   # logo USM+APEX, ikon
├── js/
│   ├── app.js                # bootstrap, router ringan, muat chrome bersama
│   ├── store.js              # "otak palsu": baca/tulis state ke localStorage
│   ├── workflow.js           # logik transisi status + peraturan perniagaan
│   └── components/           # topbar.js, sidenav.js, sla-chip.js,
│                             #   status-trail.js, list-card.js
├── data/
│   └── seed.js               # data palsu + CONFIG_DRAFT (sudah disediakan)
└── pages/
    ├── dashboard.html
    ├── application-wizard.html
    ├── application-detail.html
    ├── usains-console.html
    ├── leap-console.html
    ├── agreement.html
    ├── referrals.html
    ├── claims.html
    ├── annual-review.html
    └── settings-draft.html
```

Awak boleh laraskan susunan jika ada sebab kukuh, tetapi kekalkan prinsip
"satu skrin = satu fail" dan pengasingan data/logik/paparan.

---

## 6. Corak "otak palsu"

- `data/seed.js` — keadaan awal (ejen, pelajar, tuntutan) + `CONFIG_DRAFT`
  (semua nilai boleh-konfigurasi).
- `js/store.js` — pada muat pertama, salin seed ke `localStorage` di bawah satu
  kunci (cth `usm_demo_state`). Semua bacaan/tulisan seterusnya melalui store.
- `js/workflow.js` — fungsi transisi (contoh `verifyAndForward(appId)`,
  `approve(appId)`, `signParty(agreementId, party)`, `submitClaim(claimId)`,
  `markPaid(claimId)`, `renew(orgId)`). Setiap transisi:
  1. sahkan peraturan (cth claim tak boleh PAID sebelum APPROVED),
  2. kemas kini state,
  3. tambah satu entri "activity log" (siapa/bila/status lama→baru/sebab),
  4. tulis balik ke store.
- **Reset Demo** — kosongkan kunci `localStorage` dan muat semula dari seed.

---

## 7. Ciri yang WAJIB ada

1. **Penukar peranan** di top bar: `Agent` / `USAINS` / `USM LEAP` /
   `Payment Officer` / `Super Admin` — tukar tanpa login sebenar; navigasi &
   tindakan berubah ikut peranan.
2. **Status trail 5-peringkat** pada setiap fail:
   `Submitted → Verified by USAINS → Approved & Signed → Active → Annual Review`.
3. **SLA chip:** `Within SLA` / `Approaching Deadline` / `Overdue` — guna
   pelbagai keadaan dari seed (ada yang overdue, ada yang ok).
4. **Golden path yang benar-benar bergerak** bila butang diklik (verify,
   forward, approve, sign, submit claim, mark paid, renew) — bukan skrin statik.
   Selepas klik, state kekal (localStorage) walau tukar halaman.
5. **Lencana "DRAF"** (badge kecil, jelas) pada SETIAP nilai belum muktamad:
   kadar komisen, tempoh SLA, yuran pendaftaran, performance bond, threshold
   rujukan, tempoh pengajian minimum. Baca nilai dari `CONFIG_DRAFT`.
6. **Skrin "Tetapan (DRAF)"** (`settings-draft.html`) — senaraikan SEMUA nilai
   `CONFIG_DRAFT` di satu tempat dengan lencana DRAF. Ini penutup demo & peta
   kepada Modul Konfigurasi produksi.
7. **Responsif** — guna pada telefon 360px ke atas (jadual → kad pada mobile).
8. **UI Bahasa Melayu**; istilah teknikal English kekal konsisten (ikut spec).
9. **Branding USM + APEX**, tema ungu (ikut ZIP).
10. **Notifikasi dipapar dalam UI sahaja** (lonceng/senarai) — TIADA e-mel sebenar.

---

## 8. Golden path (jalan cerita demo)

Guna satu ejen yang sama untuk kesinambungan; kekalkan 2–3 ejen lain (Al-Manar
overdue, EduBridge below-threshold) supaya dashboard hidup.

1. **Agent** — mohon baru (wizard: syarikat → PIC/pengarah → dokumen → ABC → hantar).
2. **USAINS** — semak dokumen, **pulangkan 1 dokumen** (sebab wajib), ejen
   betulkan, USAINS **verify & forward**.
3. **USM LEAP** — **approve** → draf perjanjian auto-jana.
4. **Perjanjian** — tiga pihak "tandatangan" → ejen jadi **Active**.
5. **Agent (active)** — **rujuk pelajar** → **hantar tuntutan komisen**.
6. **USAINS/LEAP** — semak 5 syarat kelayakan → **lulus** → **Payment Officer**
   **rekod bayaran** (amaun, tarikh, rujukan).
7. **Annual review** — ejen hampir tamat muncul → LEAP **renew** atau **terminate**.

---

## 9. Skrin demo (subset golden path)

Dashboard (ikut peranan), Wizard permohonan, Detail + correction, Konsol USAINS,
Konsol LEAP, Agreement tracker, Referral, Commission claim (+ eligibility +
payment), Annual review, dan **Tetapan (DRAF)**.

---

## 10. Nilai DRAF (titik keputusan owner)

Semua ini ada dalam `CONFIG_DRAFT` (`data/seed.js`). Paparkan dengan lencana DRAF.

| Perkara | Nilai seed DRAF |
|---|---|
| Kadar komisen | UG 15%, PG 10% (dari yuran tahun 1) |
| Yuran pendaftaran | NEW RM2,000, RENEWAL RM1,000 |
| Performance bond | RM500 |
| Paid-up capital minimum | RM5,000 |
| SLA semakan USAINS | 7 hari kalendar |
| SLA keputusan LEAP | 7 hari kalendar |
| SLA keputusan tuntutan | 14 hari |
| Amaran tamat | 90 / 60 / 30 hari |
| Threshold rujukan (renew) | 15 pelajar/tahun |
| Tempoh pengajian minimum (claim) | 2 bulan |

---

## 11. Larangan

- **JANGAN** bina backend, DB, API, SSO, payment gateway, atau e-signature sebenar.
- **JANGAN** hantar e-mel; papar "notifikasi" dalam UI sahaja.
- **JANGAN** guna data USM sebenar — semua rekaan; label demo dengan jelas.
- **JANGAN** deploy sendiri ke Hostinger — serahkan fail + README; owner upload.
- **JANGAN** guna format `.dc.html` atau bundle JS dari ZIP.
- **JANGAN** anggap status "tandatangan" sebagai e-signature sah undang-undang.

---

## 12. Definition of Done

- [ ] Golden path lengkap, tanpa link mati, dari mohon hingga renew.
- [ ] Transisi status benar-benar bergerak & kekal (localStorage).
- [ ] Penukar peranan berfungsi; nav/tindakan berubah ikut peranan.
- [ ] Status trail 5-peringkat konsisten pada semua fail.
- [ ] SLA chip tunjuk pelbagai keadaan (overdue + ok + approaching).
- [ ] Lencana DRAF muncul pada semua nilai; skrin Tetapan (DRAF) siap.
- [ ] Butang **Reset Demo** memulihkan keadaan asal bersih.
- [ ] Responsif diuji pada 360px & desktop; UI Bahasa Melayu.
- [ ] Branding USM+APEX, tema ungu.
- [ ] `README.md` dikemas kini: cara buka lokal, cara reset, cara upload ke
      Hostinger (`agents.durianbytes.com`), senarai fail.
- [ ] Struktur UI disahkan boleh diguna semula sebagai views CodeIgniter 4.

---

## 13. Selepas siap

Serahkan: (1) laman statik lengkap dalam repo, (2) `README.md` dikemas kini,
(3) nota ringkas mengesahkan struktur UI boleh diguna semula untuk fasa produksi,
dan (4) senarai andaian/keputusan yang perlu owner sahkan.

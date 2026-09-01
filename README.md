# USM Agent Gateway — Demo

Demo boleh-klik untuk **USM Agent Gateway**, satu sistem pengurusan kitar hayat
ejen pengambilan pelajar antarabangsa USM. Demo ini menunjukkan **keseluruhan
proses** — dari permohonan ejen hingga pembaharuan tahunan — untuk ditunjuk
kepada pihak pengurusan USM.

> **Ini demo, bukan sistem sebenar.** Front-end statik sahaja (HTML + Bootstrap 5
> + JavaScript). Tiada backend, database, atau data sebenar. Semua data adalah
> rekaan. State demo disimpan dalam `localStorage` pelayar.

**Domain demo:** https://agents.durianbytes.com

---

## Kandungan

- [Cara buka demo (lokal)](#cara-buka-demo-lokal)
- [Cara reset demo](#cara-reset-demo)
- [Cara upload ke Hostinger](#cara-upload-ke-hostinger)
- [Golden path demo (jalan cerita)](#golden-path-demo-jalan-cerita)
- [Struktur fail](#struktur-fail)
- [Ujian (untuk pembangun sahaja)](#ujian-untuk-pembangun-sahaja)
- [Untuk pembangun](#untuk-pembangun)

---

## Cara buka demo (lokal)

Demo ini **mesti dijalankan melalui pelayan statik**, bukan dibuka terus sebagai
fail (`file://`). Sebabnya: Bootstrap 5 dimuatkan dari CDN dan sesetengah
pelayar menyekat CDN, `localStorage` serta laluan relatif apabila halaman dibuka
dari `file://`. Syarat "mesti berfungsi dari `file://`" telah digugurkan
(keputusan owner, 1 Sep 2026).

Pilih salah satu:

```bash
# Python 3
python3 -m http.server 8000

# atau Node.js
npx http-server -p 8000 -c-1
```

Kemudian buka **http://localhost:8000**.

Atau guna sambungan **"Live Server"** dalam VS Code (klik kanan `index.html` →
*Open with Live Server*).

> **Perlukan internet.** Bootstrap 5 (CSS + JS) dimuatkan dari CDN jsDelivr.
> Ini keputusan muktamad projek — lihat `CLAUDE.md` §3 dan §3.1.
> Di Hostinger, subdomain `agents.durianbytes.com` melayan fail ini sebagai laman
> statik biasa, jadi keadaannya sama seperti pelayan lokal.

---

## Cara reset demo

Demo menyimpan kemajuan (transisi status) dalam `localStorage`. Untuk mula
semula bersih sebelum sesi demo baharu:

- Klik butang **"Reset Demo"** pada top bar, **atau**
- Kosongkan storan tapak dalam DevTools pelayar (Application → Local Storage →
  padam kunci `usm_demo_state`).

---

## Cara upload ke Hostinger

Subdomain `agents.durianbytes.com` menghoskan fail statik ini. Langkah (UI hPanel
mungkin berbeza sedikit ikut versi):

1. **Log masuk hPanel** Hostinger untuk domain `durianbytes.com`.
2. **Cipta subdomain:** cari *Subdomains* → masukkan `agents` → cipta. Hostinger
   akan cipta satu folder khas untuk subdomain (contoh `.../agents.durianbytes.com`
   atau di bawah `public_html/agents`). Ambil perhatian laluan folder itu.
3. **Aktifkan SSL:** cari *SSL* → pasang sijil percuma (Let's Encrypt) untuk
   `agents.durianbytes.com` supaya `https://` berfungsi.
4. **Upload fail:** guna *File Manager* atau FTP. Muat naik **kandungan** repo
   (fail & folder: `index.html`, `assets/`, `js/`, `data/`, `pages/`) ke **akar
   folder subdomain**. Pastikan `index.html` berada terus di akar folder itu
   (bukan dalam subfolder tambahan).
5. **Uji:** buka `https://agents.durianbytes.com` dan larikan seluruh golden path
   serta butang **Reset Demo**.

> Nota: `README.md`, `CLAUDE.md`, `.gitignore`, `docs/` dan `tests/` tidak perlu
> diupload ke Hostinger — ia untuk repo sahaja. Yang perlu naik hanyalah
> `index.html`, `assets/`, `js/`, `data/` dan `pages/`.

---

## Golden path demo (jalan cerita)

Mula sebagai peranan **Agent**, dan tukar peranan di bar atas mengikut arahan
kad *"Langkah seterusnya"* pada Dashboard:

| # | Peranan | Tindakan |
|---|---|---|
| 1 | Agent | Mohon / Renew → isi wizard 4 langkah → terima deklarasi ABC → hantar |
| 2 | USAINS | Fail permohonan → **Pulangkan** satu dokumen (sebab wajib) |
| 3 | Agent | Fail permohonan → **Hantar semula** dokumen itu |
| 4 | USAINS | Sahkan semua 9 dokumen → **Verify & forward ke LEAP** |
| 5 | USM LEAP | Konsol LEAP → **Luluskan** → draf perjanjian dijana automatik |
| 6 | USAINS → LEAP → Agent | Perjanjian → tandatangan tiga pihak → ejen jadi **AKTIF** |
| 7 | Agent | Rujukan Pelajar → hantar rujukan baharu |
| 8 | USAINS | Rujukan Pelajar → majukan status sehingga **Yuran dibayar** |
| 9 | Agent | **Bina tuntutan** → **Hantar tuntutan** |
| 10 | USAINS | Tuntutan → tanda 5 syarat kelayakan → **Hantar untuk keputusan LEAP** |
| 11 | USM LEAP | Tuntutan → **Luluskan** |
| 12 | Payment Officer | Tuntutan → **Rekod bayaran** (amaun, tarikh, rujukan) |
| 13 | USM LEAP | Annual Review → **Buka review** → **Renew** |

Penutup: buka **Tetapan (DRAF)**, tukar *Kadar komisen UG* daripada 15 kepada
20, dan tunjukkan setiap amaun tuntutan berubah serta-merta.

---

## Struktur fail

```
index.html                    Landing → pages/dashboard.html
assets/css/app.css            Tema ungu USM + APEX di atas Bootstrap 5
assets/img/usm-apex-logo.svg  Logo rasmi USM + APEX (PNG terbenam dalam SVG)
data/seed.js                  Semua data rekaan + CONFIG_DRAFT
js/store.js                   State demo dalam localStorage + Reset Demo
js/workflow.js                Semua transisi status + peraturan perniagaan
js/app.js                     Bootstrap halaman, suntik chrome, utiliti UI
js/components/topbar.js       Jenama, penukar peranan, notifikasi, Reset Demo
js/components/sidenav.js      Navigasi ikut peranan + kiraan tugasan
js/components/sla-chip.js     Chip SLA (Within / Approaching / Overdue)
js/components/status-trail.js Status trail 5-peringkat
js/components/list-card.js    Kad, jadual boleh-tindan, lencana DRAF
js/pages/<skrin>.js           Logik setiap skrin (satu fail satu skrin)
pages/<skrin>.html            Setiap skrin = satu fail HTML (10 skrin)
tests/                        Ujian pembangunan sahaja — tidak perlu diupload
```

---

## Ujian (untuk pembangun sahaja)

Demo tidak memerlukan Node atau sebarang build. Ujian di bawah pula memerlukan
Node, dan dua daripadanya memerlukan pakej/pelayar tambahan:

```bash
# 1. Logik workflow hujung ke hujung (tiada kebergantungan)
node tests/golden-path.node.js

# 2. Golden path dengan klik sebenar pada UI yang dirender
npm i jsdom && node tests/ui-golden-path.jsdom.js

# 3. Tiada limpahan mendatar pada skrin 360px (perlu Google Chrome)
node tests/responsive-360.chrome.js
```

> Nota untuk sesiapa yang menguji responsif secara manual: bendera
> `--window-size` Chrome headless **tidak** menetapkan lebar viewport kecil
> dengan tepat (ia terhad kepada lebih kurang 526px), jadi tangkapan skrin
> "360px" boleh menipu. Guna DevTools device toolbar, atau ujian nombor 3 di
> atas yang memuatkan setiap halaman dalam iframe selebar tepat 360px.

---

## Untuk pembangun

Demo ini direka supaya **boleh diguna semula** sebagai lapisan paparan untuk
sistem produksi (CodeIgniter 4 + MySQL). Setiap fail dalam `pages/` memetakan
kepada satu *view* CI4; chrome bersama memetakan kepada *layout/partial*. Lihat
`CLAUDE.md` untuk brief pembangunan penuh dan `Spesifikasi Pembangunan v1.0`
untuk keperluan sistem sebenar.

Pemetaan yang dicadangkan ke CI4:

| Demo | CodeIgniter 4 |
|---|---|
| `pages/<skrin>.html` | satu view setiap satu (`app/Views/agent/<skrin>.php`) |
| chrome bersama (`topbar.js` + `sidenav.js`) | `app/Views/layouts/main.php` + partial |
| `js/components/*.js` | view cell / partial (chip SLA, status trail, kad senarai) |
| `js/workflow.js` | satu Workflow Service; setiap fungsi jadi satu kaedah |
| `js/store.js` | Model + Repository di atas MySQL |
| `data/seed.js` `CONFIG_DRAFT` | jadual konfigurasi berversi (Modul Konfigurasi) |
| log aktiviti demo | jadual audit trail |

Nilai dalam `CONFIG_DRAFT` (`data/seed.js`) ialah **titik keputusan owner** —
dipaparkan dengan lencana **DRAF** sepanjang demo dan diringkaskan dalam skrin
*Tetapan (DRAF)*.

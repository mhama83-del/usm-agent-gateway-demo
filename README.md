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
- [Struktur fail](#struktur-fail)
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

> Nota: `README.md`, `CLAUDE.md`, dan `.gitignore` tidak perlu diupload ke
> Hostinger — ia untuk repo sahaja.

---

## Struktur fail

```
index.html            Landing → dashboard
assets/css/app.css    Tema ungu USM atas Bootstrap 5
assets/img/           Logo USM+APEX, ikon
js/app.js             Bootstrap + chrome bersama + router ringan
js/store.js           State demo (localStorage)
js/workflow.js        Logik transisi status
js/components/         Topbar, nav, SLA chip, status trail, list card
data/seed.js          Data palsu + CONFIG_DRAFT (nilai boleh-konfigurasi)
pages/                Setiap skrin = satu fail HTML
```

---

## Untuk pembangun

Demo ini direka supaya **boleh diguna semula** sebagai lapisan paparan untuk
sistem produksi (CodeIgniter 4 + MySQL). Setiap fail dalam `pages/` memetakan
kepada satu *view* CI4; chrome bersama memetakan kepada *layout/partial*. Lihat
`CLAUDE.md` untuk brief pembangunan penuh dan `Spesifikasi Pembangunan v1.0`
untuk keperluan sistem sebenar.

Nilai dalam `CONFIG_DRAFT` (`data/seed.js`) ialah **titik keputusan owner** —
dipaparkan dengan lencana **DRAF** sepanjang demo dan diringkaskan dalam skrin
*Tetapan (DRAF)*.

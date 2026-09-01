assets/img — nota untuk owner
=============================

usm-apex-logo.svg
-----------------
Logo RASMI USM + APEX (kunci mendatar), dibekalkan oleh owner pada 1 Sep 2026.
Placeholder yang dilukis semasa pembangunan telah DIGANTIKAN sepenuhnya.

PENTING — apa sebenarnya fail ini:
Walaupun berakhiran .svg, ia BUKAN grafik vektor. Ia adalah pembalut SVG yang
mengandungi satu imej PNG tertanam sebagai data URI base64:

    <svg viewBox="0 0 232 56"><image xlink:href="data:image/png;base64,..."/></svg>

  - PNG tertanam: 696 x 168 piksel, telus
  - saiz fail   : lebih kurang 67 KB
  - sumber asal owner: PNG telus 2505 x 605

Nama .svg dikekalkan supaya rujukan dalam kod tidak perlu berubah. Kesannya:
kualiti adalah kualiti raster, bukan vektor — jangan besarkan melebihi kira-kira
230px lebar tanpa membekalkan fail resolusi lebih tinggi.

Pada tinggi paparan 46px, lebar logo lebih kurang 190px, jadi 696px sumber
memberi lebihan sampel yang selesa walaupun pada skrin 3x DPR.

Dirujuk oleh:
  js/components/topbar.js  ->  <img src="<base>assets/img/usm-apex-logo.svg">
  assets/css/app.css       ->  .usm-logo

Nota paparan: artwork berwarna gelap dan latarnya telus, jadi CSS meletakkannya
di atas plat putih (.usm-logo). Jangan buang plat putih itu tanpa menguji
semula di atas top bar ungu.

Jika logo digantikan kemudian
-----------------------------
Kekalkan nama fail `usm-apex-logo.svg` supaya tiada perubahan kod diperlukan.
Jika fail gantian berformat lain (contoh .png sebenar atau SVG vektor tulen),
kemas kini rujukan dalam js/components/topbar.js kepada nama fail baharu itu.

Untuk kualiti terbaik pada masa depan, minta versi VEKTOR sebenar (.svg / .ai /
.eps) daripada Bahagian Komunikasi Korporat USM — ia lebih kecil dan tajam pada
semua saiz.

Tinggi paparan: 46px (desktop) / 34px (di bawah 576px). Nisbah lebar bebas.

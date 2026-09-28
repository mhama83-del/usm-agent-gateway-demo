/*
 * stamp-version.js — Cop tag versi (?v=<BUILD>) pada setiap rujukan aset
 * TEMPATAN dalam index.html dan pages/*.html.
 *
 * KENAPA
 * Hostinger melayan fail statik dengan cache panjang dan di belakang CDN.
 * Tanpa tag versi, pelayar dan CDN boleh terus menghidangkan JS/CSS lama
 * selepas deploy — halaman nampak berfungsi tetapi ciri baharu "hilang".
 * Tag versi menukar URL setiap keluaran, jadi cache lama tidak pernah
 * dipadankan dan fail baharu sentiasa diambil.
 *
 * SUMBER VERSI TUNGGAL
 * Pemalar BUILD dalam js/app.js. Tiada tempat lain mentakrifkan versi; skrip
 * ini membacanya dan menyalinnya ke setiap rujukan.
 *
 * CARA GUNA (pembangun sahaja — demo sendiri tetap tidak perlu build)
 *   1. Naikkan BUILD dalam js/app.js
 *   2. node tools/stamp-version.js
 *   3. Commit HTML yang dicop
 *
 * Skrip ini idempoten: menjalankannya semula hanya menggantikan tag sedia ada.
 *
 * URL CDN (cdn.jsdelivr.net) SENGAJA DILANGKAU. Ia sudah tidak berubah
 * mengikut versi dalam laluannya (bootstrap@5.3.3), jadi menambah ?v= hanya
 * akan membatalkan cache CDN yang sah tanpa sebarang faedah.
 */
var fs = require('fs');
var path = require('path');

var ROOT = path.join(__dirname, '..');

function readBuild() {
  var src = fs.readFileSync(path.join(ROOT, 'js/app.js'), 'utf8');
  var m = /var BUILD = '([^']+)';/.exec(src);
  if (!m) {
    console.error('! Tidak jumpa "var BUILD = ..." dalam js/app.js');
    process.exit(1);
  }
  return m[1];
}

function htmlFiles() {
  var out = [path.join(ROOT, 'index.html')];
  var dir = path.join(ROOT, 'pages');
  fs.readdirSync(dir).forEach(function (f) {
    if (f.slice(-5) === '.html') out.push(path.join(dir, f));
  });
  return out;
}

// href="…​.css" / src="…​.js" yang bukan URL mutlak.
var ASSET_RE = /(href|src)="((?!https?:)(?!\/\/)[^"]+?\.(?:css|js))(\?v=[^"]*)?"/g;

function stamp(build, check) {
  var changed = [], missing = [];

  htmlFiles().forEach(function (file) {
    var src = fs.readFileSync(file, 'utf8');
    var rel = path.relative(ROOT, file).split(path.sep).join('/');
    var out = src.replace(ASSET_RE, function (whole, attr, url, existing) {
      var want = attr + '="' + url + '?v=' + build + '"';
      if (check && whole !== want) {
        missing.push(rel + ' → ' + url + (existing ? ' (' + existing + ')' : ' (tiada ?v=)'));
      }
      return want;
    });
    if (out !== src) {
      changed.push(rel);
      if (!check) fs.writeFileSync(file, out);
    }
  });

  return { changed: changed, missing: missing };
}

var build = readBuild();
var mode = process.argv[2] === '--check' ? 'check' : 'write';
var res = stamp(build, mode === 'check');

if (mode === 'check') {
  if (res.missing.length) {
    console.log('GAGAL — ' + res.missing.length + ' rujukan tidak dicop dengan ?v=' + build + ':');
    res.missing.forEach(function (x) { console.log('  ! ' + x); });
    process.exit(1);
  }
  console.log('OK — setiap rujukan aset tempatan dicop ?v=' + build);
} else {
  console.log('BUILD = ' + build);
  if (!res.changed.length) {
    console.log('Tiada perubahan — semua fail sudah dicop.');
  } else {
    console.log(res.changed.length + ' fail dicop:');
    res.changed.forEach(function (f) { console.log('  ' + f); });
  }
}

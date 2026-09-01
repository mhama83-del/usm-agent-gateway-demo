/*
 * responsive-360.chrome.js — Semak dalam PELAYAR SEBENAR bahawa setiap skrin
 * (a) dirender tanpa ralat dengan Bootstrap dari CDN, dan
 * (b) tidak melimpah mendatar pada skrin 360px (keperluan CLAUDE.md §7.7).
 *
 * Ia menghidupkan pelayan statik sementara, memuatkan setiap halaman dalam
 * iframe selebar tepat 360px, dan membandingkan scrollWidth dengan clientWidth.
 * Elemen yang melepasi tepi kanan disenaraikan supaya puncanya mudah dicari.
 *
 * Perlu Google Chrome dipasang. Cara jalan:
 *   node tests/responsive-360.chrome.js
 *
 * Nota: bendera --window-size Chrome headless TIDAK menetapkan lebar viewport
 * dengan tepat pada saiz kecil (ia terhad kepada ~526px), jadi tangkapan skrin
 * 360px boleh mengelirukan. Iframe 360px yang jelas ialah ukuran yang betul.
 */
var http = require('http');
var fs = require('fs');
var path = require('path');
var { spawn } = require('child_process');

var ROOT = path.join(__dirname, '..');
var PORT = 8731;
var PAGES = ['dashboard', 'application-wizard', 'application-detail', 'usains-console',
  'leap-console', 'agreement', 'referrals', 'claims', 'annual-review', 'settings-draft'];

var CHROME_CANDIDATES = [
  process.env.CHROME_PATH,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
];
function findChrome() {
  for (var i = 0; i < CHROME_CANDIDATES.length; i++) {
    var c = CHROME_CANDIDATES[i];
    if (c && fs.existsSync(c)) return c;
  }
  return null;
}

var TYPES = {
  '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp'
};

var HARNESS = '<!doctype html><meta charset="utf-8"><title>ukur</title>'
  + '<style>body{margin:0}iframe{width:360px;height:1000px;border:0;display:block}</style>'
  + '<div id="out">menunggu</div><script>'
  + 'var PAGES=' + JSON.stringify(PAGES) + ';var results=[];var i=0;'
  + 'function next(){'
  + ' if(i>=PAGES.length){document.getElementById("out").textContent="HASIL::"+results.join(" ~ ");return;}'
  + ' var key=PAGES[i];var f=document.createElement("iframe");'
  + ' f.src="/pages/"+key+".html";'
  + ' f.onload=function(){setTimeout(function(){'
  + '  var d=f.contentDocument;var sw=d.documentElement.scrollWidth;var cw=d.documentElement.clientWidth;'
  + '  var over=[];'
  + '  if(sw>cw+1){var all=d.querySelectorAll("*");'
  + '   for(var j=0;j<all.length;j++){'
  + '    if(all[j].closest(".usm-nav"))continue;'
  + '    var r=all[j].getBoundingClientRect();'
  + '    if(r.right>cw+1&&r.width>0){'
  + '     var cls=(all[j].className&&all[j].className.baseVal===undefined)?String(all[j].className).split(" ").slice(0,3).join("."):"";'
  + '     over.push(all[j].tagName.toLowerCase()+(cls?"."+cls:"")+"@"+Math.round(r.right));'
  + '     if(over.length>=4)break;}}}'
  + '  var pg=d.getElementById("page");var html=pg?pg.innerHTML:"";'
  + '  if(!pg||html.length<200)over.push("SKRIN-KOSONG");'
  + '  if(html.indexOf("Ralat skrin")>=0)over.push("RALAT-SKRIN");'
  + '  if(html.indexOf("belum dibina")>=0)over.push("SKRIN-BELUM-DIBINA");'
  + '  results.push(key+"="+sw+"/"+cw+(over.length?" ["+over.join(", ")+"]":""));'
  + '  document.body.removeChild(f);i++;next();},350);};'
  + ' document.body.appendChild(f);}'
  + 'next();</script>';

var server = http.createServer(function (req, res) {
  var p = decodeURIComponent(req.url.split('?')[0]);
  if (p === '/__harness') {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(HARNESS);
    return;
  }
  if (p === '/') p = '/index.html';
  fs.readFile(path.join(ROOT, p), function (e, buf) {
    if (e) { res.writeHead(404); res.end('404'); return; }
    res.writeHead(200, { 'Content-Type': TYPES[path.extname(p)] || 'application/octet-stream' });
    res.end(buf);
  });
});

var chrome = findChrome();
if (!chrome) {
  console.log('LANGKAU: Google Chrome tidak dijumpai. Set CHROME_PATH untuk menjalankan ujian ini.');
  process.exit(0);
}

// PENTING: guna spawn TAK SEGERAK. execFileSync akan menyekat gelung acara
// Node, jadi pelayan dalam proses yang sama tidak akan dapat melayan Chrome.
server.listen(PORT, function () {
  var dom = '';
  var child = spawn(chrome, [
    '--headless', '--disable-gpu', '--no-sandbox',
    '--no-first-run', '--no-default-browser-check',
    '--disable-extensions', '--disable-sync',
    '--metrics-recording-only', '--mute-audio',
    '--virtual-time-budget=25000',
    '--window-size=900,1200',
    '--dump-dom', 'http://localhost:' + PORT + '/__harness'
  ], { stdio: ['ignore', 'pipe', 'ignore'] });

  var killer = setTimeout(function () {
    try { child.kill(); } catch (e) { /* abaikan */ }
  }, 120000);

  child.stdout.on('data', function (b) { dom += b.toString(); });

  child.on('error', function (e) {
    clearTimeout(killer);
    server.close();
    console.log('GAGAL menjalankan Chrome: ' + e.message);
    process.exit(1);
  });

  child.on('close', function () {
    clearTimeout(killer);
    server.close();

    var m = /HASIL::([^<]*)/.exec(dom);
    if (!m) {
      console.log('GAGAL: harness tidak menghasilkan keputusan.');
      console.log('DOM (600 aksara pertama): ' + dom.slice(0, 600));
      process.exit(1);
    }
    var rows = m[1].split(' ~ ');
    var ok = 0, fail = 0;
    console.log('\nLebar mendatar pada viewport 360px (scrollWidth / clientWidth):\n');
    for (var i = 0; i < rows.length; i++) {
      var bad = rows[i].indexOf('[') >= 0;
      if (bad) { fail++; console.log('  GAGAL ' + rows[i]); }
      else { ok++; console.log('  OK    ' + rows[i]); }
    }
    console.log('\n=======================================');
    console.log('LULUS: ' + ok + '   GAGAL: ' + fail);
    process.exit(fail ? 1 : 0);
  });
});

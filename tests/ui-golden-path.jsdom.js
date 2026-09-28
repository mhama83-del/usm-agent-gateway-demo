/*
 * ui-golden-path.jsdom.js — Golden path dengan KLIK SEBENAR pada UI yang
 * dirender (jsdom). Ini ujian pembangunan sahaja; demo itu sendiri tidak
 * memerlukan Node atau sebarang build.
 *
 * Cara jalan:  npm i jsdom  &&  node tests/ui-golden-path.jsdom.js
 */
var fs = require('fs');
var path = require('path');
var { JSDOM } = require('jsdom');

var REPO = path.join(__dirname, '..');
var SCRIPTS = [
  'data/seed.js', 'js/store.js', 'js/workflow.js',
  'js/components/list-card.js', 'js/components/sla-chip.js',
  'js/components/status-trail.js', 'js/components/topbar.js',
  'js/components/sidenav.js', 'js/app.js'
];

var ok = 0, fail = 0;
function check(label, cond, extra) {
  if (cond) { ok++; console.log('  OK   ' + label); }
  else { fail++; console.log('  GAGAL ' + label + (extra ? ' :: ' + extra : '')); }
}

var store = {};   // localStorage kekal merentas "muat semula halaman"
var win;

function openPage(key, query) {
  var dom = new JSDOM(
    '<!doctype html><html><body>' +
    '<div id="chrome-top"></div><div id="page"></div>' +
    '<div id="chrome-bottom"></div><div id="toast-host"></div>' +
    '</body></html>',
    { url: 'http://localhost:8000/pages/' + key + '.html' + (query || ''), runScripts: 'outside-only' }
  );
  win = dom.window;
  Object.defineProperty(win, 'localStorage', {
    value: {
      getItem: function (k) { return Object.prototype.hasOwnProperty.call(store, k) ? store[k] : null; },
      setItem: function (k, v) { store[k] = String(v); },
      removeItem: function (k) { delete store[k]; }
    },
    configurable: true
  });
  win.confirm = function () { return true; };
  win.alert = function () {};
  win.prompt = function () { return promptValue; };
  try { win.location.reload = function () {}; } catch (e) { /* jsdom */ }
  var files = SCRIPTS.concat(['js/pages/' + key + '.js']);
  for (var i = 0; i < files.length; i++) {
    win.eval(fs.readFileSync(path.join(REPO, files[i]), 'utf8'));
  }
  win.USMDEMO.App.boot(key);
  return win;
}

var promptValue = '';
function setPrompt(v) { promptValue = v; if (win) win.prompt = function () { return v; }; }

// Sentiasa baca Store/WF daripada window semasa (setiap halaman = window baharu).
function S() { return win.USMDEMO.Store; }
function W() { return win.USMDEMO.WF; }
function setRole(r) { S().setRole(r); }

function findByText(sel, text) {
  var els = win.document.querySelectorAll(sel);
  for (var i = 0; i < els.length; i++) {
    if ((els[i].textContent || '').indexOf(text) >= 0) return els[i];
  }
  return null;
}
function click(sel, text) {
  var el = text ? findByText(sel, text) : win.document.querySelector(sel);
  if (!el) throw new Error('Elemen tidak dijumpai: ' + sel + (text ? ' [' + text + ']' : ''));
  el.dispatchEvent(new win.MouseEvent('click', { bubbles: true }));
  return el;
}
function clickIf(sel) {
  var el = win.document.querySelector(sel);
  if (el) el.dispatchEvent(new win.MouseEvent('click', { bubbles: true }));
  return !!el;
}
function body() { return win.document.getElementById('page').innerHTML; }
function chrome() { return win.document.getElementById('chrome-top').innerHTML; }

console.log('\n== 1. Dashboard ==');
openPage('dashboard');
check('chrome disuntik (penukar peranan)', !!win.document.getElementById('role-switcher'));
check('butang Reset Demo wujud', !!win.document.getElementById('btn-reset-demo'));
check('lencana DRAF kelihatan', body().indexOf('draf-badge') >= 0);
setRole('usains');
openPage('dashboard');
check('chip SLA Overdue kelihatan (USAINS)', body().indexOf('Overdue') >= 0);
check('chip SLA Approaching Deadline kelihatan', body().indexOf('Approaching Deadline') >= 0);
check('chip SLA Within SLA kelihatan', body().indexOf('Within SLA') >= 0);

console.log('\n== 2. Wizard permohonan (Agent) ==');
setRole('agent');
openPage('application-wizard');
check('langkah 1 aktif', !!win.document.querySelector('.wizard-step.active[data-step="1"]'));
click('button', 'Next');
click('button', 'Next');
click('button', 'Next');
check('langkah 4 (ABC) aktif', !!win.document.querySelector('.wizard-step.active[data-step="4"]'));
click('button', 'Submit application');
check('disekat tanpa deklarasi ABC', S().agents().length === 6);
win.document.getElementById('abc').checked = true;
click('button', 'Submit application');
var newAgentId = S().agents()[0].id;
check('permohonan baharu dicipta', S().agents().length === 7
  && S().agents()[0].appStatus === 'SUBMITTED', newAgentId);
check('chip SLA dikira (bukan medan seed)', S().agents()[0].slaSource === 'computed');

console.log('\n== 3. USAINS — pulangkan 1 dokumen (sebab wajib) ==');
setRole('usains');
openPage('application-detail', '?id=' + newAgentId);
check('fail permohonan baharu dibuka', body().indexOf(newAgentId) >= 0);
setPrompt('');
click('[data-action="doc-return"]');
check('sebab kosong ditolak', S().agent(newAgentId).appStatus !== 'RETURNED_TO_AGENT');
setPrompt('Financial statements cover 1 year only; the latest 2 years are required.');
click('[data-action="doc-return"]');
check('status RETURNED_TO_AGENT', S().agent(newAgentId).appStatus === 'RETURNED_TO_AGENT');
check('sebab dipaparkan pada dokumen', body().indexOf('the latest 2 years are required') >= 0);

console.log('\n== 4. Agent betulkan dokumen ==');
setRole('agent');
openPage('application-detail', '?id=' + newAgentId);
setPrompt('Audited statements for 2024 & 2025 uploaded.');
click('[data-action="doc-resubmit"]');
check('dokumen RESUBMITTED', S().agent(newAgentId).docs[0].status === 'RESUBMITTED');
check('kembali UNDER_USAINS_REVIEW', S().agent(newAgentId).appStatus === 'UNDER_USAINS_REVIEW');

console.log('\n== 5. USAINS sahkan semua + forward ==');
setRole('usains');
openPage('application-detail', '?id=' + newAgentId);
var n = 0;
while (clickIf('[data-action="doc-verify"]') && n < 25) { n++; }
check('semua dokumen disahkan', W().docsOutstanding(S().agent(newAgentId)).length === 0);
click('[data-action="forward"]');
check('status VERIFIED', S().agent(newAgentId).appStatus === 'VERIFIED');
check('peringkat 2/5', W().stageOf(S().agent(newAgentId)) === 2);

console.log('\n== 6. LEAP luluskan ==');
setRole('leap');
openPage('leap-console');
check('kes muncul dalam konsol LEAP', body().indexOf(newAgentId) >= 0);
click('[data-action="approve"][data-id="' + newAgentId + '"]');
check('APPROVED_AWAITING_AGREEMENT', S().agent(newAgentId).appStatus === 'APPROVED_AWAITING_AGREEMENT');
var agrId = (S().agreementForAgent(newAgentId) || {}).id;
check('draf perjanjian dijana', !!agrId, agrId);

console.log('\n== 7. Tandatangan tiga pihak ==');
setRole('usains');
openPage('agreement', '?id=' + agrId);
click('[data-action="sign"]');
check('USAINS menandatangani', S().agreement(agrId).signatures.usains.signed === true);
setRole('leap');
openPage('agreement', '?id=' + agrId);
click('[data-action="sign"]');
check('LEAP menandatangani', S().agreement(agrId).signatures.leap.signed === true);
setRole('agent');
openPage('agreement', '?id=' + agrId);
click('[data-action="sign"]');
check('FULLY_SIGNED', S().agreement(agrId).status === 'FULLY_SIGNED');
check('ejen kini ACTIVE', S().agent(newAgentId).agentStatus === 'ACTIVE');
check('peringkat 4/5', W().stageOf(S().agent(newAgentId)) === 4);

console.log('\n== 7b. Pendaftaran vendor Bendahari ==');
// Skrin vendor-registration.html dibina dalam commit berikutnya; di sini
// transisi dipandu terus melalui WF supaya golden path UI kekal boleh jalan.
setRole('payment');
var payBlocked = false;
try { W().recordPayment('CL-0102', { amount: 10, reference: 'X' }); } catch (e) { payBlocked = true; }
check('R-1 bayaran disekat tanpa Kod Pembekal', payBlocked);
setRole('agent');
W().submitVendorForm(newAgentId, {
  bankAccountHolder: 'Nusantara Edu Partners Sdn Bhd',
  bankName: 'Demo Nusantara Bank', bankAccountNo: '9999-2100-4455',
  swiftCode: 'DEMOIDJA', declarationIdNo: 'Passport C7781900', declarationAccepted: true
});
check('borang vendor dihantar -> Pending',
  S().agent(newAgentId).vendor.vendorStatus === 'Pending');
setRole('usains'); W().verifyVendorPTJ(newAgentId);
setRole('payment'); W().issueSupplierCode(newAgentId);
check('Kod Pembekal dikeluarkan', W().isVendorRegistered(S().agent(newAgentId)),
  S().agent(newAgentId).vendor.supplierCode);

console.log('\n== 8. Agent rujuk pelajar ==');
setRole('agent');
openPage('referrals');
check('borang rujukan tersedia', !!win.document.getElementById('ref-form'));
click('[data-action="add"]');
var newRefId = S().referrals()[0].refId;
check('rujukan dicipta', S().referrals()[0].isDemoCreated === true
  && S().referrals()[0].refStatus === 'SUBMITTED', newRefId);

console.log('\n== 9. USAINS majukan status rujukan ==');
setRole('usains');
for (var k = 0; k < 3; k++) {
  openPage('referrals');
  clickIf('[data-action="advance"][data-id="' + newRefId + '"]');
}
check('rujukan FEES_PAID', S().referral(newRefId).refStatus === 'FEES_PAID',
  S().referral(newRefId).refStatus);

console.log('\n== 10. Agent bina + hantar tuntutan ==');
setRole('agent');
openPage('referrals');
click('[data-action="claim"][data-id="' + newRefId + '"]');
var newClaimId = S().claims()[0].id;
check('draf tuntutan dibina', S().claims()[0].claimStatus === 'DRAFT', newClaimId);
check('amaun DIKIRA = 5175', W().commissionOf(S().claims()[0]) === 5175,
  String(W().commissionOf(S().claims()[0])));
openPage('claims', '?id=' + newClaimId);
click('[data-action="submit"]');
check('tuntutan SUBMITTED', S().claim(newClaimId).claimStatus === 'SUBMITTED');

console.log('\n== 11. USAINS semak 5 syarat kelayakan ==');
setRole('usains');
openPage('claims', '?id=' + newClaimId);
click('[data-action="forward"]');
check('disekat sebelum 5 syarat disahkan',
  S().claim(newClaimId).claimStatus !== 'PENDING_LEAP_DECISION');
for (var e = 0; e < 5; e++) {
  var cb = win.document.querySelector('[data-elig][data-idx="' + e + '"]');
  cb.checked = true;
  cb.dispatchEvent(new win.Event('change', { bubbles: true }));
}
check('5 syarat ditanda', S().claim(newClaimId).eligibility.join(',') === 'true,true,true,true,true');
click('[data-action="forward"]');
check('PENDING_LEAP_DECISION', S().claim(newClaimId).claimStatus === 'PENDING_LEAP_DECISION');

console.log('\n== 12. LEAP luluskan tuntutan ==');
setRole('leap');
openPage('claims', '?id=' + newClaimId);
click('[data-action="approve"]');
check('APPROVED_PENDING_PAYMENT', S().claim(newClaimId).claimStatus === 'APPROVED_PENDING_PAYMENT');

console.log('\n== 13. Payment Officer rekod bayaran ==');
setRole('payment');
openPage('claims', '?id=' + newClaimId);
check('borang bayaran dipaparkan', !!win.document.getElementById('pay-form'));
click('[data-action="pay"]');
check('tuntutan PAID', S().claim(newClaimId).claimStatus === 'PAID');
check('rujukan bayaran disimpan', S().claim(newClaimId).payment.reference === 'TT-2026-00871');
check('peringkat tuntutan 5/5', W().claimStageOf(S().claim(newClaimId)) === 5);

console.log('\n== 14. Annual review + renew ==');
setRole('leap');
openPage('annual-review');
click('[data-action="open"][data-id="' + newAgentId + '"]');
check('REVIEW_DUE', S().agent(newAgentId).agentStatus === 'REVIEW_DUE');
check('peringkat 5/5', W().stageOf(S().agent(newAgentId)) === 5);
setPrompt('Performance satisfactory.');
click('[data-action="renew"][data-id="' + newAgentId + '"]');
check('RENEWED', S().agent(newAgentId).agentStatus === 'RENEWED');

console.log('\n== 15. Transisi kekal selepas refresh ==');
openPage('dashboard');
check('ejen demo masih RENEWED', S().agent(newAgentId).agentStatus === 'RENEWED');
check('tuntutan masih PAID', S().claim(newClaimId).claimStatus === 'PAID');
check('perjanjian masih FULLY_SIGNED', S().agreement(agrId).status === 'FULLY_SIGNED');

// Cari input tetapan mengikut laluan CONFIG_DRAFT yang dipaparkan pada barisnya.
function settingInput(pathText) {
  var fields = win.document.querySelectorAll('[data-field]');
  for (var q = 0; q < fields.length; q++) {
    var row = fields[q].closest ? fields[q].closest('tr') : fields[q].parentNode.parentNode;
    if (row && (row.textContent || '').indexOf(pathText) >= 0) return fields[q];
  }
  return null;
}

console.log('\n== 16. Tetapan (DRAF) menggerakkan amaun ==');
openPage('settings-draft');
var before = W().commissionOf(S().claim(newClaimId));
var input = settingInput('CONFIG_DRAFT.commission.ug.ratePercent');
check('medan kadar UG dijumpai', !!input);
input.value = '30';
input.dispatchEvent(new win.Event('change', { bubbles: true }));
check('kadar UG jadi 30%', S().config().commission.ug.ratePercent === 30);
check('amaun berganda 5175 -> 10350', W().commissionOf(S().claim(newClaimId)) === 10350,
  String(W().commissionOf(S().claim(newClaimId))));
check('jadual kesan langsung dikemas kini', body().indexOf('10,350') >= 0);
click('[data-action="restore"]');
check('pulih ke 15%', S().config().commission.ug.ratePercent === 15);
check('amaun kembali ' + before, W().commissionOf(S().claim(newClaimId)) === before);

console.log('\n== 16b. Ambang SLA + penanda snapshot kelihatan di UI ==');
openPage('settings-draft');
check('ambang "Approaching Deadline" tersenarai di Tetapan (DRAF)',
  body().indexOf('Approaching Deadline') >= 0);
var slaField = settingInput('CONFIG_DRAFT.sla.approachingWithinDays');
check('medan ambang boleh diedit', !!slaField && slaField.value === '2', slaField && slaField.value);
slaField.value = '20';
slaField.dispatchEvent(new win.Event('change', { bubbles: true }));
check('ambang disimpan ke config', S().config().sla.approachingWithinDays === 20);
setRole('usains');
openPage('dashboard');
check('chip SLA bertukar warning selepas ambang dinaikkan',
  (body().match(/Approaching Deadline/g) || []).length >= 2);
openPage('settings-draft');
click('[data-action="restore"]');
check('ambang pulih ke 2', S().config().sla.approachingWithinDays === 2);

openPage('claims');
check('penanda snapshot pada amaun tuntutan', body().indexOf('snap-mark') >= 0);
check('teks demo-vs-produksi ada pada tooltip',
  body().indexOf('Production freezes the rate on each claim') >= 0);
check('chip SLA membawa lencana DRAF', body().indexOf('sla-chip') >= 0
  && body().indexOf('draf-badge') >= 0);

console.log('\n== 16c. Liputan: SEMUA nilai CONFIG_DRAFT ada di Tetapan (DRAF) ==');
openPage('settings-draft');
var pageHtml = body();
var leaves = [];
(function walk(node, prefix) {
  for (var key in node) {
    if (!Object.prototype.hasOwnProperty.call(node, key)) continue;
    var v = node[key];
    var p = prefix ? prefix + '.' + key : key;
    if (v && typeof v === 'object' && !Array.isArray(v)) walk(v, p);
    else leaves.push(p);
  }
})(win.USMDEMO.SEED.CONFIG_DRAFT, '');
check('CONFIG_DRAFT mempunyai ' + leaves.length + ' nilai daun', leaves.length >= 19,
  String(leaves.length));
var missing = [];
for (var lf = 0; lf < leaves.length; lf++) {
  if (pageHtml.indexOf('CONFIG_DRAFT.' + leaves[lf]) < 0) missing.push(leaves[lf]);
}
check('setiap nilai CONFIG_DRAFT dipaparkan', missing.length === 0, missing.join(', '));
var drafCount = (pageHtml.match(/draf-badge/g) || []).length;
check('setiap nilai membawa lencana DRAF (' + drafCount + ' >= ' + leaves.length + ')',
  drafCount >= leaves.length, String(drafCount));

console.log('\n== 17. Penukar peranan menukar navigasi ==');
setRole('agent');
openPage('dashboard');
check('Agent nampak "Apply / Renew"', chrome().indexOf('Apply / Renew') >= 0);
check('Agent tidak nampak "USAINS Console"', chrome().indexOf('USAINS Console') < 0);
setRole('usains');
openPage('dashboard');
check('USAINS nampak "USAINS Console"', chrome().indexOf('USAINS Console') >= 0);
check('USAINS tidak nampak "Apply / Renew"', chrome().indexOf('Apply / Renew') < 0);
setRole('payment');
openPage('dashboard');
check('Payment Officer nampak Commission Claims', chrome().indexOf('Commission Claims') >= 0);
openPage('usains-console');
check('Payment Officer disekat dari USAINS Console', body().indexOf('has no access to this screen') >= 0);

console.log('\n== 18. Reset Demo ==');
setRole('agent');
openPage('dashboard');
click('#btn-reset-demo');
check('kembali 6 ejen seed', S().agents().length === 6, String(S().agents().length));
check('ejen demo hilang', S().agent(newAgentId) === null);
check('tuntutan demo hilang', S().claim(newClaimId) === null);
check('CL-0102 kembali DRAFT', S().claim('CL-0102').claimStatus === 'DRAFT');

console.log('\n== 19. Semua 10 skrin dirender tanpa ralat ==');
var PAGES = ['dashboard', 'application-wizard', 'application-detail', 'usains-console',
  'leap-console', 'agreement', 'referrals', 'claims', 'annual-review', 'settings-draft',
  'vendor-registration', 'claim-batch'];
setRole('admin');
for (var p = 0; p < PAGES.length; p++) {
  openPage(PAGES[p]);
  var html = body();
  check(PAGES[p] + '.html dirender',
    html.length > 200 && html.indexOf('Screen error') < 0 && html.indexOf('Screen not built') < 0,
    html.slice(0, 120));
}

console.log('\n== 20. Tiada link mati (setiap skrin × setiap peranan) ==');
var ROLES = ['agent', 'usains', 'leap', 'payment', 'admin'];
var dead = [];
var checked = 0;
for (var rr = 0; rr < ROLES.length; rr++) {
  for (var pp = 0; pp < PAGES.length; pp++) {
    openPage(PAGES[pp]);
    S().setRole(ROLES[rr]);
    openPage(PAGES[pp]);
    var anchors = win.document.querySelectorAll('a[href]');
    for (var an = 0; an < anchors.length; an++) {
      var href = anchors[an].getAttribute('href');
      if (!href || href.charAt(0) === '#' || /^(https?:|mailto:|tel:)/.test(href)) continue;
      var file = href.split('?')[0].split('#')[0];
      // pautan relatif dari dalam pages/, atau '../' ke akar repo
      var abs = file.indexOf('../') === 0
        ? path.join(REPO, file.replace('../', ''))
        : path.join(REPO, 'pages', file);
      checked++;
      if (!fs.existsSync(abs)) {
        var key = ROLES[rr] + ':' + PAGES[pp] + ' → ' + href;
        if (dead.indexOf(key) < 0) dead.push(key);
      }
    }
  }
}
check(checked + ' pautan disemak merentas 10 skrin × 5 peranan — tiada yang mati',
  dead.length === 0, dead.slice(0, 6).join(' | '));
console.log('\n== 21. UI English (tiada teks BM tertinggal) ==');

// Penanda BM. Nama bulan yang SAMA dalam English (April, Jun, September,
// November) sengaja tidak disenaraikan; hanya yang benar-benar BM.
var BM_WORDS = [
  // kata kerja pasif / proses
  'dijana', 'diterima', 'dihantar', 'dipulangkan', 'dimulakan', 'diluluskan',
  'ditolak', 'disahkan', 'ditandatangani', 'dikira', 'dibina', 'ditamatkan',
  'diperbaharui', 'menunggu', 'merujuk',
  // kata nama domain
  'semakan', 'tuntutan', 'permohonan', 'perjanjian', 'pelajar', 'ejen',
  'bayaran', 'tarikh', 'hari', 'tamat', 'sehingga', 'yuran', 'kadar',
  'komisen', 'dokumen', 'peranan', 'peringkat', 'sebab', 'lencana', 'tetapan',
  'rujukan', 'kelayakan', 'syarat', 'ambang', 'prestasi', 'notifikasi',
  'aktiviti', 'tandatangan', 'konsol', 'skrin', 'ralat',
  // kata tugas
  'tiada', 'tidak', 'wajib', 'belum', 'sudah', 'kepada', 'daripada', 'dengan',
  'untuk', 'dalam', 'semua', 'setiap', 'anda', 'sila',
  // nama bulan BM yang berbeza daripada English
  'Januari', 'Februari', 'Julai', 'Ogos', 'Oktober', 'Disember',
  'Mei', 'Mac', 'Okt', 'Dis',
  // lencana lama
  'DRAF<', '>DRAF<', 'AKTIF'
];

function bmWordIn(text) {
  for (var w = 0; w < BM_WORDS.length; w++) {
    var word = BM_WORDS[w];
    var re = new RegExp('(^|[^A-Za-z])' + word.replace(/[<>]/g, '\\$&') + '([^A-Za-z]|$)');
    if (re.test(text)) return word;
  }
  return null;
}

// --- 21a. UI dirender: 10 skrin x 5 peranan (chrome + badan + footer) ---
var bmHits = [];
for (var bp = 0; bp < PAGES.length; bp++) {
  for (var br = 0; br < ROLES.length; br++) {
    openPage(PAGES[bp]);
    S().setRole(ROLES[br]);
    openPage(PAGES[bp]);
    var regions = [
      ['chrome', win.document.getElementById('chrome-top').textContent],
      ['body', win.document.getElementById('page').textContent],
      ['footer', win.document.getElementById('chrome-bottom').textContent]
    ];
    for (var rg = 0; rg < regions.length; rg++) {
      var word = bmWordIn(regions[rg][1] || '');
      if (!word) continue;
      var hit = PAGES[bp] + ' [' + ROLES[br] + '] ' + regions[rg][0] + ' → "' + word + '"';
      if (bmHits.indexOf(hit) < 0) bmHits.push(hit);
    }
  }
}
check('tiada perkataan BM pada 10 skrin x 5 peranan (chrome + badan + footer)',
  bmHits.length === 0, bmHits.slice(0, 8).join(' | '));

// --- 21b. Kandungan yang DIJANA semasa larian: notifikasi, log, aktiviti ---
// Reset dahulu, kemudian larikan golden path penuh sekali lagi supaya setiap
// notify() dan logIt() dalam workflow.js menghasilkan teks untuk diimbas.
openPage('dashboard');
S().reset();
setRole('agent');
openPage('application-wizard');
click('button', 'Next'); click('button', 'Next'); click('button', 'Next');
win.document.getElementById('abc').checked = true;
click('button', 'Submit application');
var gAgent = S().agents()[0].id;
setRole('usains');
openPage('application-detail', '?id=' + gAgent);
setPrompt('Financial statements cover 1 year only.');
click('[data-action="doc-return"]');
setRole('agent');
openPage('application-detail', '?id=' + gAgent);
setPrompt('Audited statements uploaded.');
click('[data-action="doc-resubmit"]');
setRole('usains');
openPage('application-detail', '?id=' + gAgent);
var gN = 0;
while (clickIf('[data-action="doc-verify"]') && gN < 25) { gN++; }
click('[data-action="forward"]');
setRole('leap');
openPage('leap-console');
click('[data-action="approve"][data-id="' + gAgent + '"]');
var gAgr = (S().agreementForAgent(gAgent) || {}).id;
setRole('usains'); openPage('agreement', '?id=' + gAgr); click('[data-action="sign"]');
setRole('leap');   openPage('agreement', '?id=' + gAgr); click('[data-action="sign"]');
setRole('agent');  openPage('agreement', '?id=' + gAgr); click('[data-action="sign"]');
// Pendaftaran vendor — tanpa Kod Pembekal, rekod bayaran di bawah akan disekat.
W().submitVendorForm(gAgent, {
  bankName: 'Demo Nusantara Bank', bankAccountNo: '9999-2100-4455',
  declarationAccepted: true
});
setRole('usains'); W().verifyVendorPTJ(gAgent);
setRole('payment'); W().issueSupplierCode(gAgent);
setRole('agent');
openPage('referrals');
click('[data-action="add"]');
var gRef = S().referrals()[0].refId;
setRole('usains');
for (var gk = 0; gk < 3; gk++) { openPage('referrals'); clickIf('[data-action="advance"][data-id="' + gRef + '"]'); }
setRole('agent');
openPage('referrals');
click('[data-action="claim"][data-id="' + gRef + '"]');
var gClaim = S().claims()[0].id;
openPage('claims', '?id=' + gClaim);
click('[data-action="submit"]');
setRole('usains');
openPage('claims', '?id=' + gClaim);
for (var ge = 0; ge < 5; ge++) {
  var gcb = win.document.querySelector('[data-elig][data-idx="' + ge + '"]');
  gcb.checked = true;
  gcb.dispatchEvent(new win.Event('change', { bubbles: true }));
}
click('[data-action="forward"]');
setRole('leap');
openPage('claims', '?id=' + gClaim);
click('[data-action="approve"]');
setRole('payment');
openPage('claims', '?id=' + gClaim);
click('[data-action="pay"]');
setRole('leap');
openPage('annual-review');
click('[data-action="open"][data-id="' + gAgent + '"]');
setPrompt('Performance satisfactory.');
click('[data-action="renew"][data-id="' + gAgent + '"]');

check('golden path dijalankan semula untuk menjana teks masa larian',
  S().claim(gClaim).claimStatus === 'PAID' && S().agent(gAgent).agentStatus === 'RENEWED');

var notifHits = [], notifs = S().notifications();
for (var nn = 0; nn < notifs.length; nn++) {
  var nWord = bmWordIn(notifs[nn].title + ' ' + notifs[nn].body + ' ' + notifs[nn].timeLabel);
  if (nWord) notifHits.push(notifs[nn].id + ' "' + notifs[nn].title + '" → ' + nWord);
}
check(notifs.length + ' notifikasi (seed + dijana) semuanya English',
  notifHits.length === 0, notifHits.slice(0, 5).join(' | '));

var logHits = [], logs = S().log();
for (var lg = 0; lg < logs.length; lg++) {
  var lWord = bmWordIn(logs[lg].note + ' ' + logs[lg].tsLabel + ' ' + logs[lg].actor);
  if (lWord) logHits.push(logs[lg].id + ' "' + logs[lg].note + '" → ' + lWord);
}
check(logs.length + ' entri log aktiviti (seed + dijana) semuanya English',
  logHits.length === 0, logHits.slice(0, 5).join(' | '));

var actHits = [], allAgents = S().agents();
for (var ag = 0; ag < allAgents.length; ag++) {
  var acts = allAgents[ag].activities || [];
  for (var ac = 0; ac < acts.length; ac++) {
    var aWord = bmWordIn(acts[ac].action + ' ' + acts[ac].time + ' ' + acts[ac].actor);
    if (aWord) actHits.push(allAgents[ag].id + ' "' + acts[ac].action + '" → ' + aWord);
  }
}
check('log aktiviti setiap fail ejen semuanya English',
  actHits.length === 0, actHits.slice(0, 5).join(' | '));

// --- 21c. Seluruh state tersimpan (jaring keselamatan menyeluruh) ---
var stateWord = bmWordIn(JSON.stringify(S().state()).replace(/[{}",\[\]]/g, ' '));
check('tiada perkataan BM di mana-mana dalam state tersimpan',
  stateWord === null, 'dijumpai: ' + stateWord);

// --- 21d. Label tarikh guna nama bulan English ---
var badMonth = null;
var MS = ['Januari', 'Februari', 'Julai', 'Ogos', 'Oktober', 'Disember', 'Mei', 'Mac', 'Okt', 'Dis'];
var allDates = [];
for (var dq = 0; dq < notifs.length; dq++) allDates.push(notifs[dq].timeLabel);
for (var dl = 0; dl < logs.length; dl++) allDates.push(logs[dl].tsLabel);
allDates.push(W().fmt('2026-08-31'), W().fmt('2026-10-15'), W().fmt('2026-12-01'), W().fmt('2026-03-14'));
for (var dm = 0; dm < allDates.length; dm++) {
  for (var mm = 0; mm < MS.length; mm++) {
    if (String(allDates[dm]).indexOf(MS[mm]) >= 0) badMonth = allDates[dm] + ' (' + MS[mm] + ')';
  }
}
check(allDates.length + ' label tarikh guna nama bulan English', badMonth === null, badMonth);
check('fmt() memberi bulan English', W().fmt('2026-08-31') === '31 Aug 2026', W().fmt('2026-08-31'));

check('lencana memaparkan DRAFT, bukan DRAF', body().indexOf('>DRAFT<') >= 0);

console.log('\n== 22. State lama (versi 1) dibuang, bukan dipapar ==');
// Punca sebenar aduan "teks BM masih ada": pelayar yang pernah menjalankan
// demo versi BM menyimpan state penuh dalam localStorage. Tanpa kenaikan
// VERSION, kod English akan membaca semula teks BM yang tersimpan itu.
var staleState = {
  version: 1,
  nowIso: '2026-08-31',
  role: 'agent',
  config: { commission: { ug: { label: 'Ijazah Sarjana Muda (UG)', ratePercent: 15, basis: 'Yuran tahun pertama' } } },
  agents: [],
  referrals: [],
  claims: [],
  agreements: [],
  notifications: [{ id: 'NT-0101', audience: 'all', title: 'Draf perjanjian dijana',
    body: 'AGR-0901 menunggu tandatangan tiga pihak.', timeLabel: '31 Ogos 2026', read: false, link: null }],
  log: [{ id: 'LG-0101', tsLabel: '31 Ogos 2026', actor: 'Nurul Ain Zulkifli', role: 'agent',
    entity: 'agent', entityId: 'AG-2101', from: 'VERIFIED', to: 'APPROVED_AWAITING_AGREEMENT',
    note: 'Permohonan diluluskan — draf perjanjian AGR-0901 dijana' }],
  demoAgentId: 'AG-2101',
  seq: { agent: 2101, ref: 300, claim: 200, agreement: 901, log: 101, notif: 101 }
};
store['usm_demo_state'] = JSON.stringify(staleState);
openPage('dashboard');
check('state versi 1 dibuang dan diganti seed', S().state().version === 3, String(S().state().version));
check('6 ejen seed dimuatkan semula', S().agents().length === 6, String(S().agents().length));
check('notifikasi BM lama hilang', bmWordIn(JSON.stringify(S().notifications())) === null);
check('log BM lama hilang', bmWordIn(JSON.stringify(S().log())) === null);
check('label CONFIG_DRAFT BM lama hilang',
  S().config().commission.ug.label === 'Undergraduate (UG)', S().config().commission.ug.label);
check('tiada teks BM pada dashboard selepas naik taraf',
  bmWordIn(chrome() + body()) === null, String(bmWordIn(chrome() + body())));

console.log('\n=======================================');
console.log('LULUS: ' + ok + '   GAGAL: ' + fail);
process.exit(fail ? 1 : 0);

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
click('button', 'Seterusnya');
click('button', 'Seterusnya');
click('button', 'Seterusnya');
check('langkah 4 (ABC) aktif', !!win.document.querySelector('.wizard-step.active[data-step="4"]'));
click('button', 'Hantar permohonan');
check('disekat tanpa deklarasi ABC', S().agents().length === 6);
win.document.getElementById('abc').checked = true;
click('button', 'Hantar permohonan');
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
setPrompt('Penyata kewangan hanya 1 tahun; perlu 2 tahun terkini.');
click('[data-action="doc-return"]');
check('status RETURNED_TO_AGENT', S().agent(newAgentId).appStatus === 'RETURNED_TO_AGENT');
check('sebab dipaparkan pada dokumen', body().indexOf('perlu 2 tahun terkini') >= 0);

console.log('\n== 4. Agent betulkan dokumen ==');
setRole('agent');
openPage('application-detail', '?id=' + newAgentId);
setPrompt('Penyata beraudit 2024 & 2025 dimuat naik.');
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
setPrompt('Prestasi memuaskan.');
click('[data-action="renew"][data-id="' + newAgentId + '"]');
check('RENEWED', S().agent(newAgentId).agentStatus === 'RENEWED');

console.log('\n== 15. Transisi kekal selepas refresh ==');
openPage('dashboard');
check('ejen demo masih RENEWED', S().agent(newAgentId).agentStatus === 'RENEWED');
check('tuntutan masih PAID', S().claim(newClaimId).claimStatus === 'PAID');
check('perjanjian masih FULLY_SIGNED', S().agreement(agrId).status === 'FULLY_SIGNED');

console.log('\n== 16. Tetapan (DRAF) menggerakkan amaun ==');
openPage('settings-draft');
var before = W().commissionOf(S().claim(newClaimId));
var input = win.document.querySelector('[data-field="0"]');
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
var slaField = null;
var fields = win.document.querySelectorAll('[data-field]');
for (var q = 0; q < fields.length; q++) {
  var rowTxt = fields[q].parentNode.parentNode.textContent || '';
  if (rowTxt.indexOf('Approaching Deadline') >= 0) slaField = fields[q];
}
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
  body().indexOf('Produksi membekukan kadar pada setiap claim') >= 0);
check('chip SLA membawa lencana DRAF', body().indexOf('sla-chip') >= 0
  && body().indexOf('draf-badge') >= 0);

console.log('\n== 17. Penukar peranan menukar navigasi ==');
setRole('agent');
openPage('dashboard');
check('Agent nampak "Mohon / Renew"', chrome().indexOf('Mohon / Renew') >= 0);
check('Agent tidak nampak "Konsol USAINS"', chrome().indexOf('Konsol USAINS') < 0);
setRole('usains');
openPage('dashboard');
check('USAINS nampak "Konsol USAINS"', chrome().indexOf('Konsol USAINS') >= 0);
check('USAINS tidak nampak "Mohon / Renew"', chrome().indexOf('Mohon / Renew') < 0);
setRole('payment');
openPage('dashboard');
check('Payment Officer nampak Tuntutan Komisen', chrome().indexOf('Tuntutan Komisen') >= 0);
openPage('usains-console');
check('Payment Officer disekat dari Konsol USAINS', body().indexOf('tiada akses') >= 0);

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
  'leap-console', 'agreement', 'referrals', 'claims', 'annual-review', 'settings-draft'];
setRole('admin');
for (var p = 0; p < PAGES.length; p++) {
  openPage(PAGES[p]);
  var html = body();
  check(PAGES[p] + '.html dirender',
    html.length > 200 && html.indexOf('Ralat skrin') < 0 && html.indexOf('belum dibina') < 0,
    html.slice(0, 120));
}

console.log('\n=======================================');
console.log('LULUS: ' + ok + '   GAGAL: ' + fail);
process.exit(fail ? 1 : 0);

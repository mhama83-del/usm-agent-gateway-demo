// Ujian golden path tanpa pelayar (node) — mengesahkan logik workflow.
var path = require('path');
var REPO = path.join(__dirname, '..').split(path.sep).join('/');
var mem = {};
global.window = {
  localStorage: {
    getItem: function (k) { return Object.prototype.hasOwnProperty.call(mem, k) ? mem[k] : null; },
    setItem: function (k, v) { mem[k] = String(v); },
    removeItem: function (k) { delete mem[k]; }
  }
};
require(REPO + '/data/seed.js');
require(REPO + '/js/store.js');
require(REPO + '/js/workflow.js');

var S = window.USMDEMO.Store;
var W = window.USMDEMO.WF;
var ok = 0, fail = 0;
function check(label, cond, extra) {
  if (cond) { ok++; console.log('  OK   ' + label); }
  else { fail++; console.log('  GAGAL ' + label + (extra ? ' :: ' + extra : '')); }
}
function step(n, t) { console.log('\n' + n + '. ' + t); }

S.load();

// --- keadaan awal ---
step(0, 'Keadaan awal seed');
check('6 ejen', S.agents().length === 6);
check('AG-2077 peringkat 1, SLA late', W.stageOf(S.agent('AG-2077')) === 1 && W.slaOf(S.agent('AG-2077')) === 'late');
check('AG-2041 peringkat 4 (Active)', W.stageOf(S.agent('AG-2041')) === 4);
check('AG-1875 peringkat 5 (Annual Review)', W.stageOf(S.agent('AG-1875')) === 5);
check('komisen CL-0091 = 5400 (36000 x 15%)', W.commissionOf(S.claim('CL-0091')) === 5400);

// --- komisen bergerak bila kadar ditukar ---
step('0b', 'Kadar DRAF ditukar dalam Tetapan');
S.config().commission.ug.ratePercent = 20;
check('CL-0091 kini 7200 (36000 x 20%)', W.commissionOf(S.claim('CL-0091')) === 7200,
  'dapat ' + W.commissionOf(S.claim('CL-0091')));
S.config().commission.ug.ratePercent = 15;
check('kembali 5400 selepas set semula', W.commissionOf(S.claim('CL-0091')) === 5400);

// --- 1. Agent mohon baharu ---
step(1, 'Agent — hantar permohonan baharu');
S.setRole('agent');
var a = W.submitApplication({
  name: 'Nusantara Edu Partners Sdn Bhd', country: 'Indonesia', mode: 'new',
  pic: 'Siti Rahayu', director: 'Andi Wijaya (Passport B7712233)',
  ssm: 'SSM 2201188-K', paidUpCapital: 'RM 88,000',
  registeredAddress: 'Jl. Thamrin 20, Jakarta Pusat, Indonesia',
  officialEmail: 'admin@nusantara-edu.id', website: 'www.nusantara-edu.id',
  abcAccepted: true
});
check('ejen baharu dicipta', !!a && a.appStatus === 'SUBMITTED', a && a.id);
check('slaSource = computed', a.slaSource === 'computed');
check('SLA chip dikira = ok (7 hari)', W.slaOf(a) === 'ok', W.slaOf(a));
check('9 dokumen PENDING', a.docs.length === 9 && W.docsOutstanding(a).length === 9);
check('notifikasi USAINS dijana', S.notifications()[0].audience === 'usains');

// SLA bergerak bila tempoh SLA DRAF dipendekkan
S.config().sla.usainsReviewDays = 1;
check('SLA jadi warning bila tempoh DRAF = 1 hari', W.slaOf(a) === 'warning', W.slaOf(a));
S.config().sla.usainsReviewDays = 7;

// Ambang "Approaching Deadline" kini nilai DRAF, bukan nombor tersembunyi
step('1c', 'Ambang Approaching Deadline dari CONFIG_DRAFT');
check('ambang lalai = 2 hari', S.config().sla.approachingWithinDays === 2);
check('SLA ok pada ambang 2', W.slaOf(a) === 'ok', W.slaOf(a));
S.config().sla.approachingWithinDays = 7;
check('ambang 7 menjadikan chip warning', W.slaOf(a) === 'warning', W.slaOf(a));
S.config().sla.approachingWithinDays = 0;
check('ambang 0 menjadikan chip ok semula', W.slaOf(a) === 'ok', W.slaOf(a));
S.config().sla.approachingWithinDays = 2;

// --- peranan salah tidak boleh bertindak ---
step('1b', 'Kawalan peranan');
var threw = false;
try { W.verifyAndForward(a.id); } catch (e) { threw = true; }
check('Agent tidak boleh verify & forward', threw);

// --- 2. USAINS semak + pulangkan 1 dokumen ---
step(2, 'USAINS — semak dokumen, pulangkan 1');
S.setRole('usains');
W.startReview(a.id);
check('status UNDER_USAINS_REVIEW', S.agent(a.id).appStatus === 'UNDER_USAINS_REVIEW');
threw = false;
try { W.returnDocument(a.id, 2, '   '); } catch (e) { threw = true; }
check('sebab wajib untuk pulangkan dokumen', threw);
W.returnDocument(a.id, 2, 'Penyata kewangan hanya 1 tahun; perlu 2 tahun terkini.');
check('status RETURNED_TO_AGENT', S.agent(a.id).appStatus === 'RETURNED_TO_AGENT');
check('dokumen #3 RETURNED', S.agent(a.id).docs[2].status === 'RETURNED');
threw = false;
try { W.verifyAndForward(a.id); } catch (e) { threw = true; }
check('tidak boleh forward sebelum semua dokumen VERIFIED', threw);

// --- 3. Agent betulkan ---
step(3, 'Agent — hantar semula dokumen');
S.setRole('agent');
W.resubmitDocument(a.id, 2, 'Penyata beraudit 2024 & 2025 dimuat naik.');
check('dokumen #3 RESUBMITTED', S.agent(a.id).docs[2].status === 'RESUBMITTED');
check('kembali UNDER_USAINS_REVIEW', S.agent(a.id).appStatus === 'UNDER_USAINS_REVIEW');

// --- 4. USAINS verify & forward ---
step(4, 'USAINS — sahkan semua dan forward');
S.setRole('usains');
for (var i = 0; i < 9; i++) W.verifyDocument(a.id, i);
W.verifyAndForward(a.id);
check('status VERIFIED', S.agent(a.id).appStatus === 'VERIFIED');
check('peringkat 2', W.stageOf(S.agent(a.id)) === 2);

// --- 5. LEAP approve ---
step(5, 'USM LEAP — luluskan');
S.setRole('leap');
W.approve(a.id);
var agr = S.agreementForAgent(a.id);
check('APPROVED_AWAITING_AGREEMENT', S.agent(a.id).appStatus === 'APPROVED_AWAITING_AGREEMENT');
check('draf perjanjian dijana', !!agr && agr.status === 'DRAFT', agr && agr.id);
check('peringkat 3', W.stageOf(S.agent(a.id)) === 3);

// --- 6. Tandatangan 3 pihak ---
step(6, 'Perjanjian — tandatangan 3 pihak');
S.setRole('usains'); W.signParty(agr.id, 'usains');
check('menunggu tandatangan LEAP', S.agreement(agr.id).status === 'AWAITING_LEAP_SIGNATURE');
S.setRole('leap'); W.signParty(agr.id, 'leap');
check('menunggu tandatangan ejen', S.agreement(agr.id).status === 'AWAITING_AGENT_SIGNATURE');
threw = false;
try { W.signParty(agr.id, 'agent'); } catch (e) { threw = true; }
check('LEAP tidak boleh tandatangan bagi pihak ejen', threw);
S.setRole('agent'); W.signParty(agr.id, 'agent');
check('FULLY_SIGNED', S.agreement(agr.id).status === 'FULLY_SIGNED');
check('ejen kini ACTIVE', S.agent(a.id).agentStatus === 'ACTIVE');
check('peringkat 4', W.stageOf(S.agent(a.id)) === 4);
check('tarikh tamat = +2 tahun', S.agreement(agr.id).endIso === '2028-08-31', S.agreement(agr.id).endIso);

// --- 7. Rujuk pelajar ---
step(7, 'Agent — rujuk pelajar');
var ref = W.addReferral(a.id, {
  name: 'Bagus Santoso', country: 'Indonesia', passport: 'A55667788',
  program: 'Bachelor of Computer Science', level: 'UG', firstYearFee: 34500
});
check('rujukan dicipta SUBMITTED', ref.refStatus === 'SUBMITTED', ref.refId);
threw = false;
try { W.createClaim(a.id, ref.refId); } catch (e) { threw = true; }
check('tuntutan disekat sebelum FEES_PAID', threw);

step('7b', 'USAINS — majukan status rujukan hingga Yuran dibayar');
S.setRole('usains');
W.advanceReferral(ref.refId); // OFFERED
W.advanceReferral(ref.refId); // ENROLLED
W.advanceReferral(ref.refId); // FEES_PAID
check('rujukan FEES_PAID', S.referral(ref.refId).refStatus === 'FEES_PAID');

// --- 8. Tuntutan komisen ---
step(8, 'Agent — bina dan hantar tuntutan');
S.setRole('agent');
var c = W.createClaim(a.id, ref.refId);
check('tuntutan DRAFT', c.claimStatus === 'DRAFT', c.id);
check('amaun DIKIRA = 5175 (34500 x 15%)', W.commissionOf(c) === 5175, String(W.commissionOf(c)));
W.submitClaim(c.id);
check('tuntutan SUBMITTED', S.claim(c.id).claimStatus === 'SUBMITTED');
check('deadline = +14 hari', S.claim(c.id).deadlineIso === '2026-09-14', S.claim(c.id).deadlineIso);

// --- 9. USAINS semak 5 syarat ---
step(9, 'USAINS — semak 5 syarat kelayakan');
S.setRole('usains');
W.startClaimReview(c.id);
threw = false;
try { W.forwardClaim(c.id); } catch (e) { threw = true; }
check('tidak boleh forward sebelum 5 syarat disahkan', threw);
for (var k = 0; k < 5; k++) W.setEligibility(c.id, k, true);
W.forwardClaim(c.id);
check('PENDING_LEAP_DECISION', S.claim(c.id).claimStatus === 'PENDING_LEAP_DECISION');

// --- 10. LEAP lulus ---
step(10, 'USM LEAP — luluskan tuntutan');
S.setRole('leap');
W.decideClaim(c.id, 'approve');
check('APPROVED_PENDING_PAYMENT', S.claim(c.id).claimStatus === 'APPROVED_PENDING_PAYMENT');

// --- 11. Payment Officer rekod bayaran ---
step(11, 'Payment Officer — rekod bayaran');
S.setRole('leap');
threw = false;
try { W.recordPayment(c.id, { amount: 5175, reference: 'X' }); } catch (e) { threw = true; }
check('LEAP tidak boleh rekod bayaran', threw);
S.setRole('payment');
threw = false;
try { W.recordPayment(c.id, { amount: 5175, reference: '  ' }); } catch (e) { threw = true; }
check('rujukan bayaran wajib', threw);
W.recordPayment(c.id, { amount: W.commissionOf(S.claim(c.id)), reference: 'TT-2026-00871', dateIso: '2026-09-02' });
check('tuntutan PAID', S.claim(c.id).claimStatus === 'PAID');
check('peringkat tuntutan 5', W.claimStageOf(S.claim(c.id)) === 5);

// --- 12. Annual review + renew ---
step(12, 'Annual review dan pembaharuan');
S.setRole('leap');
W.openAnnualReview(a.id);
check('REVIEW_DUE', S.agent(a.id).agentStatus === 'REVIEW_DUE');
check('peringkat 5', W.stageOf(S.agent(a.id)) === 5);
W.renew(a.id, 'Prestasi memuaskan untuk demo');
check('RENEWED', S.agent(a.id).agentStatus === 'RENEWED');
check('tamat dilanjutkan ke 2030-08-31', S.agent(a.id).expiryIso === '2030-08-31', S.agent(a.id).expiryIso);

// --- 13. Kekal selepas "refresh" ---
step(13, 'Kekal selepas refresh (baca semula dari localStorage)');
var snapshot = mem['usm_demo_state'];
delete require.cache[require.resolve(REPO + '/js/store.js')];
delete require.cache[require.resolve(REPO + '/js/workflow.js')];
delete require.cache[require.resolve(REPO + '/data/seed.js')];
window.USMDEMO = undefined;
require(REPO + '/data/seed.js');
require(REPO + '/js/store.js');
require(REPO + '/js/workflow.js');
var S2 = window.USMDEMO.Store, W2 = window.USMDEMO.WF;
check('state dibaca semula', !!snapshot && S2.agents().length === 7);
check('ejen demo masih RENEWED', S2.agent(a.id).agentStatus === 'RENEWED');
check('tuntutan masih PAID', S2.claim(c.id).claimStatus === 'PAID');

// --- 14. Reset Demo ---
step(14, 'Reset Demo');
S2.reset();
check('kembali 6 ejen seed', S2.agents().length === 6);
check('ejen demo hilang', S2.agent(a.id) === null);
check('CL-0102 kembali DRAFT', S2.claim('CL-0102').claimStatus === 'DRAFT');
check('kadar UG kembali 15%', S2.config().commission.ug.ratePercent === 15);

console.log('\n=======================================');
console.log('LULUS: ' + ok + '   GAGAL: ' + fail);
process.exit(fail ? 1 : 0);

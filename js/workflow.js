/*
 * workflow.js — Logik transisi status + peraturan perniagaan demo.
 *
 * Setiap transisi: (1) sahkan peraturan, (2) kemas kini state,
 * (3) tambah entri log aktiviti, (4) hantar notifikasi UI, (5) simpan.
 * Ini memetakan kepada satu Workflow Service dalam produksi CI4.
 */
(function (root) {
  'use strict';

  var NS = root.USMDEMO = root.USMDEMO || {};
  var S = NS.Store;
  var SEED = NS.SEED;

  // --- Tarikh ------------------------------------------------------------
  var BULAN = ['Jan', 'Feb', 'Mac', 'Apr', 'Mei', 'Jun', 'Jul', 'Ogos', 'Sep', 'Okt', 'Nov', 'Dis'];

  function toDate(iso) { return new Date(iso + 'T00:00:00'); }
  function toIso(d) {
    var m = String(d.getMonth() + 1), day = String(d.getDate());
    if (m.length < 2) m = '0' + m;
    if (day.length < 2) day = '0' + day;
    return d.getFullYear() + '-' + m + '-' + day;
  }
  function addDays(iso, n) { var d = toDate(iso); d.setDate(d.getDate() + n); return toIso(d); }
  function addYears(iso, n) { var d = toDate(iso); d.setFullYear(d.getFullYear() + n); return toIso(d); }
  function fmt(iso) {
    if (!iso) return '—';
    var d = toDate(iso);
    return d.getDate() + ' ' + BULAN[d.getMonth()] + ' ' + d.getFullYear();
  }
  function daysBetween(fromIso, toIsoStr) {
    return Math.round((toDate(toIsoStr) - toDate(fromIso)) / 86400000);
  }
  function daysUntil(iso) { return iso ? daysBetween(S.now(), iso) : null; }
  function money(n) {
    n = Math.round(Number(n) || 0);
    return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }

  // --- Peringkat (status trail 5-peringkat) ------------------------------
  var APP_STAGE = {
    DRAFT: 1, SUBMITTED: 1, UNDER_USAINS_REVIEW: 1, RETURNED_TO_AGENT: 1,
    REJECTED: 1, WITHDRAWN: 1, CANCELLED: 1,
    VERIFIED: 2, UNDER_LEAP_REVIEW: 2,
    APPROVED_AWAITING_AGREEMENT: 3, AGREEMENT_SIGNED: 3
  };
  var LATE_AGENT_STATUS = { REVIEW_DUE: 1, RENEWED: 1, NOT_RENEWED: 1, TERMINATED: 1, EXPIRED: 1 };

  function stageOf(a) {
    if (!a) return 1;
    if (LATE_AGENT_STATUS[a.agentStatus]) return 5;
    if (a.agentStatus === 'ACTIVE') return 4;
    return APP_STAGE[a.appStatus] || 1;
  }

  var CLAIM_STAGE = {
    DRAFT: 1, CANCELLED: 1,
    SUBMITTED: 2,
    UNDER_USAINS_REVIEW: 3, RETURNED: 3,
    PENDING_LEAP_DECISION: 4, APPROVED_PENDING_PAYMENT: 4, REJECTED: 4,
    PAID: 5
  };
  function claimStageOf(c) { return CLAIM_STAGE[c.claimStatus] || 1; }

  // --- Label BM ----------------------------------------------------------
  var APP_LABEL = {
    DRAFT: 'Draf', SUBMITTED: 'Dihantar', UNDER_USAINS_REVIEW: 'Dalam semakan USAINS',
    RETURNED_TO_AGENT: 'Dipulangkan kepada ejen', VERIFIED: 'Disahkan USAINS',
    UNDER_LEAP_REVIEW: 'Dalam keputusan LEAP',
    APPROVED_AWAITING_AGREEMENT: 'Diluluskan — menunggu perjanjian',
    AGREEMENT_SIGNED: 'Perjanjian lengkap ditandatangani',
    REJECTED: 'Ditolak', WITHDRAWN: 'Ditarik balik', CANCELLED: 'Dibatalkan'
  };
  var AGENT_LABEL = {
    PENDING: 'Menunggu', ACTIVE: 'Aktif', SUSPENDED: 'Digantung',
    REVIEW_DUE: 'Annual review', RENEWED: 'Diperbaharui',
    NOT_RENEWED: 'Tidak diperbaharui', TERMINATED: 'Ditamatkan', EXPIRED: 'Luput'
  };
  var CLAIM_LABEL = {
    DRAFT: 'Draf', SUBMITTED: 'Dihantar', UNDER_USAINS_REVIEW: 'Semakan USAINS',
    RETURNED: 'Dipulangkan', PENDING_LEAP_DECISION: 'Menunggu keputusan LEAP',
    APPROVED_PENDING_PAYMENT: 'Diluluskan — menunggu bayaran',
    REJECTED: 'Ditolak', PAID: 'Telah dibayar', CANCELLED: 'Dibatalkan'
  };
  var REF_LABEL = {
    SUBMITTED: 'Dihantar', OFFERED: 'Ditawarkan', ENROLLED: 'Telah enrol',
    FEES_PAID: 'Yuran dibayar', WITHDRAWN: 'Ditarik balik', NOT_PROCEED: 'Tidak diteruskan'
  };
  var AGR_LABEL = {
    NOT_GENERATED: 'Belum dijana', DRAFT: 'Draf',
    AWAITING_USAINS_SIGNATURE: 'Menunggu tandatangan USAINS',
    AWAITING_LEAP_SIGNATURE: 'Menunggu tandatangan USM LEAP',
    AWAITING_AGENT_SIGNATURE: 'Menunggu tandatangan ejen',
    FULLY_SIGNED: 'Lengkap ditandatangani', VOID: 'Terbatal', EXPIRED: 'Luput'
  };
  var DOC_LABEL = {
    PENDING: 'Belum disemak', VERIFIED: 'Disahkan',
    RETURNED: 'Dipulangkan', RESUBMITTED: 'Dihantar semula'
  };

  // --- SLA ---------------------------------------------------------------
  // Keputusan owner (1 Sep 2026): ejen SEED guna medan `sla` (keadaan yang
  // dikurasi untuk cerita demo). Permohonan yang DICIPTA semasa demo dikira
  // daripada CONFIG_DRAFT.sla + tarikh supaya chipnya bergerak.
  function slaDeadline(a) {
    var cfg = S.config();
    if (a.appStatus === 'SUBMITTED' || a.appStatus === 'UNDER_USAINS_REVIEW' || a.appStatus === 'RETURNED_TO_AGENT') {
      return a.submittedIso ? addDays(a.submittedIso, cfg.sla.usainsReviewDays) : null;
    }
    if (a.appStatus === 'VERIFIED' || a.appStatus === 'UNDER_LEAP_REVIEW') {
      return addDays(a.verifiedIso || a.submittedIso, cfg.sla.leapDecisionDays);
    }
    return null;
  }
  function slaStateFromDeadline(deadlineIso) {
    if (!deadlineIso) return 'ok';
    var left = daysUntil(deadlineIso);
    if (left < 0) return 'late';
    // Ambang "Approaching Deadline" ialah nilai DRAF, bukan nombor tersembunyi.
    var within = S.config().sla.approachingWithinDays;
    if (left <= (within == null ? 2 : within)) return 'warning';
    return 'ok';
  }
  function slaOf(a) {
    if (!a) return 'ok';
    if (a.slaSource === 'seed') return a.sla || 'ok';   // medan seed menang
    return slaStateFromDeadline(slaDeadline(a));
  }
  function slaOfClaim(c) {
    if (!c.submittedIso) return 'ok';
    if (c.claimStatus === 'PAID' || c.claimStatus === 'REJECTED') return 'ok';
    return slaStateFromDeadline(addDays(c.submittedIso, S.config().sla.claimDecisionDays));
  }

  // --- Komisen (DIKIRA dari CONFIG_DRAFT, bukan angka mati) --------------
  function ratePercent(level) {
    var c = S.config().commission;
    return (level === 'PG' ? c.pg : c.ug).ratePercent;
  }
  function commissionOf(rec) {
    var fee = rec.firstYearFee || 0;
    return Math.round(fee * ratePercent(rec.level) / 100);
  }

  // --- Log + notifikasi --------------------------------------------------
  function logIt(entity, entityId, from, to, note) {
    var st = S.state();
    var info = S.roleInfo();
    st.log.unshift({
      id: S.nextId('log', 'LG-'),
      tsIso: st.nowIso, tsLabel: fmt(st.nowIso),
      actor: info.person, role: info.key,
      entity: entity, entityId: entityId,
      from: from, to: to, note: note || ''
    });
    if (entity === 'agent') {
      var a = S.agent(entityId);
      if (a) {
        a.activities = a.activities || [];
        a.activities.unshift({
          actor: info.person + ' (' + info.label + ')',
          action: note || (from + ' → ' + to),
          time: fmt(st.nowIso)
        });
      }
    }
  }
  function notify(audience, title, body, link, agentId) {
    var st = S.state();
    st.notifications.unshift({
      id: S.nextId('notif', 'NT-'),
      audience: audience, agentId: agentId || null,
      title: title, body: body,
      timeIso: st.nowIso, timeLabel: fmt(st.nowIso),
      read: false, link: link || null
    });
  }

  // --- Kebenaran mengikut peranan ----------------------------------------
  var PERMS = {
    agent: ['submitApplication', 'resubmitDocument', 'signAgent', 'addReferral', 'createClaim', 'submitClaim'],
    usains: ['startReview', 'verifyDocument', 'returnDocument', 'verifyAndForward', 'signUsains',
             'startClaimReview', 'setEligibility', 'forwardClaim', 'returnClaim', 'advanceReferral'],
    leap: ['approve', 'rejectApplication', 'signLeap', 'decideClaim', 'openAnnualReview',
           'renew', 'terminate', 'advanceReferral'],
    payment: ['recordPayment'],
    admin: ['*']
  };
  function can(action, roleKey) {
    var r = roleKey || S.role();
    var list = PERMS[r] || [];
    if (list.indexOf('*') >= 0) return true;
    return list.indexOf(action) >= 0;
  }
  function guard(action) {
    if (!can(action)) {
      throw new Error('Peranan ' + S.roleInfo().label + ' tiada kebenaran untuk tindakan ini.');
    }
  }

  // --- Transisi: permohonan ---------------------------------------------
  function submitApplication(data) {
    guard('submitApplication');
    var st = S.state();
    var a = {
      id: S.nextId('agent', 'AG-'), name: data.name, country: data.country,
      mode: data.mode || 'new',
      typeLabel: data.mode === 'renewal' ? 'Renewal' : 'New Application',
      stage: 1, sla: 'ok', slaSource: 'computed',
      appStatus: 'SUBMITTED', agentStatus: 'PENDING', agreementId: null,
      docs: SEED.docsFor('PENDING'),
      submittedIso: st.nowIso, submittedLabel: fmt(st.nowIso),
      expiryIso: null, expiryLabel: null, studentsThisYear: 0,
      tin: data.tin || '—', ssm: data.ssm || '—',
      paidUpCapital: data.paidUpCapital || '—',
      registeredAddress: data.registeredAddress || '—',
      operatingAddress: data.operatingAddress || 'Same as registered address',
      website: data.website || '—', officialEmail: data.officialEmail || '—',
      pic: data.pic || '—', director: data.director || '—', conduct: '—',
      abc: { accepted: !!data.abcAccepted, byName: data.pic || '—', dateLabel: fmt(st.nowIso) },
      isDemoCreated: true,
      activities: []
    };
    st.agents.unshift(a);
    st.demoAgentId = a.id;
    logIt('agent', a.id, 'DRAFT', 'SUBMITTED',
      'Permohonan ' + (a.mode === 'renewal' ? 'pembaharuan' : 'baharu') + ' dihantar');
    notify('usains', 'Permohonan baharu diterima',
      a.name + ' (' + a.id + ') menunggu semakan dokumen.', 'usains-console.html', a.id);
    S.save();
    return a;
  }

  function startReview(agentId) {
    guard('startReview');
    var a = S.agent(agentId);
    if (a.appStatus !== 'SUBMITTED') {
      throw new Error('Hanya permohonan berstatus "Dihantar" boleh dibuka untuk semakan.');
    }
    a.appStatus = 'UNDER_USAINS_REVIEW';
    logIt('agent', a.id, 'SUBMITTED', a.appStatus, 'Semakan dokumen dimulakan');
    S.save();
    return a;
  }

  function verifyDocument(agentId, idx) {
    guard('verifyDocument');
    var a = S.agent(agentId);
    if (a.appStatus === 'SUBMITTED') {
      a.appStatus = 'UNDER_USAINS_REVIEW';
      logIt('agent', a.id, 'SUBMITTED', a.appStatus, 'Semakan dokumen dimulakan');
    }
    a.docs[idx].status = 'VERIFIED';
    a.docs[idx].note = '';
    S.save();
    return a;
  }

  function returnDocument(agentId, idx, reason) {
    guard('returnDocument');
    if (!reason || !reason.trim()) {
      throw new Error('Sebab wajib diisi apabila memulangkan dokumen.');
    }
    var a = S.agent(agentId);
    var from = a.appStatus;
    a.docs[idx].status = 'RETURNED';
    a.docs[idx].note = reason.trim();
    a.appStatus = 'RETURNED_TO_AGENT';
    logIt('agent', a.id, from, a.appStatus,
      'Dokumen dipulangkan: ' + a.docs[idx].name + ' — ' + reason.trim());
    notify('agent', 'Dokumen dipulangkan untuk pembetulan',
      a.docs[idx].name + ': ' + reason.trim(), 'application-detail.html?id=' + a.id, a.id);
    S.save();
    return a;
  }

  function resubmitDocument(agentId, idx, note) {
    guard('resubmitDocument');
    var a = S.agent(agentId);
    if (a.docs[idx].status !== 'RETURNED') {
      throw new Error('Dokumen ini tidak dipulangkan, jadi tiada apa untuk dibetulkan.');
    }
    a.docs[idx].status = 'RESUBMITTED';
    a.docs[idx].note = note || 'Dokumen digantikan oleh ejen';
    var stillReturned = false;
    for (var i = 0; i < a.docs.length; i++) {
      if (a.docs[i].status === 'RETURNED') stillReturned = true;
    }
    var from = a.appStatus;
    if (!stillReturned) a.appStatus = 'UNDER_USAINS_REVIEW';
    logIt('agent', a.id, from, a.appStatus, 'Dokumen dihantar semula: ' + a.docs[idx].name);
    notify('usains', 'Dokumen pembetulan diterima',
      a.name + ' menghantar semula ' + a.docs[idx].name + '.', 'usains-console.html', a.id);
    S.save();
    return a;
  }

  function docsOutstanding(a) {
    var out = [];
    if (!a || !a.docs) return out;
    for (var i = 0; i < a.docs.length; i++) {
      if (a.docs[i].status !== 'VERIFIED') out.push(a.docs[i]);
    }
    return out;
  }

  function verifyAndForward(agentId) {
    guard('verifyAndForward');
    var a = S.agent(agentId);
    var out = docsOutstanding(a);
    if (out.length) {
      throw new Error('Masih ada ' + out.length + ' dokumen belum disahkan. USAINS hanya boleh forward apabila semua dokumen VERIFIED.');
    }
    var from = a.appStatus;
    a.appStatus = 'VERIFIED';
    a.verifiedIso = S.state().nowIso;
    a.verifiedLabel = fmt(a.verifiedIso);
    logIt('agent', a.id, from, a.appStatus, 'Dokumen disahkan dan dihantar kepada USM LEAP');
    notify('leap', 'Kes menunggu keputusan LEAP',
      a.name + ' (' + a.id + ') telah disahkan USAINS.', 'leap-console.html', a.id);
    S.save();
    return a;
  }

  function approve(agentId) {
    guard('approve');
    var a = S.agent(agentId);
    if (a.appStatus !== 'VERIFIED' && a.appStatus !== 'UNDER_LEAP_REVIEW') {
      throw new Error('LEAP hanya boleh meluluskan permohonan berstatus VERIFIED.');
    }
    var st = S.state();
    var from = a.appStatus;
    a.appStatus = 'APPROVED_AWAITING_AGREEMENT';
    var agr = {
      id: S.nextId('agreement', 'AGR-'), agentId: a.id, status: 'DRAFT',
      termYears: st.config.renewal.agreementTermYears,
      startIso: null, startLabel: '—', endIso: null, endLabel: '—',
      generatedLabel: fmt(st.nowIso),
      signatures: {
        usains: { signed: false, by: null, dateIso: null, dateLabel: '—' },
        leap: { signed: false, by: null, dateIso: null, dateLabel: '—' },
        agent: { signed: false, by: null, dateIso: null, dateLabel: '—' }
      }
    };
    st.agreements.unshift(agr);
    a.agreementId = agr.id;
    logIt('agent', a.id, from, a.appStatus,
      'Permohonan diluluskan — draf perjanjian ' + agr.id + ' dijana');
    notify('all', 'Draf perjanjian dijana',
      agr.id + ' untuk ' + a.name + ' menunggu tandatangan tiga pihak.',
      'agreement.html?id=' + agr.id, a.id);
    S.save();
    return a;
  }

  function rejectApplication(agentId, reason) {
    guard('rejectApplication');
    if (!reason || !reason.trim()) throw new Error('Sebab wajib diisi untuk penolakan.');
    var a = S.agent(agentId);
    var from = a.appStatus;
    a.appStatus = 'REJECTED';
    logIt('agent', a.id, from, a.appStatus, 'Permohonan ditolak: ' + reason.trim());
    notify('agent', 'Permohonan ditolak', reason.trim(),
      'application-detail.html?id=' + a.id, a.id);
    S.save();
    return a;
  }

  // --- Transisi: perjanjian ---------------------------------------------
  var PARTY_ACTION = { usains: 'signUsains', leap: 'signLeap', agent: 'signAgent' };
  var PARTY_LABEL = { usains: 'USAINS', leap: 'USM LEAP', agent: 'Ejen' };

  function signParty(agreementId, party) {
    guard(PARTY_ACTION[party]);
    var agr = S.agreement(agreementId);
    if (!agr) throw new Error('Perjanjian tidak dijumpai.');
    if (agr.status === 'FULLY_SIGNED') throw new Error('Perjanjian sudah lengkap ditandatangani.');
    if (agr.signatures[party].signed) throw new Error(PARTY_LABEL[party] + ' sudah menandatangani.');
    var st = S.state();
    var info = S.roleInfo();
    var from = agr.status;
    agr.signatures[party] = {
      signed: true, by: info.person + ' (' + info.label + ')',
      dateIso: st.nowIso, dateLabel: fmt(st.nowIso)
    };
    var a = S.agent(agr.agentId);
    if (agr.signatures.usains.signed && agr.signatures.leap.signed && agr.signatures.agent.signed) {
      agr.status = 'FULLY_SIGNED';
      agr.startIso = st.nowIso;
      agr.startLabel = fmt(st.nowIso);
      agr.endIso = addYears(st.nowIso, agr.termYears);
      agr.endLabel = fmt(agr.endIso);
      if (a) {
        a.appStatus = 'AGREEMENT_SIGNED';
        a.agentStatus = 'ACTIVE';
        a.typeLabel = 'Active';
        a.expiryIso = agr.endIso;
        a.expiryLabel = agr.endLabel;
        logIt('agent', a.id, 'PENDING', 'ACTIVE',
          'Perjanjian lengkap ditandatangani — ejen kini AKTIF');
      }
      notify('all', 'Ejen kini AKTIF',
        (a ? a.name : agr.agentId) + ' boleh mula merujuk pelajar.', 'referrals.html', agr.agentId);
    } else {
      agr.status = !agr.signatures.usains.signed ? 'AWAITING_USAINS_SIGNATURE'
        : (!agr.signatures.leap.signed ? 'AWAITING_LEAP_SIGNATURE' : 'AWAITING_AGENT_SIGNATURE');
      notify('all', 'Tandatangan direkod',
        PARTY_LABEL[party] + ' menandatangani ' + agr.id + '.',
        'agreement.html?id=' + agr.id, agr.agentId);
    }
    logIt('agreement', agr.id, from, agr.status,
      'Tandatangan ' + PARTY_LABEL[party] + ' direkod (status demo, bukan e-signature sah)');
    S.save();
    return agr;
  }

  // --- Transisi: rujukan pelajar ----------------------------------------
  function addReferral(agentId, data) {
    guard('addReferral');
    var a = S.agent(agentId);
    if (a.agentStatus !== 'ACTIVE' && a.agentStatus !== 'RENEWED') {
      throw new Error('Hanya ejen berstatus AKTIF boleh mencipta rujukan pelajar.');
    }
    var st = S.state();
    var ref = {
      refId: S.nextId('ref', 'REF-'), name: data.name,
      country: data.country || a.country,
      passport: data.passport || '—',
      firstYearFee: Number(data.firstYearFee) || 0,
      refStatus: 'SUBMITTED', program: data.program, level: data.level || 'UG',
      agentId: a.id, status: 'Submitted',
      semester: data.semester || '2026/2027 Sem 1',
      createdIso: st.nowIso, isDemoCreated: true
    };
    st.referrals.unshift(ref);
    logIt('referral', ref.refId, '—', 'SUBMITTED', 'Rujukan pelajar baharu: ' + ref.name);
    notify('usains', 'Rujukan pelajar baharu',
      a.name + ' merujuk ' + ref.name + ' (' + ref.program + ').', 'referrals.html', a.id);
    S.save();
    return ref;
  }

  var REF_FLOW = ['SUBMITTED', 'OFFERED', 'ENROLLED', 'FEES_PAID'];
  function advanceReferral(refId) {
    guard('advanceReferral');
    var ref = S.referral(refId);
    if (!ref) throw new Error('Rujukan tidak dijumpai.');
    var i = REF_FLOW.indexOf(ref.refStatus);
    if (i < 0 || i >= REF_FLOW.length - 1) throw new Error('Rujukan sudah di peringkat akhir.');
    var from = ref.refStatus;
    ref.refStatus = REF_FLOW[i + 1];
    ref.status = ({ SUBMITTED: 'Submitted', OFFERED: 'Offered', ENROLLED: 'Enrolled', FEES_PAID: 'Fees Paid' })[ref.refStatus];
    logIt('referral', ref.refId, from, ref.refStatus,
      'Status rujukan dikemas kini oleh pegawai berautoriti (' + ref.name + ')');
    S.save();
    return ref;
  }

  // --- Transisi: tuntutan komisen ---------------------------------------
  function createClaim(agentId, refId) {
    guard('createClaim');
    var a = S.agent(agentId);
    var ref = S.referral(refId);
    if (!ref) throw new Error('Rujukan tidak dijumpai.');
    if (ref.refStatus !== 'FEES_PAID') {
      throw new Error('Tuntutan hanya boleh dibina bagi rujukan berstatus "Yuran dibayar".');
    }
    var existing = S.claims();
    for (var i = 0; i < existing.length; i++) {
      if (existing[i].refId === ref.refId) throw new Error('Rujukan ini sudah mempunyai tuntutan (' + existing[i].id + ').');
    }
    var st = S.state();
    var c = {
      id: S.nextId('claim', 'CL-'), student: ref.name, passport: ref.passport,
      program: ref.program, level: ref.level, agentId: a.id,
      refId: ref.refId, firstYearFee: ref.firstYearFee,
      claimStatus: 'DRAFT', status: 'Draft',
      submittedIso: null, submittedLabel: '—',
      deadlineIso: null, deadlineLabel: '—',
      eligibility: [false, false, false, false, false],
      isDemoCreated: true
    };
    st.claims.unshift(c);
    logIt('claim', c.id, '—', 'DRAFT', 'Draf tuntutan dibina untuk ' + ref.name);
    S.save();
    return c;
  }

  function submitClaim(claimId) {
    guard('submitClaim');
    var c = S.claim(claimId);
    if (c.claimStatus !== 'DRAFT' && c.claimStatus !== 'RETURNED') {
      throw new Error('Hanya tuntutan Draf atau Dipulangkan boleh dihantar.');
    }
    var st = S.state();
    var from = c.claimStatus;
    c.claimStatus = 'SUBMITTED';
    c.submittedIso = st.nowIso;
    c.submittedLabel = fmt(st.nowIso);
    c.deadlineIso = addDays(st.nowIso, st.config.sla.claimDecisionDays);
    c.deadlineLabel = fmt(c.deadlineIso);
    c.rateSnapshot = ratePercent(c.level);
    logIt('claim', c.id, from, c.claimStatus, 'Tuntutan dihantar — RM ' + money(commissionOf(c)));
    notify('usains', 'Tuntutan komisen baharu',
      c.id + ' (' + c.student + ') menunggu semakan kelayakan.', 'claims.html', c.agentId);
    S.save();
    return c;
  }

  function startClaimReview(claimId) {
    guard('startClaimReview');
    var c = S.claim(claimId);
    if (c.claimStatus !== 'SUBMITTED') {
      throw new Error('Hanya tuntutan berstatus "Dihantar" boleh dibuka untuk semakan.');
    }
    c.claimStatus = 'UNDER_USAINS_REVIEW';
    logIt('claim', c.id, 'SUBMITTED', c.claimStatus, 'Semakan kelayakan dimulakan');
    S.save();
    return c;
  }

  function setEligibility(claimId, idx, value) {
    guard('setEligibility');
    var c = S.claim(claimId);
    if (c.claimStatus === 'SUBMITTED') {
      c.claimStatus = 'UNDER_USAINS_REVIEW';
      logIt('claim', c.id, 'SUBMITTED', c.claimStatus, 'Semakan kelayakan dimulakan');
    }
    if (c.claimStatus !== 'UNDER_USAINS_REVIEW') {
      throw new Error('Syarat kelayakan hanya boleh disemak semasa peringkat semakan USAINS.');
    }
    c.eligibility[idx] = !!value;
    S.save();
    return c;
  }

  function forwardClaim(claimId) {
    guard('forwardClaim');
    var c = S.claim(claimId);
    for (var i = 0; i < 5; i++) {
      if (!c.eligibility[i]) {
        throw new Error('Syarat kelayakan #' + (i + 1) + ' belum disahkan: ' + SEED.ELIGIBILITY_LABELS[i]);
      }
    }
    var from = c.claimStatus;
    c.claimStatus = 'PENDING_LEAP_DECISION';
    logIt('claim', c.id, from, c.claimStatus,
      '5 syarat kelayakan disahkan — dihantar untuk keputusan LEAP');
    notify('leap', 'Tuntutan menunggu keputusan',
      c.id + ' (' + c.student + ') — RM ' + money(commissionOf(c)), 'claims.html', c.agentId);
    S.save();
    return c;
  }

  function returnClaim(claimId, reason) {
    guard('returnClaim');
    if (!reason || !reason.trim()) throw new Error('Sebab wajib diisi untuk memulangkan tuntutan.');
    var c = S.claim(claimId);
    var from = c.claimStatus;
    c.claimStatus = 'RETURNED';
    c.returnReason = reason.trim();
    logIt('claim', c.id, from, c.claimStatus, 'Tuntutan dipulangkan: ' + reason.trim());
    notify('agent', 'Tuntutan dipulangkan', c.id + ': ' + reason.trim(), 'claims.html', c.agentId);
    S.save();
    return c;
  }

  function decideClaim(claimId, decision, reason) {
    guard('decideClaim');
    var c = S.claim(claimId);
    if (c.claimStatus !== 'PENDING_LEAP_DECISION') {
      throw new Error('Tuntutan belum sampai ke peringkat keputusan LEAP.');
    }
    var from = c.claimStatus;
    if (decision === 'reject') {
      if (!reason || !reason.trim()) throw new Error('Sebab wajib diisi untuk penolakan tuntutan.');
      c.claimStatus = 'REJECTED';
      c.decision = 'Rejected';
      c.decisionReason = reason.trim();
      logIt('claim', c.id, from, c.claimStatus, 'Tuntutan ditolak: ' + reason.trim());
      notify('agent', 'Tuntutan ditolak', c.id + ': ' + reason.trim(), 'claims.html', c.agentId);
    } else {
      c.claimStatus = 'APPROVED_PENDING_PAYMENT';
      c.decision = 'Approved';
      logIt('claim', c.id, from, c.claimStatus, 'Tuntutan diluluskan — menunggu rekod bayaran');
      notify('payment', 'Tuntutan sedia untuk bayaran',
        c.id + ' — RM ' + money(commissionOf(c)), 'claims.html', c.agentId);
    }
    S.save();
    return c;
  }

  function recordPayment(claimId, data) {
    guard('recordPayment');
    var c = S.claim(claimId);
    if (c.claimStatus !== 'APPROVED_PENDING_PAYMENT') {
      throw new Error('Bayaran hanya boleh direkod selepas tuntutan DILULUSKAN.');
    }
    if (!data || !data.reference || !String(data.reference).trim()) {
      throw new Error('Rujukan bayaran wajib diisi.');
    }
    if (!data.amount) throw new Error('Amaun bayaran wajib diisi.');
    var from = c.claimStatus;
    var st = S.state();
    c.claimStatus = 'PAID';
    c.payment = {
      amount: Number(data.amount),
      dateIso: data.dateIso || st.nowIso,
      dateLabel: fmt(data.dateIso || st.nowIso),
      reference: String(data.reference).trim(),
      payee: data.payee || (S.agent(c.agentId) || {}).name || '—',
      note: data.note || ''
    };
    logIt('claim', c.id, from, c.claimStatus,
      'Bayaran direkod: RM ' + money(c.payment.amount) + ' · Ruj ' + c.payment.reference);
    notify('agent', 'Tuntutan telah dibayar',
      c.id + ' — RM ' + money(c.payment.amount) + ' (Ruj ' + c.payment.reference + ')',
      'claims.html', c.agentId);
    S.save();
    return c;
  }

  // --- Transisi: annual review & pembaharuan ----------------------------
  function referralCountThisYear(agentId) {
    var a = S.agent(agentId);
    var refs = S.referrals(), n = 0;
    for (var i = 0; i < refs.length; i++) {
      if (refs[i].agentId === agentId) n++;
    }
    if (a && typeof a.studentsThisYear === 'number' && a.studentsThisYear > n) return a.studentsThisYear;
    return n;
  }

  function openAnnualReview(agentId) {
    guard('openAnnualReview');
    var a = S.agent(agentId);
    if (a.agentStatus !== 'ACTIVE' && a.agentStatus !== 'RENEWED') {
      throw new Error('Annual review hanya untuk ejen aktif.');
    }
    var from = a.agentStatus;
    a.agentStatus = 'REVIEW_DUE';
    a.typeLabel = 'Active · Annual Review';
    logIt('agent', a.id, from, a.agentStatus,
      'Annual review dibuka — rujukan ' + referralCountThisYear(a.id) +
      ' vs ambang ' + S.config().renewal.minReferralsPerYear);
    notify('leap', 'Annual review dibuka',
      a.name + ' memerlukan keputusan renew/terminate.', 'annual-review.html', a.id);
    S.save();
    return a;
  }

  function renew(agentId, note) {
    guard('renew');
    var a = S.agent(agentId);
    if (a.agentStatus !== 'REVIEW_DUE') {
      throw new Error('Hanya ejen dalam annual review boleh diperbaharui.');
    }
    var st = S.state();
    var from = a.agentStatus;
    a.agentStatus = 'RENEWED';
    a.typeLabel = 'Active · Renewed';
    var agr = S.agreementForAgent(a.id);
    var base = (agr && agr.endIso) || a.expiryIso || st.nowIso;
    var newEnd = addYears(base, st.config.renewal.agreementTermYears);
    a.expiryIso = newEnd;
    a.expiryLabel = fmt(newEnd);
    if (agr) {
      agr.endIso = newEnd;
      agr.endLabel = fmt(newEnd);
      agr.status = 'FULLY_SIGNED';
    }
    logIt('agent', a.id, from, a.agentStatus,
      'Diperbaharui sehingga ' + fmt(newEnd) + (note ? ' — ' + note : ''));
    notify('agent', 'Pembaharuan diluluskan',
      'Perjanjian dilanjutkan sehingga ' + fmt(newEnd) + '.', 'annual-review.html', a.id);
    S.save();
    return a;
  }

  function terminate(agentId, reason) {
    guard('terminate');
    if (!reason || !reason.trim()) throw new Error('Sebab wajib diisi untuk penamatan.');
    var a = S.agent(agentId);
    var from = a.agentStatus;
    a.agentStatus = 'TERMINATED';
    a.typeLabel = 'Terminated';
    logIt('agent', a.id, from, a.agentStatus, 'Ditamatkan: ' + reason.trim());
    notify('agent', 'Perjanjian ditamatkan', reason.trim(), 'annual-review.html', a.id);
    S.save();
    return a;
  }

  NS.WF = {
    fmt: fmt, addDays: addDays, addYears: addYears, toIso: toIso,
    daysUntil: daysUntil, daysBetween: daysBetween, money: money,
    stageOf: stageOf, claimStageOf: claimStageOf,
    slaOf: slaOf, slaOfClaim: slaOfClaim, slaDeadline: slaDeadline,
    ratePercent: ratePercent, commissionOf: commissionOf,
    docsOutstanding: docsOutstanding, referralCountThisYear: referralCountThisYear,
    APP_LABEL: APP_LABEL, AGENT_LABEL: AGENT_LABEL, CLAIM_LABEL: CLAIM_LABEL,
    REF_LABEL: REF_LABEL, AGR_LABEL: AGR_LABEL, DOC_LABEL: DOC_LABEL,
    PARTY_LABEL: PARTY_LABEL,
    can: can,
    submitApplication: submitApplication, startReview: startReview,
    verifyDocument: verifyDocument, returnDocument: returnDocument,
    resubmitDocument: resubmitDocument, verifyAndForward: verifyAndForward,
    approve: approve, rejectApplication: rejectApplication,
    signParty: signParty,
    addReferral: addReferral, advanceReferral: advanceReferral,
    createClaim: createClaim, submitClaim: submitClaim,
    startClaimReview: startClaimReview, setEligibility: setEligibility,
    forwardClaim: forwardClaim, returnClaim: returnClaim,
    decideClaim: decideClaim, recordPayment: recordPayment,
    openAnnualReview: openAnnualReview, renew: renew, terminate: terminate,
    logIt: logIt, notify: notify
  };
})(window);

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
  var BULAN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

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
  // Label bulan sahaja, untuk tempoh batch: "Mar 2026".
  function monthLabel(iso) {
    if (!iso) return '—';
    var d = toDate(iso);
    return BULAN[d.getMonth()] + ' ' + d.getFullYear();
  }
  function addMonths(iso, n) { var d = toDate(iso); d.setMonth(d.getMonth() + n); return toIso(d); }

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

  // --- Label paparan -----------------------------------------------------
  var APP_LABEL = {
    DRAFT: 'Draft', SUBMITTED: 'Submitted', UNDER_USAINS_REVIEW: 'Under USAINS review',
    RETURNED_TO_AGENT: 'Returned to agent', VERIFIED: 'Verified by USAINS',
    UNDER_LEAP_REVIEW: 'Awaiting LEAP decision',
    APPROVED_AWAITING_AGREEMENT: 'Approved — awaiting agreement',
    AGREEMENT_SIGNED: 'Agreement fully signed',
    REJECTED: 'Rejected', WITHDRAWN: 'Withdrawn', CANCELLED: 'Cancelled'
  };
  var AGENT_LABEL = {
    PENDING: 'Pending', ACTIVE: 'Active', SUSPENDED: 'Suspended',
    REVIEW_DUE: 'Annual review', RENEWED: 'Renewed',
    NOT_RENEWED: 'Not renewed', TERMINATED: 'Terminated', EXPIRED: 'Expired'
  };
  var CLAIM_LABEL = {
    DRAFT: 'Draft', SUBMITTED: 'Submitted', UNDER_USAINS_REVIEW: 'USAINS review',
    RETURNED: 'Returned', PENDING_LEAP_DECISION: 'Awaiting LEAP decision',
    APPROVED_PENDING_PAYMENT: 'Approved — awaiting payment',
    REJECTED: 'Rejected', PAID: 'Paid', CANCELLED: 'Cancelled'
  };
  var REF_LABEL = {
    SUBMITTED: 'Submitted', OFFERED: 'Offered', ENROLLED: 'Enrolled',
    FEES_PAID: 'Fees paid', WITHDRAWN: 'Withdrawn', NOT_PROCEED: 'Not proceeding'
  };
  var AGR_LABEL = {
    NOT_GENERATED: 'Not generated', DRAFT: 'Draft',
    AWAITING_USAINS_SIGNATURE: 'Awaiting USAINS signature',
    AWAITING_LEAP_SIGNATURE: 'Awaiting USM LEAP signature',
    AWAITING_AGENT_SIGNATURE: 'Awaiting agent signature',
    FULLY_SIGNED: 'Fully signed', VOID: 'Void', EXPIRED: 'Expired'
  };
  var DOC_LABEL = {
    PENDING: 'Not reviewed', VERIFIED: 'Verified',
    RETURNED: 'Returned', RESUBMITTED: 'Resubmitted'
  };

  var BATCH_LABEL = {
    DRAFT: 'Draft', CHECKED: 'Checked by USAINS',
    APPROVED: 'Approved by USM LEAP',
    SUBMITTED_TO_BENDAHARI: 'Submitted to Bursary'
  };
  var VENDOR_LABEL = {
    'Not Registered': 'Not Registered', 'Pending': 'Pending Supplier Code',
    'Registered': 'Registered'
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
    // Ambang "Approaching Deadline" ialah nilai DRAFT, bukan nombor tersembunyi.
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

  // Lajur "Total Fee (USD)" borang Bendahari. DIKIRA daripada kadar DRAFT —
  // feeUSD tidak disimpan, supaya RM kekal satu-satunya sumber kebenaran.
  function usdOf(rm) {
    var rate = S.config().currency.usdToRm;
    if (!rm || !rate) return 0;
    return Math.round(rm / rate * 100) / 100;
  }
  function usdMoney(rm) {
    var v = usdOf(rm);
    return v.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
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
    if (entity === 'agent' || entity === 'vendor') {
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
    agent: ['submitApplication', 'resubmitDocument', 'signAgent', 'addReferral', 'createClaim', 'submitClaim',
            'submitVendorForm'],
    usains: ['startReview', 'verifyDocument', 'returnDocument', 'verifyAndForward', 'signUsains',
             'startClaimReview', 'setEligibility', 'forwardClaim', 'returnClaim', 'advanceReferral',
             'verifyVendorPTJ', 'createBatch', 'checkBatch', 'submitBatchToBendahari'],
    leap: ['approve', 'rejectApplication', 'signLeap', 'decideClaim', 'openAnnualReview',
           'renew', 'terminate', 'advanceReferral', 'approveBatch'],
    payment: ['recordPayment', 'issueSupplierCode'],
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
      throw new Error('The ' + S.roleInfo().label + ' role is not permitted to perform this action.');
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
      // Ejen baharu BELUM berdaftar sebagai pembekal Bendahari. Part A diisi
      // awal daripada borang permohonan supaya skrin vendor sedia terisi.
      vendor: SEED.vendorProfile({
        fullName: data.name,
        registrationNo: data.ssm || '—',
        address: data.registeredAddress || '—',
        email: data.officialEmail || '—',
        nationality: data.country || '—',
        contactPerson: data.pic || '—',
        bankAccountHolder: data.name,
        declarationName: data.pic || '—',
        designation: 'Person in Charge (PIC)',
        vendorStatus: 'Not Registered'
      }),
      activities: []
    };
    st.agents.unshift(a);
    st.demoAgentId = a.id;
    logIt('agent', a.id, 'DRAFT', 'SUBMITTED',
      (a.mode === 'renewal' ? 'Renewal' : 'New') + ' application submitted');
    notify('usains', 'New application received',
      a.name + ' (' + a.id + ') is awaiting a document review.', 'usains-console.html', a.id);
    S.save();
    return a;
  }

  function startReview(agentId) {
    guard('startReview');
    var a = S.agent(agentId);
    if (a.appStatus !== 'SUBMITTED') {
      throw new Error('Only applications with status "Submitted" can be opened for review.');
    }
    a.appStatus = 'UNDER_USAINS_REVIEW';
    logIt('agent', a.id, 'SUBMITTED', a.appStatus, 'Document review started');
    S.save();
    return a;
  }

  function verifyDocument(agentId, idx) {
    guard('verifyDocument');
    var a = S.agent(agentId);
    if (a.appStatus === 'SUBMITTED') {
      a.appStatus = 'UNDER_USAINS_REVIEW';
      logIt('agent', a.id, 'SUBMITTED', a.appStatus, 'Document review started');
    }
    a.docs[idx].status = 'VERIFIED';
    a.docs[idx].note = '';
    S.save();
    return a;
  }

  function returnDocument(agentId, idx, reason) {
    guard('returnDocument');
    if (!reason || !reason.trim()) {
      throw new Error('A reason is required when returning a document.');
    }
    var a = S.agent(agentId);
    var from = a.appStatus;
    a.docs[idx].status = 'RETURNED';
    a.docs[idx].note = reason.trim();
    a.appStatus = 'RETURNED_TO_AGENT';
    logIt('agent', a.id, from, a.appStatus,
      'Document returned: ' + a.docs[idx].name + ' — ' + reason.trim());
    notify('agent', 'Document returned for correction',
      a.docs[idx].name + ': ' + reason.trim(), 'application-detail.html?id=' + a.id, a.id);
    S.save();
    return a;
  }

  function resubmitDocument(agentId, idx, note) {
    guard('resubmitDocument');
    var a = S.agent(agentId);
    if (a.docs[idx].status !== 'RETURNED') {
      throw new Error('This document was not returned, so there is nothing to correct.');
    }
    a.docs[idx].status = 'RESUBMITTED';
    a.docs[idx].note = note || 'Document replaced by the agent';
    var stillReturned = false;
    for (var i = 0; i < a.docs.length; i++) {
      if (a.docs[i].status === 'RETURNED') stillReturned = true;
    }
    var from = a.appStatus;
    if (!stillReturned) a.appStatus = 'UNDER_USAINS_REVIEW';
    logIt('agent', a.id, from, a.appStatus, 'Document resubmitted: ' + a.docs[idx].name);
    notify('usains', 'Corrected document received',
      a.name + ' resubmitted ' + a.docs[idx].name + '.', 'usains-console.html', a.id);
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
      throw new Error(out.length + ' document(s) are still unverified. USAINS can only forward once every document is VERIFIED.');
    }
    var from = a.appStatus;
    a.appStatus = 'VERIFIED';
    a.verifiedIso = S.state().nowIso;
    a.verifiedLabel = fmt(a.verifiedIso);
    logIt('agent', a.id, from, a.appStatus, 'Documents verified and forwarded to USM LEAP');
    notify('leap', 'Case awaiting LEAP decision',
      a.name + ' (' + a.id + ') has been verified by USAINS.', 'leap-console.html', a.id);
    S.save();
    return a;
  }

  function approve(agentId) {
    guard('approve');
    var a = S.agent(agentId);
    if (a.appStatus !== 'VERIFIED' && a.appStatus !== 'UNDER_LEAP_REVIEW') {
      throw new Error('LEAP can only approve applications with status VERIFIED.');
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
      'Application approved — agreement draft ' + agr.id + ' generated');
    notify('all', 'Agreement draft generated',
      agr.id + ' for ' + a.name + ' is awaiting signatures from all three parties.',
      'agreement.html?id=' + agr.id, a.id);
    S.save();
    return a;
  }

  function rejectApplication(agentId, reason) {
    guard('rejectApplication');
    if (!reason || !reason.trim()) throw new Error('A reason is required to reject an application.');
    var a = S.agent(agentId);
    var from = a.appStatus;
    a.appStatus = 'REJECTED';
    logIt('agent', a.id, from, a.appStatus, 'Application rejected: ' + reason.trim());
    notify('agent', 'Application rejected', reason.trim(),
      'application-detail.html?id=' + a.id, a.id);
    S.save();
    return a;
  }

  // --- Transisi: perjanjian ---------------------------------------------
  var PARTY_ACTION = { usains: 'signUsains', leap: 'signLeap', agent: 'signAgent' };
  var PARTY_LABEL = { usains: 'USAINS', leap: 'USM LEAP', agent: 'Agent' };

  function signParty(agreementId, party) {
    guard(PARTY_ACTION[party]);
    var agr = S.agreement(agreementId);
    if (!agr) throw new Error('Agreement not found.');
    if (agr.status === 'FULLY_SIGNED') throw new Error('This agreement is already fully signed.');
    if (agr.signatures[party].signed) throw new Error(PARTY_LABEL[party] + ' has already signed.');
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
          'Agreement fully signed — the agent is now ACTIVE');
      }
      notify('all', 'Agent is now ACTIVE',
        (a ? a.name : agr.agentId) + ' can begin referring students.', 'referrals.html', agr.agentId);
    } else {
      agr.status = !agr.signatures.usains.signed ? 'AWAITING_USAINS_SIGNATURE'
        : (!agr.signatures.leap.signed ? 'AWAITING_LEAP_SIGNATURE' : 'AWAITING_AGENT_SIGNATURE');
      notify('all', 'Signature recorded',
        PARTY_LABEL[party] + ' signed ' + agr.id + '.',
        'agreement.html?id=' + agr.id, agr.agentId);
    }
    logIt('agreement', agr.id, from, agr.status,
      PARTY_LABEL[party] + ' signature recorded (demo status only, not a valid e-signature)');
    S.save();
    return agr;
  }

  // --- Transisi: rujukan pelajar ----------------------------------------
  function addReferral(agentId, data) {
    guard('addReferral');
    var a = S.agent(agentId);
    if (a.agentStatus !== 'ACTIVE' && a.agentStatus !== 'RENEWED') {
      throw new Error('Only agents with ACTIVE status can create student referrals.');
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
    logIt('referral', ref.refId, '—', 'SUBMITTED', 'New student referral: ' + ref.name);
    notify('usains', 'New student referral',
      a.name + ' referred ' + ref.name + ' (' + ref.program + ').', 'referrals.html', a.id);
    S.save();
    return ref;
  }

  var REF_FLOW = ['SUBMITTED', 'OFFERED', 'ENROLLED', 'FEES_PAID'];
  function advanceReferral(refId) {
    guard('advanceReferral');
    var ref = S.referral(refId);
    if (!ref) throw new Error('Referral not found.');
    var i = REF_FLOW.indexOf(ref.refStatus);
    if (i < 0 || i >= REF_FLOW.length - 1) throw new Error('This referral is already at the final stage.');
    var from = ref.refStatus;
    ref.refStatus = REF_FLOW[i + 1];
    ref.status = ({ SUBMITTED: 'Submitted', OFFERED: 'Offered', ENROLLED: 'Enrolled', FEES_PAID: 'Fees Paid' })[ref.refStatus];
    logIt('referral', ref.refId, from, ref.refStatus,
      'Referral status updated by an authorised officer (' + ref.name + ')');
    S.save();
    return ref;
  }

  // --- Transisi: tuntutan komisen ---------------------------------------
  function createClaim(agentId, refId) {
    guard('createClaim');
    var a = S.agent(agentId);
    var ref = S.referral(refId);
    if (!ref) throw new Error('Referral not found.');
    if (ref.refStatus !== 'FEES_PAID') {
      throw new Error('A claim can only be built for referrals with status "Fees paid".');
    }
    var existing = S.claims();
    for (var i = 0; i < existing.length; i++) {
      if (existing[i].refId === ref.refId) throw new Error('This referral already has a claim (' + existing[i].id + ').');
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
    logIt('claim', c.id, '—', 'DRAFT', 'Claim draft built for ' + ref.name);
    S.save();
    return c;
  }

  function submitClaim(claimId) {
    guard('submitClaim');
    var c = S.claim(claimId);
    if (c.claimStatus !== 'DRAFT' && c.claimStatus !== 'RETURNED') {
      throw new Error('Only Draft or Returned claims can be submitted.');
    }
    var st = S.state();
    var from = c.claimStatus;
    c.claimStatus = 'SUBMITTED';
    c.submittedIso = st.nowIso;
    c.submittedLabel = fmt(st.nowIso);
    c.deadlineIso = addDays(st.nowIso, st.config.sla.claimDecisionDays);
    c.deadlineLabel = fmt(c.deadlineIso);
    c.rateSnapshot = ratePercent(c.level);
    logIt('claim', c.id, from, c.claimStatus, 'Claim submitted — RM ' + money(commissionOf(c)));
    notify('usains', 'New commission claim',
      c.id + ' (' + c.student + ') is awaiting an eligibility review.', 'claims.html', c.agentId);
    S.save();
    return c;
  }

  function startClaimReview(claimId) {
    guard('startClaimReview');
    var c = S.claim(claimId);
    if (c.claimStatus !== 'SUBMITTED') {
      throw new Error('Only claims with status "Submitted" can be opened for review.');
    }
    c.claimStatus = 'UNDER_USAINS_REVIEW';
    logIt('claim', c.id, 'SUBMITTED', c.claimStatus, 'Eligibility review started');
    S.save();
    return c;
  }

  function setEligibility(claimId, idx, value) {
    guard('setEligibility');
    var c = S.claim(claimId);
    if (c.claimStatus === 'SUBMITTED') {
      c.claimStatus = 'UNDER_USAINS_REVIEW';
      logIt('claim', c.id, 'SUBMITTED', c.claimStatus, 'Eligibility review started');
    }
    if (c.claimStatus !== 'UNDER_USAINS_REVIEW') {
      throw new Error('Eligibility conditions can only be reviewed during the USAINS review stage.');
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
        throw new Error('Eligibility condition #' + (i + 1) + ' is not yet confirmed: ' + SEED.ELIGIBILITY_LABELS[i]);
      }
    }
    var from = c.claimStatus;
    c.claimStatus = 'PENDING_LEAP_DECISION';
    logIt('claim', c.id, from, c.claimStatus,
      'All 5 eligibility conditions confirmed — sent for LEAP decision');
    notify('leap', 'Claim awaiting decision',
      c.id + ' (' + c.student + ') — RM ' + money(commissionOf(c)), 'claims.html', c.agentId);
    S.save();
    return c;
  }

  function returnClaim(claimId, reason) {
    guard('returnClaim');
    if (!reason || !reason.trim()) throw new Error('A reason is required to return a claim.');
    var c = S.claim(claimId);
    var from = c.claimStatus;
    c.claimStatus = 'RETURNED';
    c.returnReason = reason.trim();
    logIt('claim', c.id, from, c.claimStatus, 'Claim returned: ' + reason.trim());
    notify('agent', 'Claim returned', c.id + ': ' + reason.trim(), 'claims.html', c.agentId);
    S.save();
    return c;
  }

  function decideClaim(claimId, decision, reason) {
    guard('decideClaim');
    var c = S.claim(claimId);
    if (c.claimStatus !== 'PENDING_LEAP_DECISION') {
      throw new Error('This claim has not yet reached the LEAP decision stage.');
    }
    var from = c.claimStatus;
    if (decision === 'reject') {
      if (!reason || !reason.trim()) throw new Error('A reason is required to reject a claim.');
      c.claimStatus = 'REJECTED';
      c.decision = 'Rejected';
      c.decisionReason = reason.trim();
      logIt('claim', c.id, from, c.claimStatus, 'Claim rejected: ' + reason.trim());
      notify('agent', 'Claim rejected', c.id + ': ' + reason.trim(), 'claims.html', c.agentId);
    } else {
      c.claimStatus = 'APPROVED_PENDING_PAYMENT';
      c.decision = 'Approved';
      logIt('claim', c.id, from, c.claimStatus, 'Claim approved — awaiting payment record');
      notify('payment', 'Claim ready for payment',
        c.id + ' — RM ' + money(commissionOf(c)), 'claims.html', c.agentId);
    }
    S.save();
    return c;
  }

  function recordPayment(claimId, data) {
    guard('recordPayment');
    var c = S.claim(claimId);
    if (c.claimStatus !== 'APPROVED_PENDING_PAYMENT') {
      throw new Error('Payment can only be recorded after the claim is APPROVED.');
    }
    // R-1: tiada Kod Pembekal Bendahari = tiada bayaran.
    var payee = S.agent(c.agentId);
    var pv = payee && payee.vendor;
    if (!pv || pv.vendorStatus !== 'Registered' || !pv.supplierCode) {
      throw new Error('Payment is blocked: ' + (payee ? payee.name : c.agentId)
        + ' has no Bursary Supplier Code. Complete the vendor registration form '
        + '(USM.FIS.AP.B.2023.01) first.');
    }
    if (!data || !data.reference || !String(data.reference).trim()) {
      throw new Error('A payment reference is required.');
    }
    if (!data.amount) throw new Error('A payment amount is required.');
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
      'Payment recorded: RM ' + money(c.payment.amount) + ' · Ref ' + c.payment.reference);
    notify('agent', 'Claim has been paid',
      c.id + ' — RM ' + money(c.payment.amount) + ' (Ref ' + c.payment.reference + ')',
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
      throw new Error('Annual review applies to active agents only.');
    }
    var from = a.agentStatus;
    a.agentStatus = 'REVIEW_DUE';
    a.typeLabel = 'Active · Annual Review';
    logIt('agent', a.id, from, a.agentStatus,
      'Annual review opened — ' + referralCountThisYear(a.id) +
      ' referrals vs a threshold of ' + S.config().renewal.minReferralsPerYear);
    notify('leap', 'Annual review opened',
      a.name + ' needs a renew/terminate decision.', 'annual-review.html', a.id);
    S.save();
    return a;
  }

  function renew(agentId, note) {
    guard('renew');
    var a = S.agent(agentId);
    if (a.agentStatus !== 'REVIEW_DUE') {
      throw new Error('Only agents under annual review can be renewed.');
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
      'Renewed until ' + fmt(newEnd) + (note ? ' — ' + note : ''));
    notify('agent', 'Renewal approved',
      'The agreement has been extended until ' + fmt(newEnd) + '.', 'annual-review.html', a.id);
    S.save();
    return a;
  }

  function terminate(agentId, reason) {
    guard('terminate');
    if (!reason || !reason.trim()) throw new Error('A reason is required to terminate an agreement.');
    var a = S.agent(agentId);
    var from = a.agentStatus;
    a.agentStatus = 'TERMINATED';
    a.typeLabel = 'Terminated';
    logIt('agent', a.id, from, a.agentStatus, 'Terminated: ' + reason.trim());
    notify('agent', 'Agreement terminated', reason.trim(), 'annual-review.html', a.id);
    S.save();
    return a;
  }

  // --- Transisi: pendaftaran vendor (USM.FIS.AP.B.2023.01) ---------------
  function vendorOf(a) { return (a && a.vendor) || null; }

  function isVendorRegistered(a) {
    var v = vendorOf(a);
    return !!(v && v.vendorStatus === 'Registered' && v.supplierCode);
  }

  // Seksyen 1 (Part A/B/C) dihantar oleh ejen.
  function submitVendorForm(agentId, data) {
    guard('submitVendorForm');
    var a = S.agent(agentId);
    if (!a) throw new Error('Agent not found.');
    // R-3
    if (a.agentStatus !== 'ACTIVE' && a.agentStatus !== 'RENEWED') {
      throw new Error('Only ACTIVE agents can submit the vendor registration form.');
    }
    if (a.vendor && a.vendor.vendorStatus === 'Registered') {
      throw new Error('This agent already holds a Bursary Supplier Code.');
    }
    data = data || {};
    if (!String(data.bankAccountNo || '').trim()) {
      throw new Error('Bank Account No. is required in Part B.');
    }
    if (!String(data.bankName || '').trim()) {
      throw new Error('Bank Full Name is required in Part B.');
    }
    if (!data.declarationAccepted) {
      throw new Error('The Part C declaration must be accepted before submitting.');
    }
    var st = S.state();
    var v = a.vendor || (a.vendor = SEED.vendorProfile());
    var from = v.vendorStatus;
    var keys = ['fullName', 'registrationNo', 'address', 'phoneMalaysia', 'phoneOrigin',
      'email', 'nationality', 'contactPerson', 'bankAccountHolder', 'bankName',
      'bankAccountNo', 'bankAddress', 'swiftCode', 'bankBranch', 'routingNumber',
      'ibanNumber', 'bsbCode', 'ifscCode', 'declarationName', 'declarationIdNo',
      'designation'];
    for (var i = 0; i < keys.length; i++) {
      if (data[keys[i]] != null && String(data[keys[i]]).trim() !== '') v[keys[i]] = data[keys[i]];
    }
    v.declarationSigned = true;
    v.declarationDateLabel = fmt(st.nowIso);
    v.vendorStatus = 'Pending';
    logIt('vendor', a.id, from, v.vendorStatus,
      'Vendor registration form submitted (USM.FIS.AP.B.2023.01)');
    notify('usains', 'Vendor registration submitted',
      a.name + ' submitted the non-trade vendor form for PTJ verification.',
      'vendor-registration.html?id=' + a.id, a.id);
    S.save();
    return a;
  }

  // Seksyen 2 disahkan oleh PTJ (USAINS).
  function verifyVendorPTJ(agentId) {
    guard('verifyVendorPTJ');
    var a = S.agent(agentId);
    var v = vendorOf(a);
    if (!v) throw new Error('Agent not found.');
    if (v.vendorStatus !== 'Pending') {
      throw new Error('Section 2 can only be completed once the agent has submitted Section 1.');
    }
    if (v.ptjVerified) throw new Error('Section 2 has already been completed.');
    var st = S.state();
    var info = S.roleInfo();
    v.ptjVerified = true;
    v.ptjPurpose = 'Recruitment agent commission payment';
    v.ptjApplicantName = info.person;
    v.ptjGrade = info.title;
    v.ptjEmail = info.person.toLowerCase().replace(/[^a-z]+/g, '.') + '@usains.demo';
    v.ptjDateLabel = fmt(st.nowIso);
    logIt('vendor', a.id, 'Pending', 'Pending',
      'Section 2 verified by PTJ — forwarded to the Bursary');
    notify('payment', 'Vendor form ready for Supplier Code',
      a.name + ' passed PTJ verification and is awaiting a Supplier Code.',
      'vendor-registration.html?id=' + a.id, a.id);
    S.save();
    return a;
  }

  // Seksyen 3 — Bendahari mengeluarkan Kod Pembekal.
  function issueSupplierCode(agentId, code) {
    guard('issueSupplierCode');
    var a = S.agent(agentId);
    var v = vendorOf(a);
    if (!v) throw new Error('Agent not found.');
    if (v.vendorStatus === 'Registered') throw new Error('A Supplier Code has already been issued.');
    if (v.vendorStatus !== 'Pending') {
      throw new Error('The agent must submit the vendor registration form first.');
    }
    // R-2
    if (!v.ptjVerified) {
      throw new Error('Section 2 (PTJ verification) must be completed before the Bursary can issue a Supplier Code.');
    }
    var st = S.state();
    var info = S.roleInfo();
    code = String(code || '').trim();
    if (!code) code = S.nextId('vendor', 'NT-' + toDate(st.nowIso).getFullYear() + '-');
    v.supplierCode = code;
    v.supplierCategory = 'NONTRADE';
    v.processedBy = info.person;
    v.verifiedBy = 'Haslina Mohd Yusof';
    v.issuedDateLabel = fmt(st.nowIso);
    v.vendorStatus = 'Registered';
    logIt('vendor', a.id, 'Pending', 'Registered',
      'Supplier Code ' + code + ' issued by the Bursary');
    notify('all', 'Supplier Code issued',
      a.name + ' is now a registered non-trade vendor (' + code + ').',
      'vendor-registration.html?id=' + a.id, a.id);
    S.save();
    return a;
  }

  // --- Transisi: batch tuntutan Bendahari --------------------------------
  var BATCH_READY = { APPROVED_PENDING_PAYMENT: 1, PAID: 1 };

  function batchClaims(b) {
    var out = [];
    if (!b) return out;
    for (var i = 0; i < b.claimIds.length; i++) {
      var c = S.claim(b.claimIds[i]);
      if (c) out.push(c);
    }
    return out;
  }

  // Jumlah DIKIRA, tidak disimpan.
  function batchTotals(b) {
    var list = batchClaims(b), rm = 0;
    for (var i = 0; i < list.length; i++) rm += (list[i].firstYearFee || 0);
    return { count: list.length, feeRm: rm, feeUsd: usdOf(rm) };
  }

  // Tuntutan yang layak dimasukkan ke batch baharu bagi satu ejen.
  function batchableClaims(agentId) {
    var all = S.claims(), out = [];
    for (var i = 0; i < all.length; i++) {
      var c = all[i];
      if (c.agentId !== agentId) continue;
      if (c.batchId) continue;
      if (!BATCH_READY[c.claimStatus]) continue;
      out.push(c);
    }
    return out;
  }

  function createBatch(agentId, claimIds) {
    guard('createBatch');
    var a = S.agent(agentId);
    if (!a) throw new Error('Agent not found.');
    if (!claimIds || !claimIds.length) {
      throw new Error('Select at least one claim to build a batch.');
    }
    var st = S.state();
    var picked = [];
    for (var i = 0; i < claimIds.length; i++) {
      var c = S.claim(claimIds[i]);
      if (!c) throw new Error('Claim ' + claimIds[i] + ' not found.');
      // R-4
      if (c.agentId !== agentId) {
        throw new Error('A batch may only contain claims from one agent — ' + c.id
          + ' belongs to a different agent.');
      }
      if (!BATCH_READY[c.claimStatus]) {
        throw new Error(c.id + ' has not passed the USM LEAP decision yet.');
      }
      // R-5
      if (c.batchId) throw new Error(c.id + ' is already in batch ' + c.batchId + '.');
      picked.push(c);
    }
    var seq = st.batches.length + 1;
    var num = String(seq);
    while (num.length < 3) num = '0' + num;
    var months = st.config.bendahari.batchPeriodMonths;
    var b = {
      id: S.nextId('batch', 'BAT-'),
      batchNo: 'BND/' + toDate(st.nowIso).getFullYear() + '/' + num,
      agentId: a.id,
      periodFromLabel: monthLabel(addMonths(st.nowIso, -(months - 1))),
      periodToLabel: monthLabel(st.nowIso),
      claimIds: [],
      batchStatus: 'DRAFT',
      preparedBy: S.roleInfo().person + ' (' + S.roleInfo().label + ')',
      checkedBy: { name: '—', designation: '—', dateLabel: '—' },
      approvedBy: { name: '—', designation: '—', dateLabel: '—' },
      createdIso: st.nowIso, submittedIso: null,
      isDemoCreated: true
    };
    for (var k = 0; k < picked.length; k++) {
      picked[k].batchId = b.id;
      b.claimIds.push(picked[k].id);
    }
    st.batches.unshift(b);
    logIt('batch', b.id, '—', 'DRAFT',
      'Bursary claim batch built for ' + a.name + ' — ' + b.claimIds.length + ' claim(s)');
    notify('usains', 'Claim batch created',
      b.batchNo + ' (' + a.name + ') is ready for checking.', 'claim-batch.html?id=' + b.id, a.id);
    S.save();
    return b;
  }

  // Sign-off "Reviewed By" — USAINS.
  function checkBatch(batchId) {
    guard('checkBatch');
    var b = S.batch(batchId);
    if (!b) throw new Error('Batch not found.');
    if (b.batchStatus !== 'DRAFT') throw new Error('Only a Draft batch can be checked.');
    if (!b.claimIds.length) throw new Error('An empty batch cannot be checked.');
    var st = S.state(), info = S.roleInfo();
    b.checkedBy = { name: info.person, designation: info.title + ', ' + info.label, dateLabel: fmt(st.nowIso) };
    b.batchStatus = 'CHECKED';
    logIt('batch', b.id, 'DRAFT', b.batchStatus, 'Batch checked by USAINS (Reviewed By)');
    notify('leap', 'Claim batch awaiting approval',
      b.batchNo + ' has been checked and needs USM LEAP approval.',
      'claim-batch.html?id=' + b.id, b.agentId);
    S.save();
    return b;
  }

  // Sign-off "Approved By" — USM LEAP. R-6: mesti selepas checkBatch.
  function approveBatch(batchId) {
    guard('approveBatch');
    var b = S.batch(batchId);
    if (!b) throw new Error('Batch not found.');
    if (b.batchStatus === 'DRAFT') {
      throw new Error('USAINS must check this batch before USM LEAP can approve it.');
    }
    if (b.batchStatus !== 'CHECKED') throw new Error('Only a Checked batch can be approved.');
    var st = S.state(), info = S.roleInfo();
    b.approvedBy = { name: info.person, designation: info.title + ', ' + info.label, dateLabel: fmt(st.nowIso) };
    b.batchStatus = 'APPROVED';
    logIt('batch', b.id, 'CHECKED', b.batchStatus, 'Batch approved by USM LEAP (Approved By)');
    notify('usains', 'Claim batch approved',
      b.batchNo + ' is approved and ready to submit to the Bursary.',
      'claim-batch.html?id=' + b.id, b.agentId);
    S.save();
    return b;
  }

  function submitBatchToBendahari(batchId) {
    guard('submitBatchToBendahari');
    var b = S.batch(batchId);
    if (!b) throw new Error('Batch not found.');
    if (b.batchStatus !== 'APPROVED') {
      throw new Error('Only an Approved batch can be submitted to the Bursary.');
    }
    var st = S.state();
    b.batchStatus = 'SUBMITTED_TO_BENDAHARI';
    b.submittedIso = st.nowIso;
    logIt('batch', b.id, 'APPROVED', b.batchStatus,
      'Batch submitted to the Bursary in the prescribed format');
    notify('payment', 'Claim batch received from USAINS',
      b.batchNo + ' has been submitted to the Bursary for payment.',
      'claim-batch.html?id=' + b.id, b.agentId);
    S.save();
    return b;
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
    BATCH_LABEL: BATCH_LABEL, VENDOR_LABEL: VENDOR_LABEL,
    monthLabel: monthLabel, addMonths: addMonths,
    usdOf: usdOf, usdMoney: usdMoney,
    isVendorRegistered: isVendorRegistered,
    submitVendorForm: submitVendorForm, verifyVendorPTJ: verifyVendorPTJ,
    issueSupplierCode: issueSupplierCode,
    batchClaims: batchClaims, batchTotals: batchTotals, batchableClaims: batchableClaims,
    createBatch: createBatch, checkBatch: checkBatch,
    approveBatch: approveBatch, submitBatchToBendahari: submitBatchToBendahari,
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

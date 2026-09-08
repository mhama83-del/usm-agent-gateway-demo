/* dashboard.js — Dashboard mengikut peranan: KPI, langkah seterusnya,
   baris gilir tindakan, notifikasi dan log aktiviti. */
(function (root) {
  'use strict';
  var NS = root.USMDEMO;

  function link(text, page, params, cls) {
    var q = (params && params.id) ? ('?id=' + encodeURIComponent(params.id)) : '';
    return '<a class="btn btn-sm ' + (cls || 'btn-usm') + '" href="' + page + '.html' + q + '">'
      + text + '</a>';
  }

  // Satu ayat: apa yang peranan ini patut buat sekarang.
  function nextStepFor(ctx) {
    var S = ctx.S;
    var role = S.role();
    var a = S.currentAgent();
    var agents = S.agents();
    var claims = S.claims();
    var i;

    if (role === 'agent') {
      if (!a || a.appStatus === 'REJECTED') {
        return { t: 'Submit a new agent application', d: '4-step wizard: company → PIC → documents → ABC declaration.', b: link('Open application wizard', 'application-wizard') };
      }
      if (a.appStatus === 'RETURNED_TO_AGENT') {
        return { t: 'USAINS returned a document — correct it now', d: 'Open the file and resubmit the flagged document.', b: link('Open application file', 'application-detail', { id: a.id }) };
      }
      var agr = S.agreementForAgent(a.id);
      if (agr && agr.status !== 'FULLY_SIGNED' && !agr.signatures.agent.signed) {
        return { t: 'Sign your agreement', d: 'The agent becomes ACTIVE once all three parties have signed.', b: link('Open agreement', 'agreement', { id: agr.id }) };
      }
      if (a.agentStatus === 'ACTIVE' || a.agentStatus === 'RENEWED') {
        for (i = 0; i < claims.length; i++) {
          if (claims[i].agentId === a.id && ['DRAFT', 'RETURNED'].indexOf(claims[i].claimStatus) >= 0) {
            return { t: 'Submit claim ' + claims[i].id, d: 'The claim draft is ready to send to USAINS.', b: link('Open claim', 'claims', { id: claims[i].id }) };
          }
        }
        return { t: 'Refer a new student, or build a commission claim', d: 'A claim can only be built once a referral reaches "Fees paid".', b: link('Open student referrals', 'referrals') };
      }
      return { t: 'Awaiting action from USM', d: 'Current status: ' + (ctx.W.APP_LABEL[a.appStatus] || a.appStatus) + '.', b: link('Open application file', 'application-detail', { id: a.id }) };
    }

    if (role === 'usains') {
      for (i = 0; i < agents.length; i++) {
        if (['SUBMITTED', 'UNDER_USAINS_REVIEW'].indexOf(agents[i].appStatus) >= 0) {
          return { t: 'Review documents: ' + agents[i].name, d: 'Verify each document, or return one with a reason.', b: link('Open USAINS console', 'usains-console') };
        }
      }
      for (i = 0; i < claims.length; i++) {
        if (['SUBMITTED', 'UNDER_USAINS_REVIEW'].indexOf(claims[i].claimStatus) >= 0) {
          return { t: 'Review eligibility for claim ' + claims[i].id, d: 'All 5 eligibility conditions must be confirmed before forwarding.', b: link('Open claim', 'claims', { id: claims[i].id }) };
        }
      }
      return { t: 'No cases awaiting USAINS review', d: 'The queue is empty for now.', b: link('Open USAINS console', 'usains-console', null, 'btn-outline-usm') };
    }

    if (role === 'leap') {
      for (i = 0; i < agents.length; i++) {
        if (agents[i].appStatus === 'VERIFIED') {
          return { t: 'Approval decision: ' + agents[i].name, d: 'Approving automatically generates an agreement draft.', b: link('Open LEAP console', 'leap-console') };
        }
      }
      for (i = 0; i < claims.length; i++) {
        if (claims[i].claimStatus === 'PENDING_LEAP_DECISION') {
          return { t: 'Decision on claim ' + claims[i].id, d: 'Approve or reject; a rejection requires a written reason.', b: link('Open claim', 'claims', { id: claims[i].id }) };
        }
      }
      for (i = 0; i < agents.length; i++) {
        if (agents[i].agentStatus === 'REVIEW_DUE') {
          return { t: 'Annual review: ' + agents[i].name, d: 'Review referral performance, then renew or terminate.', b: link('Open annual review', 'annual-review') };
        }
      }
      return { t: 'No cases awaiting a LEAP decision', d: 'The queue is empty for now.', b: link('Open LEAP console', 'leap-console', null, 'btn-outline-usm') };
    }

    if (role === 'payment') {
      for (i = 0; i < claims.length; i++) {
        if (claims[i].claimStatus === 'APPROVED_PENDING_PAYMENT') {
          return { t: 'Record payment for ' + claims[i].id + ' — ' + ctx.App.money(ctx.W.commissionOf(claims[i])),
            d: 'The amount, date and transaction reference must be recorded.', b: link('Open claim', 'claims', { id: claims[i].id }) };
        }
      }
      return { t: 'No claims awaiting payment', d: 'Payment can only be recorded after LEAP approves a claim.', b: link('Open claims', 'claims', null, 'btn-outline-usm') };
    }

    return { t: 'Super Admin — every screen and action is open',
      d: 'Use this role to jump to any part of the demo.',
      b: link('Open Settings (DRAFT)', 'settings-draft', null, 'btn-outline-usm') };
  }

  NS.App.register('dashboard', function (ctx) {
    var S = ctx.S, W = ctx.W, C = ctx.C, App = ctx.App;
    var agents = S.agents(), claims = S.claims();
    var role = S.role();
    var cfg = S.config();
    var i, a, c;

    // --- KPI ---
    var nActive = 0, nPending = 0, nOverdue = 0, nReview = 0;
    var claimValue = 0, nClaimOpen = 0, paidValue = 0;
    for (i = 0; i < agents.length; i++) {
      a = agents[i];
      if (a.agentStatus === 'ACTIVE' || a.agentStatus === 'RENEWED') nActive++;
      if (a.agentStatus === 'PENDING') nPending++;
      if (W.slaOf(a) === 'late') nOverdue++;
      if (a.agentStatus === 'REVIEW_DUE') nReview++;
    }
    for (i = 0; i < claims.length; i++) {
      c = claims[i];
      if (c.claimStatus === 'PAID') { paidValue += W.commissionOf(c); continue; }
      if (['REJECTED', 'DRAFT', 'CANCELLED'].indexOf(c.claimStatus) < 0) {
        nClaimOpen++;
        claimValue += W.commissionOf(c);
      }
    }

    var kpis = '<div class="row g-3 mb-3">'
      + C.kpi('Active agents', nActive, nReview + ' under annual review')
      + C.kpi('Applications in progress', nPending,
          nOverdue ? '<span class="text-danger fw-semibold">' + nOverdue + ' past SLA</span>' : 'All within SLA')
      + C.kpi('Open claims', nClaimOpen,
          App.money(claimValue) + C.draf('Amount computed from the DRAFT rate') + C.snapMark())
      + C.kpi('Paid', App.money(paidValue).replace('RM ', 'RM<span class="fs-6">&nbsp;</span>'),
          'Manual payment records only')
      + '</div>';

    // --- Langkah seterusnya ---
    var next = nextStepFor(ctx);
    var nextCard = '<div class="card card-accent mb-3">'
      + '<div class="card-body d-flex justify-content-between align-items-center flex-wrap gap-3">'
      + '<div><div class="breadcrumb-mini mb-1">Next step for ' + C.esc(S.roleInfo().label) + '</div>'
      + '<div class="fw-semibold">' + C.esc(next.t) + '</div>'
      + '<div class="small text-muted">' + C.esc(next.d) + '</div></div>'
      + '<div>' + next.b + '</div></div></div>';

    // --- Senarai ejen ---
    var rows = [];
    for (i = 0; i < agents.length; i++) {
      a = agents[i];
      if (role === 'agent' && a.id !== (S.currentAgent() || {}).id) continue;
      rows.push([
        '<a href="application-detail.html?id=' + C.esc(a.id) + '" class="fw-semibold">' + C.esc(a.id) + '</a>'
          + (a.isDemoCreated ? '<div><span class="badge bg-warning text-dark mt-1">NEW IN DEMO</span></div>' : ''),
        '<div class="fw-semibold">' + C.esc(a.name) + '</div>'
          + '<div class="small text-muted">' + C.esc(a.country) + ' · ' + C.esc(a.typeLabel) + '</div>',
        C.statusBadge(a.appStatus, W.APP_LABEL[a.appStatus] || a.appStatus)
          + '<div class="mt-1">' + C.statusBadge(a.agentStatus, W.AGENT_LABEL[a.agentStatus] || a.agentStatus) + '</div>',
        '<span class="badge bg-light text-dark border">' + W.stageOf(a) + ' / 5</span>'
          + '<div class="small text-muted">' + C.esc(NS.SEED.STAGE_LABELS[W.stageOf(a) - 1]) + '</div>',
        C.slaChipForAgent(a),
        C.esc(a.expiryLabel || '—')
      ]);
    }
    var agentTable = C.card('Agents &amp; applications <span class="badge bg-light text-dark border ms-1">' + rows.length + '</span>',
      C.table(['ID', 'Agent', 'Status', 'Stage', 'SLA', 'Expiry'], rows,
        { empty: 'No agents for this role.' }));

    // --- Notifikasi peranan ---
    var notes = C.topbar.visibleNotifications(), notifHtml = '';
    for (i = 0; i < Math.min(notes.length, 4); i++) {
      var nt = notes[i];
      notifHtml += '<div class="usm-doc-row">'
        + '<div class="small fw-semibold">' + C.esc(nt.title)
        + (nt.read ? '' : ' <span class="badge bg-danger">new</span>') + '</div>'
        + '<div class="small text-muted">' + C.esc(nt.body) + '</div>'
        + '<div class="small text-muted">' + C.esc(nt.timeLabel)
        + (nt.link ? ' · <a href="' + C.esc(nt.link) + '">Open</a>' : '') + '</div>'
        + '</div>';
    }
    var notifCard = C.card('Notifications (UI only)',
      notifHtml || C.emptyState('No notifications for this role.'),
      { right: '<span class="small text-muted">No real e-mail or SMS</span>' });

    // --- Log aktiviti ---
    var log = S.log(), logHtml = '';
    for (i = 0; i < Math.min(log.length, 6); i++) {
      var l = log[i];
      logHtml += '<div class="usm-log-item">'
        + '<div class="small"><strong>' + C.esc(l.actor) + '</strong> · '
        + '<span class="font-monospace">' + C.esc(l.entityId) + '</span></div>'
        + '<div class="small">' + C.esc(l.note) + '</div>'
        + '<small>' + C.esc(l.tsLabel) + ' · ' + C.esc(l.from) + ' → ' + C.esc(l.to) + '</small>'
        + '</div>';
    }
    var logCard = C.card('Recent activity log', logHtml || C.emptyState('No activity.'));

    ctx.host.innerHTML =
      App.pageTitle('Dashboard',
        C.esc(S.roleInfo().person) + ' · ' + C.esc(S.roleInfo().title)
        + ' · Performance threshold ' + cfg.renewal.minReferralsPerYear + ' referrals/year '
        + C.draf('Referral threshold for renewal — DRAFT'),
        '', 'Active role: ' + C.esc(S.roleInfo().label))
      + kpis + nextCard
      + '<div class="row g-3">'
      + '<div class="col-lg-8">' + agentTable + '</div>'
      + '<div class="col-lg-4">' + notifCard + logCard + '</div>'
      + '</div>';
  });
})(window);

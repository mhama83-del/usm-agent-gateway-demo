/* leap-console.js — Baris gilir keputusan USM LEAP: kelulusan permohonan,
   keputusan tuntutan, dan annual review terbuka. */
(function (root) {
  'use strict';
  var NS = root.USMDEMO;

  NS.App.register('leap-console', function (ctx) {
    var S = ctx.S, W = ctx.W, C = ctx.C, App = ctx.App;
    var SLA_ORDER = { late: 0, warning: 1, ok: 2 };

    function render() {
      var agents = S.agents().slice(), claims = S.claims().slice();
      var cfg = S.config();
      var i, a, c;

      agents.sort(function (x, y) { return SLA_ORDER[W.slaOf(x)] - SLA_ORDER[W.slaOf(y)]; });

      var rows = [];
      for (i = 0; i < agents.length; i++) {
        a = agents[i];
        if (['VERIFIED', 'UNDER_LEAP_REVIEW'].indexOf(a.appStatus) < 0) continue;
        rows.push([
          '<a href="application-detail.html?id=' + C.esc(a.id) + '" class="fw-semibold">' + C.esc(a.id) + '</a>',
          '<div class="fw-semibold">' + C.esc(a.name) + '</div>'
            + '<div class="small text-muted">' + C.esc(a.country) + ' · ' + C.esc(a.typeLabel) + '</div>',
          '<div>' + C.esc(a.verifiedLabel || a.submittedLabel) + '</div>'
            + '<div class="small text-success">9 / 9 documents verified</div>',
          C.slaChipForAgent(a),
          '<button class="btn btn-sm btn-usm" data-action="approve" data-id="' + C.esc(a.id) + '">Approve</button> '
            + '<button class="btn btn-sm btn-outline-danger mt-1 mt-md-0" data-action="reject" data-id="' + C.esc(a.id) + '">Reject</button>'
        ]);
      }

      var claimRows = [];
      for (i = 0; i < claims.length; i++) {
        c = claims[i];
        if (c.claimStatus !== 'PENDING_LEAP_DECISION') continue;
        var ag = S.agent(c.agentId);
        claimRows.push([
          '<span class="fw-semibold">' + C.esc(c.id) + '</span>',
          '<div class="fw-semibold">' + C.esc(c.student) + '</div>'
            + '<div class="small text-muted">' + C.esc(ag ? ag.name : c.agentId) + ' · ' + C.esc(c.level) + '</div>',
          C.amountWithNotes(App.money(W.commissionOf(c)), c.level, W.ratePercent(c.level), c.rateSnapshot),
          '<span class="badge bg-success">5 / 5</span><div class="small text-muted">confirmed by USAINS</div>',
          C.slaChipForClaim(c),
          '<button class="btn btn-sm btn-usm" data-action="claim-approve" data-id="' + C.esc(c.id) + '">Approve</button> '
            + '<button class="btn btn-sm btn-outline-danger mt-1 mt-md-0" data-action="claim-reject" data-id="' + C.esc(c.id) + '">Reject</button>'
        ]);
      }

      var reviewRows = [];
      for (i = 0; i < agents.length; i++) {
        a = agents[i];
        if (a.agentStatus !== 'REVIEW_DUE') continue;
        var refs = W.referralCountThisYear(a.id);
        var below = refs < cfg.renewal.minReferralsPerYear;
        reviewRows.push([
          '<span class="fw-semibold">' + C.esc(a.id) + '</span>',
          '<div class="fw-semibold">' + C.esc(a.name) + '</div>'
            + '<div class="small text-muted">' + C.esc(a.country) + '</div>',
          '<span class="' + (below ? 'text-danger fw-semibold' : 'text-success fw-semibold') + '">' + refs + '</span>'
            + ' / ' + cfg.renewal.minReferralsPerYear + C.draf('Referral threshold for renewal — DRAFT')
            + (below ? '<div class="small text-danger">Below threshold</div>' : ''),
          C.esc(a.expiryLabel || '—'),
          '<a class="btn btn-sm btn-usm" href="annual-review.html?id=' + C.esc(a.id) + '">Open review</a>'
        ]);
      }

      var total = rows.length + claimRows.length + reviewRows.length;
      var banner = total
        ? '<div class="alert alert-light border small"><strong>' + total + ' case(s) awaiting your decision.</strong> '
          + 'A rejection at any stage requires a written reason (specification §15.5).</div>'
        : '<div class="alert alert-success small">No cases awaiting a USM LEAP decision.</div>';

      ctx.host.innerHTML =
        App.pageTitle('USM LEAP Console',
          'Application approvals, claim decisions and annual reviews. '
          + 'LEAP decision SLA: ' + cfg.sla.leapDecisionDays + ' calendar days '
          + C.draf('LEAP decision SLA — DRAFT'),
          '', 'USM LEAP')
        + banner
        + C.card('Applications awaiting a decision <span class="badge bg-light text-dark border ms-1">' + rows.length + '</span>',
            C.table(['ID', 'Agent', 'Verified by USAINS', 'SLA', 'Action'], rows,
              { empty: 'No applications awaiting a LEAP decision.' }),
            { right: '<span class="small text-muted">Approving generates an agreement draft</span>' })
        + C.card('Claims awaiting a decision <span class="badge bg-light text-dark border ms-1">' + claimRows.length + '</span>',
            C.table(['ID', 'Student', 'Amount', 'Eligibility', 'SLA', 'Action'], claimRows,
              { empty: 'No claims awaiting a decision.' }))
        + C.card('Open annual reviews <span class="badge bg-light text-dark border ms-1">' + reviewRows.length + '</span>',
            C.table(['ID', 'Agent', 'Referrals this year', 'Expiry', 'Action'], reviewRows,
              { empty: 'No open annual reviews.' }));
    }

    App.onAction(ctx.host, function (action, el) {
      var id = el.getAttribute('data-id');
      var r = null, why;
      if (action === 'approve') {
        r = App.run(function () { return W.approve(id); }, 'Approved — agreement draft generated.');
      } else if (action === 'reject') {
        why = root.prompt('Reason for rejecting this application (required):', '');
        if (why === null) return;
        r = App.run(function () { return W.rejectApplication(id, why); }, 'Application rejected.');
      } else if (action === 'claim-approve') {
        r = App.run(function () { return W.decideClaim(id, 'approve'); },
          'Claim approved — awaiting a payment record.');
      } else if (action === 'claim-reject') {
        why = root.prompt('Reason for rejecting this claim (required):', '');
        if (why === null) return;
        r = App.run(function () { return W.decideClaim(id, 'reject', why); }, 'Claim rejected.');
      } else { return; }
      if (r) render();
    });

    render();
  });
})(window);

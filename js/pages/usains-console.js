/* usains-console.js — Baris gilir semakan USAINS: permohonan + tuntutan. */
(function (root) {
  'use strict';
  var NS = root.USMDEMO;

  NS.App.register('usains-console', function (ctx) {
    var S = ctx.S, W = ctx.W, C = ctx.C, App = ctx.App;

    // Susun: lewat SLA dahulu, kemudian hampir tarikh akhir.
    var SLA_ORDER = { late: 0, warning: 1, ok: 2 };

    function render() {
      var agents = S.agents().slice(), claims = S.claims().slice();
      var cfg = S.config();
      var i, a, c;

      agents.sort(function (x, y) { return SLA_ORDER[W.slaOf(x)] - SLA_ORDER[W.slaOf(y)]; });
      claims.sort(function (x, y) { return SLA_ORDER[W.slaOfClaim(x)] - SLA_ORDER[W.slaOfClaim(y)]; });

      var queue = [], nLate = 0;
      for (i = 0; i < agents.length; i++) {
        a = agents[i];
        if (['SUBMITTED', 'UNDER_USAINS_REVIEW', 'RETURNED_TO_AGENT'].indexOf(a.appStatus) < 0) continue;
        if (W.slaOf(a) === 'late') nLate++;
        var out = W.docsOutstanding(a);
        var done = a.docs.length - out.length;
        var btn = '<a class="btn btn-sm btn-usm" href="application-detail.html?id=' + C.esc(a.id) + '">Review documents</a>';
        if (a.appStatus !== 'RETURNED_TO_AGENT' && out.length === 0) {
          btn += ' <button class="btn btn-sm btn-outline-usm mt-1 mt-md-0" data-action="forward" data-id="' + C.esc(a.id) + '">Verify &amp; forward</button>';
        }
        queue.push([
          '<a href="application-detail.html?id=' + C.esc(a.id) + '" class="fw-semibold">' + C.esc(a.id) + '</a>',
          '<div class="fw-semibold">' + C.esc(a.name) + '</div>'
            + '<div class="small text-muted">' + C.esc(a.country) + ' · ' + C.esc(a.typeLabel) + '</div>',
          C.statusBadge(a.appStatus, W.APP_LABEL[a.appStatus]),
          '<span class="' + (out.length ? '' : 'text-success fw-semibold') + '">' + done + ' / ' + a.docs.length + '</span>'
            + (out.length ? '<div class="small text-muted">' + out.length + ' unverified</div>' : ''),
          C.esc(a.submittedLabel),
          C.slaChipForAgent(a),
          btn
        ]);
      }

      var claimRows = [];
      for (i = 0; i < claims.length; i++) {
        c = claims[i];
        if (['SUBMITTED', 'UNDER_USAINS_REVIEW', 'RETURNED'].indexOf(c.claimStatus) < 0) continue;
        var ag = S.agent(c.agentId);
        var nElig = 0;
        for (var e = 0; e < c.eligibility.length; e++) { if (c.eligibility[e]) nElig++; }
        claimRows.push([
          '<span class="fw-semibold">' + C.esc(c.id) + '</span>',
          '<div class="fw-semibold">' + C.esc(c.student) + '</div>'
            + '<div class="small text-muted">' + C.esc(ag ? ag.name : c.agentId) + '</div>',
          C.esc(c.level) + '<div class="small text-muted">' + C.esc(c.program) + '</div>',
          C.amountWithNotes(App.money(W.commissionOf(c)), c.level, W.ratePercent(c.level), c.rateSnapshot),
          '<span class="badge bg-light text-dark border">' + nElig + ' / 5</span>'
            + '<div class="small text-muted">conditions confirmed</div>',
          C.statusBadge(c.claimStatus, W.CLAIM_LABEL[c.claimStatus]),
          C.slaChipForClaim(c),
          '<a class="btn btn-sm btn-usm" href="claims.html?id=' + C.esc(c.id) + '">Review eligibility</a>'
        ]);
      }

      var alertBanner = nLate
        ? '<div class="alert alert-danger small"><strong>' + nLate + ' application(s) past the USAINS review SLA ('
          + cfg.sla.usainsReviewDays + ' days ' + C.draf('USAINS review SLA — DRAFT') + ').</strong> '
          + 'The queue is sorted by SLA urgency.</div>'
        : '';

      ctx.host.innerHTML =
        App.pageTitle('USAINS Console',
          'Review of application documents and claim eligibility. '
          + 'Review SLA: ' + cfg.sla.usainsReviewDays + ' calendar days ' + C.draf('USAINS review SLA — DRAFT')
          + ' · Claim decision SLA: ' + cfg.sla.claimDecisionDays + ' days ' + C.draf('Claim decision SLA — DRAFT'),
          '', 'USAINS Holding Sdn Bhd')
        + alertBanner
        + C.card('Applications awaiting review <span class="badge bg-light text-dark border ms-1">' + queue.length + '</span>',
            C.table(['ID', 'Agent', 'Status', 'Documents', 'Submitted', 'SLA', 'Action'], queue,
              { empty: 'No applications awaiting USAINS review.' }),
            { right: '<span class="small text-muted">Forward only when 9/9 documents are VERIFIED</span>' })
        + C.card('Claims awaiting eligibility review <span class="badge bg-light text-dark border ms-1">' + claimRows.length + '</span>',
            C.table(['ID', 'Student', 'Programme', 'Amount', 'Eligibility', 'Status', 'SLA', 'Action'], claimRows,
              { empty: 'No claims awaiting review.' }),
            { right: '<span class="small text-muted">All 5 conditions must be confirmed before forwarding</span>' });
    }

    App.onAction(ctx.host, function (action, el) {
      if (action !== 'forward') return;
      var r = App.run(function () { return W.verifyAndForward(el.getAttribute('data-id')); },
        'Verified and forwarded to USM LEAP.');
      if (r) render();
    });

    render();
  });
})(window);

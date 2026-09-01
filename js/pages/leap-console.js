/* leap-console.js — Baris gilir keputusan USM LEAP (kelulusan + tuntutan). */
(function (root) {
  'use strict';
  var NS = root.USMDEMO;

  NS.App.register('leap-console', function (ctx) {
    var S = ctx.S, W = ctx.W, C = ctx.C, App = ctx.App;

    function render() {
      var agents = S.agents(), claims = S.claims();
      var i, a, c;

      var rows = [];
      for (i = 0; i < agents.length; i++) {
        a = agents[i];
        if (['VERIFIED', 'UNDER_LEAP_REVIEW'].indexOf(a.appStatus) < 0) continue;
        rows.push([
          '<a href="application-detail.html?id=' + C.esc(a.id) + '">' + C.esc(a.id) + '</a>',
          '<div class="fw-semibold">' + C.esc(a.name) + '</div><div class="small text-muted">' + C.esc(a.country) + ' · ' + C.esc(a.typeLabel) + '</div>',
          C.esc(a.verifiedLabel || a.submittedLabel),
          C.slaChipForAgent(a),
          '<button class="btn btn-sm btn-usm" data-action="approve" data-id="' + C.esc(a.id) + '">Luluskan</button> '
          + '<button class="btn btn-sm btn-outline-danger" data-action="reject" data-id="' + C.esc(a.id) + '">Tolak</button>'
        ]);
      }

      var claimRows = [];
      for (i = 0; i < claims.length; i++) {
        c = claims[i];
        if (c.claimStatus !== 'PENDING_LEAP_DECISION') continue;
        var ag = S.agent(c.agentId);
        claimRows.push([
          C.esc(c.id),
          '<div class="fw-semibold">' + C.esc(c.student) + '</div><div class="small text-muted">' + C.esc(ag ? ag.name : c.agentId) + '</div>',
          C.amountWithNotes(App.money(W.commissionOf(c)), c.level, W.ratePercent(c.level), c.rateSnapshot),
          C.slaChipForClaim(c),
          '<button class="btn btn-sm btn-usm" data-action="claim-approve" data-id="' + C.esc(c.id) + '">Luluskan</button> '
          + '<button class="btn btn-sm btn-outline-danger" data-action="claim-reject" data-id="' + C.esc(c.id) + '">Tolak</button>'
        ]);
      }

      var reviewRows = [];
      for (i = 0; i < agents.length; i++) {
        a = agents[i];
        if (a.agentStatus !== 'REVIEW_DUE') continue;
        reviewRows.push([
          C.esc(a.id),
          C.esc(a.name),
          W.referralCountThisYear(a.id) + ' / ' + S.config().renewal.minReferralsPerYear + ' ' + C.draf('Ambang rujukan — DRAF'),
          C.esc(a.expiryLabel || '—'),
          '<a class="btn btn-sm btn-usm" href="annual-review.html?id=' + C.esc(a.id) + '">Buka review</a>'
        ]);
      }

      var cfg = S.config();
      ctx.host.innerHTML =
        App.pageTitle('Konsol USM LEAP',
          'Keputusan kelulusan permohonan dan tuntutan. SLA keputusan LEAP: '
          + cfg.sla.leapDecisionDays + ' hari kalendar ' + C.draf('SLA keputusan LEAP — DRAF'))
        + C.card('Permohonan menunggu keputusan (' + rows.length + ')',
            C.table(['ID', 'Ejen', 'Disahkan USAINS', 'SLA', 'Tindakan'], rows,
              { empty: 'Tiada permohonan menunggu keputusan LEAP.' }))
        + C.card('Tuntutan menunggu keputusan (' + claimRows.length + ')',
            C.table(['ID', 'Pelajar', 'Amaun', 'SLA', 'Tindakan'], claimRows,
              { empty: 'Tiada tuntutan menunggu keputusan.' }))
        + C.card('Annual review terbuka (' + reviewRows.length + ')',
            C.table(['ID', 'Ejen', 'Rujukan tahun ini', 'Tamat', 'Tindakan'], reviewRows,
              { empty: 'Tiada annual review terbuka.' }));
    }

    App.onAction(ctx.host, function (action, el) {
      var id = el.getAttribute('data-id');
      var r = null, why;
      if (action === 'approve') {
        r = App.run(function () { return W.approve(id); }, 'Diluluskan — draf perjanjian dijana.');
      } else if (action === 'reject') {
        why = root.prompt('Sebab penolakan (wajib):', '');
        if (why === null) return;
        r = App.run(function () { return W.rejectApplication(id, why); }, 'Permohonan ditolak.');
      } else if (action === 'claim-approve') {
        r = App.run(function () { return W.decideClaim(id, 'approve'); }, 'Tuntutan diluluskan — menunggu rekod bayaran.');
      } else if (action === 'claim-reject') {
        why = root.prompt('Sebab penolakan tuntutan (wajib):', '');
        if (why === null) return;
        r = App.run(function () { return W.decideClaim(id, 'reject', why); }, 'Tuntutan ditolak.');
      } else { return; }
      if (r) render();
    });

    render();
  });
})(window);

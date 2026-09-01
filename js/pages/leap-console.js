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
            + '<div class="small text-success">9 / 9 dokumen disahkan</div>',
          C.slaChipForAgent(a),
          '<button class="btn btn-sm btn-usm" data-action="approve" data-id="' + C.esc(a.id) + '">Luluskan</button> '
            + '<button class="btn btn-sm btn-outline-danger mt-1 mt-md-0" data-action="reject" data-id="' + C.esc(a.id) + '">Tolak</button>'
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
          '<span class="badge bg-success">5 / 5</span><div class="small text-muted">disahkan USAINS</div>',
          C.slaChipForClaim(c),
          '<button class="btn btn-sm btn-usm" data-action="claim-approve" data-id="' + C.esc(c.id) + '">Luluskan</button> '
            + '<button class="btn btn-sm btn-outline-danger mt-1 mt-md-0" data-action="claim-reject" data-id="' + C.esc(c.id) + '">Tolak</button>'
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
            + ' / ' + cfg.renewal.minReferralsPerYear + C.draf('Ambang rujukan untuk renew — DRAF')
            + (below ? '<div class="small text-danger">Di bawah ambang</div>' : ''),
          C.esc(a.expiryLabel || '—'),
          '<a class="btn btn-sm btn-usm" href="annual-review.html?id=' + C.esc(a.id) + '">Buka review</a>'
        ]);
      }

      var total = rows.length + claimRows.length + reviewRows.length;
      var banner = total
        ? '<div class="alert alert-light border small"><strong>' + total + ' kes menunggu keputusan anda.</strong> '
          + 'Penolakan pada mana-mana peringkat memerlukan alasan bertulis (spesifikasi §15.5).</div>'
        : '<div class="alert alert-success small">Tiada kes menunggu keputusan USM LEAP.</div>';

      ctx.host.innerHTML =
        App.pageTitle('Konsol USM LEAP',
          'Kelulusan permohonan, keputusan tuntutan dan annual review. '
          + 'SLA keputusan LEAP: ' + cfg.sla.leapDecisionDays + ' hari kalendar '
          + C.draf('SLA keputusan LEAP — DRAF'),
          '', 'USM LEAP')
        + banner
        + C.card('Permohonan menunggu keputusan <span class="badge bg-light text-dark border ms-1">' + rows.length + '</span>',
            C.table(['ID', 'Ejen', 'Disahkan USAINS', 'SLA', 'Tindakan'], rows,
              { empty: 'Tiada permohonan menunggu keputusan LEAP.' }),
            { right: '<span class="small text-muted">Kelulusan menjana draf perjanjian</span>' })
        + C.card('Tuntutan menunggu keputusan <span class="badge bg-light text-dark border ms-1">' + claimRows.length + '</span>',
            C.table(['ID', 'Pelajar', 'Amaun', 'Kelayakan', 'SLA', 'Tindakan'], claimRows,
              { empty: 'Tiada tuntutan menunggu keputusan.' }))
        + C.card('Annual review terbuka <span class="badge bg-light text-dark border ms-1">' + reviewRows.length + '</span>',
            C.table(['ID', 'Ejen', 'Rujukan tahun ini', 'Tamat', 'Tindakan'], reviewRows,
              { empty: 'Tiada annual review terbuka.' }));
    }

    App.onAction(ctx.host, function (action, el) {
      var id = el.getAttribute('data-id');
      var r = null, why;
      if (action === 'approve') {
        r = App.run(function () { return W.approve(id); }, 'Diluluskan — draf perjanjian dijana.');
      } else if (action === 'reject') {
        why = root.prompt('Sebab penolakan permohonan (wajib):', '');
        if (why === null) return;
        r = App.run(function () { return W.rejectApplication(id, why); }, 'Permohonan ditolak.');
      } else if (action === 'claim-approve') {
        r = App.run(function () { return W.decideClaim(id, 'approve'); },
          'Tuntutan diluluskan — menunggu rekod bayaran.');
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

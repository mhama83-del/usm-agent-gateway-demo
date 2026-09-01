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
        var btn = '<a class="btn btn-sm btn-usm" href="application-detail.html?id=' + C.esc(a.id) + '">Semak dokumen</a>';
        if (a.appStatus !== 'RETURNED_TO_AGENT' && out.length === 0) {
          btn += ' <button class="btn btn-sm btn-outline-usm mt-1 mt-md-0" data-action="forward" data-id="' + C.esc(a.id) + '">Verify &amp; forward</button>';
        }
        queue.push([
          '<a href="application-detail.html?id=' + C.esc(a.id) + '" class="fw-semibold">' + C.esc(a.id) + '</a>',
          '<div class="fw-semibold">' + C.esc(a.name) + '</div>'
            + '<div class="small text-muted">' + C.esc(a.country) + ' · ' + C.esc(a.typeLabel) + '</div>',
          C.statusBadge(a.appStatus, W.APP_LABEL[a.appStatus]),
          '<span class="' + (out.length ? '' : 'text-success fw-semibold') + '">' + done + ' / ' + a.docs.length + '</span>'
            + (out.length ? '<div class="small text-muted">' + out.length + ' belum disahkan</div>' : ''),
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
            + '<div class="small text-muted">syarat disahkan</div>',
          C.statusBadge(c.claimStatus, W.CLAIM_LABEL[c.claimStatus]),
          C.slaChipForClaim(c),
          '<a class="btn btn-sm btn-usm" href="claims.html?id=' + C.esc(c.id) + '">Semak kelayakan</a>'
        ]);
      }

      var alertBanner = nLate
        ? '<div class="alert alert-danger small"><strong>' + nLate + ' permohonan melebihi SLA semakan USAINS ('
          + cfg.sla.usainsReviewDays + ' hari ' + C.draf('SLA semakan USAINS — DRAF') + ').</strong> '
          + 'Baris gilir disusun mengikut keterdesakan SLA.</div>'
        : '';

      ctx.host.innerHTML =
        App.pageTitle('Konsol USAINS',
          'Semakan dokumen permohonan dan kelayakan tuntutan. '
          + 'SLA semakan: ' + cfg.sla.usainsReviewDays + ' hari kalendar ' + C.draf('SLA semakan USAINS — DRAF')
          + ' · SLA keputusan tuntutan: ' + cfg.sla.claimDecisionDays + ' hari ' + C.draf('SLA keputusan tuntutan — DRAF'),
          '', 'USAINS Holding Sdn Bhd')
        + alertBanner
        + C.card('Permohonan menunggu semakan <span class="badge bg-light text-dark border ms-1">' + queue.length + '</span>',
            C.table(['ID', 'Ejen', 'Status', 'Dokumen', 'Dihantar', 'SLA', 'Tindakan'], queue,
              { empty: 'Tiada permohonan menunggu semakan USAINS.' }),
            { right: '<span class="small text-muted">Forward hanya bila 9/9 dokumen VERIFIED</span>' })
        + C.card('Tuntutan menunggu semakan kelayakan <span class="badge bg-light text-dark border ms-1">' + claimRows.length + '</span>',
            C.table(['ID', 'Pelajar', 'Program', 'Amaun', 'Kelayakan', 'Status', 'SLA', 'Tindakan'], claimRows,
              { empty: 'Tiada tuntutan menunggu semakan.' }),
            { right: '<span class="small text-muted">5 syarat perlu disahkan sebelum forward</span>' });
    }

    App.onAction(ctx.host, function (action, el) {
      if (action !== 'forward') return;
      var r = App.run(function () { return W.verifyAndForward(el.getAttribute('data-id')); },
        'Disahkan dan dihantar ke USM LEAP.');
      if (r) render();
    });

    render();
  });
})(window);

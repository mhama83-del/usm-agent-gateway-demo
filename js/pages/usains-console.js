/* usains-console.js — Baris gilir semakan USAINS (permohonan + tuntutan). */
(function (root) {
  'use strict';
  var NS = root.USMDEMO;

  NS.App.register('usains-console', function (ctx) {
    var S = ctx.S, W = ctx.W, C = ctx.C, App = ctx.App;

    function render() {
      var agents = S.agents(), claims = S.claims();
      var i, a, c;

      var queue = [];
      for (i = 0; i < agents.length; i++) {
        a = agents[i];
        if (['SUBMITTED', 'UNDER_USAINS_REVIEW', 'RETURNED_TO_AGENT'].indexOf(a.appStatus) < 0) continue;
        var out = W.docsOutstanding(a);
        var btn = '<a class="btn btn-sm btn-usm" href="application-detail.html?id=' + C.esc(a.id) + '">Semak dokumen</a>';
        if (a.appStatus !== 'RETURNED_TO_AGENT' && out.length === 0) {
          btn += ' <button class="btn btn-sm btn-outline-usm" data-action="forward" data-id="' + C.esc(a.id) + '">Verify &amp; forward</button>';
        }
        queue.push([
          '<a href="application-detail.html?id=' + C.esc(a.id) + '">' + C.esc(a.id) + '</a>',
          '<div class="fw-semibold">' + C.esc(a.name) + '</div><div class="small text-muted">' + C.esc(a.country) + ' · ' + C.esc(a.typeLabel) + '</div>',
          C.statusBadge(a.appStatus, W.APP_LABEL[a.appStatus]),
          (a.docs.length - out.length) + '/' + a.docs.length,
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
        claimRows.push([
          C.esc(c.id),
          '<div class="fw-semibold">' + C.esc(c.student) + '</div><div class="small text-muted">' + C.esc(ag ? ag.name : c.agentId) + '</div>',
          C.esc(c.level) + ' · ' + C.esc(c.program),
          C.amountWithNotes(App.money(W.commissionOf(c)), c.level, W.ratePercent(c.level), c.rateSnapshot),
          C.statusBadge(c.claimStatus, W.CLAIM_LABEL[c.claimStatus]),
          C.slaChipForClaim(c),
          '<a class="btn btn-sm btn-usm" href="claims.html?id=' + C.esc(c.id) + '">Semak kelayakan</a>'
        ]);
      }

      var cfg = S.config();
      ctx.host.innerHTML =
        App.pageTitle('Konsol USAINS',
          'Semakan dokumen permohonan dan kelayakan tuntutan. SLA semakan: '
          + cfg.sla.usainsReviewDays + ' hari kalendar ' + C.draf('SLA semakan USAINS — DRAF')
          + ' · SLA keputusan tuntutan: ' + cfg.sla.claimDecisionDays + ' hari ' + C.draf('SLA keputusan tuntutan — DRAF'))
        + C.card('Permohonan menunggu semakan (' + queue.length + ')',
            C.table(['ID', 'Ejen', 'Status', 'Dokumen', 'Dihantar', 'SLA', 'Tindakan'], queue,
              { empty: 'Tiada permohonan menunggu semakan USAINS.' }))
        + C.card('Tuntutan menunggu semakan kelayakan (' + claimRows.length + ')',
            C.table(['ID', 'Pelajar', 'Program', 'Amaun', 'Status', 'SLA', 'Tindakan'], claimRows,
              { empty: 'Tiada tuntutan menunggu semakan.' }));
    }

    App.onAction(ctx.host, function (action, el) {
      if (action === 'forward') {
        var r = App.run(function () { return W.verifyAndForward(el.getAttribute('data-id')); },
          'Disahkan dan dihantar ke USM LEAP.');
        if (r) render();
      }
    });

    render();
  });
})(window);

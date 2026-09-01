/* annual-review.js — Queue ejen hampir tamat, snapshot prestasi, renew/terminate. */
(function (root) {
  'use strict';
  var NS = root.USMDEMO;

  NS.App.register('annual-review', function (ctx) {
    var S = ctx.S, W = ctx.W, C = ctx.C, App = ctx.App;
    var focusId = App.qs('id');

    function alertBand(days) {
      var t = S.config().sla.expiryAlertsDays; // [90,60,30]
      if (days == null) return null;
      for (var i = t.length - 1; i >= 0; i--) {
        if (days <= t[i]) return t[i];
      }
      return null;
    }

    function render() {
      var role = S.role();
      var me = S.currentAgent();
      var agents = S.agents();
      var rows = [];
      var cfg = S.config();
      var threshold = cfg.renewal.minReferralsPerYear;

      for (var i = 0; i < agents.length; i++) {
        var a = agents[i];
        if (role === 'agent' && (!me || a.id !== me.id)) continue;
        var isActive = ['ACTIVE', 'RENEWED', 'REVIEW_DUE', 'TERMINATED', 'NOT_RENEWED'].indexOf(a.agentStatus) >= 0;
        if (!isActive) continue;

        var days = a.expiryIso ? W.daysUntil(a.expiryIso) : null;
        var band = alertBand(days);
        var refs = W.referralCountThisYear(a.id);
        var belowThreshold = refs < threshold;

        var acts = '';
        if (W.can('openAnnualReview') && (a.agentStatus === 'ACTIVE' || a.agentStatus === 'RENEWED')) {
          acts += '<button class="btn btn-sm btn-outline-usm" data-action="open" data-id="' + C.esc(a.id) + '">Buka review</button> ';
        }
        if (W.can('renew') && a.agentStatus === 'REVIEW_DUE') {
          acts += '<button class="btn btn-sm btn-usm" data-action="renew" data-id="' + C.esc(a.id) + '">Renew</button> '
                + '<button class="btn btn-sm btn-outline-danger" data-action="terminate" data-id="' + C.esc(a.id) + '">Terminate</button>';
        }

        rows.push([
          '<a href="application-detail.html?id=' + C.esc(a.id) + '">' + C.esc(a.id) + '</a>'
            + (focusId === a.id ? ' <span class="badge bg-warning text-dark">FOKUS</span>' : ''),
          '<div class="fw-semibold">' + C.esc(a.name) + '</div><div class="small text-muted">' + C.esc(a.country) + '</div>',
          C.statusBadge(a.agentStatus, W.AGENT_LABEL[a.agentStatus]),
          C.esc(a.expiryLabel || '—')
            + (band ? '<div class="small text-danger">Amaran ' + band + ' hari ' + C.draf('Amaran tamat — DRAF') + '</div>' : '')
            + (days != null ? '<div class="small text-muted">' + (days < 0 ? Math.abs(days) + ' hari lepas' : days + ' hari lagi') + '</div>' : ''),
          '<span class="' + (belowThreshold ? 'text-danger fw-semibold' : '') + '">' + refs + '</span> / ' + threshold
            + ' ' + C.draf('Ambang rujukan/tahun — DRAF')
            + (belowThreshold ? '<div class="small text-danger">Di bawah ambang</div>' : ''),
          acts || '<span class="text-muted small">—</span>'
        ]);
      }

      ctx.host.innerHTML =
        App.pageTitle('Annual Review &amp; Pembaharuan',
          'Amaran tamat pada ' + cfg.sla.expiryAlertsDays.join(' / ') + ' hari ' + C.draf('Amaran tamat — DRAF')
          + ' · Ambang prestasi ' + threshold + ' rujukan/tahun ' + C.draf('Ambang rujukan — DRAF')
          + ' · Tempoh perjanjian ' + cfg.renewal.agreementTermYears + ' tahun ' + C.draf('Tempoh perjanjian — DRAF'))
        + C.card('Ejen dalam skop semakan (' + rows.length + ')',
            C.table(['ID', 'Ejen', 'Status', 'Tarikh tamat', 'Prestasi rujukan', 'Tindakan'], rows,
              { empty: 'Tiada ejen dalam skop annual review.' }))
        + C.card('Nota keputusan',
            '<p class="small mb-1">Keputusan yang tersedia: <strong>RENEW</strong>, <strong>NOT_RENEW</strong>, '
            + '<strong>SUSPEND</strong>, <strong>TERMINATE</strong>. Demo ini melaksanakan RENEW dan TERMINATE '
            + '(kedua-duanya memerlukan alasan direkod untuk penamatan).</p>'
            + '<p class="small text-muted mb-0">Renew melanjutkan tarikh tamat perjanjian sebanyak '
            + cfg.renewal.agreementTermYears + ' tahun daripada tarikh tamat semasa.</p>');
    }

    App.onAction(ctx.host, function (action, el) {
      var id = el.getAttribute('data-id');
      var r = null;
      if (action === 'open') {
        r = App.run(function () { return W.openAnnualReview(id); }, 'Annual review dibuka.');
      } else if (action === 'renew') {
        var note = root.prompt('Nota keputusan renew (pilihan):', 'Prestasi memuaskan.');
        r = App.run(function () { return W.renew(id, note); }, 'Ejen diperbaharui.');
      } else if (action === 'terminate') {
        var why = root.prompt('Sebab penamatan (wajib):', '');
        if (why === null) return;
        r = App.run(function () { return W.terminate(id, why); }, 'Ejen ditamatkan.');
      } else { return; }
      if (r) render();
    });

    render();
  });
})(window);

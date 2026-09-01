/* annual-review.js — Queue ejen hampir tamat, snapshot prestasi ketika
   keputusan dibuat, dan tindakan renew / terminate. */
(function (root) {
  'use strict';
  var NS = root.USMDEMO;

  NS.App.register('annual-review', function (ctx) {
    var S = ctx.S, W = ctx.W, C = ctx.C, App = ctx.App;
    var focusId = App.qs('id');

    // Ambang amaran terkecil yang sudah dilepasi (90 / 60 / 30 hari).
    function alertBand(days) {
      var t = S.config().sla.expiryAlertsDays.slice().sort(function (x, y) { return x - y; });
      if (days == null) return null;
      for (var i = 0; i < t.length; i++) {
        if (days <= t[i]) return t[i];
      }
      return null;
    }

    function render() {
      var role = S.role();
      var me = S.currentAgent();
      var agents = S.agents();
      var cfg = S.config();
      var threshold = cfg.renewal.minReferralsPerYear;
      var rows = [], nDue = 0, nBelow = 0;

      for (var i = 0; i < agents.length; i++) {
        var a = agents[i];
        if (role === 'agent' && (!me || a.id !== me.id)) continue;
        if (['ACTIVE', 'RENEWED', 'REVIEW_DUE', 'TERMINATED', 'NOT_RENEWED'].indexOf(a.agentStatus) < 0) continue;

        var days = a.expiryIso ? W.daysUntil(a.expiryIso) : null;
        var band = alertBand(days);
        var refs = W.referralCountThisYear(a.id);
        var below = refs < threshold;
        if (a.agentStatus === 'REVIEW_DUE') nDue++;
        if (below) nBelow++;

        var acts = '';
        if (W.can('openAnnualReview') && ['ACTIVE', 'RENEWED'].indexOf(a.agentStatus) >= 0) {
          acts += '<button class="btn btn-sm btn-outline-usm" data-action="open" data-id="' + C.esc(a.id) + '">Buka review</button> ';
        }
        if (W.can('renew') && a.agentStatus === 'REVIEW_DUE') {
          acts += '<button class="btn btn-sm btn-usm" data-action="renew" data-id="' + C.esc(a.id) + '">Renew</button> '
                + '<button class="btn btn-sm btn-outline-danger mt-1 mt-md-0" data-action="terminate" data-id="' + C.esc(a.id) + '">Terminate</button>';
        }

        rows.push([
          '<a href="application-detail.html?id=' + C.esc(a.id) + '" class="fw-semibold">' + C.esc(a.id) + '</a>'
            + (focusId === a.id ? '<div><span class="badge bg-warning text-dark mt-1">FOKUS</span></div>' : ''),
          '<div class="fw-semibold">' + C.esc(a.name) + '</div>'
            + '<div class="small text-muted">' + C.esc(a.country) + '</div>',
          C.statusBadge(a.agentStatus, W.AGENT_LABEL[a.agentStatus]),
          C.esc(a.expiryLabel || '—')
            + (band ? '<div class="small text-danger">Dalam amaran ' + band + ' hari '
                + C.draf('Amaran tamat perjanjian — DRAF') + '</div>' : '')
            + (days != null
                ? '<div class="small text-muted">' + (days < 0 ? Math.abs(days) + ' hari lepas' : days + ' hari lagi') + '</div>'
                : ''),
          '<span class="' + (below ? 'text-danger fw-semibold' : 'text-success fw-semibold') + '">' + refs + '</span>'
            + ' / ' + threshold + C.draf('Ambang rujukan untuk renew — DRAF')
            + (below ? '<div class="small text-danger">Di bawah ambang</div>'
                     : '<div class="small text-success">Memenuhi ambang</div>'),
          acts || '<span class="text-muted small">—</span>'
        ]);
      }

      var banner = '';
      if (nDue) {
        banner = '<div class="alert alert-warning small"><strong>' + nDue
          + ' ejen menunggu keputusan annual review.</strong> '
          + 'Penamatan memerlukan alasan bertulis (spesifikasi §15.5).</div>';
      } else if (nBelow) {
        banner = '<div class="alert alert-light border small">' + nBelow
          + ' ejen berada di bawah ambang prestasi ' + threshold + ' rujukan/tahun '
          + C.draf('Ambang rujukan untuk renew — DRAF') + '.</div>';
      }

      ctx.host.innerHTML =
        App.pageTitle('Annual Review &amp; Pembaharuan',
          'Amaran tamat pada ' + cfg.sla.expiryAlertsDays.join(' / ') + ' hari '
          + C.draf('Amaran tamat perjanjian — DRAF')
          + ' · Ambang prestasi ' + threshold + ' rujukan/tahun ' + C.draf('Ambang rujukan untuk renew — DRAF')
          + ' · Tempoh perjanjian ' + cfg.renewal.agreementTermYears + ' tahun '
          + C.draf('Tempoh perjanjian — DRAF'),
          '', 'Peringkat 5 — Annual Review')
        + banner
        + C.card('Ejen dalam skop semakan <span class="badge bg-light text-dark border ms-1">' + rows.length + '</span>',
            C.table(['ID', 'Ejen', 'Status', 'Tarikh tamat', 'Prestasi rujukan', 'Tindakan'], rows,
              { empty: 'Tiada ejen dalam skop annual review.' }),
            { right: '<span class="small text-muted">Snapshot prestasi ketika keputusan dibuat</span>' })
        + '<div class="row g-3"><div class="col-lg-6">'
        + C.card('Keputusan yang tersedia',
            '<p class="small mb-2">Spesifikasi §8.9 menyenaraikan <strong>RENEW</strong>, '
            + '<strong>NOT_RENEW</strong>, <strong>SUSPEND</strong> dan <strong>TERMINATE</strong>.</p>'
            + '<p class="small mb-2">Demo ini melaksanakan <strong>RENEW</strong> dan '
            + '<strong>TERMINATE</strong>; penamatan memerlukan alasan yang direkod dalam log aktiviti.</p>'
            + '<p class="small text-muted mb-0">Renew melanjutkan tarikh tamat perjanjian sebanyak '
            + cfg.renewal.agreementTermYears + ' tahun ' + C.draf('Tempoh perjanjian — DRAF')
            + ' daripada tarikh tamat semasa.</p>')
        + '</div><div class="col-lg-6">'
        + C.card('Kesan penamatan',
            '<p class="small mb-2">Terminate mengekalkan semua sejarah tetapi menghalang rujukan '
            + 'dan tuntutan baharu — rekod tidak dipadam secara fizikal (spesifikasi §15.12).</p>'
            + '<p class="small text-muted mb-0">Ejen yang ditamatkan kekal dalam senarai ini dengan '
            + 'status TERMINATED supaya jejak audit lengkap.</p>')
        + '</div></div>';
    }

    App.onAction(ctx.host, function (action, el) {
      var id = el.getAttribute('data-id');
      var r = null;
      if (action === 'open') {
        r = App.run(function () { return W.openAnnualReview(id); }, 'Annual review dibuka.');
      } else if (action === 'renew') {
        var note = root.prompt('Nota keputusan renew (pilihan):', 'Prestasi memuaskan.');
        if (note === null) return;
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

/* settings-draft.js — Penutup demo: SEMUA nilai CONFIG_DRAFT di satu tempat,
   boleh diubah terus supaya kesannya kelihatan serta-merta di skrin lain. */
(function (root) {
  'use strict';
  var NS = root.USMDEMO;

  // path: laluan bertitik dalam config; type: 'number' | 'list'
  var FIELDS = [
    { g: 'Komisen', path: 'commission.ug.ratePercent', label: 'Kadar komisen UG (%)', unit: '%', type: 'number',
      note: 'Asas: yuran tahun pertama. Amaun semua tuntutan UG dikira daripada nilai ini.' },
    { g: 'Komisen', path: 'commission.pg.ratePercent', label: 'Kadar komisen PG (%)', unit: '%', type: 'number',
      note: 'Asas: yuran tahun pertama.' },
    { g: 'Komisen', path: 'commission.paymentWindowDays', label: 'Tetingkap bayaran selepas lulus', unit: 'hari', type: 'number' },

    { g: 'Yuran &amp; jaminan', path: 'fees.registrationNew', label: 'Yuran pendaftaran — NEW', unit: 'RM', type: 'number' },
    { g: 'Yuran &amp; jaminan', path: 'fees.registrationRenewal', label: 'Yuran pendaftaran — RENEWAL', unit: 'RM', type: 'number' },
    { g: 'Yuran &amp; jaminan', path: 'fees.performanceBond', label: 'Performance bond', unit: 'RM', type: 'number' },
    { g: 'Yuran &amp; jaminan', path: 'fees.paidUpCapitalMin', label: 'Paid-up capital minimum', unit: 'RM', type: 'number' },

    { g: 'SLA', path: 'sla.usainsReviewDays', label: 'SLA semakan USAINS', unit: 'hari kalendar', type: 'number',
      note: 'Menggerakkan chip SLA bagi permohonan yang dicipta semasa demo.' },
    { g: 'SLA', path: 'sla.leapDecisionDays', label: 'SLA keputusan USM LEAP', unit: 'hari kalendar', type: 'number' },
    { g: 'SLA', path: 'sla.claimDecisionDays', label: 'SLA keputusan tuntutan', unit: 'hari', type: 'number' },
    { g: 'SLA', path: 'sla.expiryAlertsDays', label: 'Amaran tamat', unit: 'hari', type: 'list' },

    { g: 'Kelayakan &amp; pembaharuan', path: 'eligibility.minStudyMonths', label: 'Tempoh pengajian minimum (claim)', unit: 'bulan', type: 'number' },
    { g: 'Kelayakan &amp; pembaharuan', path: 'renewal.minReferralsPerYear', label: 'Ambang rujukan untuk renew', unit: 'pelajar/tahun', type: 'number' },
    { g: 'Kelayakan &amp; pembaharuan', path: 'renewal.agreementTermYears', label: 'Tempoh perjanjian', unit: 'tahun', type: 'number' }
  ];

  function getPath(obj, path) {
    var p = path.split('.'), o = obj;
    for (var i = 0; i < p.length; i++) o = o[p[i]];
    return o;
  }
  function setPath(obj, path, val) {
    var p = path.split('.'), o = obj;
    for (var i = 0; i < p.length - 1; i++) o = o[p[i]];
    o[p[p.length - 1]] = val;
  }

  NS.App.register('settings-draft', function (ctx) {
    var S = ctx.S, W = ctx.W, C = ctx.C, App = ctx.App;

    function render() {
      var cfg = S.config();
      var groups = {}, order = [];
      for (var i = 0; i < FIELDS.length; i++) {
        var f = FIELDS[i];
        if (!groups[f.g]) { groups[f.g] = []; order.push(f.g); }
        var val = getPath(cfg, f.path);
        var shown = (f.type === 'list') ? val.join(', ') : val;
        groups[f.g].push([
          '<div>' + f.label + ' ' + C.draf(f.note || 'Nilai DRAF — menunggu keputusan owner') + '</div>'
            + (f.note ? '<div class="small text-muted">' + f.note + '</div>' : ''),
          '<input class="form-control form-control-sm" style="max-width:160px" '
            + 'data-field="' + i + '" value="' + C.esc(shown) + '">',
          '<span class="small text-muted">' + f.unit + '</span>'
        ]);
      }

      var body = '';
      for (i = 0; i < order.length; i++) {
        body += C.card(order[i], C.table(['Tetapan', 'Nilai DRAF', 'Unit'], groups[order[i]], { stack: true }));
      }

      // Kesan langsung — bukti bahawa nilai DRAF menggerakkan sistem
      var claims = S.claims();
      var rows = [];
      for (i = 0; i < Math.min(claims.length, 6); i++) {
        var c = claims[i];
        rows.push([
          C.esc(c.id) + ' · ' + C.esc(c.student),
          C.esc(c.level),
          App.money(c.firstYearFee),
          W.ratePercent(c.level) + '%',
          '<strong>' + App.money(W.commissionOf(c)) + '</strong>'
        ]);
      }

      ctx.host.innerHTML =
        App.pageTitle('Tetapan (DRAF)',
          'Semua nilai di sini adalah <strong>titik keputusan owner</strong>. Ubah satu nilai dan '
          + 'lihat kesannya serta-merta pada jadual di bawah dan pada skrin Tuntutan.',
          '<button class="btn btn-sm btn-outline-secondary" data-action="restore">Pulih nilai seed</button>')
        + '<div class="alert alert-warning small">Ini bukan Modul Konfigurasi produksi. Dalam sistem sebenar, '
        + 'setiap perubahan mempunyai versi + audit history supaya keputusan lama terikat kepada polisi ketika ia dibuat '
        + '(spesifikasi §16).</div>'
        + '<div class="row g-3"><div class="col-lg-7">' + body + '</div>'
        + '<div class="col-lg-5">'
        + C.card('Kesan langsung pada tuntutan',
            C.table(['Tuntutan', 'Level', 'Yuran tahun 1', 'Kadar', 'Amaun komisen'], rows, { stack: true }),
            { right: '<span class="small text-muted">Dikira semula setiap kali nilai berubah</span>' })
        + C.card('Peranan &amp; akses',
            '<p class="small mb-2">Penukar peranan di bar atas menukar navigasi dan tindakan yang '
            + 'dibenarkan. Tiada login sebenar dalam demo.</p>'
            + '<p class="small text-muted mb-0">Peranan: Agent · USAINS · USM LEAP · Payment Officer · Super Admin</p>')
        + '</div></div>';
    }

    ctx.host.addEventListener('change', function (ev) {
      var t = ev.target;
      var idx = t.getAttribute && t.getAttribute('data-field');
      if (idx == null) return;
      var f = FIELDS[Number(idx)];
      var cfg = S.config();
      var raw = t.value;
      if (f.type === 'list') {
        var parts = raw.split(','), out = [];
        for (var i = 0; i < parts.length; i++) {
          var n = Number(String(parts[i]).trim());
          if (!isNaN(n)) out.push(n);
        }
        if (!out.length) { App.toast('Nilai tidak sah.', 'danger'); render(); return; }
        setPath(cfg, f.path, out);
      } else {
        var v = Number(raw);
        if (isNaN(v) || v < 0) { App.toast('Nilai tidak sah.', 'danger'); render(); return; }
        setPath(cfg, f.path, v);
      }
      S.save();
      App.toast(f.label + ' dikemas kini kepada ' + t.value + '.', 'success');
      render();
    });

    App.onAction(ctx.host, function (action) {
      if (action !== 'restore') return;
      var st = S.state();
      st.config = S.clone(NS.SEED.CONFIG_DRAFT);
      S.save();
      App.toast('Nilai DRAF dipulihkan kepada nilai seed.', 'success');
      render();
    });

    render();
  });
})(window);

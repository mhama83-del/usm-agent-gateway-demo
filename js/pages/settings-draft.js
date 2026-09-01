/* settings-draft.js — Penutup demo: SEMUA nilai CONFIG_DRAFT di satu tempat.
 *
 * Senarai medan DIJANA dengan merentasi CONFIG_DRAFT secara rekursif, bukan
 * ditaip tangan — jadi menambah nilai baharu dalam data/seed.js secara automatik
 * muncul di sini dengan lencana DRAF. Tiada nilai boleh terlepas.
 */
(function (root) {
  'use strict';
  var NS = root.USMDEMO;

  // Metadata paparan mengikut laluan bertitik. Laluan yang tiada di sini tetap
  // dipaparkan (label dijana dari nama kunci) supaya tiada nilai tersembunyi.
  var META = {
    'commission.ug.label': { group: 'Komisen', label: 'Label level UG', editable: false },
    'commission.ug.ratePercent': { group: 'Komisen', label: 'Kadar komisen UG', unit: '%',
      note: 'Amaun setiap tuntutan UG = yuran tahun pertama × kadar ini.' },
    'commission.ug.basis': { group: 'Komisen', label: 'Asas kiraan UG', editable: false },
    'commission.pg.label': { group: 'Komisen', label: 'Label level PG', editable: false },
    'commission.pg.ratePercent': { group: 'Komisen', label: 'Kadar komisen PG', unit: '%',
      note: 'Amaun setiap tuntutan PG = yuran tahun pertama × kadar ini.' },
    'commission.pg.basis': { group: 'Komisen', label: 'Asas kiraan PG', editable: false },
    'commission.paymentWindowDays': { group: 'Komisen', label: 'Tetingkap bayaran selepas lulus', unit: 'hari' },

    'fees.registrationNew': { group: 'Yuran & jaminan', label: 'Yuran pendaftaran — NEW', unit: 'RM' },
    'fees.registrationRenewal': { group: 'Yuran & jaminan', label: 'Yuran pendaftaran — RENEWAL', unit: 'RM' },
    'fees.performanceBond': { group: 'Yuran & jaminan', label: 'Performance bond', unit: 'RM' },
    'fees.paidUpCapitalMin': { group: 'Yuran & jaminan', label: 'Paid-up capital minimum', unit: 'RM' },

    'sla.usainsReviewDays': { group: 'SLA', label: 'SLA semakan USAINS', unit: 'hari kalendar',
      note: 'Menggerakkan chip SLA bagi permohonan yang dicipta semasa demo.' },
    'sla.leapDecisionDays': { group: 'SLA', label: 'SLA keputusan USM LEAP', unit: 'hari kalendar' },
    'sla.claimDecisionDays': { group: 'SLA', label: 'SLA keputusan tuntutan', unit: 'hari' },
    'sla.approachingWithinDays': { group: 'SLA', label: 'Ambang "Approaching Deadline"', unit: 'hari sebelum tarikh akhir',
      note: 'Baki hari ≤ nilai ini menukar chip SLA daripada hijau kepada kuning.' },
    'sla.expiryAlertsDays': { group: 'SLA', label: 'Amaran tamat perjanjian', unit: 'hari' },

    'eligibility.minStudyMonths': { group: 'Kelayakan & pembaharuan', label: 'Tempoh pengajian minimum (claim)', unit: 'bulan' },
    'renewal.minReferralsPerYear': { group: 'Kelayakan & pembaharuan', label: 'Ambang rujukan untuk renew', unit: 'pelajar/tahun' },
    'renewal.agreementTermYears': { group: 'Kelayakan & pembaharuan', label: 'Tempoh perjanjian', unit: 'tahun' }
  };

  var GROUP_ORDER = ['Komisen', 'Yuran & jaminan', 'SLA', 'Kelayakan & pembaharuan', 'Lain-lain'];

  function getPath(obj, path) {
    var p = path.split('.'), o = obj;
    for (var i = 0; i < p.length; i++) {
      if (o == null) return undefined;
      o = o[p[i]];
    }
    return o;
  }
  function setPath(obj, path, val) {
    var p = path.split('.'), o = obj;
    for (var i = 0; i < p.length - 1; i++) o = o[p[i]];
    o[p[p.length - 1]] = val;
  }

  // Rentas CONFIG_DRAFT dan pulangkan setiap nilai daun.
  function collectFields(cfg) {
    var out = [];
    (function walk(node, prefix) {
      for (var k in node) {
        if (!Object.prototype.hasOwnProperty.call(node, k)) continue;
        var v = node[k];
        var path = prefix ? prefix + '.' + k : k;
        if (v && typeof v === 'object' && !Array.isArray(v)) {
          walk(v, path);
        } else {
          var meta = META[path] || {};
          out.push({
            path: path,
            label: meta.label || k,
            unit: meta.unit || '',
            note: meta.note || '',
            group: meta.group || 'Lain-lain',
            editable: meta.editable !== false,
            type: Array.isArray(v) ? 'list' : (typeof v === 'number' ? 'number' : 'text')
          });
        }
      }
    })(cfg, '');
    return out;
  }

  NS.App.register('settings-draft', function (ctx) {
    var S = ctx.S, W = ctx.W, C = ctx.C, App = ctx.App;
    var FIELDS = [];

    function fieldRow(f, i) {
      var cfg = S.config();
      var val = getPath(cfg, f.path);
      var shown = (f.type === 'list') ? val.join(', ') : val;
      var input = f.editable
        ? '<input class="form-control form-control-sm" style="max-width:170px" '
          + 'data-field="' + i + '" value="' + C.esc(shown) + '" '
          + 'aria-label="' + C.esc(f.label) + '" inputmode="' + (f.type === 'number' ? 'numeric' : 'text') + '">'
        : '<span class="small">' + C.esc(shown) + '</span>';
      return [
        '<div class="fw-semibold">' + C.esc(f.label) + ' '
          + C.draf(f.note || 'Nilai DRAF — menunggu keputusan owner') + '</div>'
          + (f.note ? '<div class="small text-muted">' + C.esc(f.note) + '</div>' : '')
          + '<div class="small text-muted font-monospace" style="font-size:.68rem">CONFIG_DRAFT.' + C.esc(f.path) + '</div>',
        input,
        '<span class="small text-muted">' + C.esc(f.unit || '—') + '</span>'
      ];
    }

    function render() {
      FIELDS = collectFields(S.config());

      var groups = {}, i;
      for (i = 0; i < FIELDS.length; i++) {
        var g = FIELDS[i].group;
        if (!groups[g]) groups[g] = [];
        groups[g].push(fieldRow(FIELDS[i], i));
      }

      var body = '';
      for (i = 0; i < GROUP_ORDER.length; i++) {
        var name = GROUP_ORDER[i];
        if (!groups[name]) continue;
        body += C.card(C.esc(name) + ' <span class="badge bg-light text-dark border ms-1">'
            + groups[name].length + '</span>',
          C.table(['Tetapan', 'Nilai DRAF', 'Unit'], groups[name]));
      }

      // Kesan langsung — bukti bahawa nilai DRAF menggerakkan sistem
      var claims = S.claims(), rows = [];
      for (i = 0; i < Math.min(claims.length, 6); i++) {
        var c = claims[i];
        rows.push([
          C.esc(c.id) + '<div class="small text-muted">' + C.esc(c.student) + '</div>',
          C.esc(c.level),
          App.money(c.firstYearFee),
          W.ratePercent(c.level) + '%',
          '<strong>' + App.money(W.commissionOf(c)) + '</strong>' + C.snapMark()
        ]);
      }

      // Kesan langsung pada chip SLA
      var agents = S.agents(), slaRows = [];
      for (i = 0; i < agents.length; i++) {
        var a = agents[i];
        if (a.slaSource === 'seed') continue;
        slaRows.push([
          C.esc(a.id) + '<div class="small text-muted">' + C.esc(a.name) + '</div>',
          C.esc(W.APP_LABEL[a.appStatus] || a.appStatus),
          C.esc(W.fmt(W.slaDeadline(a))),
          C.slaChipForAgent(a)
        ]);
      }

      ctx.host.innerHTML =
        App.pageTitle('Tetapan (DRAF)',
          'Setiap nilai di sini ialah <strong>titik keputusan owner</strong>. '
          + 'Semua ' + FIELDS.length + ' nilai dalam <code>CONFIG_DRAFT</code> disenaraikan — '
          + 'senarai ini dijana terus daripada data, jadi tiada nilai boleh terlepas.',
          '<button class="btn btn-sm btn-outline-secondary" data-action="restore">Pulih nilai seed</button>',
          'Penutup demo')
        + '<div class="alert alert-warning small">'
        + '<strong>Ini bukan Modul Konfigurasi produksi.</strong> Dalam sistem sebenar setiap '
        + 'perubahan mempunyai versi + audit history supaya keputusan lama terikat kepada polisi '
        + 'ketika ia dibuat (spesifikasi §16). Di sini perubahan hanya disimpan dalam '
        + '<code>localStorage</code> pelayar dan hilang bila Reset Demo ditekan.'
        + '</div>'
        + '<div class="row g-3">'
        + '<div class="col-lg-7">' + body + '</div>'
        + '<div class="col-lg-5">'
        + C.card('Kesan langsung — amaun tuntutan',
            C.table(['Tuntutan', 'Level', 'Yuran tahun 1', 'Kadar', 'Amaun komisen'], rows,
              { empty: 'Tiada tuntutan.' }),
            { right: '<span class="small text-muted">Dikira semula setiap kali nilai berubah</span>',
              cls: 'card-accent' })
        + C.card('Kesan langsung — chip SLA',
            C.table(['Permohonan', 'Status', 'Tarikh akhir', 'SLA'], slaRows,
              { empty: 'Cipta satu permohonan baharu melalui wizard untuk melihat chip SLA yang dikira bergerak.' }),
            { cls: 'card-accent' })
        + C.card('Peranan &amp; akses',
            '<p class="small mb-2">Penukar peranan di bar atas menukar navigasi dan tindakan yang '
            + 'dibenarkan. Tiada login sebenar dalam demo.</p>'
            + '<p class="small text-muted mb-0">Agent · USAINS · USM LEAP · Payment Officer · Super Admin</p>')
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
        if (!out.length) { App.toast('Nilai tidak sah — masukkan nombor dipisahkan koma.', 'danger'); render(); return; }
        setPath(cfg, f.path, out);
      } else if (f.type === 'number') {
        var v = Number(raw);
        if (isNaN(v) || v < 0) { App.toast('Nilai tidak sah — masukkan nombor 0 atau lebih.', 'danger'); render(); return; }
        setPath(cfg, f.path, v);
      } else {
        setPath(cfg, f.path, raw);
      }
      S.save();
      App.toast(f.label + ' → ' + t.value, 'success');
      render();
    });

    App.onAction(ctx.host, function (action) {
      if (action !== 'restore') return;
      var st = S.state();
      st.config = S.clone(NS.SEED.CONFIG_DRAFT);
      S.save();
      App.toast('Semua nilai DRAF dipulihkan kepada nilai seed.', 'success');
      render();
    });

    render();
  });

  // Didedahkan untuk ujian liputan.
  NS.App.settingsFields = collectFields;
})(window);

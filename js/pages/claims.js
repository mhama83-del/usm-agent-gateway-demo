/* claims.js — Tuntutan komisen: senarai, 5 syarat kelayakan, keputusan,
   dan rekod bayaran manual. Amaun DIKIRA dari CONFIG_DRAFT. */
(function (root) {
  'use strict';
  var NS = root.USMDEMO;

  NS.App.register('claims', function (ctx) {
    var S = ctx.S, W = ctx.W, C = ctx.C, App = ctx.App;
    var selectedId = App.qs('id');

    function visibleClaims() {
      var role = S.role();
      var me = S.currentAgent();
      var all = S.claims(), out = [];
      for (var i = 0; i < all.length; i++) {
        if (role === 'agent' && (!me || all[i].agentId !== me.id)) continue;
        out.push(all[i]);
      }
      return out;
    }

    function detailPanel(c) {
      if (!c) return C.card('Butiran tuntutan', C.emptyState('Pilih satu tuntutan daripada senarai.'));

      var ag = S.agent(c.agentId);
      var rate = W.ratePercent(c.level);
      var amount = W.commissionOf(c);

      // kiraan komisen — kelihatan bergerak bila kadar DRAF ditukar
      var calc = '<div class="alert alert-light border small mb-3">'
        + '<div class="fw-semibold mb-1">Kiraan komisen</div>'
        + App.money(c.firstYearFee) + ' (yuran tahun pertama) × <strong>' + rate + '%</strong> '
        + C.draf('Kadar komisen ' + c.level + ' — DRAF') + ' = <strong>' + App.money(amount) + '</strong>'
        + C.snapMark()
        + '<div class="mt-2 pt-2 border-top text-muted">'
        + '<strong>Demo vs produksi:</strong> ' + C.esc(C.SNAPSHOT_NOTE)
        + ' (spesifikasi §15.9 — kadar baharu tidak boleh mengubah claim lama secara senyap.)'
        + '</div>'
        + (c.rateSnapshot != null && c.rateSnapshot !== rate
            ? '<div class="text-danger mt-2">Kadar snapshot ketika claim ini dihantar: <strong>'
              + c.rateSnapshot + '%</strong> — produksi akan membayar ' + App.money(Math.round(c.firstYearFee * c.rateSnapshot / 100))
              + ', bukan ' + App.money(amount) + '.</div>'
            : '')
        + '</div>';

      // 5 syarat kelayakan
      var canEdit = W.can('setEligibility')
        && ['SUBMITTED', 'UNDER_USAINS_REVIEW'].indexOf(c.claimStatus) >= 0;
      var elig = '<div class="mb-3"><div class="fw-semibold small mb-2">5 syarat kelayakan '
        + C.draf('Tempoh pengajian minimum ' + S.config().eligibility.minStudyMonths + ' bulan — DRAF') + '</div>';
      for (var i = 0; i < NS.SEED.ELIGIBILITY_LABELS.length; i++) {
        elig += '<div class="form-check small">'
          + '<input class="form-check-input" type="checkbox" id="el' + i + '" data-elig="1" data-idx="' + i + '"'
          + (c.eligibility[i] ? ' checked' : '') + (canEdit ? '' : ' disabled') + '>'
          + '<label class="form-check-label" for="el' + i + '">' + C.esc(NS.SEED.ELIGIBILITY_LABELS[i]) + '</label>'
          + '</div>';
      }
      elig += '</div>';

      // tindakan
      var acts = [];
      if (W.can('submitClaim') && (c.claimStatus === 'DRAFT' || c.claimStatus === 'RETURNED')) {
        acts.push('<button class="btn btn-sm btn-usm" data-action="submit">Hantar tuntutan</button>');
      }
      if (W.can('startClaimReview') && c.claimStatus === 'SUBMITTED') {
        acts.push('<button class="btn btn-sm btn-outline-usm" data-action="start-review">Mula semakan</button>');
      }
      if (W.can('forwardClaim') && ['SUBMITTED', 'UNDER_USAINS_REVIEW'].indexOf(c.claimStatus) >= 0) {
        acts.push('<button class="btn btn-sm btn-usm" data-action="forward">Hantar untuk keputusan LEAP</button>');
        acts.push('<button class="btn btn-sm btn-outline-warning" data-action="return">Pulangkan</button>');
      }
      if (W.can('decideClaim') && c.claimStatus === 'PENDING_LEAP_DECISION') {
        acts.push('<button class="btn btn-sm btn-usm" data-action="approve">Luluskan</button>');
        acts.push('<button class="btn btn-sm btn-outline-danger" data-action="reject">Tolak</button>');
      }

      var payForm = '';
      if (W.can('recordPayment') && c.claimStatus === 'APPROVED_PENDING_PAYMENT') {
        payForm = '<form id="pay-form" class="row g-2 border-top pt-3">'
          + '<div class="col-12"><div class="fw-semibold small">Rekod bayaran manual</div>'
          + '<div class="form-text">Sistem tidak menjalankan transaksi kewangan. Tetingkap bayaran: '
          + S.config().commission.paymentWindowDays + ' hari ' + C.draf('Tetingkap bayaran — DRAF') + '</div></div>'
          + '<div class="col-sm-6"><label class="form-label small">Amaun (RM) *</label>'
          + '<input class="form-control form-control-sm" name="amount" value="' + amount + '"></div>'
          + '<div class="col-sm-6"><label class="form-label small">Tarikh bayaran</label>'
          + '<input class="form-control form-control-sm" name="dateIso" type="date" value="' + C.esc(S.now()) + '"></div>'
          + '<div class="col-sm-6"><label class="form-label small">Rujukan transaksi *</label>'
          + '<input class="form-control form-control-sm" name="reference" value="TT-2026-00871"></div>'
          + '<div class="col-sm-6"><label class="form-label small">Nota</label>'
          + '<input class="form-control form-control-sm" name="note" value=""></div>'
          + '<div class="col-12"><button type="button" class="btn btn-sm btn-usm" data-action="pay">Rekod bayaran</button></div>'
          + '</form>';
      }

      var paid = c.payment
        ? '<div class="alert alert-success small mt-3 mb-0">Dibayar ' + App.money(c.payment.amount)
          + ' pada ' + C.esc(c.payment.dateLabel) + ' · Rujukan <strong>' + C.esc(c.payment.reference) + '</strong>'
          + ' · Penerima: ' + C.esc(c.payment.payee) + '</div>'
        : '';

      var reason = '';
      if (c.returnReason && c.claimStatus === 'RETURNED') {
        reason = '<div class="alert alert-warning small">Dipulangkan: ' + C.esc(c.returnReason) + '</div>';
      }
      if (c.decisionReason && c.claimStatus === 'REJECTED') {
        reason = '<div class="alert alert-danger small">Ditolak: ' + C.esc(c.decisionReason) + '</div>';
      }

      return C.card('Tuntutan ' + C.esc(c.id) + ' — ' + C.esc(c.student),
        C.claimTrail(c)
        + '<div class="mt-3">' + C.defList([
            ['Status', C.statusBadge(c.claimStatus, W.CLAIM_LABEL[c.claimStatus])],
            ['Ejen', C.esc(ag ? ag.name : c.agentId)],
            ['Program', C.esc(c.program) + ' (' + C.esc(c.level) + ')'],
            ['Dihantar', C.esc(c.submittedLabel)],
            ['Tarikh akhir keputusan', C.esc(c.deadlineLabel) + ' ' + C.slaChipForClaim(c)]
          ]) + '</div>'
        + '<hr>' + calc + reason + elig
        + (acts.length ? '<div class="d-flex gap-2 flex-wrap">' + acts.join('') + '</div>' : '')
        + payForm + paid);
    }

    function render() {
      var list = visibleClaims();
      var rows = [];
      var current = null;
      for (var i = 0; i < list.length; i++) {
        var c = list[i];
        if (selectedId && c.id === selectedId) current = c;
        rows.push([
          '<a href="claims.html?id=' + C.esc(c.id) + '">' + C.esc(c.id) + '</a>',
          '<div class="fw-semibold">' + C.esc(c.student) + '</div><div class="small text-muted">' + C.esc(c.level) + ' · ' + C.esc(c.program) + '</div>',
          C.amountWithNotes(App.money(W.commissionOf(c)), c.level, W.ratePercent(c.level), c.rateSnapshot),
          C.statusBadge(c.claimStatus, W.CLAIM_LABEL[c.claimStatus]),
          C.esc(c.submittedLabel),
          C.slaChipForClaim(c)
        ]);
      }
      if (!current) current = list[0] || null;
      if (current) selectedId = current.id;

      var total = 0;
      for (i = 0; i < list.length; i++) total += W.commissionOf(list[i]);

      ctx.host.innerHTML =
        App.pageTitle('Tuntutan Komisen',
          'Amaun <strong>dikira</strong> daripada yuran tahun pertama × kadar DRAF — '
          + 'tukar kadar dalam <a href="settings-draft.html">Tetapan (DRAF)</a> dan amaun di sini akan berubah.')
        + '<div class="row g-3"><div class="col-lg-7">'
        + C.card('Senarai tuntutan (' + list.length + ')',
            C.table(['ID', 'Pelajar', 'Amaun', 'Status', 'Dihantar', 'SLA'], rows,
              { empty: 'Tiada tuntutan.' }),
            { right: '<span class="small text-muted">Jumlah dipapar: ' + App.money(total) + '</span>' })
        + '</div><div class="col-lg-5">' + detailPanel(current) + '</div></div>';
    }

    App.onAction(ctx.host, function (action, el) {
      var r = null, why;
      var c = S.claim(selectedId);
      if (!c) return;
      if (action === 'submit') {
        r = App.run(function () { return W.submitClaim(c.id); }, 'Tuntutan dihantar.');
      } else if (action === 'start-review') {
        r = App.run(function () { return W.startClaimReview(c.id); }, 'Semakan kelayakan dimulakan.');
      } else if (action === 'forward') {
        r = App.run(function () { return W.forwardClaim(c.id); }, '5 syarat disahkan — dihantar ke LEAP.');
      } else if (action === 'return') {
        why = root.prompt('Sebab memulangkan tuntutan (wajib):', '');
        if (why === null) return;
        r = App.run(function () { return W.returnClaim(c.id, why); }, 'Tuntutan dipulangkan.');
      } else if (action === 'approve') {
        r = App.run(function () { return W.decideClaim(c.id, 'approve'); }, 'Tuntutan diluluskan.');
      } else if (action === 'reject') {
        why = root.prompt('Sebab penolakan (wajib):', '');
        if (why === null) return;
        r = App.run(function () { return W.decideClaim(c.id, 'reject', why); }, 'Tuntutan ditolak.');
      } else if (action === 'pay') {
        var f = App.el('pay-form');
        var d = {};
        var ins = f.querySelectorAll('input');
        for (var i = 0; i < ins.length; i++) { if (ins[i].name) d[ins[i].name] = ins[i].value; }
        r = App.run(function () { return W.recordPayment(c.id, d); }, 'Bayaran direkod. Tuntutan kini PAID.');
      } else { return; }
      if (r) render();
    });

    // checkbox kelayakan perlu 'change', bukan hanya klik
    ctx.host.addEventListener('change', function (ev) {
      var t = ev.target;
      if (!t || !t.getAttribute('data-elig')) return;
      var c = S.claim(selectedId);
      if (!c) return;
      var idx = Number(t.getAttribute('data-idx'));
      var checked = t.checked;
      App.run(function () { return W.setEligibility(c.id, idx, checked); });
      render();
    });

    render();
  });
})(window);

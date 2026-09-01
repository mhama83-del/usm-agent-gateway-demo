/* application-detail.js — Fail permohonan: status trail, dokumen + pembetulan,
   tindakan mengikut peranan, log aktiviti. */
(function (root) {
  'use strict';
  var NS = root.USMDEMO;

  NS.App.register('application-detail', function (ctx) {
    var S = ctx.S, W = ctx.W, C = ctx.C, App = ctx.App;
    var id = App.qs('id');
    var a = id ? S.agent(id) : S.currentAgent();

    if (!a) {
      ctx.host.innerHTML = App.pageTitle('Fail permohonan')
        + '<div class="alert alert-warning">Permohonan tidak dijumpai. '
        + '<a href="dashboard.html">Kembali ke dashboard</a>.</div>';
      return;
    }

    function render() {
      a = S.agent(a.id);
      var role = S.role();
      var isOwner = (role === 'agent');
      var cfg = S.config();

      // --- dokumen ---
      var docs = '';
      for (var i = 0; i < a.docs.length; i++) {
        var d = a.docs[i];
        var actions = '';
        if (W.can('verifyDocument') && d.status !== 'VERIFIED') {
          actions += '<button class="btn btn-sm btn-outline-success" data-action="doc-verify" data-idx="' + i + '">Sahkan</button> ';
        }
        if (W.can('returnDocument') && d.status !== 'RETURNED') {
          actions += '<button class="btn btn-sm btn-outline-warning" data-action="doc-return" data-idx="' + i + '">Pulangkan</button> ';
        }
        if (isOwner && d.status === 'RETURNED') {
          actions += '<button class="btn btn-sm btn-usm" data-action="doc-resubmit" data-idx="' + i + '">Hantar semula</button>';
        }
        docs += '<div class="usm-doc-row d-flex justify-content-between align-items-center gap-2 flex-wrap">'
          + '<div class="flex-grow-1"><div class="small">' + C.esc(d.name) + '</div>'
          + (d.note ? '<div class="small text-danger">' + C.esc(d.note) + '</div>' : '')
          + '</div>'
          + '<div class="d-flex align-items-center gap-2">'
          + C.statusBadge(d.status, W.DOC_LABEL[d.status]) + actions
          + '</div></div>';
      }

      // --- tindakan utama ---
      var acts = [];
      if (W.can('startReview') && a.appStatus === 'SUBMITTED') {
        acts.push('<button class="btn btn-outline-usm btn-sm" data-action="start-review">Mula semakan</button>');
      }
      if (W.can('verifyAndForward') && (a.appStatus === 'UNDER_USAINS_REVIEW' || a.appStatus === 'SUBMITTED')) {
        acts.push('<button class="btn btn-usm btn-sm" data-action="forward">Verify &amp; forward ke LEAP</button>');
      }
      if (W.can('approve') && a.appStatus === 'VERIFIED') {
        acts.push('<button class="btn btn-usm btn-sm" data-action="approve">Luluskan</button>');
        acts.push('<button class="btn btn-outline-danger btn-sm" data-action="reject">Tolak</button>');
      }
      if (a.agreementId) {
        acts.push('<a class="btn btn-outline-usm btn-sm" href="agreement.html?id=' + C.esc(a.agreementId) + '">Buka perjanjian</a>');
      }

      var outstanding = W.docsOutstanding(a);
      var slaDl = a.slaSource === 'seed' ? null : W.slaDeadline(a);

      ctx.host.innerHTML =
        App.pageTitle('Fail ' + C.esc(a.id) + ' — ' + C.esc(a.name),
          C.esc(a.typeLabel) + ' · ' + C.esc(a.country) + ' · Dihantar ' + C.esc(a.submittedLabel),
          acts.join(' '))
        + C.card('Status trail', C.agentTrail(a),
            { right: C.slaChipForAgent(a) })
        + '<div class="row g-3"><div class="col-lg-7">'
        + C.card('Dokumen (' + (a.docs.length - outstanding.length) + '/' + a.docs.length + ' disahkan)', docs)
        + '</div><div class="col-lg-5">'
        + C.card('Maklumat syarikat', C.defList([
            ['Status permohonan', C.statusBadge(a.appStatus, W.APP_LABEL[a.appStatus])],
            ['Status ejen', C.statusBadge(a.agentStatus, W.AGENT_LABEL[a.agentStatus])],
            ['No. pendaftaran', C.esc(a.ssm)],
            ['Paid-up capital', C.esc(a.paidUpCapital) + '<div class="small text-muted">Minimum ' + App.money(cfg.fees.paidUpCapitalMin) + ' ' + C.draf('Paid-up capital minimum — DRAF') + '</div>'],
            ['PIC', C.esc(a.pic)],
            ['Pengarah', C.esc(a.director)],
            ['E-mel rasmi', C.esc(a.officialEmail)],
            ['Alamat berdaftar', C.esc(a.registeredAddress)],
            ['Tarikh tamat', C.esc(a.expiryLabel || '—')],
            ['SLA semakan', cfg.sla.usainsReviewDays + ' hari ' + C.draf('SLA semakan USAINS — DRAF')
              + (slaDl ? '<div class="small text-muted">Tarikh akhir: ' + W.fmt(slaDl) + '</div>'
                       : '<div class="small text-muted">Chip SLA ejen seed dikurasi untuk cerita demo.</div>')]
          ]))
        + C.card('Log aktiviti', activityHtml(a))
        + '</div></div>';
    }

    // Pengendali klik didaftar SEKALI sahaja (render() menulis semula innerHTML).
    App.onAction(ctx.host, function (action, el) {
        var idx = el.getAttribute('data-idx');
        var r;
        if (action === 'start-review') {
          r = App.run(function () { return W.startReview(a.id); }, 'Semakan dimulakan.');
        } else if (action === 'doc-verify') {
          r = App.run(function () { return W.verifyDocument(a.id, Number(idx)); }, 'Dokumen disahkan.');
        } else if (action === 'doc-return') {
          var reason = root.prompt('Sebab memulangkan dokumen ini (wajib):', 'Dokumen tidak lengkap / tidak terkini.');
          if (reason === null) return;
          r = App.run(function () { return W.returnDocument(a.id, Number(idx), reason); }, 'Dokumen dipulangkan kepada ejen.');
        } else if (action === 'doc-resubmit') {
          var note = root.prompt('Nota pembetulan (pilihan):', 'Dokumen terkini dimuat naik.');
          r = App.run(function () { return W.resubmitDocument(a.id, Number(idx), note); }, 'Dokumen dihantar semula.');
        } else if (action === 'forward') {
          r = App.run(function () { return W.verifyAndForward(a.id); }, 'Disahkan dan dihantar ke USM LEAP.');
        } else if (action === 'approve') {
          r = App.run(function () { return W.approve(a.id); }, 'Diluluskan — draf perjanjian dijana.');
        } else if (action === 'reject') {
          var why = root.prompt('Sebab penolakan (wajib):', '');
          if (why === null) return;
          r = App.run(function () { return W.rejectApplication(a.id, why); }, 'Permohonan ditolak.');
        } else { return; }
        if (r) render();
    });

    function activityHtml(a) {
      var h = '';
      var list = a.activities || [];
      for (var i = 0; i < Math.min(list.length, 8); i++) {
        h += '<div class="usm-log-item">'
          + '<div class="small"><strong>' + C.esc(list[i].actor) + '</strong></div>'
          + '<div class="small">' + C.esc(list[i].action) + '</div>'
          + '<small>' + C.esc(list[i].time) + '</small></div>';
      }
      return h || C.emptyState('Tiada aktiviti direkod.');
    }

    render();
  });
})(window);

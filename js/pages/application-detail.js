/* application-detail.js — Fail permohonan: status trail, checklist dokumen +
   pembetulan, tindakan mengikut peranan, dan log aktiviti fail. */
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
    var agentId = a.id;

    function docsHtml(a) {
      var isOwner = (S.role() === 'agent');
      var h = '';
      for (var i = 0; i < a.docs.length; i++) {
        var d = a.docs[i];
        var acts = '';
        if (W.can('verifyDocument') && d.status !== 'VERIFIED') {
          acts += '<button class="btn btn-sm btn-outline-success" data-action="doc-verify" data-idx="' + i + '">Sahkan</button> ';
        }
        if (W.can('returnDocument') && d.status !== 'RETURNED') {
          acts += '<button class="btn btn-sm btn-outline-warning" data-action="doc-return" data-idx="' + i + '">Pulangkan</button> ';
        }
        if (isOwner && d.status === 'RETURNED') {
          acts += '<button class="btn btn-sm btn-usm" data-action="doc-resubmit" data-idx="' + i + '">Hantar semula</button>';
        }
        h += '<div class="usm-doc-row d-flex justify-content-between align-items-start gap-2 flex-wrap">'
          + '<div class="flex-grow-1" style="min-width:180px">'
          + '<div class="small">' + (i + 1) + '. ' + C.esc(d.name) + '</div>'
          + (d.note
              ? '<div class="small ' + (d.status === 'RETURNED' ? 'text-danger' : 'text-muted') + ' mt-1">'
                + (d.status === 'RETURNED' ? 'Sebab: ' : 'Nota ejen: ') + C.esc(d.note) + '</div>'
              : '')
          + '</div>'
          + '<div class="d-flex align-items-center gap-2 flex-wrap">'
          + C.statusBadge(d.status, W.DOC_LABEL[d.status]) + acts
          + '</div></div>';
      }
      return h;
    }

    function activityHtml(a) {
      var h = '';
      var list = a.activities || [];
      for (var i = 0; i < Math.min(list.length, 10); i++) {
        h += '<div class="usm-log-item">'
          + '<div class="small fw-semibold">' + C.esc(list[i].actor) + '</div>'
          + '<div class="small">' + C.esc(list[i].action) + '</div>'
          + '<small>' + C.esc(list[i].time) + '</small></div>';
      }
      return h || C.emptyState('Tiada aktiviti direkod.');
    }

    function render() {
      a = S.agent(agentId);
      var cfg = S.config();
      var outstanding = W.docsOutstanding(a);
      var verified = a.docs.length - outstanding.length;
      var pct = Math.round(verified / a.docs.length * 100);
      var slaDl = a.slaSource === 'seed' ? null : W.slaDeadline(a);

      // --- tindakan utama ikut peranan ---
      var acts = [];
      if (W.can('startReview') && a.appStatus === 'SUBMITTED') {
        acts.push('<button class="btn btn-outline-usm btn-sm" data-action="start-review">Mula semakan</button>');
      }
      if (W.can('verifyAndForward') && ['UNDER_USAINS_REVIEW', 'SUBMITTED'].indexOf(a.appStatus) >= 0) {
        acts.push('<button class="btn btn-usm btn-sm" data-action="forward"'
          + (outstanding.length ? ' title="Masih ada ' + outstanding.length + ' dokumen belum disahkan"' : '')
          + '>Verify &amp; forward ke LEAP</button>');
      }
      if (W.can('approve') && a.appStatus === 'VERIFIED') {
        acts.push('<button class="btn btn-usm btn-sm" data-action="approve">Luluskan</button>');
        acts.push('<button class="btn btn-outline-danger btn-sm" data-action="reject">Tolak</button>');
      }
      if (a.agreementId) {
        acts.push('<a class="btn btn-outline-usm btn-sm" href="agreement.html?id=' + C.esc(a.agreementId) + '">Buka perjanjian</a>');
      }

      // --- amaran keadaan ---
      var banner = '';
      if (a.appStatus === 'RETURNED_TO_AGENT') {
        banner = '<div class="alert alert-warning small">'
          + '<strong>Pembetulan diperlukan.</strong> USAINS memulangkan '
          + outstandingReturned(a) + ' dokumen. Ejen perlu menghantar semula sebelum semakan diteruskan.'
          + '</div>';
      } else if (a.appStatus === 'REJECTED') {
        banner = '<div class="alert alert-danger small"><strong>Permohonan ditolak.</strong> '
          + 'Lihat log aktiviti untuk alasan.</div>';
      } else if (a.agentStatus === 'ACTIVE' || a.agentStatus === 'RENEWED') {
        banner = '<div class="alert alert-success small"><strong>Ejen AKTIF.</strong> '
          + 'Boleh merujuk pelajar dan menghantar tuntutan komisen sehingga '
          + C.esc(a.expiryLabel || '—') + '.</div>';
      }

      ctx.host.innerHTML =
        App.pageTitle(C.esc(a.name),
          C.esc(a.typeLabel) + ' · ' + C.esc(a.country) + ' · Dihantar ' + C.esc(a.submittedLabel),
          acts.join(' '),
          'Fail ' + C.esc(a.id))
        + banner
        + C.card('Status trail 5-peringkat', C.agentTrail(a), {
            right: C.statusBadge(a.appStatus, W.APP_LABEL[a.appStatus]) + ' ' + C.slaChipForAgent(a)
          })
        + '<div class="row g-3"><div class="col-lg-7">'
        + C.card('Checklist dokumen'
            + ' <span class="badge bg-light text-dark border ms-1">' + verified + ' / ' + a.docs.length + ' disahkan</span>',
            '<div class="progress mb-3" style="height:6px" role="progressbar" aria-label="Kemajuan semakan dokumen" '
            + 'aria-valuenow="' + pct + '" aria-valuemin="0" aria-valuemax="100">'
            + '<div class="progress-bar" style="width:' + pct + '%;background:var(--usm-purple)"></div></div>'
            + docsHtml(a))
        + '</div><div class="col-lg-5">'
        + C.card('Maklumat syarikat', C.defList([
            ['Status permohonan', C.statusBadge(a.appStatus, W.APP_LABEL[a.appStatus])],
            ['Status ejen', C.statusBadge(a.agentStatus, W.AGENT_LABEL[a.agentStatus])],
            ['No. pendaftaran', C.esc(a.ssm)],
            ['Paid-up capital', C.esc(a.paidUpCapital)
              + '<div class="small text-muted">Minimum ' + App.money(cfg.fees.paidUpCapitalMin)
              + C.draf('Paid-up capital minimum — DRAF') + '</div>'],
            ['PIC', C.esc(a.pic)],
            ['Pengarah', C.esc(a.director)],
            ['E-mel rasmi', C.esc(a.officialEmail)],
            ['Laman web', C.esc(a.website)],
            ['Alamat berdaftar', C.esc(a.registeredAddress)],
            ['Rekod tatatertib', C.esc(a.conduct)],
            ['Tarikh tamat', C.esc(a.expiryLabel || '—')]
          ]))
        + C.card('SLA', C.defList([
            ['SLA semakan USAINS', cfg.sla.usainsReviewDays + ' hari kalendar ' + C.draf('SLA semakan USAINS — DRAF')],
            ['SLA keputusan LEAP', cfg.sla.leapDecisionDays + ' hari kalendar ' + C.draf('SLA keputusan LEAP — DRAF')],
            ['Keadaan semasa', C.slaChipForAgent(a)],
            ['Tarikh akhir', slaDl
              ? C.esc(W.fmt(slaDl))
              : '<span class="text-muted">Ejen seed — keadaan SLA dikurasi untuk cerita demo</span>']
          ]))
        + C.card('Log aktiviti fail', activityHtml(a))
        + '</div></div>';
    }

    function outstandingReturned(a) {
      var n = 0;
      for (var i = 0; i < a.docs.length; i++) { if (a.docs[i].status === 'RETURNED') n++; }
      return n;
    }

    // Pengendali klik didaftar SEKALI sahaja (render() menulis semula innerHTML).
    App.onAction(ctx.host, function (action, el) {
      var idx = el.getAttribute('data-idx');
      var r;
      if (action === 'start-review') {
        r = App.run(function () { return W.startReview(agentId); }, 'Semakan dimulakan.');
      } else if (action === 'doc-verify') {
        r = App.run(function () { return W.verifyDocument(agentId, Number(idx)); }, 'Dokumen disahkan.');
      } else if (action === 'doc-return') {
        var reason = root.prompt('Sebab memulangkan dokumen ini (wajib):',
          'Dokumen tidak lengkap atau tidak terkini.');
        if (reason === null) return;
        r = App.run(function () { return W.returnDocument(agentId, Number(idx), reason); },
          'Dokumen dipulangkan kepada ejen.');
      } else if (action === 'doc-resubmit') {
        var note = root.prompt('Nota pembetulan (pilihan):', 'Dokumen terkini dimuat naik.');
        if (note === null) return;
        r = App.run(function () { return W.resubmitDocument(agentId, Number(idx), note); },
          'Dokumen dihantar semula.');
      } else if (action === 'forward') {
        r = App.run(function () { return W.verifyAndForward(agentId); },
          'Disahkan dan dihantar ke USM LEAP.');
      } else if (action === 'approve') {
        r = App.run(function () { return W.approve(agentId); },
          'Diluluskan — draf perjanjian dijana.');
      } else if (action === 'reject') {
        var why = root.prompt('Sebab penolakan (wajib):', '');
        if (why === null) return;
        r = App.run(function () { return W.rejectApplication(agentId, why); }, 'Permohonan ditolak.');
      } else { return; }
      if (r) render();
    });

    render();
  });
})(window);

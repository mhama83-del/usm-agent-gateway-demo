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
      ctx.host.innerHTML = App.pageTitle('Application file')
        + '<div class="alert alert-warning">Application not found. '
        + '<a href="dashboard.html">Back to the dashboard</a>.</div>';
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
          acts += '<button class="btn btn-sm btn-outline-success" data-action="doc-verify" data-idx="' + i + '">Verify</button> ';
        }
        if (W.can('returnDocument') && d.status !== 'RETURNED') {
          acts += '<button class="btn btn-sm btn-outline-warning" data-action="doc-return" data-idx="' + i + '">Return</button> ';
        }
        if (isOwner && d.status === 'RETURNED') {
          acts += '<button class="btn btn-sm btn-usm" data-action="doc-resubmit" data-idx="' + i + '">Resubmit</button>';
        }
        h += '<div class="usm-doc-row d-flex justify-content-between align-items-start gap-2 flex-wrap">'
          + '<div class="flex-grow-1" style="min-width:180px">'
          + '<div class="small">' + (i + 1) + '. ' + C.esc(d.name) + '</div>'
          + (d.note
              ? '<div class="small ' + (d.status === 'RETURNED' ? 'text-danger' : 'text-muted') + ' mt-1">'
                + (d.status === 'RETURNED' ? 'Reason: ' : 'Agent note: ') + C.esc(d.note) + '</div>'
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
      return h || C.emptyState('No activity recorded.');
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
        acts.push('<button class="btn btn-outline-usm btn-sm" data-action="start-review">Start review</button>');
      }
      if (W.can('verifyAndForward') && ['UNDER_USAINS_REVIEW', 'SUBMITTED'].indexOf(a.appStatus) >= 0) {
        acts.push('<button class="btn btn-usm btn-sm" data-action="forward"'
          + (outstanding.length ? ' title="' + outstanding.length + ' document(s) are still unverified"' : '')
          + '>Verify &amp; forward to LEAP</button>');
      }
      if (W.can('approve') && a.appStatus === 'VERIFIED') {
        acts.push('<button class="btn btn-usm btn-sm" data-action="approve">Approve</button>');
        acts.push('<button class="btn btn-outline-danger btn-sm" data-action="reject">Reject</button>');
      }
      if (a.agreementId) {
        acts.push('<a class="btn btn-outline-usm btn-sm" href="agreement.html?id=' + C.esc(a.agreementId) + '">Open agreement</a>');
      }

      // --- amaran keadaan ---
      var banner = '';
      if (a.appStatus === 'RETURNED_TO_AGENT') {
        banner = '<div class="alert alert-warning small">'
          + '<strong>Correction required.</strong> USAINS returned '
          + outstandingReturned(a) + ' document(s). The agent must resubmit before the review continues.'
          + '</div>';
      } else if (a.appStatus === 'REJECTED') {
        banner = '<div class="alert alert-danger small"><strong>Application rejected.</strong> '
          + 'See the activity log for the reason.</div>';
      } else if (a.agentStatus === 'ACTIVE' || a.agentStatus === 'RENEWED') {
        banner = '<div class="alert alert-success small"><strong>Agent is ACTIVE.</strong> '
          + 'May refer students and submit commission claims until '
          + C.esc(a.expiryLabel || '—') + '.</div>';
      }

      ctx.host.innerHTML =
        App.pageTitle(C.esc(a.name),
          C.esc(a.typeLabel) + ' · ' + C.esc(a.country) + ' · Submitted ' + C.esc(a.submittedLabel),
          acts.join(' '),
          'File ' + C.esc(a.id))
        + banner
        + C.card('5-stage status trail', C.agentTrail(a), {
            right: C.statusBadge(a.appStatus, W.APP_LABEL[a.appStatus]) + ' ' + C.slaChipForAgent(a)
          })
        + '<div class="row g-3"><div class="col-lg-7">'
        + C.card('Document checklist'
            + ' <span class="badge bg-light text-dark border ms-1">' + verified + ' / ' + a.docs.length + ' verified</span>',
            '<div class="progress mb-3" style="height:6px" role="progressbar" aria-label="Document review progress" '
            + 'aria-valuenow="' + pct + '" aria-valuemin="0" aria-valuemax="100">'
            + '<div class="progress-bar" style="width:' + pct + '%;background:var(--usm-purple)"></div></div>'
            + docsHtml(a))
        + '</div><div class="col-lg-5">'
        + C.card('Company details', C.defList([
            ['Application status', C.statusBadge(a.appStatus, W.APP_LABEL[a.appStatus])],
            ['Agent status', C.statusBadge(a.agentStatus, W.AGENT_LABEL[a.agentStatus])],
            ['Registration no.', C.esc(a.ssm)],
            ['Paid-up capital', C.esc(a.paidUpCapital)
              + '<div class="small text-muted">Minimum ' + App.money(cfg.fees.paidUpCapitalMin)
              + C.draf('Minimum paid-up capital — DRAFT') + '</div>'],
            ['PIC', C.esc(a.pic)],
            ['Director', C.esc(a.director)],
            ['Official e-mail', C.esc(a.officialEmail)],
            ['Website', C.esc(a.website)],
            ['Registered address', C.esc(a.registeredAddress)],
            ['Conduct record', C.esc(a.conduct)],
            ['Expiry date', C.esc(a.expiryLabel || '—')]
          ]))
        + C.card('SLA', C.defList([
            ['USAINS review SLA', cfg.sla.usainsReviewDays + ' calendar days ' + C.draf('USAINS review SLA — DRAFT')],
            ['LEAP decision SLA', cfg.sla.leapDecisionDays + ' calendar days ' + C.draf('LEAP decision SLA — DRAFT')],
            ['Current state', C.slaChipForAgent(a)],
            ['Deadline', slaDl
              ? C.esc(W.fmt(slaDl))
              : '<span class="text-muted">Seed agent — SLA state curated for the demo storyline</span>']
          ]))
        + C.card('File activity log', activityHtml(a))
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
        r = App.run(function () { return W.startReview(agentId); }, 'Review started.');
      } else if (action === 'doc-verify') {
        r = App.run(function () { return W.verifyDocument(agentId, Number(idx)); }, 'Document verified.');
      } else if (action === 'doc-return') {
        var reason = root.prompt('Reason for returning this document (required):',
          'Document is incomplete or out of date.');
        if (reason === null) return;
        r = App.run(function () { return W.returnDocument(agentId, Number(idx), reason); },
          'Document returned to the agent.');
      } else if (action === 'doc-resubmit') {
        var note = root.prompt('Correction note (optional):', 'Latest document uploaded.');
        if (note === null) return;
        r = App.run(function () { return W.resubmitDocument(agentId, Number(idx), note); },
          'Document resubmitted.');
      } else if (action === 'forward') {
        r = App.run(function () { return W.verifyAndForward(agentId); },
          'Verified and forwarded to USM LEAP.');
      } else if (action === 'approve') {
        r = App.run(function () { return W.approve(agentId); },
          'Approved — agreement draft generated.');
      } else if (action === 'reject') {
        var why = root.prompt('Reason for rejection (required):', '');
        if (why === null) return;
        r = App.run(function () { return W.rejectApplication(agentId, why); }, 'Application rejected.');
      } else { return; }
      if (r) render();
    });

    render();
  });
})(window);

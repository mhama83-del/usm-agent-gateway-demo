/* claims.js — Tuntutan komisen: senarai, kiraan amaun, 5 syarat kelayakan,
   keputusan LEAP dan rekod bayaran manual.
   Amaun DIKIRA dari CONFIG_DRAFT — bukan angka mati. */
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

    function calcBlock(c) {
      var rate = W.ratePercent(c.level);
      var amount = W.commissionOf(c);
      var snapDiff = (c.rateSnapshot != null && c.rateSnapshot !== rate);
      return '<div class="alert alert-light border small mb-3">'
        + '<div class="fw-semibold mb-1">Commission calculation</div>'
        + '<div>' + App.money(c.firstYearFee) + ' <span class="text-muted">(first-year fee)</span>'
        + ' × <strong>' + rate + '%</strong> ' + C.draf(c.level + ' commission rate — DRAFT')
        + ' = <strong>' + App.money(amount) + '</strong>' + C.snapMark() + '</div>'
        + '<div class="mt-2 pt-2 border-top text-muted">'
        + '<strong>Demo vs production:</strong> ' + C.esc(C.SNAPSHOT_NOTE)
        + ' Specification §15.9 — a new rate must not silently change older claims.'
        + '</div>'
        + (snapDiff
            ? '<div class="text-danger mt-2"><strong>The rate has changed since this claim was submitted.</strong> '
              + 'Snapshot at submission: ' + c.rateSnapshot + '% → production would pay '
              + App.money(Math.round(c.firstYearFee * c.rateSnapshot / 100))
              + ', not ' + App.money(amount) + '.</div>'
            : '')
        + '</div>';
    }

    function eligBlock(c) {
      var canEdit = W.can('setEligibility')
        && ['SUBMITTED', 'UNDER_USAINS_REVIEW'].indexOf(c.claimStatus) >= 0;
      var n = 0;
      for (var z = 0; z < c.eligibility.length; z++) { if (c.eligibility[z]) n++; }

      var h = '<div class="mb-3">'
        + '<div class="d-flex justify-content-between align-items-center mb-2 flex-wrap gap-1">'
        + '<span class="fw-semibold small">5 eligibility conditions</span>'
        + '<span class="badge ' + (n === 5 ? 'bg-success' : 'bg-light text-dark border') + '">' + n + ' / 5</span>'
        + '</div>'
        + '<div class="small text-muted mb-2">Confirmed manually by an internal officer — not agent input '
        + '(specification §15.8). Minimum study period: ' + S.config().eligibility.minStudyMonths
        + ' months ' + C.draf('Minimum study period — DRAFT') + '</div>';

      for (var i = 0; i < NS.SEED.ELIGIBILITY_LABELS.length; i++) {
        h += '<div class="form-check small">'
          + '<input class="form-check-input" type="checkbox" id="el' + i + '" data-elig="1" data-idx="' + i + '"'
          + (c.eligibility[i] ? ' checked' : '') + (canEdit ? '' : ' disabled') + '>'
          + '<label class="form-check-label" for="el' + i + '">'
          + C.esc(NS.SEED.ELIGIBILITY_LABELS[i]) + '</label></div>';
      }
      if (!canEdit && ['SUBMITTED', 'UNDER_USAINS_REVIEW'].indexOf(c.claimStatus) >= 0) {
        h += '<div class="small text-muted mt-2">Only USAINS can confirm these conditions.</div>';
      }
      return h + '</div>';
    }

    function detailPanel(c) {
      if (!c) return C.card('Claim details', C.emptyState('Select a claim from the list.'));

      var ag = S.agent(c.agentId);
      var amount = W.commissionOf(c);
      var acts = [];

      if (W.can('submitClaim') && ['DRAFT', 'RETURNED'].indexOf(c.claimStatus) >= 0) {
        acts.push('<button class="btn btn-sm btn-usm" data-action="submit">Submit claim</button>');
      }
      if (W.can('startClaimReview') && c.claimStatus === 'SUBMITTED') {
        acts.push('<button class="btn btn-sm btn-outline-usm" data-action="start-review">Start review</button>');
      }
      if (W.can('forwardClaim') && ['SUBMITTED', 'UNDER_USAINS_REVIEW'].indexOf(c.claimStatus) >= 0) {
        acts.push('<button class="btn btn-sm btn-usm" data-action="forward">Send for LEAP decision</button>');
        acts.push('<button class="btn btn-sm btn-outline-warning" data-action="return">Return</button>');
      }
      if (W.can('decideClaim') && c.claimStatus === 'PENDING_LEAP_DECISION') {
        acts.push('<button class="btn btn-sm btn-usm" data-action="approve">Approve</button>');
        acts.push('<button class="btn btn-sm btn-outline-danger" data-action="reject">Reject</button>');
      }

      var payForm = '';
      if (W.can('recordPayment') && c.claimStatus === 'APPROVED_PENDING_PAYMENT') {
        payForm = '<form id="pay-form" class="row g-2 border-top pt-3 mt-3">'
          + '<div class="col-12"><div class="fw-semibold small">Manual payment record</div>'
          + '<div class="form-text">The system does not perform financial transactions (specification §8.8). '
          + 'Payment window: ' + S.config().commission.paymentWindowDays + ' days '
          + C.draf('Payment window after approval — DRAFT') + '</div></div>'
          + '<div class="col-sm-6"><label class="form-label small" for="p-amt">Amount (RM) *</label>'
          + '<input id="p-amt" class="form-control form-control-sm" name="amount" value="' + amount + '" inputmode="numeric"></div>'
          + '<div class="col-sm-6"><label class="form-label small" for="p-date">Payment date</label>'
          + '<input id="p-date" class="form-control form-control-sm" name="dateIso" type="date" value="' + C.esc(S.now()) + '"></div>'
          + '<div class="col-sm-6"><label class="form-label small" for="p-ref">Transaction reference *</label>'
          + '<input id="p-ref" class="form-control form-control-sm" name="reference" value="TT-2026-00871"></div>'
          + '<div class="col-sm-6"><label class="form-label small" for="p-note">Note</label>'
          + '<input id="p-note" class="form-control form-control-sm" name="note" value=""></div>'
          + '<div class="col-12"><button type="button" class="btn btn-sm btn-usm" data-action="pay">Record payment</button></div>'
          + '</form>';
      }

      var paid = c.payment
        ? '<div class="alert alert-success small mt-3 mb-0">'
          + '<div class="fw-semibold">Payment recorded</div>'
          + App.money(c.payment.amount) + ' on ' + C.esc(c.payment.dateLabel)
          + '<br>Reference: <strong>' + C.esc(c.payment.reference) + '</strong>'
          + '<br>Payee: ' + C.esc(c.payment.payee)
          + (c.payment.note ? '<br>Note: ' + C.esc(c.payment.note) : '')
          + '</div>'
        : '';

      var reason = '';
      if (c.returnReason && c.claimStatus === 'RETURNED') {
        reason = '<div class="alert alert-warning small"><strong>Returned to the agent:</strong> '
          + C.esc(c.returnReason) + '</div>';
      }
      if (c.decisionReason && c.claimStatus === 'REJECTED') {
        reason = '<div class="alert alert-danger small"><strong>Rejected:</strong> '
          + C.esc(c.decisionReason) + '</div>';
      }

      return C.card('Claim ' + C.esc(c.id),
        '<div class="mb-3"><div class="fw-semibold">' + C.esc(c.student) + '</div>'
        + '<div class="small text-muted">' + C.esc(c.program) + ' · ' + C.esc(c.level)
        + ' · ' + C.esc(ag ? ag.name : c.agentId) + '</div></div>'
        + C.claimTrail(c)
        + '<div class="mt-3">' + C.defList([
            ['Status', C.statusBadge(c.claimStatus, W.CLAIM_LABEL[c.claimStatus])],
            ['Submitted', C.esc(c.submittedLabel)],
            ['Decision deadline', C.esc(c.deadlineLabel) + ' ' + C.slaChipForClaim(c)]
          ]) + '</div>'
        + '<hr>' + calcBlock(c) + reason + eligBlock(c)
        + (acts.length ? '<div class="d-flex gap-2 flex-wrap">' + acts.join('') + '</div>' : '')
        + payForm + paid);
    }

    function render() {
      var list = visibleClaims();
      var rows = [];
      var current = null;
      var openValue = 0, paidValue = 0;

      for (var i = 0; i < list.length; i++) {
        var c = list[i];
        if (selectedId && c.id === selectedId) current = c;
        if (c.claimStatus === 'PAID') paidValue += W.commissionOf(c);
        else if (['REJECTED', 'CANCELLED'].indexOf(c.claimStatus) < 0) openValue += W.commissionOf(c);

        rows.push([
          '<a href="claims.html?id=' + C.esc(c.id) + '" class="fw-semibold">' + C.esc(c.id) + '</a>'
            + (c.id === selectedId ? ' <span class="badge bg-warning text-dark">SHOWN</span>' : ''),
          '<div class="fw-semibold">' + C.esc(c.student) + '</div>'
            + '<div class="small text-muted">' + C.esc(c.level) + ' · ' + C.esc(c.program) + '</div>',
          C.amountWithNotes(App.money(W.commissionOf(c)), c.level, W.ratePercent(c.level), c.rateSnapshot),
          C.statusBadge(c.claimStatus, W.CLAIM_LABEL[c.claimStatus])
            + '<div class="small text-muted">Stage ' + W.claimStageOf(c) + ' / 5</div>',
          C.esc(c.submittedLabel),
          C.slaChipForClaim(c)
        ]);
      }
      if (!current) current = list[0] || null;
      if (current) selectedId = current.id;

      ctx.host.innerHTML =
        App.pageTitle('Commission Claims',
          'Amounts are <strong>computed</strong> from the first-year fee × the DRAFT rate. '
          + 'Change the rate in <a href="settings-draft.html">Settings (DRAFT)</a> and every amount '
          + 'on this screen updates immediately.',
          '', 'Stage 4 — Active agent')
        + '<div class="row g-3 mb-3">'
        + C.kpi('Claims shown', list.length, 'Filtered by role')
        + C.kpi('Open value', App.money(openValue), 'Not yet paid' + C.snapMark())
        + C.kpi('Paid', App.money(paidValue), 'Manual payment records')
        + C.kpi('Current rate', W.ratePercent('UG') + '% / ' + W.ratePercent('PG') + '%',
            'UG / PG ' + C.draf('Commission rate — DRAFT'))
        + '</div>'
        + '<div class="row g-3"><div class="col-lg-7">'
        + C.card('Claim list <span class="badge bg-light text-dark border ms-1">' + list.length + '</span>',
            C.table(['ID', 'Student', 'Amount', 'Status', 'Submitted', 'SLA'], rows,
              { empty: 'No claims.' }))
        + '</div><div class="col-lg-5">' + detailPanel(current) + '</div></div>';
    }

    App.onAction(ctx.host, function (action, el) {
      var r = null, why;
      var c = S.claim(selectedId);
      if (!c) return;
      if (action === 'submit') {
        r = App.run(function () { return W.submitClaim(c.id); }, 'Claim submitted to USAINS.');
      } else if (action === 'start-review') {
        r = App.run(function () { return W.startClaimReview(c.id); }, 'Eligibility review started.');
      } else if (action === 'forward') {
        r = App.run(function () { return W.forwardClaim(c.id); }, 'All 5 conditions confirmed — sent to LEAP.');
      } else if (action === 'return') {
        why = root.prompt('Reason for returning this claim (required):', '');
        if (why === null) return;
        r = App.run(function () { return W.returnClaim(c.id, why); }, 'Claim returned to the agent.');
      } else if (action === 'approve') {
        r = App.run(function () { return W.decideClaim(c.id, 'approve'); },
          'Claim approved — awaiting a payment record.');
      } else if (action === 'reject') {
        why = root.prompt('Reason for rejecting this claim (required):', '');
        if (why === null) return;
        r = App.run(function () { return W.decideClaim(c.id, 'reject', why); }, 'Claim rejected.');
      } else if (action === 'pay') {
        var f = App.el('pay-form');
        var d = {};
        var ins = f.querySelectorAll('input');
        for (var i = 0; i < ins.length; i++) { if (ins[i].name) d[ins[i].name] = ins[i].value; }
        r = App.run(function () { return W.recordPayment(c.id, d); },
          'Payment recorded. The claim is now PAID.');
      } else { return; }
      if (r) render();
    });

    // Checkbox kelayakan guna 'change' (bukan klik) supaya toggle asal kekal.
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

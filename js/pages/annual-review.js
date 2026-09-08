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
          acts += '<button class="btn btn-sm btn-outline-usm" data-action="open" data-id="' + C.esc(a.id) + '">Open review</button> ';
        }
        if (W.can('renew') && a.agentStatus === 'REVIEW_DUE') {
          acts += '<button class="btn btn-sm btn-usm" data-action="renew" data-id="' + C.esc(a.id) + '">Renew</button> '
                + '<button class="btn btn-sm btn-outline-danger mt-1 mt-md-0" data-action="terminate" data-id="' + C.esc(a.id) + '">Terminate</button>';
        }

        rows.push([
          '<a href="application-detail.html?id=' + C.esc(a.id) + '" class="fw-semibold">' + C.esc(a.id) + '</a>'
            + (focusId === a.id ? '<div><span class="badge bg-warning text-dark mt-1">FOCUS</span></div>' : ''),
          '<div class="fw-semibold">' + C.esc(a.name) + '</div>'
            + '<div class="small text-muted">' + C.esc(a.country) + '</div>',
          C.statusBadge(a.agentStatus, W.AGENT_LABEL[a.agentStatus]),
          C.esc(a.expiryLabel || '—')
            + (band ? '<div class="small text-danger">Within the ' + band + '-day alert window '
                + C.draf('Agreement expiry alerts — DRAFT') + '</div>' : '')
            + (days != null
                ? '<div class="small text-muted">' + (days < 0 ? Math.abs(days) + ' days ago' : days + ' days left') + '</div>'
                : ''),
          '<span class="' + (below ? 'text-danger fw-semibold' : 'text-success fw-semibold') + '">' + refs + '</span>'
            + ' / ' + threshold + C.draf('Referral threshold for renewal — DRAFT')
            + (below ? '<div class="small text-danger">Below threshold</div>'
                     : '<div class="small text-success">Meets threshold</div>'),
          acts || '<span class="text-muted small">—</span>'
        ]);
      }

      var banner = '';
      if (nDue) {
        banner = '<div class="alert alert-warning small"><strong>' + nDue
          + ' agent(s) awaiting an annual review decision.</strong> '
          + 'Termination requires a written reason (specification §15.5).</div>';
      } else if (nBelow) {
        banner = '<div class="alert alert-light border small">' + nBelow
          + ' agent(s) are below the performance threshold of ' + threshold + ' referrals/year '
          + C.draf('Referral threshold for renewal — DRAFT') + '.</div>';
      }

      ctx.host.innerHTML =
        App.pageTitle('Annual Review &amp; Renewal',
          'Expiry alerts at ' + cfg.sla.expiryAlertsDays.join(' / ') + ' days '
          + C.draf('Agreement expiry alerts — DRAFT')
          + ' · Performance threshold ' + threshold + ' referrals/year ' + C.draf('Referral threshold for renewal — DRAFT')
          + ' · Agreement term ' + cfg.renewal.agreementTermYears + ' years '
          + C.draf('Agreement term — DRAFT'),
          '', 'Stage 5 — Annual Review')
        + banner
        + C.card('Agents in review scope <span class="badge bg-light text-dark border ms-1">' + rows.length + '</span>',
            C.table(['ID', 'Agent', 'Status', 'Expiry date', 'Referral performance', 'Action'], rows,
              { empty: 'No agents in annual review scope.' }),
            { right: '<span class="small text-muted">Performance snapshot at the time of decision</span>' })
        + '<div class="row g-3"><div class="col-lg-6">'
        + C.card('Available decisions',
            '<p class="small mb-2">Specification §8.9 lists <strong>RENEW</strong>, '
            + '<strong>NOT_RENEW</strong>, <strong>SUSPEND</strong> and <strong>TERMINATE</strong>.</p>'
            + '<p class="small mb-2">This demo implements <strong>RENEW</strong> and '
            + '<strong>TERMINATE</strong>; termination requires a reason recorded in the activity log.</p>'
            + '<p class="small text-muted mb-0">Renew extends the agreement expiry date by '
            + cfg.renewal.agreementTermYears + ' years ' + C.draf('Agreement term — DRAFT')
            + ' from the current expiry date.</p>')
        + '</div><div class="col-lg-6">'
        + C.card('Effect of termination',
            '<p class="small mb-2">Terminate preserves all history but blocks new referrals '
            + 'and claims — records are not physically deleted (specification §15.12).</p>'
            + '<p class="small text-muted mb-0">A terminated agent stays in this list with '
            + 'status TERMINATED so the audit trail stays complete.</p>')
        + '</div></div>';
    }

    App.onAction(ctx.host, function (action, el) {
      var id = el.getAttribute('data-id');
      var r = null;
      if (action === 'open') {
        r = App.run(function () { return W.openAnnualReview(id); }, 'Annual review opened.');
      } else if (action === 'renew') {
        var note = root.prompt('Renewal decision note (optional):', 'Performance satisfactory.');
        if (note === null) return;
        r = App.run(function () { return W.renew(id, note); }, 'Agent renewed.');
      } else if (action === 'terminate') {
        var why = root.prompt('Reason for termination (required):', '');
        if (why === null) return;
        r = App.run(function () { return W.terminate(id, why); }, 'Agent terminated.');
      } else { return; }
      if (r) render();
    });

    render();
  });
})(window);

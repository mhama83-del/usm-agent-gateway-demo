/* agreement.js — Agreement tracker: status, rekod tandatangan tiga pihak,
   dan kesan pengaktifan ejen.
   PERINGATAN: "tandatangan" hanyalah STATUS demo, bukan e-signature sah. */
(function (root) {
  'use strict';
  var NS = root.USMDEMO;

  var PARTIES = ['usains', 'leap', 'agent'];

  NS.App.register('agreement', function (ctx) {
    var S = ctx.S, W = ctx.W, C = ctx.C, App = ctx.App;
    var wantedId = App.qs('id');

    function pickDefault() {
      var list = S.agreements();
      if (wantedId && S.agreement(wantedId)) return S.agreement(wantedId);
      var cur = S.currentAgent();
      if (cur && cur.agreementId && S.agreement(cur.agreementId)) return S.agreement(cur.agreementId);
      for (var i = 0; i < list.length; i++) {
        if (list[i].status !== 'FULLY_SIGNED') return list[i];
      }
      return list[0] || null;
    }

    var current = pickDefault();
    var currentId = current ? current.id : null;

    function signedCount(agr) {
      var n = 0;
      for (var i = 0; i < PARTIES.length; i++) { if (agr.signatures[PARTIES[i]].signed) n++; }
      return n;
    }

    function signRow(agr, party) {
      var s = agr.signatures[party];
      var action = { usains: 'signUsains', leap: 'signLeap', agent: 'signAgent' }[party];
      var btn = '';
      if (!s.signed && agr.status !== 'FULLY_SIGNED') {
        btn = W.can(action)
          ? '<button class="btn btn-sm btn-usm" data-action="sign" data-party="' + party + '">Sign as ' + W.PARTY_LABEL[party] + '</button>'
          : '<span class="small text-muted">Awaiting ' + W.PARTY_LABEL[party] + '</span>';
      }
      return '<div class="usm-doc-row d-flex justify-content-between align-items-center gap-2 flex-wrap">'
        + '<div><div class="fw-semibold small">' + W.PARTY_LABEL[party] + '</div>'
        + '<div class="small text-muted">'
        + (s.signed ? C.esc(s.by) + ' · ' + C.esc(s.dateLabel) : 'Not yet signed')
        + '</div></div>'
        + '<div class="d-flex align-items-center gap-2 flex-wrap">'
        + (s.signed ? '<span class="badge bg-success">Signed</span>'
                    : '<span class="badge bg-secondary">Awaiting</span>')
        + btn + '</div></div>';
    }

    function render() {
      current = currentId ? S.agreement(currentId) : null;
      var list = S.agreements();
      var rows = [];
      for (var i = 0; i < list.length; i++) {
        var g = list[i];
        var ag = S.agent(g.agentId);
        rows.push([
          '<a href="agreement.html?id=' + C.esc(g.id) + '" class="fw-semibold">' + C.esc(g.id) + '</a>'
            + (g.id === currentId ? ' <span class="badge bg-warning text-dark">SHOWN</span>' : ''),
          '<div class="fw-semibold">' + C.esc(ag ? ag.name : g.agentId) + '</div>'
            + '<div class="small text-muted">' + C.esc(g.agentId) + '</div>',
          C.statusBadge(g.status, W.AGR_LABEL[g.status])
            + '<div class="small text-muted">' + signedCount(g) + ' / 3 signatures</div>',
          C.esc(g.startLabel) + ' → ' + C.esc(g.endLabel)
        ]);
      }

      var detail;
      if (!current) {
        detail = C.card('Agreement',
          C.emptyState('No agreement generated yet. Approve an application in the USM LEAP Console first.'));
      } else {
        var ag2 = S.agent(current.agentId);
        var n = signedCount(current);
        var pct = Math.round(n / 3 * 100);
        var done = current.status === 'FULLY_SIGNED';
        detail = C.card('Agreement ' + C.esc(current.id),
            '<div class="mb-3"><div class="fw-semibold">' + C.esc(ag2 ? ag2.name : current.agentId) + '</div>'
            + '<div class="small text-muted">' + C.esc(current.agentId) + '</div></div>'
            + '<div class="progress mb-3" style="height:6px" role="progressbar" '
            + 'aria-label="Signature progress" aria-valuenow="' + pct + '" aria-valuemin="0" aria-valuemax="100">'
            + '<div class="progress-bar" style="width:' + pct + '%;background:var(--usm-purple)"></div></div>'
            + C.defList([
              ['Status', C.statusBadge(current.status, W.AGR_LABEL[current.status])],
              ['Signatures', n + ' / 3'],
              ['Draft generated', C.esc(current.generatedLabel)],
              ['Term', current.termYears + ' years ' + C.draf('Agreement term — DRAFT')],
              ['Start → End', C.esc(current.startLabel) + ' → ' + C.esc(current.endLabel)],
              ['Application file', '<a href="application-detail.html?id=' + C.esc(current.agentId) + '">'
                + C.esc(current.agentId) + '</a>']
            ])
            + '<hr>'
            + '<div class="fw-semibold small mb-2">Three-party signature record</div>'
            + signRow(current, 'usains') + signRow(current, 'leap') + signRow(current, 'agent')
            + (done
                ? '<div class="alert alert-success small mt-3 mb-0">Fully signed — the agent is now <strong>ACTIVE</strong> '
                  + 'until ' + C.esc(current.endLabel) + '.</div>'
                : '<div class="alert alert-light border small mt-3 mb-0">The agent becomes ACTIVE only after '
                  + 'all three parties have signed (specification §15.4). Signing order is not '
                  + 'enforced in the demo.</div>')
            + '<div class="alert alert-warning small mt-2 mb-0">'
            + '<strong>Not an e-signature.</strong> The "signed" status here is only a status '
            + 'in the demo database. It has no legal effect.'
            + '</div>');
      }

      ctx.host.innerHTML =
        App.pageTitle('Agreement',
          'A LEAP approval generates the agreement draft automatically. '
          + 'The agent becomes ACTIVE only after all three parties have signed.',
          '', 'Stage 3 → 4')
        + '<div class="row g-3"><div class="col-lg-6">' + detail + '</div>'
        + '<div class="col-lg-6">'
        + C.card('All agreements <span class="badge bg-light text-dark border ms-1">' + rows.length + '</span>',
            C.table(['ID', 'Agent', 'Status', 'Term'], rows, { empty: 'No agreements.' }))
        + (current && S.agent(current.agentId)
            ? C.card('Agent status trail', C.agentTrail(S.agent(current.agentId)))
            : '')
        + '</div></div>';
    }

    App.onAction(ctx.host, function (action, el) {
      if (action !== 'sign' || !currentId) return;
      var party = el.getAttribute('data-party');
      var r = App.run(function () { return W.signParty(currentId, party); },
        W.PARTY_LABEL[party] + ' signature recorded.');
      if (r) render();
    });

    render();
  });
})(window);

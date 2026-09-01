/* agreement.js — Agreement tracker: status + rekod tandatangan tiga pihak.
   PERINGATAN: "tandatangan" hanyalah STATUS demo, bukan e-signature sah. */
(function (root) {
  'use strict';
  var NS = root.USMDEMO;

  NS.App.register('agreement', function (ctx) {
    var S = ctx.S, W = ctx.W, C = ctx.C, App = ctx.App;
    var wantedId = App.qs('id');

    function pickDefault() {
      var list = S.agreements();
      if (wantedId) return S.agreement(wantedId);
      var cur = S.currentAgent();
      if (cur && cur.agreementId) return S.agreement(cur.agreementId);
      // yang belum lengkap dahulu
      for (var i = 0; i < list.length; i++) {
        if (list[i].status !== 'FULLY_SIGNED') return list[i];
      }
      return list[0] || null;
    }

    var current = pickDefault();

    function signRow(agr, party) {
      var s = agr.signatures[party];
      var action = { usains: 'signUsains', leap: 'signLeap', agent: 'signAgent' }[party];
      var btn = '';
      if (!s.signed && agr.status !== 'FULLY_SIGNED') {
        btn = W.can(action)
          ? '<button class="btn btn-sm btn-usm" data-action="sign" data-party="' + party + '">Tandatangan sebagai ' + W.PARTY_LABEL[party] + '</button>'
          : '<span class="small text-muted">Menunggu ' + W.PARTY_LABEL[party] + '</span>';
      }
      return '<div class="usm-doc-row d-flex justify-content-between align-items-center gap-2 flex-wrap">'
        + '<div><div class="fw-semibold small">' + W.PARTY_LABEL[party] + '</div>'
        + '<div class="small text-muted">' + (s.signed ? C.esc(s.by) + ' · ' + C.esc(s.dateLabel) : 'Belum ditandatangani') + '</div></div>'
        + '<div class="d-flex align-items-center gap-2">'
        + (s.signed ? '<span class="badge bg-success">Ditandatangani</span>' : '<span class="badge bg-secondary">Menunggu</span>')
        + btn + '</div></div>';
    }

    function render() {
      var list = S.agreements();
      var rows = [];
      for (var i = 0; i < list.length; i++) {
        var g = list[i];
        var ag = S.agent(g.agentId);
        rows.push([
          '<a href="agreement.html?id=' + C.esc(g.id) + '">' + C.esc(g.id) + '</a>',
          C.esc(ag ? ag.name : g.agentId),
          C.statusBadge(g.status, W.AGR_LABEL[g.status]),
          C.esc(g.startLabel) + ' → ' + C.esc(g.endLabel),
          g.termYears + ' tahun ' + C.draf('Tempoh perjanjian — DRAF')
        ]);
      }

      var detail;
      if (!current) {
        detail = C.card('Perjanjian', C.emptyState('Tiada perjanjian dijana lagi. Luluskan satu permohonan dahulu.'));
      } else {
        var ag = S.agent(current.agentId);
        detail = C.card('Perjanjian ' + C.esc(current.id) + ' — ' + C.esc(ag ? ag.name : current.agentId),
            C.defList([
              ['Status', C.statusBadge(current.status, W.AGR_LABEL[current.status])],
              ['Draf dijana', C.esc(current.generatedLabel)],
              ['Tempoh', current.termYears + ' tahun ' + C.draf('Tempoh perjanjian — DRAF')],
              ['Mula → Tamat', C.esc(current.startLabel) + ' → ' + C.esc(current.endLabel)],
              ['Ejen', '<a href="application-detail.html?id=' + C.esc(current.agentId) + '">' + C.esc(current.agentId) + '</a>']
            ])
            + '<hr>'
            + signRow(current, 'usains') + signRow(current, 'leap') + signRow(current, 'agent')
            + '<div class="alert alert-warning small mt-3 mb-0">'
            + 'Status <strong>"ditandatangani"</strong> dalam demo ini hanyalah satu status. '
            + 'Ia <strong>bukan</strong> e-signature yang sah di sisi undang-undang.'
            + '</div>');
      }

      ctx.host.innerHTML =
        App.pageTitle('Perjanjian', 'Ejen menjadi AKTIF hanya selepas ketiga-tiga pihak menandatangani.')
        + '<div class="row g-3"><div class="col-lg-6">' + detail + '</div>'
        + '<div class="col-lg-6">'
        + C.card('Semua perjanjian', C.table(['ID', 'Ejen', 'Status', 'Tempoh', 'Terma'], rows,
            { empty: 'Tiada perjanjian.' }))
        + (current && S.agent(current.agentId)
            ? C.card('Status trail ejen', C.agentTrail(S.agent(current.agentId))) : '')
        + '</div></div>';
    }

    App.onAction(ctx.host, function (action, el) {
      if (action !== 'sign' || !current) return;
      var party = el.getAttribute('data-party');
      var r = App.run(function () { return W.signParty(current.id, party); },
        'Tandatangan ' + W.PARTY_LABEL[party] + ' direkod.');
      if (r) { current = S.agreement(current.id); render(); }
    });

    render();
  });
})(window);

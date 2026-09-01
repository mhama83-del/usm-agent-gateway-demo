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
          ? '<button class="btn btn-sm btn-usm" data-action="sign" data-party="' + party + '">Tandatangan sebagai ' + W.PARTY_LABEL[party] + '</button>'
          : '<span class="small text-muted">Menunggu ' + W.PARTY_LABEL[party] + '</span>';
      }
      return '<div class="usm-doc-row d-flex justify-content-between align-items-center gap-2 flex-wrap">'
        + '<div><div class="fw-semibold small">' + W.PARTY_LABEL[party] + '</div>'
        + '<div class="small text-muted">'
        + (s.signed ? C.esc(s.by) + ' · ' + C.esc(s.dateLabel) : 'Belum ditandatangani')
        + '</div></div>'
        + '<div class="d-flex align-items-center gap-2 flex-wrap">'
        + (s.signed ? '<span class="badge bg-success">Ditandatangani</span>'
                    : '<span class="badge bg-secondary">Menunggu</span>')
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
            + (g.id === currentId ? ' <span class="badge bg-warning text-dark">DIPAPAR</span>' : ''),
          '<div class="fw-semibold">' + C.esc(ag ? ag.name : g.agentId) + '</div>'
            + '<div class="small text-muted">' + C.esc(g.agentId) + '</div>',
          C.statusBadge(g.status, W.AGR_LABEL[g.status])
            + '<div class="small text-muted">' + signedCount(g) + ' / 3 tandatangan</div>',
          C.esc(g.startLabel) + ' → ' + C.esc(g.endLabel)
        ]);
      }

      var detail;
      if (!current) {
        detail = C.card('Perjanjian',
          C.emptyState('Tiada perjanjian dijana lagi. Luluskan satu permohonan di Konsol USM LEAP dahulu.'));
      } else {
        var ag2 = S.agent(current.agentId);
        var n = signedCount(current);
        var pct = Math.round(n / 3 * 100);
        var done = current.status === 'FULLY_SIGNED';
        detail = C.card('Perjanjian ' + C.esc(current.id),
            '<div class="mb-3"><div class="fw-semibold">' + C.esc(ag2 ? ag2.name : current.agentId) + '</div>'
            + '<div class="small text-muted">' + C.esc(current.agentId) + '</div></div>'
            + '<div class="progress mb-3" style="height:6px" role="progressbar" '
            + 'aria-label="Kemajuan tandatangan" aria-valuenow="' + pct + '" aria-valuemin="0" aria-valuemax="100">'
            + '<div class="progress-bar" style="width:' + pct + '%;background:var(--usm-purple)"></div></div>'
            + C.defList([
              ['Status', C.statusBadge(current.status, W.AGR_LABEL[current.status])],
              ['Tandatangan', n + ' / 3'],
              ['Draf dijana', C.esc(current.generatedLabel)],
              ['Tempoh', current.termYears + ' tahun ' + C.draf('Tempoh perjanjian — DRAF')],
              ['Mula → Tamat', C.esc(current.startLabel) + ' → ' + C.esc(current.endLabel)],
              ['Fail permohonan', '<a href="application-detail.html?id=' + C.esc(current.agentId) + '">'
                + C.esc(current.agentId) + '</a>']
            ])
            + '<hr>'
            + '<div class="fw-semibold small mb-2">Rekod tandatangan tiga pihak</div>'
            + signRow(current, 'usains') + signRow(current, 'leap') + signRow(current, 'agent')
            + (done
                ? '<div class="alert alert-success small mt-3 mb-0">Lengkap ditandatangani — ejen kini <strong>AKTIF</strong> '
                  + 'sehingga ' + C.esc(current.endLabel) + '.</div>'
                : '<div class="alert alert-light border small mt-3 mb-0">Ejen menjadi AKTIF hanya selepas '
                  + 'ketiga-tiga pihak menandatangani (spesifikasi §15.4). Urutan tandatangan tidak '
                  + 'dikuatkuasakan dalam demo.</div>')
            + '<div class="alert alert-warning small mt-2 mb-0">'
            + '<strong>Bukan e-signature.</strong> Status "ditandatangani" di sini hanyalah satu status '
            + 'dalam pangkalan data demo. Ia tiada kesan undang-undang.'
            + '</div>');
      }

      ctx.host.innerHTML =
        App.pageTitle('Perjanjian',
          'Kelulusan LEAP menjana draf perjanjian secara automatik. '
          + 'Ejen menjadi AKTIF hanya selepas ketiga-tiga pihak menandatangani.',
          '', 'Peringkat 3 → 4')
        + '<div class="row g-3"><div class="col-lg-6">' + detail + '</div>'
        + '<div class="col-lg-6">'
        + C.card('Semua perjanjian <span class="badge bg-light text-dark border ms-1">' + rows.length + '</span>',
            C.table(['ID', 'Ejen', 'Status', 'Tempoh'], rows, { empty: 'Tiada perjanjian.' }))
        + (current && S.agent(current.agentId)
            ? C.card('Status trail ejen', C.agentTrail(S.agent(current.agentId)))
            : '')
        + '</div></div>';
    }

    App.onAction(ctx.host, function (action, el) {
      if (action !== 'sign' || !currentId) return;
      var party = el.getAttribute('data-party');
      var r = App.run(function () { return W.signParty(currentId, party); },
        'Tandatangan ' + W.PARTY_LABEL[party] + ' direkod.');
      if (r) render();
    });

    render();
  });
})(window);

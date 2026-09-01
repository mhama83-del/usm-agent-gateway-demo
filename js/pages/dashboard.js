/* dashboard.js — Dashboard mengikut peranan: KPI, langkah seterusnya,
   baris gilir tindakan, notifikasi dan log aktiviti. */
(function (root) {
  'use strict';
  var NS = root.USMDEMO;

  function link(text, page, params, cls) {
    var q = (params && params.id) ? ('?id=' + encodeURIComponent(params.id)) : '';
    return '<a class="btn btn-sm ' + (cls || 'btn-usm') + '" href="' + page + '.html' + q + '">'
      + text + '</a>';
  }

  // Satu ayat: apa yang peranan ini patut buat sekarang.
  function nextStepFor(ctx) {
    var S = ctx.S;
    var role = S.role();
    var a = S.currentAgent();
    var agents = S.agents();
    var claims = S.claims();
    var i;

    if (role === 'agent') {
      if (!a || a.appStatus === 'REJECTED') {
        return { t: 'Hantar permohonan ejen baharu', d: 'Wizard 4 langkah: syarikat → PIC → dokumen → deklarasi ABC.', b: link('Buka wizard permohonan', 'application-wizard') };
      }
      if (a.appStatus === 'RETURNED_TO_AGENT') {
        return { t: 'USAINS memulangkan dokumen — betulkan sekarang', d: 'Buka fail dan hantar semula dokumen yang ditanda.', b: link('Buka fail permohonan', 'application-detail', { id: a.id }) };
      }
      var agr = S.agreementForAgent(a.id);
      if (agr && agr.status !== 'FULLY_SIGNED' && !agr.signatures.agent.signed) {
        return { t: 'Tandatangan perjanjian anda', d: 'Ejen menjadi AKTIF selepas ketiga-tiga pihak menandatangani.', b: link('Buka perjanjian', 'agreement', { id: agr.id }) };
      }
      if (a.agentStatus === 'ACTIVE' || a.agentStatus === 'RENEWED') {
        for (i = 0; i < claims.length; i++) {
          if (claims[i].agentId === a.id && ['DRAFT', 'RETURNED'].indexOf(claims[i].claimStatus) >= 0) {
            return { t: 'Hantar tuntutan ' + claims[i].id, d: 'Draf tuntutan sedia untuk dihantar kepada USAINS.', b: link('Buka tuntutan', 'claims', { id: claims[i].id }) };
          }
        }
        return { t: 'Rujuk pelajar baharu, atau bina tuntutan komisen', d: 'Tuntutan hanya boleh dibina selepas rujukan berstatus "Yuran dibayar".', b: link('Buka rujukan pelajar', 'referrals') };
      }
      return { t: 'Menunggu tindakan pihak USM', d: 'Status semasa: ' + (ctx.W.APP_LABEL[a.appStatus] || a.appStatus) + '.', b: link('Buka fail permohonan', 'application-detail', { id: a.id }) };
    }

    if (role === 'usains') {
      for (i = 0; i < agents.length; i++) {
        if (['SUBMITTED', 'UNDER_USAINS_REVIEW'].indexOf(agents[i].appStatus) >= 0) {
          return { t: 'Semak dokumen: ' + agents[i].name, d: 'Sahkan setiap dokumen, atau pulangkan dengan sebab.', b: link('Buka konsol USAINS', 'usains-console') };
        }
      }
      for (i = 0; i < claims.length; i++) {
        if (['SUBMITTED', 'UNDER_USAINS_REVIEW'].indexOf(claims[i].claimStatus) >= 0) {
          return { t: 'Semak kelayakan tuntutan ' + claims[i].id, d: '5 syarat kelayakan perlu disahkan sebelum boleh forward.', b: link('Buka tuntutan', 'claims', { id: claims[i].id }) };
        }
      }
      return { t: 'Tiada kes menunggu semakan USAINS', d: 'Baris gilir kosong buat masa ini.', b: link('Buka konsol USAINS', 'usains-console', null, 'btn-outline-usm') };
    }

    if (role === 'leap') {
      for (i = 0; i < agents.length; i++) {
        if (agents[i].appStatus === 'VERIFIED') {
          return { t: 'Keputusan kelulusan: ' + agents[i].name, d: 'Kelulusan menjana draf perjanjian secara automatik.', b: link('Buka konsol LEAP', 'leap-console') };
        }
      }
      for (i = 0; i < claims.length; i++) {
        if (claims[i].claimStatus === 'PENDING_LEAP_DECISION') {
          return { t: 'Keputusan tuntutan ' + claims[i].id, d: 'Lulus atau tolak; penolakan memerlukan alasan.', b: link('Buka tuntutan', 'claims', { id: claims[i].id }) };
        }
      }
      for (i = 0; i < agents.length; i++) {
        if (agents[i].agentStatus === 'REVIEW_DUE') {
          return { t: 'Annual review: ' + agents[i].name, d: 'Semak prestasi rujukan, kemudian renew atau terminate.', b: link('Buka annual review', 'annual-review') };
        }
      }
      return { t: 'Tiada kes menunggu keputusan LEAP', d: 'Baris gilir kosong buat masa ini.', b: link('Buka konsol LEAP', 'leap-console', null, 'btn-outline-usm') };
    }

    if (role === 'payment') {
      for (i = 0; i < claims.length; i++) {
        if (claims[i].claimStatus === 'APPROVED_PENDING_PAYMENT') {
          return { t: 'Rekod bayaran ' + claims[i].id + ' — ' + ctx.App.money(ctx.W.commissionOf(claims[i])),
            d: 'Amaun, tarikh dan rujukan transaksi wajib direkod.', b: link('Buka tuntutan', 'claims', { id: claims[i].id }) };
        }
      }
      return { t: 'Tiada tuntutan menunggu bayaran', d: 'Bayaran hanya boleh direkod selepas LEAP meluluskan tuntutan.', b: link('Buka tuntutan', 'claims', null, 'btn-outline-usm') };
    }

    return { t: 'Super Admin — semua skrin dan tindakan terbuka',
      d: 'Guna peranan ini untuk melompat ke mana-mana bahagian demo.',
      b: link('Buka Tetapan (DRAF)', 'settings-draft', null, 'btn-outline-usm') };
  }

  NS.App.register('dashboard', function (ctx) {
    var S = ctx.S, W = ctx.W, C = ctx.C, App = ctx.App;
    var agents = S.agents(), claims = S.claims();
    var role = S.role();
    var cfg = S.config();
    var i, a, c;

    // --- KPI ---
    var nActive = 0, nPending = 0, nOverdue = 0, nReview = 0;
    var claimValue = 0, nClaimOpen = 0, paidValue = 0;
    for (i = 0; i < agents.length; i++) {
      a = agents[i];
      if (a.agentStatus === 'ACTIVE' || a.agentStatus === 'RENEWED') nActive++;
      if (a.agentStatus === 'PENDING') nPending++;
      if (W.slaOf(a) === 'late') nOverdue++;
      if (a.agentStatus === 'REVIEW_DUE') nReview++;
    }
    for (i = 0; i < claims.length; i++) {
      c = claims[i];
      if (c.claimStatus === 'PAID') { paidValue += W.commissionOf(c); continue; }
      if (['REJECTED', 'DRAFT', 'CANCELLED'].indexOf(c.claimStatus) < 0) {
        nClaimOpen++;
        claimValue += W.commissionOf(c);
      }
    }

    var kpis = '<div class="row g-3 mb-3">'
      + C.kpi('Ejen aktif', nActive, nReview + ' dalam annual review')
      + C.kpi('Permohonan dalam proses', nPending,
          nOverdue ? '<span class="text-danger fw-semibold">' + nOverdue + ' melebihi SLA</span>' : 'Semua dalam SLA')
      + C.kpi('Tuntutan terbuka', nClaimOpen,
          App.money(claimValue) + C.draf('Amaun dikira dari kadar DRAF') + C.snapMark())
      + C.kpi('Telah dibayar', App.money(paidValue).replace('RM ', 'RM<span class="fs-6">&nbsp;</span>'),
          'Rekod bayaran manual sahaja')
      + '</div>';

    // --- Langkah seterusnya ---
    var next = nextStepFor(ctx);
    var nextCard = '<div class="card card-accent mb-3">'
      + '<div class="card-body d-flex justify-content-between align-items-center flex-wrap gap-3">'
      + '<div><div class="breadcrumb-mini mb-1">Langkah seterusnya untuk ' + C.esc(S.roleInfo().label) + '</div>'
      + '<div class="fw-semibold">' + C.esc(next.t) + '</div>'
      + '<div class="small text-muted">' + C.esc(next.d) + '</div></div>'
      + '<div>' + next.b + '</div></div></div>';

    // --- Senarai ejen ---
    var rows = [];
    for (i = 0; i < agents.length; i++) {
      a = agents[i];
      if (role === 'agent' && a.id !== (S.currentAgent() || {}).id) continue;
      rows.push([
        '<a href="application-detail.html?id=' + C.esc(a.id) + '" class="fw-semibold">' + C.esc(a.id) + '</a>'
          + (a.isDemoCreated ? '<div><span class="badge bg-warning text-dark mt-1">BARU DALAM DEMO</span></div>' : ''),
        '<div class="fw-semibold">' + C.esc(a.name) + '</div>'
          + '<div class="small text-muted">' + C.esc(a.country) + ' · ' + C.esc(a.typeLabel) + '</div>',
        C.statusBadge(a.appStatus, W.APP_LABEL[a.appStatus] || a.appStatus)
          + '<div class="mt-1">' + C.statusBadge(a.agentStatus, W.AGENT_LABEL[a.agentStatus] || a.agentStatus) + '</div>',
        '<span class="badge bg-light text-dark border">' + W.stageOf(a) + ' / 5</span>'
          + '<div class="small text-muted">' + C.esc(NS.SEED.STAGE_LABELS[W.stageOf(a) - 1]) + '</div>',
        C.slaChipForAgent(a),
        C.esc(a.expiryLabel || '—')
      ]);
    }
    var agentTable = C.card('Ejen &amp; permohonan <span class="badge bg-light text-dark border ms-1">' + rows.length + '</span>',
      C.table(['ID', 'Ejen', 'Status', 'Peringkat', 'SLA', 'Tamat'], rows,
        { empty: 'Tiada ejen untuk peranan ini.' }));

    // --- Notifikasi peranan ---
    var notes = C.topbar.visibleNotifications(), notifHtml = '';
    for (i = 0; i < Math.min(notes.length, 4); i++) {
      var nt = notes[i];
      notifHtml += '<div class="usm-doc-row">'
        + '<div class="small fw-semibold">' + C.esc(nt.title)
        + (nt.read ? '' : ' <span class="badge bg-danger">baharu</span>') + '</div>'
        + '<div class="small text-muted">' + C.esc(nt.body) + '</div>'
        + '<div class="small text-muted">' + C.esc(nt.timeLabel)
        + (nt.link ? ' · <a href="' + C.esc(nt.link) + '">Buka</a>' : '') + '</div>'
        + '</div>';
    }
    var notifCard = C.card('Notifikasi (UI sahaja)',
      notifHtml || C.emptyState('Tiada notifikasi untuk peranan ini.'),
      { right: '<span class="small text-muted">Tiada e-mel/SMS sebenar</span>' });

    // --- Log aktiviti ---
    var log = S.log(), logHtml = '';
    for (i = 0; i < Math.min(log.length, 6); i++) {
      var l = log[i];
      logHtml += '<div class="usm-log-item">'
        + '<div class="small"><strong>' + C.esc(l.actor) + '</strong> · '
        + '<span class="font-monospace">' + C.esc(l.entityId) + '</span></div>'
        + '<div class="small">' + C.esc(l.note) + '</div>'
        + '<small>' + C.esc(l.tsLabel) + ' · ' + C.esc(l.from) + ' → ' + C.esc(l.to) + '</small>'
        + '</div>';
    }
    var logCard = C.card('Log aktiviti terkini', logHtml || C.emptyState('Tiada aktiviti.'));

    ctx.host.innerHTML =
      App.pageTitle('Dashboard',
        C.esc(S.roleInfo().person) + ' · ' + C.esc(S.roleInfo().title)
        + ' · Ambang prestasi ' + cfg.renewal.minReferralsPerYear + ' rujukan/tahun '
        + C.draf('Ambang rujukan untuk renew — DRAF'),
        '', 'Peranan aktif: ' + C.esc(S.roleInfo().label))
      + kpis + nextCard
      + '<div class="row g-3">'
      + '<div class="col-lg-8">' + agentTable + '</div>'
      + '<div class="col-lg-4">' + notifCard + logCard + '</div>'
      + '</div>';
  });
})(window);

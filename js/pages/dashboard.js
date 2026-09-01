/* dashboard.js — Dashboard mengikut peranan + panduan golden path. */
(function (root) {
  'use strict';
  var NS = root.USMDEMO;

  function nextStepFor(ctx) {
    var S = ctx.S, W = ctx.W, C = ctx.C;
    var role = S.role();
    var a = S.currentAgent();
    var agents = S.agents();
    var claims = S.claims();
    var i;

    function link(text, page, params) {
      var q = '';
      if (params && params.id) q = '?id=' + encodeURIComponent(params.id);
      return '<a class="btn btn-sm btn-usm" href="' + page + '.html' + q + '">' + text + '</a>';
    }

    if (role === 'agent') {
      if (!a || a.appStatus === 'REJECTED') return { t: 'Hantar permohonan baharu', b: link('Buka wizard permohonan', 'application-wizard') };
      if (a.appStatus === 'RETURNED_TO_AGENT') return { t: 'USAINS memulangkan dokumen — betulkan sekarang', b: link('Buka fail permohonan', 'application-detail', { id: a.id }) };
      var agr = S.agreementForAgent(a.id);
      if (agr && agr.status !== 'FULLY_SIGNED' && !agr.signatures.agent.signed) {
        return { t: 'Tandatangan perjanjian anda', b: link('Buka perjanjian', 'agreement', { id: agr.id }) };
      }
      if (a.agentStatus === 'ACTIVE' || a.agentStatus === 'RENEWED') {
        for (i = 0; i < claims.length; i++) {
          if (claims[i].agentId === a.id && claims[i].claimStatus === 'DRAFT') {
            return { t: 'Hantar draf tuntutan ' + claims[i].id, b: link('Buka tuntutan', 'claims') };
          }
        }
        return { t: 'Rujuk pelajar baharu atau bina tuntutan komisen', b: link('Buka rujukan pelajar', 'referrals') };
      }
      return { t: 'Menunggu tindakan pihak USM — pantau status fail anda', b: link('Buka fail permohonan', 'application-detail', { id: a.id }) };
    }

    if (role === 'usains') {
      for (i = 0; i < agents.length; i++) {
        if (agents[i].appStatus === 'SUBMITTED' || agents[i].appStatus === 'UNDER_USAINS_REVIEW') {
          return { t: 'Semak dokumen ' + agents[i].name, b: link('Buka konsol USAINS', 'usains-console') };
        }
      }
      for (i = 0; i < claims.length; i++) {
        if (claims[i].claimStatus === 'SUBMITTED' || claims[i].claimStatus === 'UNDER_USAINS_REVIEW') {
          return { t: 'Semak kelayakan tuntutan ' + claims[i].id, b: link('Buka tuntutan', 'claims') };
        }
      }
      return { t: 'Tiada kes menunggu semakan USAINS', b: link('Buka konsol USAINS', 'usains-console') };
    }

    if (role === 'leap') {
      for (i = 0; i < agents.length; i++) {
        if (agents[i].appStatus === 'VERIFIED') {
          return { t: 'Keputusan kelulusan untuk ' + agents[i].name, b: link('Buka konsol LEAP', 'leap-console') };
        }
      }
      for (i = 0; i < claims.length; i++) {
        if (claims[i].claimStatus === 'PENDING_LEAP_DECISION') {
          return { t: 'Keputusan tuntutan ' + claims[i].id, b: link('Buka tuntutan', 'claims') };
        }
      }
      for (i = 0; i < agents.length; i++) {
        if (agents[i].agentStatus === 'REVIEW_DUE') {
          return { t: 'Annual review: ' + agents[i].name, b: link('Buka annual review', 'annual-review') };
        }
      }
      return { t: 'Tiada kes menunggu keputusan LEAP', b: link('Buka konsol LEAP', 'leap-console') };
    }

    if (role === 'payment') {
      for (i = 0; i < claims.length; i++) {
        if (claims[i].claimStatus === 'APPROVED_PENDING_PAYMENT') {
          return { t: 'Rekod bayaran untuk ' + claims[i].id + ' (' + ctx.App.money(W.commissionOf(claims[i])) + ')', b: link('Buka tuntutan', 'claims') };
        }
      }
      return { t: 'Tiada tuntutan menunggu bayaran', b: link('Buka tuntutan', 'claims') };
    }

    return { t: 'Super Admin — semua skrin dan tindakan terbuka', b: link('Buka Tetapan (DRAF)', 'settings-draft') + ' ' + C.esc('') };
  }

  NS.App.register('dashboard', function (ctx) {
    var S = ctx.S, W = ctx.W, C = ctx.C, App = ctx.App;
    var agents = S.agents(), claims = S.claims(), refs = S.referrals();
    var role = S.role();
    var i, a, c;

    // --- KPI ---
    var nActive = 0, nPending = 0, nOverdue = 0, nReview = 0, claimValue = 0, nClaimOpen = 0;
    for (i = 0; i < agents.length; i++) {
      a = agents[i];
      if (a.agentStatus === 'ACTIVE' || a.agentStatus === 'RENEWED') nActive++;
      if (a.agentStatus === 'PENDING') nPending++;
      if (W.slaOf(a) === 'late') nOverdue++;
      if (a.agentStatus === 'REVIEW_DUE') nReview++;
    }
    for (i = 0; i < claims.length; i++) {
      c = claims[i];
      if (c.claimStatus !== 'PAID' && c.claimStatus !== 'REJECTED' && c.claimStatus !== 'DRAFT') {
        nClaimOpen++;
        claimValue += W.commissionOf(c);
      }
    }

    var kpis = '<div class="row g-3 mb-3">'
      + C.kpi('Ejen aktif', nActive, 'Termasuk yang diperbaharui')
      + C.kpi('Permohonan dalam proses', nPending, nOverdue + ' melebihi SLA')
      + C.kpi('Tuntutan terbuka', nClaimOpen, App.money(claimValue) + ' ' + C.draf('Amaun dikira dari kadar DRAF'))
      + C.kpi('Annual review', nReview, 'Ambang ' + S.config().renewal.minReferralsPerYear + ' rujukan/tahun ' + C.draf())
      + '</div>';

    // --- Langkah seterusnya ---
    var next = nextStepFor(ctx);
    var nextCard = '<div class="card mb-3 border-2" style="border-color:var(--usm-purple)">'
      + '<div class="card-body d-flex justify-content-between align-items-center flex-wrap gap-2">'
      + '<div><div class="text-muted small text-uppercase" style="letter-spacing:.05em">Langkah seterusnya untuk ' + C.esc(S.roleInfo().label) + '</div>'
      + '<div class="fw-semibold">' + C.esc(next.t) + '</div></div>'
      + '<div>' + next.b + '</div></div></div>';

    // --- Senarai ejen ---
    var rows = [];
    for (i = 0; i < agents.length; i++) {
      a = agents[i];
      if (role === 'agent' && a.id !== (S.currentAgent() || {}).id) continue;
      rows.push([
        '<a href="application-detail.html?id=' + C.esc(a.id) + '">' + C.esc(a.id) + '</a>'
          + (a.isDemoCreated ? ' <span class="badge bg-usm" style="background:var(--usm-purple)">BARU</span>' : ''),
        '<div class="fw-semibold">' + C.esc(a.name) + '</div><div class="small text-muted">' + C.esc(a.country) + '</div>',
        C.statusBadge(a.appStatus, W.APP_LABEL[a.appStatus] || a.appStatus),
        C.statusBadge(a.agentStatus, W.AGENT_LABEL[a.agentStatus] || a.agentStatus),
        'Peringkat ' + W.stageOf(a) + '/5',
        C.slaChipForAgent(a),
        C.esc(a.expiryLabel || '—')
      ]);
    }
    var agentTable = C.card('Ejen &amp; permohonan',
      C.table(['ID', 'Ejen', 'Status permohonan', 'Status ejen', 'Peringkat', 'SLA', 'Tamat'], rows,
        { empty: 'Tiada ejen untuk peranan ini.' }));

    // --- Aktiviti terkini ---
    var log = S.log(), logHtml = '';
    for (i = 0; i < Math.min(log.length, 6); i++) {
      var l = log[i];
      logHtml += '<div class="usm-log-item">'
        + '<div class="small"><strong>' + C.esc(l.actor) + '</strong> · ' + C.esc(l.entityId) + '</div>'
        + '<div class="small">' + C.esc(l.note) + '</div>'
        + '<small>' + C.esc(l.tsLabel) + ' · ' + C.esc(l.from) + ' → ' + C.esc(l.to) + '</small>'
        + '</div>';
    }
    var logCard = C.card('Log aktiviti terkini', logHtml || C.emptyState('Tiada aktiviti.'));

    ctx.host.innerHTML =
      App.pageTitle('Dashboard', 'Peranan aktif: <strong>' + C.esc(S.roleInfo().label) + '</strong> · '
        + C.esc(S.roleInfo().person) + ' · Tarikh demo: ' + W.fmt(S.now()))
      + kpis + nextCard
      + '<div class="row g-3"><div class="col-lg-8">' + agentTable + '</div>'
      + '<div class="col-lg-4">' + logCard + '</div></div>';
  });
})(window);

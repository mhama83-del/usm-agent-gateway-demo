/*
 * sidenav.js — Navigasi skrin, ditapis mengikut peranan aktif, dengan kiraan
 * tugasan menunggu supaya penonton nampak ke mana perlu pergi seterusnya.
 * (Baris mendatar pada desktop, boleh skrol pada mobile.)
 * Dalam CI4 ini menjadi partial navigasi + policy peranan.
 */
(function (root) {
  'use strict';
  var NS = root.USMDEMO = root.USMDEMO || {};
  var C = NS.C = NS.C || {};

  // key ialah nama fail tanpa .html
  var LINKS = [
    { key: 'dashboard',           label: 'Dashboard',        roles: ['agent', 'usains', 'leap', 'payment', 'admin'] },
    { key: 'application-wizard',  label: 'Mohon / Renew',    roles: ['agent', 'admin'] },
    { key: 'application-detail',  label: 'Fail Permohonan',  roles: ['agent', 'usains', 'leap', 'admin'] },
    { key: 'usains-console',      label: 'Konsol USAINS',    roles: ['usains', 'admin'], count: 'usains' },
    { key: 'leap-console',        label: 'Konsol USM LEAP',  roles: ['leap', 'admin'], count: 'leap' },
    { key: 'agreement',           label: 'Perjanjian',       roles: ['agent', 'usains', 'leap', 'admin'], count: 'agreement' },
    { key: 'referrals',           label: 'Rujukan Pelajar',  roles: ['agent', 'usains', 'leap', 'admin'] },
    { key: 'claims',              label: 'Tuntutan Komisen', roles: ['agent', 'usains', 'leap', 'payment', 'admin'], count: 'claims' },
    { key: 'annual-review',       label: 'Annual Review',    roles: ['leap', 'agent', 'admin'], count: 'review' },
    { key: 'settings-draft',      label: 'Tetapan (DRAF)',   roles: ['agent', 'usains', 'leap', 'payment', 'admin'] }
  ];

  // Bilangan item yang menunggu tindakan peranan semasa.
  function pendingCount(kind) {
    var S = NS.Store, W = NS.WF;
    var role = S.role();
    var agents = S.agents(), claims = S.claims(), agreements = S.agreements();
    var n = 0, i;

    if (kind === 'usains') {
      for (i = 0; i < agents.length; i++) {
        if (['SUBMITTED', 'UNDER_USAINS_REVIEW'].indexOf(agents[i].appStatus) >= 0) n++;
      }
      for (i = 0; i < claims.length; i++) {
        if (['SUBMITTED', 'UNDER_USAINS_REVIEW'].indexOf(claims[i].claimStatus) >= 0) n++;
      }
      return n;
    }
    if (kind === 'leap') {
      for (i = 0; i < agents.length; i++) {
        if (['VERIFIED', 'UNDER_LEAP_REVIEW'].indexOf(agents[i].appStatus) >= 0) n++;
        if (agents[i].agentStatus === 'REVIEW_DUE') n++;
      }
      for (i = 0; i < claims.length; i++) {
        if (claims[i].claimStatus === 'PENDING_LEAP_DECISION') n++;
      }
      return n;
    }
    if (kind === 'agreement') {
      var party = { usains: 'usains', leap: 'leap', agent: 'agent' }[role];
      for (i = 0; i < agreements.length; i++) {
        var g = agreements[i];
        if (g.status === 'FULLY_SIGNED') continue;
        if (role === 'admin') { n++; continue; }
        if (party && !g.signatures[party].signed) {
          if (role !== 'agent' || g.agentId === (S.currentAgent() || {}).id) n++;
        }
      }
      return n;
    }
    if (kind === 'claims') {
      var me = S.currentAgent();
      for (i = 0; i < claims.length; i++) {
        var c = claims[i];
        if (role === 'agent') {
          if (me && c.agentId === me.id && ['DRAFT', 'RETURNED'].indexOf(c.claimStatus) >= 0) n++;
        } else if (role === 'usains') {
          if (['SUBMITTED', 'UNDER_USAINS_REVIEW'].indexOf(c.claimStatus) >= 0) n++;
        } else if (role === 'leap') {
          if (c.claimStatus === 'PENDING_LEAP_DECISION') n++;
        } else if (role === 'payment') {
          if (c.claimStatus === 'APPROVED_PENDING_PAYMENT') n++;
        }
      }
      return n;
    }
    if (kind === 'review') {
      for (i = 0; i < agents.length; i++) {
        if (agents[i].agentStatus !== 'REVIEW_DUE') continue;
        if (role === 'agent') {
          if (agents[i].id === (S.currentAgent() || {}).id) n++;
        } else { n++; }
      }
      return n;
    }
    return 0;
  }

  function render(base, activeKey) {
    var role = NS.Store.role();
    var h = '<nav class="usm-nav" aria-label="Navigasi utama"><div class="container-xl">'
          + '<ul class="nav flex-nowrap">';
    for (var i = 0; i < LINKS.length; i++) {
      var l = LINKS[i];
      if (l.roles.indexOf(role) < 0) continue;
      var n = l.count ? pendingCount(l.count) : 0;
      h += '<li class="nav-item"><a class="nav-link' + (l.key === activeKey ? ' active' : '') + '" '
         + 'href="' + base + 'pages/' + l.key + '.html"'
         + (l.key === activeKey ? ' aria-current="page"' : '') + '>'
         + C.esc(l.label)
         + (n ? '<span class="nav-count" title="' + n + ' item menunggu tindakan anda">' + n + '</span>' : '')
         + '</a></li>';
    }
    return h + '</ul></div></nav>';
  }

  function allowed(key, role) {
    role = role || NS.Store.role();
    for (var i = 0; i < LINKS.length; i++) {
      if (LINKS[i].key === key) return LINKS[i].roles.indexOf(role) >= 0;
    }
    return true;
  }

  C.sidenav = { render: render, allowed: allowed, pendingCount: pendingCount, LINKS: LINKS };
})(window);

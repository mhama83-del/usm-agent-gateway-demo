/*
 * sidenav.js — Navigasi skrin, ditapis mengikut peranan aktif.
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
    { key: 'usains-console',      label: 'Konsol USAINS',    roles: ['usains', 'admin'] },
    { key: 'leap-console',        label: 'Konsol USM LEAP',  roles: ['leap', 'admin'] },
    { key: 'agreement',           label: 'Perjanjian',       roles: ['agent', 'usains', 'leap', 'admin'] },
    { key: 'referrals',           label: 'Rujukan Pelajar',  roles: ['agent', 'usains', 'leap', 'admin'] },
    { key: 'claims',              label: 'Tuntutan Komisen', roles: ['agent', 'usains', 'leap', 'payment', 'admin'] },
    { key: 'annual-review',       label: 'Annual Review',    roles: ['leap', 'agent', 'admin'] },
    { key: 'settings-draft',      label: 'Tetapan (DRAF)',   roles: ['agent', 'usains', 'leap', 'payment', 'admin'] }
  ];

  function render(base, activeKey) {
    var role = NS.Store.role();
    var h = '<nav class="usm-nav"><div class="container-xl"><ul class="nav flex-nowrap">';
    for (var i = 0; i < LINKS.length; i++) {
      var l = LINKS[i];
      if (l.roles.indexOf(role) < 0) continue;
      h += '<li class="nav-item"><a class="nav-link' + (l.key === activeKey ? ' active' : '') + '" '
         + 'href="' + base + 'pages/' + l.key + '.html">' + C.esc(l.label) + '</a></li>';
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

  C.sidenav = { render: render, allowed: allowed, LINKS: LINKS };
})(window);

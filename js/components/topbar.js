/*
 * topbar.js — Chrome bersama bahagian atas: jenama USM+APEX, penukar peranan,
 * lonceng notifikasi (UI sahaja) dan butang Reset Demo.
 * Dalam CI4 ini menjadi satu partial layout.
 */
(function (root) {
  'use strict';
  var NS = root.USMDEMO = root.USMDEMO || {};
  var C = NS.C = NS.C || {};

  function esc(s) { return C.esc(s); }

  function visibleNotifications() {
    var role = NS.Store.role();
    var all = NS.Store.notifications();
    var out = [];
    for (var i = 0; i < all.length; i++) {
      if (all[i].audience === 'all' || all[i].audience === role) out.push(all[i]);
    }
    return out;
  }

  function render(base) {
    var S = NS.Store;
    var role = S.roleInfo();
    var roles = NS.SEED.ROLES;
    var notes = visibleNotifications();

    var opts = '';
    for (var k in roles) {
      if (!Object.prototype.hasOwnProperty.call(roles, k)) continue;
      opts += '<option value="' + k + '"' + (k === role.key ? ' selected' : '') + '>'
            + esc(roles[k].label) + '</option>';
    }

    var items = '';
    if (!notes.length) {
      items = '<li><span class="dropdown-item-text text-muted small">Tiada notifikasi.</span></li>';
    }
    for (var i = 0; i < Math.min(notes.length, 8); i++) {
      var n = notes[i];
      var href = n.link ? (base + 'pages/' + n.link) : '#';
      items += '<li><a class="dropdown-item text-wrap" href="' + esc(href) + '" style="max-width:320px">'
             + '<div class="fw-semibold small">' + esc(n.title) + '</div>'
             + '<div class="small text-muted">' + esc(n.body) + '</div>'
             + '<div class="small text-muted">' + esc(n.timeLabel) + '</div>'
             + '</a></li>';
    }

    return ''
      + '<div class="usm-demo-strip text-center py-1 px-2">'
      + 'DEMO SAHAJA · Semua data adalah REKAAN · Bukan sistem produksi USM · '
      + 'Nilai bertanda DRAF belum dimuktamadkan'
      + '</div>'
      + '<header class="usm-topbar py-2">'
      + '  <div class="container-xl d-flex align-items-center gap-3 flex-wrap">'
      + '    <a href="' + base + 'pages/dashboard.html" class="d-flex align-items-center gap-2">'
      + '      <span class="usm-brand-mark">USM</span>'
      + '      <span><span class="usm-brand-title d-block">USM Agent Gateway</span>'
      + '      <span class="usm-brand-sub">USM + APEX · Pengurusan Kitar Hayat Ejen</span></span>'
      + '    </a>'
      + '    <div class="ms-auto d-flex align-items-center gap-2 flex-wrap">'
      + '      <div class="dropdown">'
      + '        <button class="btn btn-sm btn-light position-relative dropdown-toggle" data-bs-toggle="dropdown" aria-expanded="false">'
      + '          Notifikasi'
      + (notes.length ? '<span class="badge bg-danger ms-1">' + notes.length + '</span>' : '')
      + '        </button>'
      + '        <ul class="dropdown-menu dropdown-menu-end">' + items + '</ul>'
      + '      </div>'
      + '      <label class="visually-hidden" for="role-switcher">Tukar peranan</label>'
      + '      <select id="role-switcher" class="form-select form-select-sm" style="width:auto">' + opts + '</select>'
      + '      <button id="btn-reset-demo" class="btn btn-sm btn-outline-light">Reset Demo</button>'
      + '    </div>'
      + '  </div>'
      + '  <div class="container-xl mt-1">'
      + '    <small class="text-white-50">Log masuk sebagai <strong class="text-white">' + esc(role.person) + '</strong> · '
      + esc(role.title) + ' · ' + esc(role.org) + '</small>'
      + '  </div>'
      + '</header>';
  }

  function wire(base) {
    var sel = document.getElementById('role-switcher');
    if (sel) {
      sel.addEventListener('change', function () {
        NS.Store.setRole(sel.value);
        root.location.reload();
      });
    }
    var btn = document.getElementById('btn-reset-demo');
    if (btn) {
      btn.addEventListener('click', function () {
        if (root.confirm('Reset Demo akan memadam semua kemajuan dan kembali ke data asal seed. Teruskan?')) {
          NS.Store.reset();
          root.location.href = base + 'pages/dashboard.html';
        }
      });
    }
  }

  C.topbar = { render: render, wire: wire, visibleNotifications: visibleNotifications };
})(window);

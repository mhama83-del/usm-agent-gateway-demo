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

  function unreadCount() {
    var n = visibleNotifications(), c = 0;
    for (var i = 0; i < n.length; i++) { if (!n[i].read) c++; }
    return c;
  }

  function render(base) {
    var S = NS.Store;
    var role = S.roleInfo();
    var roles = NS.SEED.ROLES;
    var notes = visibleNotifications();
    var unread = unreadCount();

    var opts = '';
    for (var k in roles) {
      if (!Object.prototype.hasOwnProperty.call(roles, k)) continue;
      opts += '<option value="' + k + '"' + (k === role.key ? ' selected' : '') + '>'
            + esc(roles[k].label) + '</option>';
    }

    var items = '';
    if (!notes.length) {
      items = '<li><span class="dropdown-item-text text-muted small">Tiada notifikasi untuk peranan ini.</span></li>';
    }
    for (var i = 0; i < Math.min(notes.length, 8); i++) {
      var n = notes[i];
      var href = n.link ? (base + 'pages/' + n.link) : '#';
      items += '<li><a class="dropdown-item notif-item py-2' + (n.read ? '' : ' notif-unread') + '" '
             + 'href="' + esc(href) + '" data-notif="' + esc(n.id) + '">'
             + '<div class="fw-semibold small">' + esc(n.title) + '</div>'
             + '<div class="small text-muted">' + esc(n.body) + '</div>'
             + '<div class="small text-muted mt-1">' + esc(n.timeLabel) + '</div>'
             + '</a></li>';
    }
    if (notes.length) {
      items += '<li><hr class="dropdown-divider"></li>'
             + '<li><button type="button" class="dropdown-item small text-muted" id="btn-notif-read">'
             + 'Tandakan semua sebagai dibaca</button></li>';
    }

    return ''
      + '<div class="usm-demo-strip text-center py-1 px-2">'
      + 'DEMO SAHAJA · Semua data adalah REKAAN · Bukan sistem produksi USM · '
      + 'Nilai bertanda DRAF belum dimuktamadkan'
      + '</div>'
      + '<header class="usm-topbar py-2">'
      + '  <div class="container-xl d-flex align-items-center gap-2 gap-sm-3 flex-wrap">'
      + '    <a href="' + base + 'pages/dashboard.html" class="d-flex align-items-center gap-2 flex-shrink-0">'
      + '      <img src="' + base + 'assets/img/usm-apex-logo.svg" class="usm-logo"'
      + '           alt="Universiti Sains Malaysia · APEX">'
      + '      <span class="d-none d-sm-block">'
      + '        <span class="usm-brand-title d-block">USM Agent Gateway</span>'
      + '        <span class="usm-brand-sub">USM + APEX · Pengurusan Kitar Hayat Ejen</span>'
      + '      </span>'
      + '    </a>'
      + '    <div class="ms-auto d-flex align-items-center gap-2 flex-wrap">'
      + '      <div class="dropdown">'
      + '        <button class="btn btn-sm btn-light position-relative dropdown-toggle" '
      + '                data-bs-toggle="dropdown" aria-expanded="false" aria-label="Notifikasi">'
      + '          Notifikasi'
      + (unread ? '<span class="badge bg-danger ms-1">' + unread + '</span>' : '')
      + '        </button>'
      + '        <ul class="dropdown-menu dropdown-menu-end shadow">' + items + '</ul>'
      + '      </div>'
      + '      <label class="visually-hidden" for="role-switcher">Tukar peranan</label>'
      + '      <select id="role-switcher" class="form-select form-select-sm" style="width:auto" '
      + '              title="Tukar peranan — navigasi dan tindakan berubah ikut peranan">' + opts + '</select>'
      + '      <button id="btn-reset-demo" class="btn btn-sm btn-outline-light" '
      + '              title="Padam semua kemajuan demo dan kembali ke data asal seed">Reset Demo</button>'
      + '    </div>'
      + '  </div>'
      + '  <div class="container-xl mt-2">'
      + '    <span class="usm-whoami d-inline-block">'
      + '      <strong>' + esc(role.person) + '</strong> · ' + esc(role.title) + ' · ' + esc(role.org)
      + '    </span>'
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
    var readBtn = document.getElementById('btn-notif-read');
    if (readBtn) {
      readBtn.addEventListener('click', function () {
        var list = visibleNotifications();
        for (var i = 0; i < list.length; i++) list[i].read = true;
        NS.Store.save();
        root.location.reload();
      });
    }
    // Buka notifikasi = tandakan dibaca
    var links = document.querySelectorAll('[data-notif]');
    for (var i = 0; i < links.length; i++) {
      links[i].addEventListener('click', function (ev) {
        var id = ev.currentTarget.getAttribute('data-notif');
        var all = NS.Store.notifications();
        for (var j = 0; j < all.length; j++) { if (all[j].id === id) all[j].read = true; }
        NS.Store.save();
      });
    }
  }

  C.topbar = {
    render: render, wire: wire,
    visibleNotifications: visibleNotifications,
    unreadCount: unreadCount
  };
})(window);

/*
 * app.js — Bootstrap demo: suntik chrome bersama, daftar skrin, utiliti UI.
 * Setiap fail dalam pages/ memanggil USMDEMO.App.boot('<key>').
 */
(function (root) {
  'use strict';
  var NS = root.USMDEMO = root.USMDEMO || {};
  var C = NS.C = NS.C || {};

  var PAGES = {};          // key -> render(ctx)
  var BASE = '../';        // pages/ berada satu tahap di bawah akar

  function register(key, fn) { PAGES[key] = fn; }

  function qs(name) {
    var m = new RegExp('[?&]' + name + '=([^&#]*)').exec(root.location.search);
    return m ? decodeURIComponent(m[1].replace(/\+/g, ' ')) : null;
  }

  function el(id) { return document.getElementById(id); }

  function toast(msg, kind) {
    var host = el('toast-host');
    if (!host) {
      host = document.createElement('div');
      host.id = 'toast-host';
      host.className = 'toast-host';
      document.body.appendChild(host);
    }
    var d = document.createElement('div');
    d.className = 'alert alert-' + (kind || 'success') + ' shadow-sm py-2 px-3 small mb-2';
    d.setAttribute('role', 'status');
    d.textContent = msg;
    host.appendChild(d);
    root.setTimeout(function () { if (d.parentNode) d.parentNode.removeChild(d); }, 4200);
  }

  // Jalankan satu transisi workflow dengan pengendalian ralat seragam.
  function run(fn, okMsg) {
    try {
      var r = fn();
      if (okMsg) toast(okMsg, 'success');
      return r;
    } catch (e) {
      toast(e.message || String(e), 'danger');
      return null;
    }
  }

  function money(n) { return 'RM ' + NS.WF.money(n); }

  function go(page, params) {
    var url = BASE + 'pages/' + page + '.html';
    if (params) {
      var parts = [];
      for (var k in params) {
        if (Object.prototype.hasOwnProperty.call(params, k) && params[k] != null) {
          parts.push(encodeURIComponent(k) + '=' + encodeURIComponent(params[k]));
        }
      }
      if (parts.length) url += '?' + parts.join('&');
    }
    root.location.href = url;
  }

  function pageTitle(title, sub, right) {
    return '<div class="d-flex justify-content-between align-items-start flex-wrap gap-2 mb-3">'
      + '<div><h1 class="h4 mb-1">' + title + '</h1>'
      + (sub ? '<div class="text-muted small">' + sub + '</div>' : '')
      + '</div>'
      + (right ? '<div class="d-flex gap-2 flex-wrap">' + right + '</div>' : '')
      + '</div>';
  }

  // Suntik chrome bersama + render skrin.
  function boot(key) {
    var S = NS.Store;
    S.load();

    var top = el('chrome-top');
    if (top) top.innerHTML = C.topbar.render(BASE) + C.sidenav.render(BASE, key);
    C.topbar.wire(BASE);

    var bottom = el('chrome-bottom');
    if (bottom) {
      bottom.innerHTML = '<footer class="usm-footer mt-4 py-3"><div class="container-xl">'
        + 'USM Agent Gateway — <strong>DEMO</strong>. Semua data rekaan; tiada backend, '
        + 'tiada e-mel, tiada e-signature sah undang-undang. Nilai <span class="draf-badge">DRAF</span> '
        + 'menunggu keputusan owner. Domain demo: agents.durianbytes.com'
        + '</div></footer>';
    }

    var host = el('page');
    if (!host) return;

    if (!C.sidenav.allowed(key)) {
      host.innerHTML = pageTitle('Skrin ini tidak tersedia untuk peranan anda')
        + '<div class="alert alert-warning">Peranan <strong>' + C.esc(S.roleInfo().label)
        + '</strong> tiada akses ke skrin ini. Tukar peranan di bar atas.</div>';
      return;
    }

    var fn = PAGES[key];
    if (!fn) { host.innerHTML = '<div class="alert alert-danger">Skrin belum dibina: ' + C.esc(key) + '</div>'; return; }
    try {
      fn({ host: host, S: S, W: NS.WF, C: C, App: NS.App });
    } catch (e) {
      host.innerHTML = '<div class="alert alert-danger"><strong>Ralat skrin:</strong> ' + C.esc(e.message) + '</div>';
      if (root.console) root.console.error(e);
    }
  }

  // Bantu: pasang pengendali klik pada elemen dengan data-action.
  function onAction(host, handler) {
    host.addEventListener('click', function (ev) {
      var t = ev.target;
      while (t && t !== host && !t.getAttribute('data-action')) t = t.parentNode;
      if (!t || t === host) return;
      ev.preventDefault();
      handler(t.getAttribute('data-action'), t);
    });
  }

  NS.App = {
    register: register, boot: boot, qs: qs, el: el, toast: toast, run: run,
    money: money, go: go, pageTitle: pageTitle, onAction: onAction, BASE: BASE
  };
})(window);

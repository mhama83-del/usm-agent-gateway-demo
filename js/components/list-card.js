/*
 * list-card.js — Blok paparan berulang: kad KPI, jadual boleh-stack (mobile),
 * lencana DRAF, lencana status, baris dokumen.
 * Setiap fungsi memulangkan HTML — mudah jadi partial CI4 kemudian.
 */
(function (root) {
  'use strict';
  var NS = root.USMDEMO = root.USMDEMO || {};
  var C = NS.C = NS.C || {};

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  // Lencana DRAF pada setiap nilai belum muktamad.
  function draf(hint) {
    return '<span class="draf-badge" title="' + esc(hint || 'Nilai DRAF — menunggu keputusan owner') + '">DRAF</span>';
  }

  // Nilai + lencana DRAF
  function drafValue(value, hint) {
    return esc(value) + draf(hint);
  }

  function kpi(label, value, sub) {
    return '<div class="col-6 col-lg-3">'
      + '<div class="card h-100 usm-kpi"><div class="card-body py-3">'
      + '<div class="text-muted small">' + label + '</div>'
      + '<div class="display-6">' + value + '</div>'
      + (sub ? '<div class="small text-muted">' + sub + '</div>' : '')
      + '</div></div></div>';
  }

  var BADGE = {
    ACTIVE: 'success', RENEWED: 'success', PENDING: 'secondary',
    REVIEW_DUE: 'warning text-dark', TERMINATED: 'dark', NOT_RENEWED: 'dark',
    SUSPENDED: 'warning text-dark', EXPIRED: 'dark',
    PAID: 'success', APPROVED_PENDING_PAYMENT: 'info text-dark',
    PENDING_LEAP_DECISION: 'primary', UNDER_USAINS_REVIEW: 'primary',
    SUBMITTED: 'secondary', DRAFT: 'light text-dark border',
    RETURNED: 'warning text-dark', REJECTED: 'danger',
    RETURNED_TO_AGENT: 'warning text-dark', VERIFIED: 'info text-dark',
    APPROVED_AWAITING_AGREEMENT: 'info text-dark', AGREEMENT_SIGNED: 'success',
    FULLY_SIGNED: 'success', RESUBMITTED: 'info text-dark'
  };

  function statusBadge(code, label) {
    var cls = BADGE[code] || 'secondary';
    return '<span class="badge bg-' + cls + '">' + esc(label || code) + '</span>';
  }

  // rows: array of { cells: [{label, html}], }
  function table(headers, rows, opts) {
    opts = opts || {};
    var h = '<div class="table-responsive"><table class="table table-usm align-middle '
          + (opts.stack === false ? '' : 'table-stack') + '">';
    h += '<thead><tr>';
    for (var i = 0; i < headers.length; i++) h += '<th>' + headers[i] + '</th>';
    h += '</tr></thead><tbody>';
    if (!rows.length) {
      h += '<tr><td colspan="' + headers.length + '" class="text-center text-muted py-4">'
         + (opts.empty || 'Tiada rekod.') + '</td></tr>';
    }
    for (var r = 0; r < rows.length; r++) {
      h += '<tr>';
      for (var c = 0; c < rows[r].length; c++) {
        h += '<td data-label="' + esc(headers[c]) + '">' + rows[r][c] + '</td>';
      }
      h += '</tr>';
    }
    return h + '</tbody></table></div>';
  }

  function card(title, bodyHtml, opts) {
    opts = opts || {};
    return '<div class="card mb-3 ' + (opts.cls || '') + '">'
      + (title ? '<div class="card-header d-flex justify-content-between align-items-center flex-wrap gap-2">'
                 + '<span>' + title + '</span>'
                 + (opts.right || '') + '</div>' : '')
      + '<div class="card-body">' + bodyHtml + '</div></div>';
  }

  function defList(pairs) {
    var h = '<dl class="row mb-0 small">';
    for (var i = 0; i < pairs.length; i++) {
      h += '<dt class="col-sm-4 text-muted fw-normal">' + pairs[i][0] + '</dt>'
         + '<dd class="col-sm-8">' + pairs[i][1] + '</dd>';
    }
    return h + '</dl>';
  }

  function emptyState(msg) {
    return '<p class="text-muted text-center py-4 mb-0">' + esc(msg) + '</p>';
  }

  C.esc = esc;
  C.draf = draf;
  C.drafValue = drafValue;
  C.kpi = kpi;
  C.statusBadge = statusBadge;
  C.table = table;
  C.card = card;
  C.defList = defList;
  C.emptyState = emptyState;
})(window);

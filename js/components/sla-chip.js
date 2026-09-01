/*
 * sla-chip.js — Chip SLA: Within SLA / Approaching Deadline / Overdue.
 * Dalam CI4 ini menjadi satu view cell/partial.
 */
(function (root) {
  'use strict';
  var NS = root.USMDEMO = root.USMDEMO || {};
  var C = NS.C = NS.C || {};

  var TEXT = {
    ok: 'Within SLA',
    warning: 'Approaching Deadline',
    late: 'Overdue'
  };

  // state: 'ok' | 'warning' | 'late'
  function slaChip(state, extra) {
    var s = TEXT[state] ? state : 'ok';
    var tail = extra ? ' · ' + extra : '';
    return '<span class="sla-chip sla-' + s + '">' + TEXT[s] + tail + '</span>';
  }

  // Chip untuk satu ejen, termasuk baki hari jika dikira.
  function slaChipForAgent(a) {
    var W = NS.WF;
    var state = W.slaOf(a);
    var extra = '';
    if (a.slaSource !== 'seed') {
      var dl = W.slaDeadline(a);
      if (dl) {
        var left = W.daysUntil(dl);
        extra = (left < 0) ? (Math.abs(left) + ' hari lewat') : (left + ' hari lagi');
      }
    }
    return slaChip(state, extra);
  }

  function slaChipForClaim(c) {
    var W = NS.WF;
    var state = W.slaOfClaim(c);
    var extra = '';
    if (c.deadlineIso && c.claimStatus !== 'PAID' && c.claimStatus !== 'REJECTED') {
      var left = W.daysUntil(c.deadlineIso);
      extra = (left < 0) ? (Math.abs(left) + ' hari lewat') : (left + ' hari lagi');
    }
    return slaChip(state, extra);
  }

  C.slaChip = slaChip;
  C.slaChipForAgent = slaChipForAgent;
  C.slaChipForClaim = slaChipForClaim;
  C.SLA_TEXT = TEXT;
})(window);

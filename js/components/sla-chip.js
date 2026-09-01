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

  // Semua input chip SLA (tempoh semakan + ambang "approaching") ialah nilai
  // DRAF, jadi chip membawa lencana DRAF sendiri.
  function drafHint() {
    var sla = NS.Store.config().sla;
    return 'Chip dikira dari nilai DRAF: semakan USAINS ' + sla.usainsReviewDays
      + ' hari, keputusan LEAP ' + sla.leapDecisionDays + ' hari, keputusan tuntutan '
      + sla.claimDecisionDays + ' hari, ambang "Approaching Deadline" '
      + sla.approachingWithinDays + ' hari.';
  }

  // state: 'ok' | 'warning' | 'late'
  function slaChip(state, extra, opts) {
    opts = opts || {};
    var s = TEXT[state] ? state : 'ok';
    var tail = extra ? ' · ' + extra : '';
    var chip = '<span class="sla-chip sla-' + s + '">' + TEXT[s] + tail + '</span>';
    return opts.noDraf ? chip : chip + NS.C.draf(drafHint());
  }

  // Chip untuk satu ejen, termasuk baki hari jika dikira.
  // Ejen SEED: medan `sla` yang dikurasi menang (keputusan owner 1 Sep 2026).
  function slaChipForAgent(a) {
    var W = NS.WF;
    var state = W.slaOf(a);
    if (a.slaSource === 'seed') {
      return '<span class="sla-chip sla-' + state + '">' + TEXT[state] + '</span>'
        + NS.C.draf('Keadaan SLA yang dikurasi untuk cerita demo (medan seed). '
          + 'Permohonan yang dicipta semasa demo dikira dari nilai DRAF.');
    }
    var extra = '';
    var dl = W.slaDeadline(a);
    if (dl) {
      var left = W.daysUntil(dl);
      extra = (left < 0) ? (Math.abs(left) + ' hari lewat') : (left + ' hari lagi');
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

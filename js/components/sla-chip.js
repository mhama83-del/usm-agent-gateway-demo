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
  // DRAFT, jadi chip membawa lencana DRAFT sendiri.
  function drafHint() {
    var sla = NS.Store.config().sla;
    return 'Chip computed from DRAFT values: USAINS review ' + sla.usainsReviewDays
      + ' days, LEAP decision ' + sla.leapDecisionDays + ' days, claim decision '
      + sla.claimDecisionDays + ' days, "Approaching Deadline" threshold '
      + sla.approachingWithinDays + ' days.';
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
        + NS.C.draf('SLA state curated for the demo storyline (seed field). '
          + 'Applications created during the demo are computed from DRAFT values.');
    }
    var extra = '';
    var dl = W.slaDeadline(a);
    if (dl) {
      var left = W.daysUntil(dl);
      extra = (left < 0) ? (Math.abs(left) + ' days late') : (left + ' days left');
    }
    return slaChip(state, extra);
  }

  function slaChipForClaim(c) {
    var W = NS.WF;
    var state = W.slaOfClaim(c);
    var extra = '';
    if (c.deadlineIso && c.claimStatus !== 'PAID' && c.claimStatus !== 'REJECTED') {
      var left = W.daysUntil(c.deadlineIso);
      extra = (left < 0) ? (Math.abs(left) + ' days late') : (left + ' days left');
    }
    return slaChip(state, extra);
  }

  C.slaChip = slaChip;
  C.slaChipForAgent = slaChipForAgent;
  C.slaChipForClaim = slaChipForClaim;
  C.SLA_TEXT = TEXT;
})(window);

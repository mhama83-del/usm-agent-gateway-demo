/*
 * status-trail.js — Status trail 5-peringkat.
 * Digunakan pada setiap fail permohonan/ejen dan (dengan label lain) tuntutan.
 */
(function (root) {
  'use strict';
  var NS = root.USMDEMO = root.USMDEMO || {};
  var C = NS.C = NS.C || {};

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  // labels: array label; current: 1-based
  function statusTrail(labels, current) {
    var h = '<div class="trail" role="list" aria-label="Status trail">';
    for (var i = 0; i < labels.length; i++) {
      var n = i + 1;
      var cls = n < current ? 'done' : (n === current ? 'current' : '');
      h += '<div class="trail-step ' + cls + '" role="listitem">'
         + '<span class="trail-num">PERINGKAT ' + n + '</span>'
         + esc(labels[n - 1])
         + '</div>';
    }
    return h + '</div>';
  }

  function agentTrail(a) {
    return statusTrail(NS.SEED.STAGE_LABELS, NS.WF.stageOf(a));
  }
  function claimTrail(c) {
    return statusTrail(NS.SEED.CLAIM_STAGE_LABELS, NS.WF.claimStageOf(c));
  }
  function referralTrail(ref) {
    var order = ['SUBMITTED', 'OFFERED', 'ENROLLED', 'FEES_PAID'];
    var idx = order.indexOf(ref.refStatus);
    return statusTrail(NS.SEED.REFERRAL_STAGE_LABELS, idx < 0 ? 1 : idx + 1);
  }

  C.statusTrail = statusTrail;
  C.agentTrail = agentTrail;
  C.claimTrail = claimTrail;
  C.referralTrail = referralTrail;
})(window);

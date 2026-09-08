/* referrals.js — Rujukan pelajar: ejen AKTIF merujuk, pegawai berautoriti
   mengesahkan status secara manual, dan tuntutan dibina selepas yuran dibayar. */
(function (root) {
  'use strict';
  var NS = root.USMDEMO;

  var REF_ORDER = ['SUBMITTED', 'OFFERED', 'ENROLLED', 'FEES_PAID'];

  NS.App.register('referrals', function (ctx) {
    var S = ctx.S, W = ctx.W, C = ctx.C, App = ctx.App;
    var filter = App.qs('status') || 'all';

    function claimForRef(refId) {
      var cl = S.claims();
      for (var i = 0; i < cl.length; i++) { if (cl[i].refId === refId) return cl[i]; }
      return null;
    }

    function render() {
      var role = S.role();
      var me = S.currentAgent();
      var refs = S.referrals();
      var rows = [], counts = { SUBMITTED: 0, OFFERED: 0, ENROLLED: 0, FEES_PAID: 0 };
      var visible = 0;

      for (var i = 0; i < refs.length; i++) {
        var r = refs[i];
        if (role === 'agent' && (!me || r.agentId !== me.id)) continue;
        visible++;
        if (counts[r.refStatus] != null) counts[r.refStatus]++;
        if (filter !== 'all' && r.refStatus !== filter) continue;

        var ag = S.agent(r.agentId);
        var existing = claimForRef(r.refId);
        var acts = '';
        if (W.can('advanceReferral') && REF_ORDER.indexOf(r.refStatus) >= 0
            && r.refStatus !== 'FEES_PAID') {
          var nextLabel = W.REF_LABEL[REF_ORDER[REF_ORDER.indexOf(r.refStatus) + 1]];
          acts += '<button class="btn btn-sm btn-outline-usm" data-action="advance" data-id="'
            + C.esc(r.refId) + '" title="Confirm manually: ' + C.esc(nextLabel) + '">→ '
            + C.esc(nextLabel) + '</button> ';
        }
        if (W.can('createClaim') && r.refStatus === 'FEES_PAID' && !existing && me && r.agentId === me.id) {
          acts += '<button class="btn btn-sm btn-usm" data-action="claim" data-id="' + C.esc(r.refId) + '">Build claim</button>';
        }
        if (existing) {
          acts += '<a class="btn btn-sm btn-outline-secondary" href="claims.html?id=' + C.esc(existing.id) + '">'
            + C.esc(existing.id) + ' · ' + C.esc(W.CLAIM_LABEL[existing.claimStatus]) + '</a>';
        }

        rows.push([
          '<span class="fw-semibold">' + C.esc(r.refId || '—') + '</span>'
            + (r.isDemoCreated ? '<div><span class="badge bg-warning text-dark mt-1">NEW</span></div>' : ''),
          '<div class="fw-semibold">' + C.esc(r.name) + '</div>'
            + '<div class="small text-muted">' + C.esc(r.country) + ' · ' + C.esc(r.passport) + '</div>',
          '<div>' + C.esc(r.program) + '</div>'
            + '<div class="small text-muted">' + C.esc(r.level) + ' · ' + C.esc(r.semester) + '</div>',
          C.esc(ag ? ag.name : r.agentId),
          C.statusBadge(r.refStatus, W.REF_LABEL[r.refStatus] || r.refStatus),
          App.money(r.firstYearFee)
            + '<div class="small text-muted">Commission: '
            + C.amountWithNotes(App.money(W.commissionOf(r)), r.level, W.ratePercent(r.level), null)
            + '</div>',
          acts || '<span class="text-muted small">—</span>'
        ]);
      }

      // penapis status
      var chips = '<div class="d-flex gap-1 flex-wrap">';
      chips += '<a class="btn btn-sm ' + (filter === 'all' ? 'btn-usm' : 'btn-outline-usm')
        + '" href="referrals.html">All (' + visible + ')</a>';
      for (var k = 0; k < REF_ORDER.length; k++) {
        var st = REF_ORDER[k];
        chips += '<a class="btn btn-sm ' + (filter === st ? 'btn-usm' : 'btn-outline-usm')
          + '" href="referrals.html?status=' + st + '">' + C.esc(W.REF_LABEL[st])
          + ' (' + counts[st] + ')</a>';
      }
      chips += '</div>';

      var canAdd = me && W.can('addReferral') && (me.agentStatus === 'ACTIVE' || me.agentStatus === 'RENEWED');
      var addForm = '';
      if (W.can('addReferral')) {
        addForm = C.card('Refer a new student',
          (canAdd ? ''
            : '<div class="alert alert-warning small">Only agents with <strong>ACTIVE</strong> status may '
              + 'refer students (specification §15.1). Your status: '
              + C.statusBadge(me ? me.agentStatus : 'PENDING',
                  me ? (W.AGENT_LABEL[me.agentStatus] || me.agentStatus) : 'No agent') + '</div>')
          + '<form id="ref-form" class="row g-2">'
          + '<div class="col-sm-6"><label class="form-label small" for="r-name">Full name *</label>'
          + '<input id="r-name" class="form-control form-control-sm" name="name" value="Bagus Santoso"></div>'
          + '<div class="col-sm-6"><label class="form-label small" for="r-pp">Passport no.</label>'
          + '<input id="r-pp" class="form-control form-control-sm" name="passport" value="A55667788"></div>'
          + '<div class="col-sm-6"><label class="form-label small" for="r-country">Country</label>'
          + '<input id="r-country" class="form-control form-control-sm" name="country" value="Indonesia"></div>'
          + '<div class="col-sm-6"><label class="form-label small" for="r-prog">Programme *</label>'
          + '<input id="r-prog" class="form-control form-control-sm" name="program" value="Bachelor of Computer Science"></div>'
          + '<div class="col-sm-4"><label class="form-label small" for="r-level">Level</label>'
          + '<select id="r-level" class="form-select form-select-sm" name="level"><option>UG</option><option>PG</option></select></div>'
          + '<div class="col-sm-8"><label class="form-label small" for="r-fee">First-year fee (RM)</label>'
          + '<input id="r-fee" class="form-control form-control-sm" name="firstYearFee" value="34500" inputmode="numeric">'
          + '<div class="form-text">Commission basis: fee × rate '
          + W.ratePercent('UG') + '% (UG) / ' + W.ratePercent('PG') + '% (PG) '
          + C.draf('Commission rate — DRAFT') + '</div></div>'
          + '<div class="col-12"><button type="button" class="btn btn-usm btn-sm" data-action="add"'
          + (canAdd ? '' : ' disabled') + '>Submit referral</button></div>'
          + '</form>');
      }

      ctx.host.innerHTML =
        App.pageTitle('Student Referrals',
          'Referral status is confirmed <strong>manually</strong> by an authorised officer — '
          + 'there is no automatic integration with admissions or finance systems (specification §8.7).',
          '', 'Stage 4 — Active agent')
        + '<div class="mb-3">' + chips + '</div>'
        + '<div class="row g-3"><div class="col-lg-8">'
        + C.card('Referrals <span class="badge bg-light text-dark border ms-1">' + rows.length + '</span>',
            C.table(['ID', 'Student', 'Programme', 'Agent', 'Status', 'Year 1 fee', 'Action'], rows,
              { empty: 'No referrals for this filter.' }))
        + '</div><div class="col-lg-4">' + addForm
        + C.card('Referral status flow',
            C.statusTrail(NS.SEED.REFERRAL_STAGE_LABELS, 1)
            + '<p class="small text-muted mt-3 mb-0">A commission claim can only be built once a '
            + 'referral reaches <strong>Fees Paid</strong>, and each referral may have '
            + 'only one claim.</p>')
        + '</div></div>';
    }

    App.onAction(ctx.host, function (action, el) {
      var id = el.getAttribute('data-id');
      var r = null;
      if (action === 'advance') {
        r = App.run(function () { return W.advanceReferral(id); }, 'Referral status updated.');
      } else if (action === 'claim') {
        var me = S.currentAgent();
        r = App.run(function () { return W.createClaim(me.id, id); }, 'Claim draft built.');
        if (r) { App.go('claims', { id: r.id }); return; }
      } else if (action === 'add') {
        var f = App.el('ref-form');
        var d = {};
        var ins = f.querySelectorAll('input, select');
        for (var i = 0; i < ins.length; i++) { if (ins[i].name) d[ins[i].name] = ins[i].value; }
        if (!d.name || !d.name.trim()) { App.toast('Student name is required.', 'danger'); return; }
        if (!d.program || !d.program.trim()) { App.toast('Programme is required.', 'danger'); return; }
        var me2 = S.currentAgent();
        r = App.run(function () { return W.addReferral(me2.id, d); }, 'Student referral submitted.');
      } else { return; }
      if (r) render();
    });

    render();
  });
})(window);

/* referrals.js — Rujukan pelajar: ejen aktif merujuk, pegawai kemas kini status,
   dan bina draf tuntutan bila yuran sudah dibayar. */
(function (root) {
  'use strict';
  var NS = root.USMDEMO;

  NS.App.register('referrals', function (ctx) {
    var S = ctx.S, W = ctx.W, C = ctx.C, App = ctx.App;

    function claimForRef(refId) {
      var cl = S.claims();
      for (var i = 0; i < cl.length; i++) { if (cl[i].refId === refId) return cl[i]; }
      return null;
    }

    function render() {
      var role = S.role();
      var me = S.currentAgent();
      var refs = S.referrals();
      var rows = [];

      for (var i = 0; i < refs.length; i++) {
        var r = refs[i];
        if (role === 'agent' && (!me || r.agentId !== me.id)) continue;
        var ag = S.agent(r.agentId);
        var acts = '';
        if (W.can('advanceReferral') && ['SUBMITTED', 'OFFERED', 'ENROLLED'].indexOf(r.refStatus) >= 0) {
          acts += '<button class="btn btn-sm btn-outline-usm" data-action="advance" data-id="' + C.esc(r.refId) + '">Majukan status</button> ';
        }
        var existing = claimForRef(r.refId);
        if (W.can('createClaim') && r.refStatus === 'FEES_PAID' && !existing && me && r.agentId === me.id) {
          acts += '<button class="btn btn-sm btn-usm" data-action="claim" data-id="' + C.esc(r.refId) + '">Bina tuntutan</button>';
        }
        if (existing) {
          acts += '<a class="btn btn-sm btn-outline-secondary" href="claims.html?id=' + C.esc(existing.id) + '">' + C.esc(existing.id) + '</a>';
        }

        rows.push([
          C.esc(r.refId || '—'),
          '<div class="fw-semibold">' + C.esc(r.name) + '</div><div class="small text-muted">' + C.esc(r.country) + ' · ' + C.esc(r.passport) + '</div>',
          '<div>' + C.esc(r.program) + '</div><div class="small text-muted">' + C.esc(r.level) + ' · ' + C.esc(r.semester) + '</div>',
          C.esc(ag ? ag.name : r.agentId),
          C.statusBadge(r.refStatus, W.REF_LABEL[r.refStatus] || r.refStatus),
          App.money(r.firstYearFee) + '<div class="small text-muted">Komisen: ' + App.money(W.commissionOf(r)) + ' ' + C.draf('Kadar ' + W.ratePercent(r.level) + '% — DRAF') + '</div>',
          acts || '<span class="text-muted small">—</span>'
        ]);
      }

      var canAdd = me && W.can('addReferral') && (me.agentStatus === 'ACTIVE' || me.agentStatus === 'RENEWED');
      var addForm = '';
      if (W.can('addReferral')) {
        addForm = C.card('Rujuk pelajar baharu',
          (canAdd ? '' : '<div class="alert alert-warning small">Hanya ejen berstatus <strong>AKTIF</strong> boleh merujuk pelajar. '
            + 'Status anda sekarang: ' + C.statusBadge(me ? me.agentStatus : 'PENDING', me ? (W.AGENT_LABEL[me.agentStatus] || me.agentStatus) : 'Tiada') + '</div>')
          + '<form id="ref-form" class="row g-2">'
          + '<div class="col-sm-6"><label class="form-label small">Nama penuh *</label><input class="form-control form-control-sm" name="name" value="Bagus Santoso"></div>'
          + '<div class="col-sm-6"><label class="form-label small">No. pasport</label><input class="form-control form-control-sm" name="passport" value="A55667788"></div>'
          + '<div class="col-sm-6"><label class="form-label small">Negara</label><input class="form-control form-control-sm" name="country" value="Indonesia"></div>'
          + '<div class="col-sm-6"><label class="form-label small">Program</label><input class="form-control form-control-sm" name="program" value="Bachelor of Computer Science"></div>'
          + '<div class="col-sm-4"><label class="form-label small">Level</label><select class="form-select form-select-sm" name="level"><option>UG</option><option>PG</option></select></div>'
          + '<div class="col-sm-8"><label class="form-label small">Yuran tahun pertama (RM)</label><input class="form-control form-control-sm" name="firstYearFee" value="34500">'
          + '<div class="form-text">Asas kiraan komisen ' + C.draf('Kadar komisen — DRAF') + '</div></div>'
          + '<div class="col-12"><button type="button" class="btn btn-usm btn-sm" data-action="add"' + (canAdd ? '' : ' disabled') + '>Hantar rujukan</button></div>'
          + '</form>');
      }

      ctx.host.innerHTML =
        App.pageTitle('Rujukan Pelajar',
          'Status disahkan secara manual oleh pegawai berautoriti — tiada integrasi automatik.')
        + '<div class="row g-3"><div class="col-lg-8">'
        + C.card('Rujukan (' + rows.length + ')',
            C.table(['ID', 'Pelajar', 'Program', 'Ejen', 'Status', 'Yuran tahun 1', 'Tindakan'], rows,
              { empty: 'Tiada rujukan.' }))
        + '</div><div class="col-lg-4">' + addForm
        + C.card('Aliran status rujukan', C.statusTrail(NS.SEED.REFERRAL_STAGE_LABELS, 1)
            + '<p class="small text-muted mt-2 mb-0">Tuntutan komisen hanya boleh dibina selepas '
            + '<strong>Fees Paid</strong>.</p>')
        + '</div></div>';
    }

    App.onAction(ctx.host, function (action, el) {
      var id = el.getAttribute('data-id');
      var r = null;
      if (action === 'advance') {
        r = App.run(function () { return W.advanceReferral(id); }, 'Status rujukan dikemas kini.');
      } else if (action === 'claim') {
        var me = S.currentAgent();
        r = App.run(function () { return W.createClaim(me.id, id); }, 'Draf tuntutan dibina.');
        if (r) { App.go('claims', { id: r.id }); return; }
      } else if (action === 'add') {
        var f = App.el('ref-form');
        var d = {};
        var ins = f.querySelectorAll('input, select');
        for (var i = 0; i < ins.length; i++) { if (ins[i].name) d[ins[i].name] = ins[i].value; }
        if (!d.name || !d.program) { App.toast('Nama dan program wajib diisi.', 'danger'); return; }
        var me2 = S.currentAgent();
        r = App.run(function () { return W.addReferral(me2.id, d); }, 'Rujukan pelajar dihantar.');
      } else { return; }
      if (r) render();
    });

    render();
  });
})(window);

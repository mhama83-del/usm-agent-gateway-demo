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
            + C.esc(r.refId) + '" title="Sahkan secara manual: ' + C.esc(nextLabel) + '">→ '
            + C.esc(nextLabel) + '</button> ';
        }
        if (W.can('createClaim') && r.refStatus === 'FEES_PAID' && !existing && me && r.agentId === me.id) {
          acts += '<button class="btn btn-sm btn-usm" data-action="claim" data-id="' + C.esc(r.refId) + '">Bina tuntutan</button>';
        }
        if (existing) {
          acts += '<a class="btn btn-sm btn-outline-secondary" href="claims.html?id=' + C.esc(existing.id) + '">'
            + C.esc(existing.id) + ' · ' + C.esc(W.CLAIM_LABEL[existing.claimStatus]) + '</a>';
        }

        rows.push([
          '<span class="fw-semibold">' + C.esc(r.refId || '—') + '</span>'
            + (r.isDemoCreated ? '<div><span class="badge bg-warning text-dark mt-1">BARU</span></div>' : ''),
          '<div class="fw-semibold">' + C.esc(r.name) + '</div>'
            + '<div class="small text-muted">' + C.esc(r.country) + ' · ' + C.esc(r.passport) + '</div>',
          '<div>' + C.esc(r.program) + '</div>'
            + '<div class="small text-muted">' + C.esc(r.level) + ' · ' + C.esc(r.semester) + '</div>',
          C.esc(ag ? ag.name : r.agentId),
          C.statusBadge(r.refStatus, W.REF_LABEL[r.refStatus] || r.refStatus),
          App.money(r.firstYearFee)
            + '<div class="small text-muted">Komisen: '
            + C.amountWithNotes(App.money(W.commissionOf(r)), r.level, W.ratePercent(r.level), null)
            + '</div>',
          acts || '<span class="text-muted small">—</span>'
        ]);
      }

      // penapis status
      var chips = '<div class="d-flex gap-1 flex-wrap">';
      chips += '<a class="btn btn-sm ' + (filter === 'all' ? 'btn-usm' : 'btn-outline-usm')
        + '" href="referrals.html">Semua (' + visible + ')</a>';
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
        addForm = C.card('Rujuk pelajar baharu',
          (canAdd ? ''
            : '<div class="alert alert-warning small">Hanya ejen berstatus <strong>AKTIF</strong> boleh '
              + 'merujuk pelajar (spesifikasi §15.1). Status anda: '
              + C.statusBadge(me ? me.agentStatus : 'PENDING',
                  me ? (W.AGENT_LABEL[me.agentStatus] || me.agentStatus) : 'Tiada ejen') + '</div>')
          + '<form id="ref-form" class="row g-2">'
          + '<div class="col-sm-6"><label class="form-label small" for="r-name">Nama penuh *</label>'
          + '<input id="r-name" class="form-control form-control-sm" name="name" value="Bagus Santoso"></div>'
          + '<div class="col-sm-6"><label class="form-label small" for="r-pp">No. pasport</label>'
          + '<input id="r-pp" class="form-control form-control-sm" name="passport" value="A55667788"></div>'
          + '<div class="col-sm-6"><label class="form-label small" for="r-country">Negara</label>'
          + '<input id="r-country" class="form-control form-control-sm" name="country" value="Indonesia"></div>'
          + '<div class="col-sm-6"><label class="form-label small" for="r-prog">Program *</label>'
          + '<input id="r-prog" class="form-control form-control-sm" name="program" value="Bachelor of Computer Science"></div>'
          + '<div class="col-sm-4"><label class="form-label small" for="r-level">Level</label>'
          + '<select id="r-level" class="form-select form-select-sm" name="level"><option>UG</option><option>PG</option></select></div>'
          + '<div class="col-sm-8"><label class="form-label small" for="r-fee">Yuran tahun pertama (RM)</label>'
          + '<input id="r-fee" class="form-control form-control-sm" name="firstYearFee" value="34500" inputmode="numeric">'
          + '<div class="form-text">Asas kiraan komisen: yuran × kadar '
          + W.ratePercent('UG') + '% (UG) / ' + W.ratePercent('PG') + '% (PG) '
          + C.draf('Kadar komisen — DRAF') + '</div></div>'
          + '<div class="col-12"><button type="button" class="btn btn-usm btn-sm" data-action="add"'
          + (canAdd ? '' : ' disabled') + '>Hantar rujukan</button></div>'
          + '</form>');
      }

      ctx.host.innerHTML =
        App.pageTitle('Rujukan Pelajar',
          'Status rujukan disahkan <strong>secara manual</strong> oleh pegawai berautoriti — '
          + 'tiada integrasi automatik dengan sistem kemasukan atau kewangan (spesifikasi §8.7).',
          '', 'Peringkat 4 — Ejen aktif')
        + '<div class="mb-3">' + chips + '</div>'
        + '<div class="row g-3"><div class="col-lg-8">'
        + C.card('Rujukan <span class="badge bg-light text-dark border ms-1">' + rows.length + '</span>',
            C.table(['ID', 'Pelajar', 'Program', 'Ejen', 'Status', 'Yuran tahun 1', 'Tindakan'], rows,
              { empty: 'Tiada rujukan untuk penapis ini.' }))
        + '</div><div class="col-lg-4">' + addForm
        + C.card('Aliran status rujukan',
            C.statusTrail(NS.SEED.REFERRAL_STAGE_LABELS, 1)
            + '<p class="small text-muted mt-3 mb-0">Tuntutan komisen hanya boleh dibina selepas '
            + 'rujukan mencapai <strong>Fees Paid</strong>, dan setiap rujukan hanya boleh '
            + 'mempunyai satu tuntutan.</p>')
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
        if (!d.name || !d.name.trim()) { App.toast('Nama pelajar wajib diisi.', 'danger'); return; }
        if (!d.program || !d.program.trim()) { App.toast('Program wajib diisi.', 'danger'); return; }
        var me2 = S.currentAgent();
        r = App.run(function () { return W.addReferral(me2.id, d); }, 'Rujukan pelajar dihantar.');
      } else { return; }
      if (r) render();
    });

    render();
  });
})(window);

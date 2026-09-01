/* application-wizard.js — Wizard permohonan: syarikat → PIC/pengarah →
   dokumen → deklarasi ABC → hantar. */
(function (root) {
  'use strict';
  var NS = root.USMDEMO;

  NS.App.register('application-wizard', function (ctx) {
    var S = ctx.S, W = ctx.W, C = ctx.C, App = ctx.App;
    var cfg = S.config();

    var docsHtml = '';
    for (var i = 0; i < NS.SEED.DOC_CHECKLIST.length; i++) {
      docsHtml += '<div class="usm-doc-row d-flex justify-content-between align-items-center gap-2">'
        + '<div class="small">' + C.esc(NS.SEED.DOC_CHECKLIST[i]) + '</div>'
        + '<span class="badge bg-light text-dark border">Dilampirkan (demo)</span>'
        + '</div>';
    }

    var feeLabel = App.money(cfg.fees.registrationNew) + ' ' + C.draf('Yuran pendaftaran NEW — DRAF');
    var bondLabel = App.money(cfg.fees.performanceBond) + ' ' + C.draf('Performance bond — DRAF');
    var capLabel = App.money(cfg.fees.paidUpCapitalMin) + ' ' + C.draf('Paid-up capital minimum — DRAF');
    var slaLabel = cfg.sla.usainsReviewDays + ' hari kalendar ' + C.draf('SLA semakan USAINS — DRAF');

    ctx.host.innerHTML =
      App.pageTitle('Permohonan Ejen', 'Wizard 4 langkah. Semua data yang anda taip adalah data demo.')
      + '<div class="row g-3"><div class="col-lg-8">'

      + '<div class="card mb-3"><div class="card-header">Langkah <span id="wz-num">1</span> daripada 4 — <span id="wz-title">Maklumat syarikat</span></div>'
      + '<div class="card-body">'
      + '<form id="wz-form" novalidate>'

      // Langkah 1
      + '<div class="wizard-step active" data-step="1">'
      + '  <div class="row g-2">'
      + '    <div class="col-12"><label class="form-label small">Nama syarikat *</label>'
      + '      <input class="form-control" name="name" required value="Nusantara Edu Partners Sdn Bhd"></div>'
      + '    <div class="col-sm-6"><label class="form-label small">Negara *</label>'
      + '      <input class="form-control" name="country" required value="Indonesia"></div>'
      + '    <div class="col-sm-6"><label class="form-label small">Jenis permohonan</label>'
      + '      <select class="form-select" name="mode"><option value="new">Baharu (NEW)</option><option value="renewal">Pembaharuan (RENEWAL)</option></select></div>'
      + '    <div class="col-sm-6"><label class="form-label small">No. pendaftaran (SSM/setara)</label>'
      + '      <input class="form-control" name="ssm" value="SSM 2201188-K"></div>'
      + '    <div class="col-sm-6"><label class="form-label small">Paid-up capital</label>'
      + '      <input class="form-control" name="paidUpCapital" value="RM 88,000">'
      + '      <div class="form-text">Minimum ' + capLabel + '</div></div>'
      + '    <div class="col-12"><label class="form-label small">Alamat berdaftar</label>'
      + '      <input class="form-control" name="registeredAddress" value="Jl. Thamrin 20, Jakarta Pusat, Indonesia"></div>'
      + '    <div class="col-sm-6"><label class="form-label small">Laman web</label>'
      + '      <input class="form-control" name="website" value="www.nusantara-edu.id"></div>'
      + '    <div class="col-sm-6"><label class="form-label small">E-mel rasmi</label>'
      + '      <input class="form-control" name="officialEmail" value="admin@nusantara-edu.id"></div>'
      + '  </div>'
      + '</div>'

      // Langkah 2
      + '<div class="wizard-step" data-step="2">'
      + '  <div class="row g-2">'
      + '    <div class="col-sm-6"><label class="form-label small">Person in Charge (PIC) *</label>'
      + '      <input class="form-control" name="pic" required value="Siti Rahayu"></div>'
      + '    <div class="col-sm-6"><label class="form-label small">Pengarah</label>'
      + '      <input class="form-control" name="director" value="Andi Wijaya (Passport B7712233)"></div>'
      + '    <div class="col-12"><label class="form-label small">Alamat operasi</label>'
      + '      <input class="form-control" name="operatingAddress" value="Same as registered address"></div>'
      + '  </div>'
      + '</div>'

      // Langkah 3
      + '<div class="wizard-step" data-step="3">'
      + '  <p class="small text-muted">Muat naik fail dimatikan dalam demo. Checklist di bawah '
      + '  dianggap dilampirkan; USAINS akan menyemak dan boleh memulangkan mana-mana dokumen.</p>'
      + docsHtml
      + '  <div class="alert alert-light border small mt-3 mb-0">'
      + '    Yuran pendaftaran: ' + feeLabel + ' · Performance bond: ' + bondLabel
      + '  </div>'
      + '</div>'

      // Langkah 4
      + '<div class="wizard-step" data-step="4">'
      + '  <h2 class="h6">Deklarasi Anti-Bribery and Corruption (ABC)</h2>'
      + '  <p class="small">Pemohon mengaku bahawa syarikat tidak menawarkan, memberi atau '
      + '  menerima apa-apa suapan berkaitan pengambilan pelajar ke USM, dan akan mematuhi '
      + '  polisi anti-rasuah USM sepanjang tempoh perjanjian. <em>(Teks demo, bukan teks sah.)</em></p>'
      + '  <div class="form-check">'
      + '    <input class="form-check-input" type="checkbox" id="abc" name="abcAccepted">'
      + '    <label class="form-check-label small" for="abc">Saya menerima deklarasi ABC bagi pihak syarikat.</label>'
      + '  </div>'
      + '  <div class="alert alert-warning small mt-3 mb-0">'
      + '    Selepas dihantar, SLA semakan USAINS bermula: ' + slaLabel
      + '  </div>'
      + '</div>'

      + '</form>'
      + '<div class="d-flex justify-content-between mt-3">'
      + '  <button class="btn btn-outline-secondary" data-action="prev" disabled>Kembali</button>'
      + '  <div class="d-flex gap-2">'
      + '    <button class="btn btn-usm" data-action="next">Seterusnya</button>'
      + '    <button class="btn btn-usm d-none" data-action="submit">Hantar permohonan</button>'
      + '  </div>'
      + '</div>'
      + '</div></div>'

      + '</div><div class="col-lg-4">'
      + C.card('Peringkat permohonan', C.statusTrail(NS.SEED.STAGE_LABELS, 1))
      + C.card('Nota demo',
          '<p class="small mb-2">Borang sudah diisi dengan data rekaan supaya demo pantas. '
          + 'Ubah mana-mana medan jika mahu.</p>'
          + '<p class="small mb-0">Selepas hantar, tukar peranan kepada <strong>USAINS</strong> '
          + 'di bar atas untuk menyemak dokumen.</p>')
      + '</div></div>';

    var step = 1;
    var TITLES = { 1: 'Maklumat syarikat', 2: 'PIC &amp; pengarah', 3: 'Dokumen', 4: 'Deklarasi ABC' };

    function show(n) {
      step = n;
      var els = ctx.host.querySelectorAll('.wizard-step');
      for (var i = 0; i < els.length; i++) {
        els[i].className = 'wizard-step' + (Number(els[i].getAttribute('data-step')) === n ? ' active' : '');
      }
      App.el('wz-num').textContent = String(n);
      App.el('wz-title').innerHTML = TITLES[n];
      ctx.host.querySelector('[data-action="prev"]').disabled = (n === 1);
      ctx.host.querySelector('[data-action="next"]').className = 'btn btn-usm' + (n === 4 ? ' d-none' : '');
      ctx.host.querySelector('[data-action="submit"]').className = 'btn btn-usm' + (n === 4 ? '' : ' d-none');
    }

    function formData() {
      var f = App.el('wz-form');
      var out = {};
      var inputs = f.querySelectorAll('input, select, textarea');
      for (var i = 0; i < inputs.length; i++) {
        var el = inputs[i];
        if (!el.name) continue;
        out[el.name] = (el.type === 'checkbox') ? el.checked : el.value;
      }
      return out;
    }

    App.onAction(ctx.host, function (action) {
      if (action === 'next') {
        if (step === 1) {
          var d = formData();
          if (!d.name || !d.country) { App.toast('Nama syarikat dan negara wajib diisi.', 'danger'); return; }
        }
        if (step === 2 && !formData().pic) { App.toast('Nama PIC wajib diisi.', 'danger'); return; }
        show(Math.min(4, step + 1));
      } else if (action === 'prev') {
        show(Math.max(1, step - 1));
      } else if (action === 'submit') {
        var data = formData();
        if (!data.abcAccepted) { App.toast('Deklarasi ABC wajib diterima sebelum menghantar.', 'danger'); return; }
        var a = App.run(function () { return W.submitApplication(data); },
          'Permohonan dihantar. SLA semakan USAINS bermula.');
        if (a) App.go('application-detail', { id: a.id });
      }
    });

    show(1);
  });
})(window);

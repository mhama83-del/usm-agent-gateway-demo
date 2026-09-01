/* application-wizard.js — Wizard permohonan: syarikat → PIC/pengarah →
   dokumen → deklarasi ABC → hantar. */
(function (root) {
  'use strict';
  var NS = root.USMDEMO;

  var STEPS = [
    { n: 1, title: 'Maklumat syarikat' },
    { n: 2, title: 'PIC & pengarah' },
    { n: 3, title: 'Dokumen' },
    { n: 4, title: 'Deklarasi ABC' }
  ];

  NS.App.register('application-wizard', function (ctx) {
    var S = ctx.S, W = ctx.W, C = ctx.C, App = ctx.App;
    var cfg = S.config();
    var step = 1;

    function rail() {
      var h = '<div class="wizard-rail">';
      for (var i = 0; i < STEPS.length; i++) {
        var s = STEPS[i];
        var cls = s.n < step ? 'done' : (s.n === step ? 'current' : '');
        h += '<div class="rail-item ' + cls + '">' + s.n + '. ' + C.esc(s.title) + '</div>';
      }
      return h + '</div>';
    }

    function docsHtml() {
      var h = '';
      for (var i = 0; i < NS.SEED.DOC_CHECKLIST.length; i++) {
        h += '<div class="usm-doc-row d-flex justify-content-between align-items-center gap-2">'
          + '<div class="small">' + (i + 1) + '. ' + C.esc(NS.SEED.DOC_CHECKLIST[i]) + '</div>'
          + '<span class="badge bg-light text-dark border flex-shrink-0">Dilampirkan (demo)</span>'
          + '</div>';
      }
      return h;
    }

    var feeNew = App.money(cfg.fees.registrationNew) + C.draf('Yuran pendaftaran NEW — DRAF');
    var feeRenew = App.money(cfg.fees.registrationRenewal) + C.draf('Yuran pendaftaran RENEWAL — DRAF');
    var bond = App.money(cfg.fees.performanceBond) + C.draf('Performance bond — DRAF');
    var cap = App.money(cfg.fees.paidUpCapitalMin) + C.draf('Paid-up capital minimum — DRAF');
    var slaTxt = cfg.sla.usainsReviewDays + ' hari kalendar ' + C.draf('SLA semakan USAINS — DRAF');

    function formHtml() {
      return '<form id="wz-form" novalidate>'

      + '<div class="wizard-step" data-step="1">'
      + '  <div class="row g-2">'
      + '    <div class="col-12"><label class="form-label small" for="f-name">Nama syarikat *</label>'
      + '      <input id="f-name" class="form-control" name="name" required value="Nusantara Edu Partners Sdn Bhd"></div>'
      + '    <div class="col-sm-6"><label class="form-label small" for="f-country">Negara *</label>'
      + '      <input id="f-country" class="form-control" name="country" required value="Indonesia"></div>'
      + '    <div class="col-sm-6"><label class="form-label small" for="f-mode">Jenis permohonan</label>'
      + '      <select id="f-mode" class="form-select" name="mode">'
      + '        <option value="new">Baharu (NEW) — yuran ' + App.money(cfg.fees.registrationNew) + '</option>'
      + '        <option value="renewal">Pembaharuan (RENEWAL) — yuran ' + App.money(cfg.fees.registrationRenewal) + '</option>'
      + '      </select></div>'
      + '    <div class="col-sm-6"><label class="form-label small" for="f-ssm">No. pendaftaran (SSM / setara)</label>'
      + '      <input id="f-ssm" class="form-control" name="ssm" value="SSM 2201188-K"></div>'
      + '    <div class="col-sm-6"><label class="form-label small" for="f-cap">Paid-up capital</label>'
      + '      <input id="f-cap" class="form-control" name="paidUpCapital" value="RM 88,000">'
      + '      <div class="form-text">Minimum ' + cap + '</div></div>'
      + '    <div class="col-12"><label class="form-label small" for="f-addr">Alamat berdaftar</label>'
      + '      <input id="f-addr" class="form-control" name="registeredAddress" value="Jl. Thamrin 20, Jakarta Pusat, Indonesia"></div>'
      + '    <div class="col-sm-6"><label class="form-label small" for="f-web">Laman web</label>'
      + '      <input id="f-web" class="form-control" name="website" value="www.nusantara-edu.id"></div>'
      + '    <div class="col-sm-6"><label class="form-label small" for="f-mail">E-mel rasmi</label>'
      + '      <input id="f-mail" class="form-control" name="officialEmail" value="admin@nusantara-edu.id"></div>'
      + '  </div>'
      + '</div>'

      + '<div class="wizard-step" data-step="2">'
      + '  <div class="row g-2">'
      + '    <div class="col-sm-6"><label class="form-label small" for="f-pic">Person in Charge (PIC) *</label>'
      + '      <input id="f-pic" class="form-control" name="pic" required value="Siti Rahayu">'
      + '      <div class="form-text">PIC menjadi pengguna utama akaun ejen.</div></div>'
      + '    <div class="col-sm-6"><label class="form-label small" for="f-dir">Pengarah</label>'
      + '      <input id="f-dir" class="form-control" name="director" value="Andi Wijaya (Passport B7712233)"></div>'
      + '    <div class="col-12"><label class="form-label small" for="f-oaddr">Alamat operasi</label>'
      + '      <input id="f-oaddr" class="form-control" name="operatingAddress" value="Same as registered address"></div>'
      + '  </div>'
      + '</div>'

      + '<div class="wizard-step" data-step="3">'
      + '  <p class="small text-muted">Muat naik fail dimatikan dalam demo. Sembilan dokumen di bawah '
      + '  dianggap dilampirkan; USAINS akan menyemak satu per satu dan boleh memulangkan '
      + '  mana-mana dokumen dengan sebab.</p>'
      + docsHtml()
      + '  <div class="alert alert-light border small mt-3 mb-0">'
      + '    Yuran pendaftaran: NEW ' + feeNew + ' · RENEWAL ' + feeRenew + '<br>'
      + '    Performance bond: ' + bond
      + '  </div>'
      + '</div>'

      + '<div class="wizard-step" data-step="4">'
      + '  <h2 class="h6">Deklarasi Anti-Bribery and Corruption (ABC)</h2>'
      + '  <p class="small">Pemohon mengaku bahawa syarikat tidak menawarkan, memberi atau '
      + '  menerima apa-apa suapan berkaitan pengambilan pelajar ke USM, dan akan mematuhi '
      + '  polisi anti-rasuah USM sepanjang tempoh perjanjian.</p>'
      + '  <p class="small text-muted"><em>Teks demo — bukan teks perundangan sebenar.</em></p>'
      + '  <div class="form-check">'
      + '    <input class="form-check-input" type="checkbox" id="abc" name="abcAccepted">'
      + '    <label class="form-check-label small" for="abc">'
      + '      Saya menerima deklarasi ABC bagi pihak syarikat. <strong>(wajib)</strong></label>'
      + '  </div>'
      + '  <div id="wz-summary" class="mt-3"></div>'
      + '  <div class="alert alert-warning small mt-3 mb-0">'
      + '    Selepas dihantar, SLA semakan USAINS bermula: ' + slaTxt
      + '  </div>'
      + '</div>'
      + '</form>';
    }

    ctx.host.innerHTML =
      App.pageTitle('Permohonan Ejen',
        'Wizard 4 langkah. Semua data yang anda taip adalah data demo dan hilang bila Reset Demo ditekan.',
        '', 'Agent')
      + '<div class="row g-3"><div class="col-lg-8">'
      + '<div class="card mb-3">'
      + '  <div class="card-header" id="wz-head">Langkah 1 daripada 4 — Maklumat syarikat</div>'
      + '  <div class="card-body">'
      + '    <div id="wz-rail"></div>'
      + formHtml()
      + '    <div class="d-flex justify-content-between mt-3 gap-2">'
      + '      <button class="btn btn-outline-secondary" data-action="prev" disabled>Kembali</button>'
      + '      <div class="d-flex gap-2">'
      + '        <button class="btn btn-usm" data-action="next">Seterusnya</button>'
      + '        <button class="btn btn-usm d-none" data-action="submit">Hantar permohonan</button>'
      + '      </div>'
      + '    </div>'
      + '  </div>'
      + '</div>'
      + '</div><div class="col-lg-4">'
      + C.card('Peringkat permohonan', C.statusTrail(NS.SEED.STAGE_LABELS, 1)
          + '<p class="small text-muted mt-2 mb-0">Menghantar borang ini meletakkan fail pada '
          + '<strong>Peringkat 1 — Submitted</strong>.</p>')
      + C.card('Selepas hantar',
          '<ol class="small ps-3 mb-0">'
          + '<li>Tukar peranan ke <strong>USAINS</strong> di bar atas.</li>'
          + '<li>Semak dokumen; pulangkan satu dengan sebab.</li>'
          + '<li>Kembali ke <strong>Agent</strong> untuk membetulkannya.</li>'
          + '<li>USAINS sahkan semua, kemudian <em>verify &amp; forward</em>.</li>'
          + '</ol>')
      + '</div></div>';

    function show(n) {
      step = n;
      var els = ctx.host.querySelectorAll('.wizard-step');
      for (var i = 0; i < els.length; i++) {
        els[i].className = 'wizard-step' + (Number(els[i].getAttribute('data-step')) === n ? ' active' : '');
      }
      App.el('wz-rail').innerHTML = rail();
      App.el('wz-head').textContent = 'Langkah ' + n + ' daripada 4 — ' + STEPS[n - 1].title;
      ctx.host.querySelector('[data-action="prev"]').disabled = (n === 1);
      ctx.host.querySelector('[data-action="next"]').className = 'btn btn-usm' + (n === 4 ? ' d-none' : '');
      ctx.host.querySelector('[data-action="submit"]').className = 'btn btn-usm' + (n === 4 ? '' : ' d-none');
      if (n === 4) renderSummary();
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

    function renderSummary() {
      var d = formData();
      var fee = d.mode === 'renewal' ? cfg.fees.registrationRenewal : cfg.fees.registrationNew;
      App.el('wz-summary').innerHTML = C.card('Semakan akhir', C.defList([
        ['Syarikat', C.esc(d.name) + ' <span class="text-muted">(' + C.esc(d.country) + ')</span>'],
        ['Jenis', d.mode === 'renewal' ? 'Pembaharuan (RENEWAL)' : 'Baharu (NEW)'],
        ['PIC', C.esc(d.pic)],
        ['Pengarah', C.esc(d.director)],
        ['Dokumen', NS.SEED.DOC_CHECKLIST.length + ' dilampirkan (demo)'],
        ['Yuran pendaftaran', App.money(fee) + C.draf('Yuran pendaftaran — DRAF')],
        ['Performance bond', bond]
      ]));
    }

    App.onAction(ctx.host, function (action) {
      if (action === 'next') {
        var d = formData();
        if (step === 1) {
          if (!d.name || !d.name.trim()) { App.toast('Nama syarikat wajib diisi.', 'danger'); return; }
          if (!d.country || !d.country.trim()) { App.toast('Negara wajib diisi.', 'danger'); return; }
        }
        if (step === 2 && (!d.pic || !d.pic.trim())) {
          App.toast('Nama PIC wajib diisi.', 'danger'); return;
        }
        show(Math.min(4, step + 1));
      } else if (action === 'prev') {
        show(Math.max(1, step - 1));
      } else if (action === 'submit') {
        var data = formData();
        if (!data.abcAccepted) {
          App.toast('Deklarasi ABC wajib diterima sebelum menghantar.', 'danger');
          return;
        }
        var a = App.run(function () { return W.submitApplication(data); },
          'Permohonan dihantar. SLA semakan USAINS bermula.');
        if (a) App.go('application-detail', { id: a.id });
      }
    });

    show(1);
  });
})(window);

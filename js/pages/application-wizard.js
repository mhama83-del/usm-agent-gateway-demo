/* application-wizard.js — Wizard permohonan: syarikat → PIC/pengarah →
   dokumen → deklarasi ABC → hantar. */
(function (root) {
  'use strict';
  var NS = root.USMDEMO;

  var STEPS = [
    { n: 1, title: 'Company details' },
    { n: 2, title: 'PIC & director' },
    { n: 3, title: 'Documents' },
    { n: 4, title: 'ABC declaration' }
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
          + '<span class="badge bg-light text-dark border flex-shrink-0">Attached (demo)</span>'
          + '</div>';
      }
      return h;
    }

    var feeNew = App.money(cfg.fees.registrationNew) + C.draf('NEW registration fee — DRAFT');
    var feeRenew = App.money(cfg.fees.registrationRenewal) + C.draf('RENEWAL registration fee — DRAFT');
    var bond = App.money(cfg.fees.performanceBond) + C.draf('Performance bond — DRAFT');
    var cap = App.money(cfg.fees.paidUpCapitalMin) + C.draf('Minimum paid-up capital — DRAFT');
    var slaTxt = cfg.sla.usainsReviewDays + ' calendar days ' + C.draf('USAINS review SLA — DRAFT');

    function formHtml() {
      return '<form id="wz-form" novalidate>'

      + '<div class="wizard-step" data-step="1">'
      + '  <div class="row g-2">'
      + '    <div class="col-12"><label class="form-label small" for="f-name">Company name *</label>'
      + '      <input id="f-name" class="form-control" name="name" required value="Nusantara Edu Partners Sdn Bhd"></div>'
      + '    <div class="col-sm-6"><label class="form-label small" for="f-country">Country *</label>'
      + '      <input id="f-country" class="form-control" name="country" required value="Indonesia"></div>'
      + '    <div class="col-sm-6"><label class="form-label small" for="f-mode">Application type</label>'
      + '      <select id="f-mode" class="form-select" name="mode">'
      + '        <option value="new">New (NEW) — fee ' + App.money(cfg.fees.registrationNew) + '</option>'
      + '        <option value="renewal">Renewal (RENEWAL) — fee ' + App.money(cfg.fees.registrationRenewal) + '</option>'
      + '      </select></div>'
      + '    <div class="col-sm-6"><label class="form-label small" for="f-ssm">Registration no. (SSM / equivalent)</label>'
      + '      <input id="f-ssm" class="form-control" name="ssm" value="SSM 2201188-K"></div>'
      + '    <div class="col-sm-6"><label class="form-label small" for="f-cap">Paid-up capital</label>'
      + '      <input id="f-cap" class="form-control" name="paidUpCapital" value="RM 88,000">'
      + '      <div class="form-text">Minimum ' + cap + '</div></div>'
      + '    <div class="col-12"><label class="form-label small" for="f-addr">Registered address</label>'
      + '      <input id="f-addr" class="form-control" name="registeredAddress" value="Jl. Thamrin 20, Jakarta Pusat, Indonesia"></div>'
      + '    <div class="col-sm-6"><label class="form-label small" for="f-web">Website</label>'
      + '      <input id="f-web" class="form-control" name="website" value="www.nusantara-edu.id"></div>'
      + '    <div class="col-sm-6"><label class="form-label small" for="f-mail">Official e-mail</label>'
      + '      <input id="f-mail" class="form-control" name="officialEmail" value="admin@nusantara-edu.id"></div>'
      + '  </div>'
      + '</div>'

      + '<div class="wizard-step" data-step="2">'
      + '  <div class="row g-2">'
      + '    <div class="col-sm-6"><label class="form-label small" for="f-pic">Person in Charge (PIC) *</label>'
      + '      <input id="f-pic" class="form-control" name="pic" required value="Siti Rahayu">'
      + '      <div class="form-text">The PIC becomes the primary user of the agent account.</div></div>'
      + '    <div class="col-sm-6"><label class="form-label small" for="f-dir">Director</label>'
      + '      <input id="f-dir" class="form-control" name="director" value="Andi Wijaya (Passport B7712233)"></div>'
      + '    <div class="col-12"><label class="form-label small" for="f-oaddr">Operating address</label>'
      + '      <input id="f-oaddr" class="form-control" name="operatingAddress" value="Same as registered address"></div>'
      + '  </div>'
      + '</div>'

      + '<div class="wizard-step" data-step="3">'
      + '  <p class="small text-muted">File upload is disabled in the demo. The nine documents below '
      + '  are treated as attached; USAINS reviews them one by one and may return any '
      + '  document with a reason.</p>'
      + docsHtml()
      + '  <div class="alert alert-light border small mt-3 mb-0">'
      + '    Registration fee: NEW ' + feeNew + ' · RENEWAL ' + feeRenew + '<br>'
      + '    Performance bond: ' + bond
      + '  </div>'
      + '</div>'

      + '<div class="wizard-step" data-step="4">'
      + '  <h2 class="h6">Deklarasi Anti-Bribery and Corruption (ABC)</h2>'
      + '  <p class="small">The applicant declares that the company does not offer, give or '
      + '  accept any bribe in connection with student recruitment to USM, and will comply '
      + '  with USM anti-corruption policy throughout the agreement term.</p>'
      + '  <p class="small text-muted"><em>Demo text — not actual legal wording.</em></p>'
      + '  <div class="form-check">'
      + '    <input class="form-check-input" type="checkbox" id="abc" name="abcAccepted">'
      + '    <label class="form-check-label small" for="abc">'
      + '      I accept the ABC declaration on behalf of the company. <strong>(required)</strong></label>'
      + '  </div>'
      + '  <div id="wz-summary" class="mt-3"></div>'
      + '  <div class="alert alert-warning small mt-3 mb-0">'
      + '    Once submitted, the USAINS review SLA starts: ' + slaTxt
      + '  </div>'
      + '</div>'
      + '</form>';
    }

    ctx.host.innerHTML =
      App.pageTitle('Agent Application',
        '4-step wizard. Everything you type here is demo data and is cleared when Reset Demo is pressed.',
        '', 'Agent')
      + '<div class="row g-3"><div class="col-lg-8">'
      + '<div class="card mb-3">'
      + '  <div class="card-header" id="wz-head">Step 1 of 4 — Company details</div>'
      + '  <div class="card-body">'
      + '    <div id="wz-rail"></div>'
      + formHtml()
      + '    <div class="d-flex justify-content-between mt-3 gap-2">'
      + '      <button class="btn btn-outline-secondary" data-action="prev" disabled>Back</button>'
      + '      <div class="d-flex gap-2">'
      + '        <button class="btn btn-usm" data-action="next">Next</button>'
      + '        <button class="btn btn-usm d-none" data-action="submit">Submit application</button>'
      + '      </div>'
      + '    </div>'
      + '  </div>'
      + '</div>'
      + '</div><div class="col-lg-4">'
      + C.card('Application stage', C.statusTrail(NS.SEED.STAGE_LABELS, 1)
          + '<p class="small text-muted mt-2 mb-0">Submitting this form places the file at '
          + '<strong>Stage 1 — Submitted</strong>.</p>')
      + C.card('After submitting',
          '<ol class="small ps-3 mb-0">'
          + '<li>Switch to the <strong>USAINS</strong> role in the top bar.</li>'
          + '<li>Review the documents; return one with a reason.</li>'
          + '<li>Switch back to <strong>Agent</strong> to correct it.</li>'
          + '<li>USAINS verifies everything, then does <em>verify &amp; forward</em>.</li>'
          + '</ol>')
      + '</div></div>';

    function show(n) {
      step = n;
      var els = ctx.host.querySelectorAll('.wizard-step');
      for (var i = 0; i < els.length; i++) {
        els[i].className = 'wizard-step' + (Number(els[i].getAttribute('data-step')) === n ? ' active' : '');
      }
      App.el('wz-rail').innerHTML = rail();
      App.el('wz-head').textContent = 'Step ' + n + ' of 4 — ' + STEPS[n - 1].title;
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
      App.el('wz-summary').innerHTML = C.card('Final review', C.defList([
        ['Company', C.esc(d.name) + ' <span class="text-muted">(' + C.esc(d.country) + ')</span>'],
        ['Type', d.mode === 'renewal' ? 'Renewal (RENEWAL)' : 'New (NEW)'],
        ['PIC', C.esc(d.pic)],
        ['Director', C.esc(d.director)],
        ['Documents', NS.SEED.DOC_CHECKLIST.length + ' attached (demo)'],
        ['Registration fee', App.money(fee) + C.draf('Registration fee — DRAFT')],
        ['Performance bond', bond]
      ]));
    }

    App.onAction(ctx.host, function (action) {
      if (action === 'next') {
        var d = formData();
        if (step === 1) {
          if (!d.name || !d.name.trim()) { App.toast('Company name is required.', 'danger'); return; }
          if (!d.country || !d.country.trim()) { App.toast('Country is required.', 'danger'); return; }
        }
        if (step === 2 && (!d.pic || !d.pic.trim())) {
          App.toast('PIC name is required.', 'danger'); return;
        }
        show(Math.min(4, step + 1));
      } else if (action === 'prev') {
        show(Math.max(1, step - 1));
      } else if (action === 'submit') {
        var data = formData();
        if (!data.abcAccepted) {
          App.toast('The ABC declaration must be accepted before submitting.', 'danger');
          return;
        }
        var a = App.run(function () { return W.submitApplication(data); },
          'Application submitted. The USAINS review SLA has started.');
        if (a) App.go('application-detail', { id: a.id });
      }
    });

    show(1);
  });
})(window);

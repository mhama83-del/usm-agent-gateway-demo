/* vendor-registration.js — Borang pendaftaran vendor bukan perdagangan
   (USM.FIS.AP.B.2023.01, Jabatan Bendahari).

   Seksyen 1 (Part A/B/C) diisi ejen; Seksyen 2 oleh PTJ; Seksyen 3 oleh
   Jabatan Bendahari yang mengeluarkan Kod Pembekal. Tanpa kod itu, rekod
   bayaran tuntutan disekat (peraturan R-1).

   Seksyen 2 & 3 asalnya Bahasa Melayu dalam borang rasmi — diterjemah ke
   English mengikut keputusan D-023. Kod dokumen dan label "USM Office Use
   Only" dikekalkan seperti asal. */
(function (root) {
  'use strict';
  var NS = root.USMDEMO;

  var FORM_CODE = 'USM.FIS.AP.B.2023.01';

  // Medan Part A & Part B yang boleh diisi ejen. [kunci, label, placeholder]
  var PART_A = [
    ['fullName', 'Full Name'],
    ['registrationNo', 'Registration/ Passport/ National Identification Card No'],
    ['address', 'Address'],
    ['phoneMalaysia', 'Telephone No. (Malaysia if any)'],
    ['phoneOrigin', 'Telephone No. (Origin country)'],
    ['email', 'Email Address'],
    ['nationality', 'Nationality'],
    ['contactPerson', 'Contact Person (if applicable)']
  ];
  var PART_B = [
    ['bankAccountHolder', 'Bank Account Holder Name'],
    ['bankName', 'Bank Full Name'],
    ['bankAccountNo', 'Bank Account No.'],
    ['bankAddress', 'Bank Address'],
    ['swiftCode', 'Swift Code'],
    ['bankBranch', 'Bank Branch']
  ];
  var PART_B_FOREIGN = [
    ['routingNumber', 'Routing Number'],
    ['ibanNumber', 'IBAN Number'],
    ['bsbCode', 'BSB Code'],
    ['ifscCode', 'IFSC Code']
  ];

  NS.App.register('vendor-registration', function (ctx) {
    var S = ctx.S, W = ctx.W, C = ctx.C, App = ctx.App;

    function pickAgent() {
      var wanted = App.qs('id');
      if (wanted && S.agent(wanted)) return S.agent(wanted);
      if (S.role() === 'agent') return S.currentAgent();
      // Peranan dalaman: utamakan kes yang menunggu tindakan mereka.
      var list = S.agents(), i;
      for (i = 0; i < list.length; i++) {
        if (list[i].vendor && list[i].vendor.vendorStatus === 'Pending Bendahari') return list[i];
      }
      for (i = 0; i < list.length; i++) {
        if (list[i].vendor && list[i].vendor.vendorStatus === 'Not Registered') return list[i];
      }
      return S.currentAgent() || list[0] || null;
    }

    var current = pickAgent();
    var currentId = current ? current.id : null;

    function fieldRows(defs, v, editable) {
      var h = '';
      for (var i = 0; i < defs.length; i++) {
        var k = defs[i][0], label = defs[i][1];
        var val = v[k] == null ? '' : v[k];
        h += '<div class="col-sm-6">'
          + '<label class="form-label small" for="vf-' + k + '">' + C.esc(label) + '</label>'
          + (editable
              ? '<input id="vf-' + k + '" class="form-control form-control-sm" name="' + k + '" '
                + 'value="' + C.esc(val === '—' ? '' : val) + '">'
              : '<div class="form-control form-control-sm bg-light" id="vf-' + k + '">'
                + C.esc(val || '—') + '</div>')
          + '</div>';
      }
      return h;
    }

    function render() {
      current = currentId ? S.agent(currentId) : null;
      var role = S.role();

      if (!current) {
        ctx.host.innerHTML = App.pageTitle('Vendor Registration')
          + '<div class="alert alert-warning">No agent selected. '
          + '<a href="dashboard.html">Back to the dashboard</a>.</div>';
        return;
      }

      var v = current.vendor || {};
      var status = v.vendorStatus || 'Not Registered';
      var registered = W.isVendorRegistered(current);
      var canEdit = W.can('submitVendorForm') && !registered
        && (current.agentStatus === 'ACTIVE' || current.agentStatus === 'RENEWED');

      // --- senarai ejen di sisi ---
      var list = S.agents(), rows = [];
      for (var i = 0; i < list.length; i++) {
        var a = list[i];
        if (role === 'agent' && a.id !== (S.currentAgent() || {}).id) continue;
        var av = a.vendor || {};
        rows.push([
          '<a href="vendor-registration.html?id=' + C.esc(a.id) + '" class="fw-semibold">'
            + C.esc(a.id) + '</a>'
            + (a.id === currentId ? ' <span class="badge bg-warning text-dark">SHOWN</span>' : ''),
          '<div class="fw-semibold">' + C.esc(a.name) + '</div>'
            + '<div class="small text-muted">' + C.esc(a.country) + '</div>',
          C.statusBadge(av.vendorStatus, W.VENDOR_LABEL[av.vendorStatus] || av.vendorStatus),
          '<span class="font-monospace small">' + C.esc(av.supplierCode || '—') + '</span>'
        ]);
      }

      // --- Tindakan ALIRAN KERJA: bergantung peranan dan vendorStatus ---
      var workflowActs = [];
      if (canEdit) {
        workflowActs.push('<button class="btn btn-sm btn-usm" data-action="submit-vendor">Submit registration form</button>');
      }
      if (W.can('verifyVendorPTJ') && status === 'Pending Bendahari' && !v.ptjVerified) {
        workflowActs.push('<button class="btn btn-sm btn-usm" data-action="verify-ptj">Verify Section 2 (PTJ)</button>');
      }
      if (W.can('issueSupplierCode') && status === 'Pending Bendahari') {
        workflowActs.push('<button class="btn btn-sm btn-usm" data-action="issue-code">Issue Supplier Code</button>');
      }

      // --- Tindakan DOKUMEN: TIDAK BERPAGAR ---
      // Keputusan owner 28 Sep 2026: borang boleh dicetak/disimpan dalam
      // MANA-MANA keadaan vendorStatus (Registered, Pending Bendahari, Not
      // Registered) oleh SETIAP peranan yang boleh membuka skrin ini.
      //
      // Ia sengaja dibina di luar setiap blok `if` di atas dan digabungkan
      // secara berasingan, supaya suntingan akan datang tidak boleh
      // memagarnya tanpa disedari. Ujian responsive-360.chrome.js menyemak
      // butang ini merentas ketiga-tiga vendorStatus x peranan berkaitan.
      var docActs = ['<button class="btn btn-sm btn-outline-secondary" data-action="print">'
        + 'Print / Save as PDF</button>'];

      var acts = workflowActs.concat(docActs);

      // --- banner keadaan ---
      var banner;
      if (registered) {
        banner = '<div class="alert alert-success small"><strong>Registered non-trade vendor.</strong> '
          + 'Supplier Code <strong class="font-monospace">' + C.esc(v.supplierCode) + '</strong> — '
          + 'commission payments to this agent can be recorded.</div>';
      } else if (status === 'Pending Bendahari') {
        banner = '<div class="alert alert-warning small"><strong>Awaiting Supplier Code.</strong> '
          + (v.ptjVerified
              ? 'Section 2 is verified; the Bursary has yet to issue a code. '
              : 'Section 2 (PTJ verification) is still outstanding. ')
          + 'Payment remains blocked until a Supplier Code is issued '
          + C.draf('Bursary SLA to issue a Supplier Code — DRAFT') + '.</div>';
      } else if (current.agentStatus !== 'ACTIVE' && current.agentStatus !== 'RENEWED') {
        banner = '<div class="alert alert-light border small">'
          + 'Only <strong>ACTIVE</strong> agents may submit this form (rule R-3). Current status: '
          + C.statusBadge(current.agentStatus, W.AGENT_LABEL[current.agentStatus] || current.agentStatus)
          + '</div>';
      } else {
        banner = '<div class="alert alert-danger small"><strong>Not registered with the Bursary.</strong> '
          + 'Commission payments to this agent are <strong>blocked</strong> until the form below is '
          + 'submitted and a Supplier Code is issued.</div>';
      }

      var sla = S.config().vendor.supplierCodeSlaDays;

      // Pengepala ini tersembunyi pada skrin (.print-only) dan muncul hanya
      // pada cetakan, meniru kepala borang rasmi.
      var printHead = '<div class="print-only print-sheet-head">'
        + '<img src="' + C.esc(App.asset(App.BASE + 'assets/img/usm-apex-logo.svg')) + '" class="print-logo" '
        + 'alt="Universiti Sains Malaysia · APEX">'
        + '<div>'
        + '<div class="print-sheet-org">OFFICE OF THE BURSAR</div>'
        + '<div class="print-sheet-title">NON-TRADE VENDOR REGISTRATION FORM</div>'
        + '<div class="print-sheet-code">Document Code: ' + FORM_CODE
        + ' · Amendment: 00 · Date: 01.08.2023</div>'
        + '</div></div>'
        + '<div class="print-only print-demo-note">'
        + 'DEMO ONLY · All data is fictitious · Not a USM production document'
        + '</div>';

      ctx.host.innerHTML =
        printHead
        + App.pageTitle('Vendor Registration',
          'Non-trade vendor registration with the Office of the Bursar — form '
          + '<span class="font-monospace">' + FORM_CODE + '</span>. '
          + 'A Supplier Code is required before any commission payment can be recorded. '
          + 'Bursary SLA: ' + sla + ' days ' + C.draf('Bursary SLA to issue a Supplier Code — DRAFT'),
          acts.join(' '),
          'Office of the Bursar')
        + banner
        + '<div class="row g-3"><div class="col-lg-7">'

        // ---------- SEKSYEN 1 ----------
        + '<form id="vendor-form">'
        + C.card('SECTION 1 — Part A: Agency / Individual Information',
            '<div class="row g-2">' + fieldRows(PART_A, v, canEdit) + '</div>')
        + C.card('SECTION 1 — Part B: Banking Information',
            '<p class="small text-muted mb-2">Information required for payment purposes.</p>'
            + '<div class="row g-2">' + fieldRows(PART_B, v, canEdit) + '</div>'
            + '<div class="small fw-semibold mt-3 mb-2">Additional information for a foreign bank account</div>'
            + '<div class="row g-2">' + fieldRows(PART_B_FOREIGN, v, canEdit) + '</div>')
        + C.card('SECTION 1 — Part C: Declaration',
            '<p class="small mb-2">The representative authorised by the agency declares that the '
            + 'information given in <span class="font-monospace">' + FORM_CODE + '</span> is true, '
            + 'accurate and complete, that Universiti Sains Malaysia may make payments using it, '
            + 'and that the agency will return any money wrongly credited.</p>'
            + '<p class="small text-muted"><em>Demo text — not the actual legal wording.</em></p>'
            + '<div class="row g-2">'
            + '<div class="col-sm-6"><label class="form-label small" for="vf-declarationName">Name</label>'
            + (canEdit
                ? '<input id="vf-declarationName" class="form-control form-control-sm" name="declarationName" value="' + C.esc(v.declarationName === '—' ? '' : (v.declarationName || '')) + '">'
                : '<div class="form-control form-control-sm bg-light" id="vf-declarationName">' + C.esc(v.declarationName || '—') + '</div>')
            + '</div>'
            + '<div class="col-sm-6"><label class="form-label small" for="vf-declarationIdNo">Registration/ Passport/ National Identification Card No</label>'
            + (canEdit
                ? '<input id="vf-declarationIdNo" class="form-control form-control-sm" name="declarationIdNo" value="' + C.esc(v.declarationIdNo === '—' ? '' : (v.declarationIdNo || '')) + '">'
                : '<div class="form-control form-control-sm bg-light" id="vf-declarationIdNo">' + C.esc(v.declarationIdNo || '—') + '</div>')
            + '</div>'
            + '<div class="col-sm-6"><label class="form-label small" for="vf-designation">Designation</label>'
            + (canEdit
                ? '<input id="vf-designation" class="form-control form-control-sm" name="designation" value="' + C.esc(v.designation === '—' ? '' : (v.designation || '')) + '">'
                : '<div class="form-control form-control-sm bg-light" id="vf-designation">' + C.esc(v.designation || '—') + '</div>')
            + '</div>'
            + '<div class="col-sm-6"><label class="form-label small">Date</label>'
            + '<div class="form-control form-control-sm bg-light">' + C.esc(v.declarationDateLabel || '—') + '</div></div>'
            + '</div>'
            + (canEdit
                ? '<div class="form-check mt-3">'
                  + '<input class="form-check-input" type="checkbox" id="vf-accept" name="declarationAccepted">'
                  + '<label class="form-check-label small" for="vf-accept">'
                  + 'I accept this declaration on behalf of the agency. <strong>(required)</strong></label></div>'
                : '<div class="mt-3">' + (v.declarationSigned
                    ? '<span class="badge bg-success">Declaration signed</span>'
                    : '<span class="badge bg-secondary">Not yet signed</span>')
                  + ' <span class="small text-muted ms-1">Demo status only — not a valid e-signature.</span></div>'))
        + '</form>'
        + '</div><div class="col-lg-5">'

        // ---------- SEKSYEN 2 & 3 ----------
        + C.card('SECTION 2 — Responsibility Centre (PTJ) '
            + '<span class="badge bg-light text-dark border ms-1">USM Office Use Only</span>',
            C.defList([
              ['Purpose of Application', C.esc(v.ptjPurpose || '—')],
              ['Applicant Name', C.esc(v.ptjApplicantName || '—')],
              ['Name &amp; Grade of Position', C.esc(v.ptjGrade || '—')],
              ['Email Address', C.esc(v.ptjEmail || '—')],
              ['Date', C.esc(v.ptjDateLabel || '—')],
              ['Verified', v.ptjVerified
                ? '<span class="badge bg-success">Yes</span>'
                : '<span class="badge bg-secondary">Not yet</span>']
            ]))
        + C.card('SECTION 3 — Office of the Bursar '
            + '<span class="badge bg-light text-dark border ms-1">USM Office Use Only</span>',
            C.defList([
              ['Non-Trade Supplier Code', v.supplierCode
                ? '<strong class="font-monospace">' + C.esc(v.supplierCode) + '</strong>'
                : '<span class="text-muted">Not yet issued</span>'],
              ['Category', C.esc(v.supplierCategory || S.config().vendor.supplierCodeType)
                + C.draf('Supplier code category for agents — DRAFT')
                + '<div class="small text-muted">TRADE · NONTRADE · GAJI · INVESTMENT · INTERCO · RLKA · LAIN</div>'],
              ['Processed By', C.esc(v.processedBy || '—')],
              ['Checked &amp; Verified By', C.esc(v.verifiedBy || '—')],
              ['Date', C.esc(v.issuedDateLabel || '—')],
              ['Status', C.statusBadge(status, W.VENDOR_LABEL[status] || status)]
            ]),
            { cls: 'card-accent' })
        + '<div class="no-print">'
        + C.card('Vendor status — all agents <span class="badge bg-light text-dark border ms-1">'
            + rows.length + '</span>',
            C.table(['ID', 'Agent', 'Status', 'Supplier Code'], rows,
              { empty: 'No agents for this role.' }))
        + '</div>'
        + C.card('Required attachments',
            '<ol class="small ps-3 mb-2">'
            + '<li>A copy of the Agency Registration Certificate / Identity Card / Passport</li>'
            + '<li>A copy of the front page of the bank statement</li>'
            + '</ol>'
            + '<p class="small mb-1">Completed forms are submitted to '
            + '<span class="font-monospace">evendor@usm.my</span>.</p>'
            + '<p class="small text-muted mb-0">File upload and e-mail are disabled in the demo; '
            + 'both documents are treated as attached.</p>')
        + '</div></div>';
    }

    function formData() {
      var f = App.el('vendor-form');
      var out = {};
      if (!f) return out;
      var els = f.querySelectorAll('input');
      for (var i = 0; i < els.length; i++) {
        var el = els[i];
        if (!el.name) continue;
        out[el.name] = (el.type === 'checkbox') ? el.checked : el.value;
      }
      return out;
    }

    App.onAction(ctx.host, function (action) {
      var r = null;
      if (action === 'submit-vendor') {
        var d = formData();
        r = App.run(function () { return W.submitVendorForm(currentId, d); },
          'Vendor registration form submitted for PTJ verification.');
      } else if (action === 'verify-ptj') {
        r = App.run(function () { return W.verifyVendorPTJ(currentId); },
          'Section 2 verified — forwarded to the Bursary.');
      } else if (action === 'issue-code') {
        r = App.run(function () { return W.issueSupplierCode(currentId); },
          'Supplier Code issued. Payments to this agent are now unblocked.');
      } else if (action === 'print') {
        if (root.print) root.print();
        return;
      } else { return; }
      if (r) render();
    });

    render();
  });
})(window);

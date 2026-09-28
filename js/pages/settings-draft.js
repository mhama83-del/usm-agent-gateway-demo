/* settings-draft.js — Penutup demo: SEMUA nilai CONFIG_DRAFT di satu tempat.
 *
 * Senarai medan DIJANA dengan merentasi CONFIG_DRAFT secara rekursif, bukan
 * ditaip tangan — jadi menambah nilai baharu dalam data/seed.js secara automatik
 * muncul di sini dengan lencana DRAFT. Tiada nilai boleh terlepas.
 */
(function (root) {
  'use strict';
  var NS = root.USMDEMO;

  // Metadata paparan mengikut laluan bertitik. Laluan yang tiada di sini tetap
  // dipaparkan (label dijana dari nama kunci) supaya tiada nilai tersembunyi.
  var META = {
    'commission.ug.label': { group: 'Commission', label: 'UG level label', editable: false },
    'commission.ug.ratePercent': { group: 'Commission', label: 'UG commission rate', unit: '%',
      note: 'Each UG claim amount = first-year fee × this rate.' },
    'commission.ug.basis': { group: 'Commission', label: 'UG calculation basis', editable: false },
    'commission.pg.label': { group: 'Commission', label: 'PG level label', editable: false },
    'commission.pg.ratePercent': { group: 'Commission', label: 'PG commission rate', unit: '%',
      note: 'Each PG claim amount = first-year fee × this rate.' },
    'commission.pg.basis': { group: 'Commission', label: 'PG calculation basis', editable: false },
    'commission.paymentWindowDays': { group: 'Commission', label: 'Payment window after approval', unit: 'days' },

    'fees.registrationNew': { group: 'Fees & bonds', label: 'Registration fee — NEW', unit: 'RM' },
    'fees.registrationRenewal': { group: 'Fees & bonds', label: 'Registration fee — RENEWAL', unit: 'RM' },
    'fees.performanceBond': { group: 'Fees & bonds', label: 'Performance bond', unit: 'RM' },
    'fees.paidUpCapitalMin': { group: 'Fees & bonds', label: 'Minimum paid-up capital', unit: 'RM' },

    'sla.usainsReviewDays': { group: 'SLA', label: 'USAINS review SLA', unit: 'calendar days',
      note: 'Drives the SLA chip for applications created during the demo.' },
    'sla.leapDecisionDays': { group: 'SLA', label: 'USM LEAP decision SLA', unit: 'calendar days' },
    'sla.claimDecisionDays': { group: 'SLA', label: 'Claim decision SLA', unit: 'days' },
    'sla.approachingWithinDays': { group: 'SLA', label: '"Approaching Deadline" threshold', unit: 'days before the deadline',
      note: 'Days remaining ≤ this value turns the SLA chip from green to amber.' },
    'sla.expiryAlertsDays': { group: 'SLA', label: 'Agreement expiry alerts', unit: 'days' },

    'eligibility.minStudyMonths': { group: 'Eligibility & renewal', label: 'Minimum study period (claim)', unit: 'months' },
    'renewal.minReferralsPerYear': { group: 'Eligibility & renewal', label: 'Referral threshold for renewal', unit: 'students/year' },
    'renewal.agreementTermYears': { group: 'Eligibility & renewal', label: 'Agreement term', unit: 'years' },

    'currency.usdToRm': { group: 'Currency & Bursary', label: 'USD → RM exchange rate', unit: 'RM per USD',
      note: 'Drives the "Total Fee (USD)" column on every Bursary claim batch. The USD figure is computed, never stored.' },
    'claimBatch.periodMonths': { group: 'Currency & Bursary', label: 'Claim batch period', unit: 'months',
      note: 'Length of the period covered by one batch submitted to the Bursary.' },
    'vendor.supplierCodeType': { group: 'Currency & Bursary', label: 'Supplier code category for agents', unit: 'category',
      note: 'Category recorded in Section 3 of USM.FIS.AP.B.2023.01. Agents are non-trade vendors.' },
    'vendor.supplierCodeSlaDays': { group: 'Currency & Bursary', label: 'Bursary SLA to issue a Supplier Code', unit: 'days',
      note: 'Time allowed for the Bursary to issue a Supplier Code once the vendor form is complete.' }
  };

  var GROUP_ORDER = ['Commission', 'Fees & bonds', 'SLA', 'Eligibility & renewal',
    'Currency & Bursary', 'Other'];

  function getPath(obj, path) {
    var p = path.split('.'), o = obj;
    for (var i = 0; i < p.length; i++) {
      if (o == null) return undefined;
      o = o[p[i]];
    }
    return o;
  }
  function setPath(obj, path, val) {
    var p = path.split('.'), o = obj;
    for (var i = 0; i < p.length - 1; i++) o = o[p[i]];
    o[p[p.length - 1]] = val;
  }

  // Rentas CONFIG_DRAFT dan pulangkan setiap nilai daun.
  function collectFields(cfg) {
    var out = [];
    (function walk(node, prefix) {
      for (var k in node) {
        if (!Object.prototype.hasOwnProperty.call(node, k)) continue;
        var v = node[k];
        var path = prefix ? prefix + '.' + k : k;
        if (v && typeof v === 'object' && !Array.isArray(v)) {
          walk(v, path);
        } else {
          var meta = META[path] || {};
          out.push({
            path: path,
            label: meta.label || k,
            unit: meta.unit || '',
            note: meta.note || '',
            group: meta.group || 'Other',
            editable: meta.editable !== false,
            type: Array.isArray(v) ? 'list' : (typeof v === 'number' ? 'number' : 'text')
          });
        }
      }
    })(cfg, '');
    return out;
  }

  NS.App.register('settings-draft', function (ctx) {
    var S = ctx.S, W = ctx.W, C = ctx.C, App = ctx.App;
    var FIELDS = [];

    function fieldRow(f, i) {
      var cfg = S.config();
      var val = getPath(cfg, f.path);
      var shown = (f.type === 'list') ? val.join(', ') : val;
      var input = f.editable
        ? '<input class="form-control form-control-sm" style="max-width:170px" '
          + 'data-field="' + i + '" value="' + C.esc(shown) + '" '
          + 'aria-label="' + C.esc(f.label) + '" inputmode="' + (f.type === 'number' ? 'numeric' : 'text') + '">'
        : '<span class="small">' + C.esc(shown) + '</span>';
      return [
        '<div class="fw-semibold">' + C.esc(f.label) + ' '
          + C.draf(f.note || 'DRAFT value — awaiting an owner decision') + '</div>'
          + (f.note ? '<div class="small text-muted">' + C.esc(f.note) + '</div>' : '')
          + '<div class="small text-muted font-monospace" style="font-size:.68rem">CONFIG_DRAFT.' + C.esc(f.path) + '</div>',
        input,
        '<span class="small text-muted">' + C.esc(f.unit || '—') + '</span>'
      ];
    }

    function render() {
      FIELDS = collectFields(S.config());

      var groups = {}, i;
      for (i = 0; i < FIELDS.length; i++) {
        var g = FIELDS[i].group;
        if (!groups[g]) groups[g] = [];
        groups[g].push(fieldRow(FIELDS[i], i));
      }

      var body = '';
      for (i = 0; i < GROUP_ORDER.length; i++) {
        var name = GROUP_ORDER[i];
        if (!groups[name]) continue;
        body += C.card(C.esc(name) + ' <span class="badge bg-light text-dark border ms-1">'
            + groups[name].length + '</span>',
          C.table(['Setting', 'DRAFT value', 'Unit'], groups[name]));
      }

      // Kesan langsung — bukti bahawa nilai DRAFT menggerakkan sistem
      var claims = S.claims(), rows = [];
      for (i = 0; i < Math.min(claims.length, 6); i++) {
        var c = claims[i];
        rows.push([
          C.esc(c.id) + '<div class="small text-muted">' + C.esc(c.student) + '</div>',
          C.esc(c.level),
          App.money(c.firstYearFee),
          W.ratePercent(c.level) + '%',
          '<strong>' + App.money(W.commissionOf(c)) + '</strong>' + C.snapMark()
        ]);
      }

      // Kesan langsung pada amaun USD setiap batch Bendahari
      var batchRows = [];
      var bl = S.batches();
      for (i = 0; i < bl.length; i++) {
        var bt = W.batchTotals(bl[i]);
        var bag = S.agent(bl[i].agentId);
        batchRows.push([
          C.esc(bl[i].batchNo),
          C.esc(bag ? bag.name : bl[i].agentId),
          App.money(bt.feeRm),
          S.config().currency.usdToRm,
          '<strong>' + C.esc(W.usdMoney(bt.feeRm)) + '</strong>'
        ]);
      }

      // Kesan langsung pada chip SLA
      var agents = S.agents(), slaRows = [];
      for (i = 0; i < agents.length; i++) {
        var a = agents[i];
        if (a.slaSource === 'seed') continue;
        slaRows.push([
          C.esc(a.id) + '<div class="small text-muted">' + C.esc(a.name) + '</div>',
          C.esc(W.APP_LABEL[a.appStatus] || a.appStatus),
          C.esc(W.fmt(W.slaDeadline(a))),
          C.slaChipForAgent(a)
        ]);
      }

      ctx.host.innerHTML =
        App.pageTitle('Settings (DRAFT)',
          'Every value here is an <strong>owner decision point</strong>. '
          + 'All ' + FIELDS.length + ' values in <code>CONFIG_DRAFT</code> are listed — '
          + 'this list is generated straight from the data, so no value can be missed.',
          '<button class="btn btn-sm btn-outline-secondary" data-action="restore">Restore seed values</button>',
          'Demo closing screen')
        + '<div class="alert alert-warning small">'
        + '<strong>This is not the production Configuration Module.</strong> In the real system every '
        + 'change is versioned with an audit history so past decisions stay bound to the policy '
        + 'in force when they were made (specification §16). Here changes are only stored in '
        + 'browser <code>localStorage</code> and are cleared when Reset Demo is pressed.'
        + '</div>'
        + '<div class="row g-3">'
        + '<div class="col-lg-7">' + body + '</div>'
        + '<div class="col-lg-5">'
        + C.card('Live effect — claim amounts',
            C.table(['Claim', 'Level', 'Year 1 fee', 'Rate', 'Commission amount'], rows,
              { empty: 'No claims.' }),
            { right: '<span class="small text-muted">Recomputed every time a value changes</span>',
              cls: 'card-accent' })
        + C.card('Live effect — Bursary batch (USD)',
            C.table(['Batch', 'Agent', 'Total (RM)', 'Rate', 'Total (USD)'], batchRows,
              { empty: 'No batches yet.' }),
            { right: '<span class="small text-muted">USD is computed, never stored</span>',
              cls: 'card-accent' })
        + C.card('Live effect — SLA chips',
            C.table(['Application', 'Status', 'Deadline', 'SLA'], slaRows,
              { empty: 'Create a new application through the wizard to see a computed SLA chip move.' }),
            { cls: 'card-accent' })
        + C.card('Roles &amp; access',
            '<p class="small mb-2">The role switcher in the top bar changes the navigation and the '
            + 'permitted actions. There is no real login in the demo.</p>'
            + '<p class="small text-muted mb-0">Agent · USAINS · USM LEAP · Payment Officer · Super Admin</p>')
        + '</div></div>';
    }

    ctx.host.addEventListener('change', function (ev) {
      var t = ev.target;
      var idx = t.getAttribute && t.getAttribute('data-field');
      if (idx == null) return;
      var f = FIELDS[Number(idx)];
      var cfg = S.config();
      var raw = t.value;
      if (f.type === 'list') {
        var parts = raw.split(','), out = [];
        for (var i = 0; i < parts.length; i++) {
          var n = Number(String(parts[i]).trim());
          if (!isNaN(n)) out.push(n);
        }
        if (!out.length) { App.toast('Invalid value — enter numbers separated by commas.', 'danger'); render(); return; }
        setPath(cfg, f.path, out);
      } else if (f.type === 'number') {
        var v = Number(raw);
        if (isNaN(v) || v < 0) { App.toast('Invalid value — enter a number of 0 or more.', 'danger'); render(); return; }
        setPath(cfg, f.path, v);
      } else {
        setPath(cfg, f.path, raw);
      }
      S.save();
      App.toast(f.label + ' → ' + t.value, 'success');
      render();
    });

    App.onAction(ctx.host, function (action) {
      if (action !== 'restore') return;
      var st = S.state();
      st.config = S.clone(NS.SEED.CONFIG_DRAFT);
      S.save();
      App.toast('All DRAFT values restored to the seed values.', 'success');
      render();
    });

    render();
  });

  // Didedahkan untuk ujian liputan.
  NS.App.settingsFields = collectFields;
})(window);

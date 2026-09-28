/* claim-batch.js — Batch tuntutan komisen dalam format borang Bendahari.

   Susunan lajur mengikut AGENT COMMISSION CLAIM TEMPLATE.xlsx secara TEPAT
   (19 lajur A-S, header dua baris, O3:R3 bercantum), dengan blok sign-off
   daripada CONTOH EXCEL SUBMIT BENDAHARI.xlsx. Lihat keputusan D-020 dalam
   docs/USM-Agent-Gateway-Integrasi-Bendahari-Vendor.md.

   Label sign-off diterjemah ke English (keputusan owner 28 Sep 2026) — ia
   label borang, bukan kod. Hanya kod dokumen dan "USM Office Use Only" kekal
   verbatim.

   JANGAN "kemas" ejaan header — ruang berganda dan garis miring dikekalkan
   persis seperti dalam Excel, dan ujian memadankannya secara tepat. */
(function (root) {
  'use strict';
  var NS = root.USMDEMO;

  var SHEET_TITLE = 'Foreign Student Recruitment Agent Student List for Commission Claim';

  // Baris 3 borang Excel. 'FEEDBACK FROM USM' merentangi empat lajur (O-R).
  var COLUMNS = [
    'No. of Student',
    'Agent Name',
    'Student Name',
    'Passport No.',
    'Student Matric No. (mandatory)',
    'Student USM ID No.       (mandatory)',
    'Postgraduate (PG) or Undergraduate (UG)',
    'REFERENCE NUMBER',
    'Name of School/ Faculty',
    'Name of Programme',
    'Total Fee (RM)',
    'Total Fee (USD)',
    'Date Paid to USM',
    'RECEIPT NO.',
    'FEEDBACK FROM USM',
    'Status Reply From IPS/BPA'
  ];
  // Baris 4 — sub-tajuk di bawah 'FEEDBACK FROM USM'.
  var SUBCOLUMNS = ['DATE', 'RECEIPT NO', 'AMAUN (USD)', 'AMAUN (RM)'];

  // Rekod pelajar bagi satu tuntutan. Tuntutan seed lama tiada refId, jadi
  // pasport digunakan sebagai sandaran.
  function studentFor(S, c) {
    if (c.refId) {
      var byRef = S.referral(c.refId);
      if (byRef) return byRef;
    }
    var all = S.referrals();
    for (var i = 0; i < all.length; i++) {
      if (all[i].passport && all[i].passport === c.passport) return all[i];
    }
    return null;
  }

  // Satu baris data dalam susunan lajur borang. 19 nilai: 14 + 4 feedback + 1.
  //
  // raw = true untuk CSV: amaun dikeluarkan sebagai nombor tanpa pemisah ribuan
  // dan sel kosong sebagai rentetan kosong, supaya Excel mengimportnya sebagai
  // NOMBOR dan bukan teks. Paparan skrin guna raw = false (berformat).
  function rowFor(S, W, c, index, raw) {
    var a = S.agent(c.agentId);
    var st = studentFor(S, c) || {};
    var fb = c.feedbackFromUSM || {};
    var dash = raw ? '' : '—';
    // '—' ialah nilai paparan; dalam CSV ia mesti jadi sel kosong.
    function txt(v) {
      if (v == null || v === '' || v === '—') return dash;
      return v;
    }
    function num(v, dp) {
      if (v == null) return dash;
      return raw ? String(dp ? Number(v).toFixed(dp) : v) : (dp ? Number(v).toFixed(dp) : W.money(v));
    }
    return [
      String(index + 1),
      a ? a.name : c.agentId,
      c.student,
      c.passport,
      txt(st.matricNo),
      txt(st.usmIdNo),
      c.level,
      txt(c.referenceNumber),
      txt(st.faculty),
      c.program,
      raw ? String(c.firstYearFee || 0) : W.money(c.firstYearFee),
      raw ? W.usdOf(c.firstYearFee).toFixed(2) : W.usdMoney(c.firstYearFee),
      txt(c.datePaidToUSMLabel),
      txt(c.receiptNo),
      txt(fb.dateLabel),
      txt(fb.receiptNo),
      num(fb.amountUSD, 2),
      num(fb.amountRM, 0),
      txt(c.ipsBpaStatus)
    ];
  }

  function rowsFor(S, W, batch, raw) {
    var claims = W.batchClaims(batch), out = [];
    for (var i = 0; i < claims.length; i++) out.push(rowFor(S, W, claims[i], i, raw));
    return out;
  }

  // --- CSV ---------------------------------------------------------------
  // CSV tiada sel bercantum, jadi dua baris header dikeluarkan supaya susunan
  // borang Excel kekal boleh dikenali.
  function csvCell(v) {
    var s = String(v == null ? '' : v);
    return '"' + s.replace(/"/g, '""') + '"';
  }
  function csvRow(arr) {
    var out = [];
    for (var i = 0; i < arr.length; i++) out.push(csvCell(arr[i]));
    return out.join(',');
  }

  function toCsv(S, W, batch) {
    var a = S.agent(batch.agentId);
    var head1 = COLUMNS.slice(0, 14)
      .concat(['FEEDBACK FROM USM', '', '', ''])
      .concat([COLUMNS[15]]);
    var head2 = [];
    for (var i = 0; i < 14; i++) head2.push('');
    head2 = head2.concat(SUBCOLUMNS).concat(['']);

    var lines = [];
    lines.push(csvRow([SHEET_TITLE]));
    lines.push(csvRow(['Batch Date From : ' + batch.periodFromLabel + ' to ' + batch.periodToLabel]));
    lines.push(csvRow(['Batch No.', batch.batchNo, 'Agent', a ? a.name : batch.agentId]));
    lines.push('');
    lines.push(csvRow(head1));
    lines.push(csvRow(head2));
    var rows = rowsFor(S, W, batch, true);
    for (var r = 0; r < rows.length; r++) lines.push(csvRow(rows[r]));
    lines.push('');
    lines.push(csvRow(['', '', '', '', '', 'Reviewed By :', 'Approved By :']));
    lines.push(csvRow(['', '', '', '', 'Signature :', batch.checkedBy.name, batch.approvedBy.name]));
    lines.push(csvRow(['', '', '', '', 'Date :', batch.checkedBy.dateLabel, batch.approvedBy.dateLabel]));
    lines.push(csvRow(['', '', '', '', 'Name & Position Stamp :', batch.checkedBy.designation, batch.approvedBy.designation]));
    return lines.join('\r\n');
  }

  NS.App.register('claim-batch', function (ctx) {
    var S = ctx.S, W = ctx.W, C = ctx.C, App = ctx.App;

    function pickBatch() {
      var wanted = App.qs('id');
      if (wanted && S.batch(wanted)) return S.batch(wanted);
      var list = S.batches();
      if (S.role() === 'agent') {
        var me = S.currentAgent();
        for (var i = 0; i < list.length; i++) {
          if (me && list[i].agentId === me.id) return list[i];
        }
      }
      return list[0] || null;
    }

    var current = pickBatch();
    var currentId = current ? current.id : null;

    function sheetHtml(b) {
      var a = S.agent(b.agentId);
      var rows = rowsFor(S, W, b);

      // Header dua baris: 'FEEDBACK FROM USM' merentangi 4 lajur.
      var h = '<div class="table-responsive bendahari-sheet">'
        + '<table class="table table-sm table-bordered align-middle mb-0 bendahari-table">'
        + '<thead><tr>';
      for (var i = 0; i < 14; i++) {
        h += '<th rowspan="2" class="align-middle">' + C.esc(COLUMNS[i]) + '</th>';
      }
      h += '<th colspan="4" class="text-center">' + C.esc(COLUMNS[14]) + '</th>';
      h += '<th rowspan="2" class="align-middle">' + C.esc(COLUMNS[15]) + '</th>';
      h += '</tr><tr>';
      for (var s = 0; s < SUBCOLUMNS.length; s++) h += '<th>' + C.esc(SUBCOLUMNS[s]) + '</th>';
      h += '</tr></thead><tbody>';

      if (!rows.length) {
        h += '<tr><td colspan="19" class="text-center text-muted py-4">'
          + 'No claims in this batch.</td></tr>';
      }
      for (var r = 0; r < rows.length; r++) {
        h += '<tr>';
        for (var c2 = 0; c2 < rows[r].length; c2++) {
          h += '<td>' + C.esc(rows[r][c2]) + '</td>';
        }
        h += '</tr>';
      }
      h += '</tbody></table></div>';

      var tot = W.batchTotals(b);
      h += '<div class="small text-muted mt-2">' + tot.count + ' student(s) · Total '
        + App.money(tot.feeRm) + ' · USD ' + W.usdMoney(tot.feeRm)
        + C.draf('USD converted at the DRAFT rate ' + S.config().currency.usdToRm) + '</div>';

      // Blok sign-off daripada CONTOH EXCEL SUBMIT BENDAHARI.xlsx, diterjemah
      // ke English mengikut keputusan owner 28 Sep 2026.
      h += '<div class="row g-3 mt-2 signoff-block">'
        + signCol('Reviewed By :', b.checkedBy)
        + signCol('Approved By :', b.approvedBy)
        + '</div>';
      return h;
    }

    function signCol(title, who) {
      return '<div class="col-sm-6"><div class="border rounded p-3 h-100">'
        + '<div class="fw-semibold small mb-2">' + C.esc(title) + '</div>'
        + '<dl class="row mb-0 small">'
        + '<dt class="col-5 text-muted fw-normal">Signature :</dt>'
        + '<dd class="col-7">' + (who && who.name && who.name !== '—'
            ? '<span class="badge bg-success">Signed</span> ' + C.esc(who.name)
            : '<span class="text-muted">—</span>') + '</dd>'
        + '<dt class="col-5 text-muted fw-normal">Date :</dt>'
        + '<dd class="col-7">' + C.esc((who && who.dateLabel) || '—') + '</dd>'
        + '<dt class="col-5 text-muted fw-normal">Name &amp; Position Stamp :</dt>'
        + '<dd class="col-7">' + C.esc((who && who.designation) || '—') + '</dd>'
        + '</dl></div></div>';
    }

    function buildPanel() {
      if (!W.can('createBatch')) return '';
      var agents = S.agents(), opts = '', anyClaims = false;
      for (var i = 0; i < agents.length; i++) {
        var ready = W.batchableClaims(agents[i].id);
        if (!ready.length) continue;
        anyClaims = true;
        opts += '<option value="' + C.esc(agents[i].id) + '">' + C.esc(agents[i].name)
          + ' — ' + ready.length + ' claim(s)</option>';
      }
      if (!anyClaims) {
        return C.card('Build a new batch',
          C.emptyState('No claims are waiting to be batched. A claim becomes available once '
            + 'USM LEAP has approved it.'));
      }
      var sel = App.qs('agent') || '';
      var chosen = sel && S.agent(sel) ? sel : null;
      var list = chosen ? W.batchableClaims(chosen) : [];
      var boxes = '';
      for (var k = 0; k < list.length; k++) {
        boxes += '<div class="form-check small">'
          + '<input class="form-check-input" type="checkbox" data-claim="1" id="bc' + k + '" '
          + 'value="' + C.esc(list[k].id) + '" checked>'
          + '<label class="form-check-label" for="bc' + k + '">'
          + C.esc(list[k].id) + ' · ' + C.esc(list[k].student) + ' · '
          + App.money(list[k].firstYearFee) + '</label></div>';
      }
      return C.card('Build a new batch',
        '<div class="row g-2 align-items-end">'
        + '<div class="col-sm-8"><label class="form-label small" for="batch-agent">Agent</label>'
        + '<select id="batch-agent" class="form-select form-select-sm">'
        + '<option value="">Select an agent…</option>' + opts + '</select></div>'
        + '<div class="col-sm-4"><button class="btn btn-sm btn-outline-usm w-100" '
        + 'data-action="load-claims">Show claims</button></div>'
        + '</div>'
        + (chosen
            ? '<div class="mt-3">' + boxes
              + '<button class="btn btn-sm btn-usm mt-2" data-action="create-batch" '
              + 'data-agent="' + C.esc(chosen) + '">Create batch</button></div>'
            : '<p class="small text-muted mt-3 mb-0">A batch may only contain claims from '
              + '<strong>one agent</strong> (rule R-4).</p>'));
    }

    function render() {
      current = currentId ? S.batch(currentId) : null;
      var list = S.batches(), rows = [], role = S.role();
      var me = S.currentAgent();

      for (var i = 0; i < list.length; i++) {
        var b = list[i];
        if (role === 'agent' && (!me || b.agentId !== me.id)) continue;
        var ag = S.agent(b.agentId);
        var t = W.batchTotals(b);
        rows.push([
          '<a href="claim-batch.html?id=' + C.esc(b.id) + '" class="fw-semibold">'
            + C.esc(b.batchNo) + '</a>'
            + (b.id === currentId ? ' <span class="badge bg-warning text-dark">SHOWN</span>' : '')
            + (b.isDemoCreated ? '<div><span class="badge bg-warning text-dark mt-1">NEW IN DEMO</span></div>' : ''),
          '<div class="fw-semibold">' + C.esc(ag ? ag.name : b.agentId) + '</div>'
            + '<div class="small text-muted">' + C.esc(b.periodFromLabel) + ' → '
            + C.esc(b.periodToLabel) + '</div>',
          C.statusBadge(b.batchStatus, W.BATCH_LABEL[b.batchStatus] || b.batchStatus),
          t.count + '<div class="small text-muted">' + App.money(t.feeRm) + '</div>'
        ]);
      }

      // Tindakan peringkat dokumen — dipaparkan di kawasan tajuk, sama
      // seperti skrin Vendor Registration.
      var docActs = '';
      if (current) {
        docActs = '<button class="btn btn-sm btn-outline-usm" data-action="export-csv">'
          + 'Export to Bendahari (CSV)</button> '
          + '<button class="btn btn-sm btn-outline-secondary" data-action="print">'
          + 'Print / Save as PDF</button>';
      }

      var detail;
      if (!current) {
        detail = C.card('Claim batch',
          C.emptyState('No batch selected. Build one from claims that USM LEAP has approved.'));
      } else {
        var a = S.agent(current.agentId);
        var acts = [];
        if (W.can('checkBatch') && current.batchStatus === 'DRAFT') {
          acts.push('<button class="btn btn-sm btn-usm" data-action="check">Check batch (Reviewed By)</button>');
        }
        if (W.can('approveBatch') && current.batchStatus === 'CHECKED') {
          acts.push('<button class="btn btn-sm btn-usm" data-action="approve">Approve batch (Approved By)</button>');
        }
        if (W.can('submitBatchToBendahari') && current.batchStatus === 'APPROVED') {
          acts.push('<button class="btn btn-sm btn-usm" data-action="submit-bendahari">Submit to Bursary</button>');
        }

        detail = C.card(
          'Batch ' + C.esc(current.batchNo)
            + ' <span class="badge bg-light text-dark border ms-1">' + C.esc(current.id) + '</span>',
          '<div class="d-flex justify-content-between flex-wrap gap-2 mb-3 no-print">'
          + '<div>' + C.statusBadge(current.batchStatus, W.BATCH_LABEL[current.batchStatus])
          + ' <span class="small text-muted ms-1">Prepared by ' + C.esc(current.preparedBy) + '</span></div>'
          + '<div class="d-flex gap-2 flex-wrap">' + acts.join('') + '</div>'
          + '</div>'
          + '<div class="print-only print-sheet-head">'
          + '<img src="' + C.esc(App.asset(App.BASE + 'assets/img/usm-apex-logo.svg')) + '" class="print-logo" '
          + 'alt="Universiti Sains Malaysia · APEX">'
          + '<div>'
          + '<div class="print-sheet-org">OFFICE OF THE BURSAR</div>'
          + '<div class="print-sheet-title">COMMISSION CLAIM BATCH — BURSARY SUBMISSION</div>'
          + '<div class="print-sheet-code">' + C.esc(current.batchNo) + ' · '
          + C.esc(a ? a.name : current.agentId) + '</div>'
          + '</div></div>'
          + '<div class="print-only print-demo-note">'
          + 'DEMO ONLY · All data is fictitious · Not a USM production document'
          + '</div>'
          + '<div class="bendahari-head mb-2">'
          + '<div class="fw-semibold">' + C.esc(SHEET_TITLE) + '</div>'
          + '<div class="small">Batch Date From : ' + C.esc(current.periodFromLabel)
          + ' to ' + C.esc(current.periodToLabel) + '</div>'
          + '<div class="small text-muted">' + C.esc(a ? a.name : current.agentId)
          + ' · ' + C.esc(current.batchNo) + '</div>'
          + '</div>'
          + sheetHtml(current)
          + '<div class="alert alert-light border small mt-3 mb-0 no-print">'
          + '<strong>Demo vs production:</strong> the export produces <strong>CSV</strong> only — '
          + 'generating a real <code>.xlsx</code> needs a library and would break the static, '
          + 'vanilla-JavaScript constraint. Production would generate the Bursary workbook '
          + 'server-side. The "signed" markers here are demo statuses, not e-signatures.'
          + '</div>');
      }

      ctx.host.innerHTML =
        App.pageTitle('Commission Claim Batch (Bendahari Submission)',
          'Approved commission claims are grouped into a batch and submitted to the Office of '
          + 'the Bursar in the prescribed column format. Batch period: '
          + S.config().claimBatch.periodMonths + ' months '
          + C.draf('Batch period length — DRAFT'),
          docActs, 'Office of the Bursar')
        + '<div class="row g-3"><div class="col-lg-8">' + detail + '</div>'
        + '<div class="col-lg-4 no-print">'
        + C.card('Batches <span class="badge bg-light text-dark border ms-1">' + rows.length + '</span>',
            C.table(['Batch', 'Agent', 'Status', 'Claims'], rows, { empty: 'No batches yet.' }))
        + buildPanel()
        + C.card('Sign-off order',
            '<ol class="small ps-3 mb-0">'
            + '<li><strong>USAINS</strong> checks the batch — <em>Reviewed By</em>.</li>'
            + '<li><strong>USM LEAP</strong> approves it — <em>Approved By</em>.</li>'
            + '<li><strong>USAINS</strong> submits it to the Bursary.</li>'
            + '<li><strong>Payment Officer</strong> records each payment on the claim.</li>'
            + '</ol>')
        + '</div></div>';
    }

    App.onAction(ctx.host, function (action, el) {
      var r = null;
      if (action === 'check') {
        r = App.run(function () { return W.checkBatch(currentId); }, 'Batch checked by USAINS.');
      } else if (action === 'approve') {
        r = App.run(function () { return W.approveBatch(currentId); }, 'Batch approved by USM LEAP.');
      } else if (action === 'submit-bendahari') {
        r = App.run(function () { return W.submitBatchToBendahari(currentId); },
          'Batch submitted to the Office of the Bursar.');
      } else if (action === 'load-claims') {
        var sel = App.el('batch-agent');
        if (!sel || !sel.value) { App.toast('Select an agent first.', 'danger'); return; }
        App.go('claim-batch', { id: currentId, agent: sel.value });
        return;
      } else if (action === 'create-batch') {
        var agentId = el.getAttribute('data-agent');
        var boxes = ctx.host.querySelectorAll('[data-claim]');
        var ids = [];
        for (var i = 0; i < boxes.length; i++) { if (boxes[i].checked) ids.push(boxes[i].value); }
        var made = App.run(function () { return W.createBatch(agentId, ids); }, 'Batch created.');
        if (made) { App.go('claim-batch', { id: made.id }); }
        return;
      } else if (action === 'export-csv') {
        exportCsv();
        return;
      } else if (action === 'print') {
        if (root.print) root.print();
        return;
      } else { return; }
      if (r) render();
    });

    function exportCsv() {
      var b = S.batch(currentId);
      if (!b) return;
      var csv = toCsv(S, W, b);
      // Nama fail ditetapkan oleh nota rujukan §2.3.
      var name = 'Bendahari-Claim-Batch-' + b.id + '.csv';
      try {
        var blob = new root.Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
        var url = root.URL.createObjectURL(blob);
        var link = document.createElement('a');
        link.href = url;
        link.download = name;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        root.setTimeout(function () { root.URL.revokeObjectURL(url); }, 1000);
        App.toast('Exported ' + name + ' in the Bursary column format.', 'success');
      } catch (e) {
        // Pelayar lama / persekitaran ujian tanpa Blob.
        App.toast('CSV export is not available in this browser.', 'danger');
      }
    }

    // Helaian 19 lajur terlalu lebar untuk A4 portrait. Kelas ini memilih
    // named page landscape; pelayar yang tidak menyokongnya kekal portrait.
    try { document.body.classList.add('print-landscape'); } catch (e) { /* demo */ }

    render();
  });

  // Didedahkan untuk ujian: susunan lajur dan penjana CSV boleh disemak tanpa DOM.
  NS.App.bendahari = {
    SHEET_TITLE: SHEET_TITLE,
    COLUMNS: COLUMNS,
    SUBCOLUMNS: SUBCOLUMNS,
    rowsFor: rowsFor,
    toCsv: toCsv
  };
})(window);

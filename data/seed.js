/*
 * seed.js — Data palsu untuk DEMO USM Agent Gateway.
 * Semua data REKAAN. Bukan data USM sebenar.
 *
 * Diguna sebagai <script> global (bukan ES module). Demo dijalankan melalui
 * pelayan statik lokal + Bootstrap 5 dari CDN (keputusan owner 1 Sep 2026 —
 * syarat file:// digugurkan). Semua data dieksport di bawah namespace
 * window.USMDEMO.SEED.
 *
 * CONFIG_DRAFT = semua nilai boleh-konfigurasi yang BELUM dimuktamadkan owner.
 * Paparkan dengan lencana "DRAFT" sepanjang demo; ringkaskan dalam skrin
 * pages/settings-draft.html.
 */
(function (root) {
  'use strict';

  var NOW_ISO = '2026-08-31';

  // --- Nilai keputusan owner (DRAFT) ------------------------------------
  var CONFIG_DRAFT = {
    commission: {
      ug: { label: 'Undergraduate (UG)', ratePercent: 15, basis: 'First-year fee' },
      pg: { label: 'Postgraduate (PG)',        ratePercent: 10, basis: 'First-year fee' },
      paymentWindowDays: 30 // bayaran dalam 30 hari selepas claim approved (rujukan)
    },
    fees: {
      registrationNew: 2000,     // RM, permohonan NEW
      registrationRenewal: 1000, // RM, permohonan RENEWAL
      performanceBond: 500,      // RM
      paidUpCapitalMin: 5000     // RM, minimum
    },
    sla: {
      usainsReviewDays: 7,   // hari kalendar
      leapDecisionDays: 7,   // hari kalendar
      claimDecisionDays: 14, // hari
      approachingWithinDays: 2, // baki hari <= nilai ini -> chip "Approaching Deadline"
      expiryAlertsDays: [90, 60, 30]
    },
    eligibility: {
      minStudyMonths: 2 // tempoh pengajian minimum untuk kelayakan claim
    },
    renewal: {
      minReferralsPerYear: 15, // threshold prestasi untuk renew
      agreementTermYears: 2
    },
    // Kadar tukaran untuk lajur "Total Fee (USD)" borang Bendahari.
    // feeUSD TIDAK disimpan pada mana-mana rekod (keputusan D-021) — ia dikira
    // daripada nilai ini, jadi menukarnya menggerakkan setiap amaun USD.
    currency: {
      usdToRm: 4.70
    },
    bendahari: {
      batchPeriodMonths: 6 // panjang tempoh satu batch tuntutan
    },
    vendor: {
      supplierCodeSlaDays: 14 // SLA Bendahari keluarkan Kod Pembekal
    }
  };

  // --- Label tetap -------------------------------------------------------
  var STAGE_LABELS = ['Submitted', 'Verified by USAINS', 'Approved & Signed', 'Active', 'Annual Review'];
  var CLAIM_STAGE_LABELS = ['Draft', 'Submitted', 'Processing (USAINS)', 'Decided (USM)', 'Paid'];
  var REFERRAL_STAGE_LABELS = ['Submitted', 'Offered', 'Enrolled', 'Fees Paid'];
  var ELIGIBILITY_LABELS = [
    'Recruited by this agent',
    'Student has enrolled',
    'Fees paid in full',
    'Completed 2 months of study',
    'No full refund issued'
  ];

  // Checklist dokumen (label DRAFT di mana relevan)
  var DOC_CHECKLIST = [
    'Company Registration Certificate (SSM / foreign equivalent)',
    'Proof of Paid-Up Capital (min. RM' + CONFIG_DRAFT.fees.paidUpCapitalMin + ')',
    'Audited Financial Statements (latest 2 years)',
    'Proof of Operating Experience (min. 2 years)',
    'List of Full-Time Staff (min. 2) + Resumes',
    'Business Strategy & Plan',
    'Director Resume',
    'Proof of Registration Fee Payment',
    'Proof of Performance Bond Payment (RM' + CONFIG_DRAFT.fees.performanceBond + ')'
  ];

  // Status dokumen setiap permohonan (REKAAN - demo).
  // Status: 'PENDING' | 'VERIFIED' | 'RETURNED' | 'RESUBMITTED'
  function docsFor(defaultStatus, overrides) {
    overrides = overrides || {};
    var out = [];
    for (var i = 0; i < DOC_CHECKLIST.length; i++) {
      var o = overrides[i];
      out.push({
        idx: i,
        name: DOC_CHECKLIST[i],
        status: o ? o.status : defaultStatus,
        note: (o && o.note) ? o.note : ''
      });
    }
    return out;
  }

  // --- Profil vendor (borang USM.FIS.AP.B.2023.01) -----------------------
  // Semua REKAAN — lihat docs/USM-Agent-Gateway-Integrasi-Bendahari-Vendor.md §10.
  // vendorStatus: 'Not Registered' | 'Pending' | 'Registered'
  // supplierCode hanya wujud apabila Bendahari sudah mengeluarkannya.
  function vendorProfile(o) {
    var v = {
      // Part A — Agency / Individual Information
      fullName: '—', registrationNo: '—', address: '—',
      phoneMalaysia: '—', phoneOrigin: '—', email: '—',
      nationality: '—', contactPerson: '—',
      // Part B — Banking Information
      bankAccountHolder: '—', bankName: '—', bankAccountNo: '—', bankAddress: '—',
      swiftCode: '—', bankBranch: '—',
      routingNumber: '—', ibanNumber: '—', bsbCode: '—', ifscCode: '—',
      // Part C — Declaration
      declarationName: '—', declarationIdNo: '—', designation: '—',
      declarationSigned: false, declarationDateLabel: '—',
      // Seksyen 2 — diisi PTJ
      ptjVerified: false, ptjPurpose: '—', ptjApplicantName: '—',
      ptjGrade: '—', ptjEmail: '—', ptjDateLabel: '—',
      // Seksyen 3 — diisi Jabatan Bendahari
      supplierCode: null, supplierCategory: 'NONTRADE',
      processedBy: '—', verifiedBy: '—', issuedDateLabel: '—',
      // status keseluruhan
      vendorStatus: 'Not Registered'
    };
    for (var k in (o || {})) {
      if (Object.prototype.hasOwnProperty.call(o, k)) v[k] = o[k];
    }
    return v;
  }

  // --- Ejen / permohonan -------------------------------------------------
  // stage: 1..5 sepadan STAGE_LABELS. sla: 'ok' | 'warning' | 'late'.
  var AGENTS = [
    {
      id: 'AG-2041', name: 'Global Bridge Education Sdn Bhd', country: 'Malaysia', mode: 'renewal',
      typeLabel: 'Active · Renewal Upcoming', stage: 4, sla: 'ok',
      appStatus: 'AGREEMENT_SIGNED', agentStatus: 'ACTIVE', agreementId: 'AGR-2041',
      slaSource: 'seed', docs: docsFor('VERIFIED'),
      submittedIso: '2025-01-03', submittedLabel: '3 Jan 2025', expiryIso: '2026-10-15', expiryLabel: '15 Oct 2026',
      studentsThisYear: 22, tin: 'C24501120', ssm: 'SSM 1102938-X', paidUpCapital: 'RM 180,000',
      registeredAddress: 'No. 12, Jalan Bestari 5, Taman Bestari, 11900 Bayan Lepas, Penang',
      operatingAddress: 'Same as registered address', website: 'www.globalbridge-edu.com',
      officialEmail: 'operations@globalbridge-edu.com', pic: 'Nurul Ain Zulkifli',
      director: 'Wong Kah Meng (860211-07-5523)', conduct: 'No issues on record',
      vendor: vendorProfile({
        fullName: 'Global Bridge Education Sdn Bhd', registrationNo: 'SSM 1102938-X',
        address: 'No. 12, Jalan Bestari 5, Taman Bestari, 11900 Bayan Lepas, Penang',
        phoneMalaysia: '+60 4-641 8890', phoneOrigin: '—',
        email: 'operations@globalbridge-edu.com', nationality: 'Malaysia',
        contactPerson: 'Nurul Ain Zulkifli',
        bankAccountHolder: 'Global Bridge Education Sdn Bhd',
        bankName: 'Demo Commerce Bank Berhad', bankAccountNo: '9999-2041-3388',
        bankAddress: 'Lebuh Bishop, 10200 George Town, Penang',
        swiftCode: 'DEMOMYKL', bankBranch: 'George Town',
        declarationName: 'Nurul Ain Zulkifli', declarationIdNo: '900414-07-5188',
        designation: 'Person in Charge (PIC)',
        declarationSigned: true, declarationDateLabel: '18 Sep 2024',
        ptjVerified: true, ptjPurpose: 'Recruitment agent commission payment',
        ptjApplicantName: 'Aiman Rashid', ptjGrade: 'Verification Officer, N41',
        ptjEmail: 'aiman.rashid@usains.demo', ptjDateLabel: '20 Sep 2024',
        supplierCode: 'NT-2026-0041', supplierCategory: 'NONTRADE',
        processedBy: 'Suria Kamal', verifiedBy: 'Haslina Mohd Yusof',
        issuedDateLabel: '27 Sep 2024', vendorStatus: 'Registered'
      }),
      activities: [
        { actor: 'System', action: 'Generated renewal reminder — 45 days to expiry', time: '28 Aug 2026' },
        { actor: 'Dr. Farah Idris (USM LEAP)', action: 'Confirmed annual review — active status continued', time: '12 Mar 2026' },
        { actor: 'Aiman Rashid (USAINS)', action: 'Processed Q1 2026 commission claims', time: '18 Feb 2026' }
      ]
    },
    {
      id: 'AG-2077', name: 'Al-Manar Education Consultancy', country: 'Jordan', mode: 'new',
      typeLabel: 'New Application', stage: 1, sla: 'late',
      appStatus: 'SUBMITTED', agentStatus: 'PENDING', agreementId: null,
      slaSource: 'seed', docs: docsFor('PENDING'),
      submittedIso: '2026-08-11', submittedLabel: '11 Aug 2026', expiryIso: null, expiryLabel: null,
      studentsThisYear: null, tin: '—', ssm: 'Foreign equivalent · MOI 44210', paidUpCapital: 'RM 62,000 (equivalent)',
      registeredAddress: 'Building 14, Al-Rabiah St, Amman, Jordan',
      operatingAddress: 'Same as registered address', website: 'www.almanar-edu.jo',
      officialEmail: 'admin@almanar-edu.jo', pic: 'Yasmin Odeh',
      director: 'Khalid Odeh (Passport N0234871)', conduct: '—',
      vendor: vendorProfile(), // belum menghantar borang vendor
      activities: [
        { actor: 'Yasmin Odeh (Agent)', action: 'Submitted new registration application', time: '11 Aug 2026' },
        { actor: 'System', action: 'USAINS verification SLA exceeded by 5 working days', time: '20 Aug 2026' }
      ]
    },
    {
      id: 'AG-2063', name: 'Sunrise Overseas Consultants', country: 'Vietnam', mode: 'new',
      typeLabel: 'New Application', stage: 2, sla: 'warning',
      appStatus: 'VERIFIED', agentStatus: 'PENDING', agreementId: null,
      slaSource: 'seed', docs: docsFor('VERIFIED'),
      submittedIso: '2026-08-02', submittedLabel: '2 Aug 2026', expiryIso: null, expiryLabel: null,
      studentsThisYear: null, tin: '—', ssm: 'Foreign equivalent · ERC 0109988231', paidUpCapital: 'RM 58,500 (equivalent)',
      registeredAddress: '88 Nguyen Trai, District 1, Ho Chi Minh City, Vietnam',
      operatingAddress: 'Same as registered address', website: 'www.sunriseoverseas.vn',
      officialEmail: 'contact@sunriseoverseas.vn', pic: 'Tran Thi Mai',
      director: 'Nguyen Van Long (Passport C1928374)', conduct: '—',
      vendor: vendorProfile(), // belum menghantar borang vendor
      activities: [
        { actor: 'Tran Thi Mai (Agent)', action: 'Submitted new registration application', time: '2 Aug 2026' },
        { actor: 'Aiman Rashid (USAINS)', action: 'Verified documents and forwarded to USM LEAP', time: '9 Aug 2026' }
      ]
    },
    {
      id: 'AG-1988', name: 'Crescent Pathways Sdn Bhd', country: 'Indonesia', mode: 'renewal',
      typeLabel: 'Renewal', stage: 2, sla: 'ok',
      appStatus: 'VERIFIED', agentStatus: 'PENDING', agreementId: null,
      slaSource: 'seed', docs: docsFor('VERIFIED'),
      submittedIso: '2026-07-20', submittedLabel: '20 Jul 2026', expiryIso: '2026-09-30', expiryLabel: '30 Sep 2026',
      studentsThisYear: 18, tin: 'C19983401', ssm: 'SSM 987654-A', paidUpCapital: 'RM 95,000',
      registeredAddress: 'Jalan Sudirman Kav 25, Jakarta Selatan, Indonesia',
      operatingAddress: 'Suite 8-2, Menara Bestari, Kuala Lumpur', website: 'www.crescentpathways.co.id',
      officialEmail: 'info@crescentpathways.co.id', pic: 'Dewi Kartika',
      director: 'Bambang Hartono (Passport A7712340)', conduct: 'No issues on record',
      vendor: vendorProfile(), // belum menghantar borang vendor
      activities: [
        { actor: 'Dewi Kartika (Agent)', action: 'Submitted renewal application', time: '20 Jul 2026' },
        { actor: 'Aiman Rashid (USAINS)', action: 'Verified documents and forwarded to USM LEAP', time: '28 Jul 2026' }
      ]
    },
    {
      id: 'AG-1875', name: 'EduBridge Africa Ltd', country: 'Nigeria', mode: 'renewal',
      typeLabel: 'Active · Annual Review', stage: 5, sla: 'warning',
      appStatus: 'AGREEMENT_SIGNED', agentStatus: 'REVIEW_DUE', agreementId: 'AGR-1875',
      slaSource: 'seed', docs: docsFor('VERIFIED'),
      submittedIso: '2024-03-14', submittedLabel: '14 Mar 2024', expiryIso: '2026-09-22', expiryLabel: '22 Sep 2026',
      studentsThisYear: 11, tin: 'C20874455', ssm: 'RC 1928374', paidUpCapital: 'RM 75,000 (equivalent)',
      registeredAddress: '21 Marina Road, Lagos Island, Lagos, Nigeria',
      operatingAddress: 'Same as registered address', website: 'www.edubridgeafrica.com',
      officialEmail: 'hello@edubridgeafrica.com', pic: 'Chinedu Okafor',
      director: 'Ifeoma Okafor (Passport A05821933)', conduct: 'No issues on record',
      // Akaun bank luar negara — medan Routing/IBAN/BSB/IFSC digunakan.
      vendor: vendorProfile({
        fullName: 'EduBridge Africa Ltd', registrationNo: 'RC 1928374',
        address: '21 Marina Road, Lagos Island, Lagos, Nigeria',
        phoneMalaysia: '—', phoneOrigin: '+234 1 271 0044',
        email: 'hello@edubridgeafrica.com', nationality: 'Nigeria',
        contactPerson: 'Chinedu Okafor',
        bankAccountHolder: 'EduBridge Africa Ltd',
        bankName: 'Demo Atlantic Bank Plc', bankAccountNo: '9999-1875-0210',
        bankAddress: '3 Adeola Odeku St, Victoria Island, Lagos, Nigeria',
        swiftCode: 'DEMONGLA', bankBranch: 'Victoria Island',
        routingNumber: '0210-DEMO', ibanNumber: 'NG99DEMO0000091875021',
        bsbCode: '—', ifscCode: '—',
        declarationName: 'Chinedu Okafor', declarationIdNo: 'Passport A05821933',
        designation: 'Managing Director',
        declarationSigned: true, declarationDateLabel: '2 Sep 2024',
        ptjVerified: true, ptjPurpose: 'Recruitment agent commission payment',
        ptjApplicantName: 'Aiman Rashid', ptjGrade: 'Verification Officer, N41',
        ptjEmail: 'aiman.rashid@usains.demo', ptjDateLabel: '5 Sep 2024',
        supplierCode: 'NT-2025-0018', supplierCategory: 'NONTRADE',
        processedBy: 'Suria Kamal', verifiedBy: 'Haslina Mohd Yusof',
        issuedDateLabel: '12 Sep 2024', vendorStatus: 'Registered'
      }),
      activities: [
        { actor: 'System', action: 'Students referred this year (11) fell below the minimum threshold (15)', time: '20 Aug 2026' },
        { actor: 'Dr. Farah Idris (USM LEAP)', action: 'Opened annual performance review', time: '15 Aug 2026' }
      ]
    },
    {
      id: 'AG-2019', name: 'Horizon Study Partners', country: 'Bangladesh', mode: 'new',
      typeLabel: 'New Application', stage: 3, sla: 'ok',
      appStatus: 'APPROVED_AWAITING_AGREEMENT', agentStatus: 'PENDING', agreementId: 'AGR-2019',
      slaSource: 'seed', docs: docsFor('VERIFIED'),
      submittedIso: '2026-06-25', submittedLabel: '25 Jun 2026', expiryIso: null, expiryLabel: null,
      studentsThisYear: null, tin: '—', ssm: 'Foreign equivalent · RJSC 55219', paidUpCapital: 'RM 64,000 (equivalent)',
      registeredAddress: 'House 9, Road 12, Banani, Dhaka, Bangladesh',
      operatingAddress: 'Same as registered address', website: 'www.horizonstudy.com.bd',
      officialEmail: 'team@horizonstudy.com.bd', pic: 'Rafiq Islam',
      director: 'Shirin Akter (Passport BG1234567)', conduct: '—',
      // Seksyen 1 & 2 lengkap; menunggu Bendahari keluarkan Kod Pembekal.
      vendor: vendorProfile({
        fullName: 'Horizon Study Partners', registrationNo: 'RJSC 55219',
        address: 'House 9, Road 12, Banani, Dhaka, Bangladesh',
        phoneMalaysia: '—', phoneOrigin: '+880 2 988 4410',
        email: 'team@horizonstudy.com.bd', nationality: 'Bangladesh',
        contactPerson: 'Rafiq Islam',
        bankAccountHolder: 'Horizon Study Partners',
        bankName: 'Demo Delta Bank Ltd', bankAccountNo: '9999-2019-7744',
        bankAddress: 'Gulshan Avenue, Dhaka 1212, Bangladesh',
        swiftCode: 'DEMOBDDH', bankBranch: 'Gulshan',
        routingNumber: '7744-DEMO', ibanNumber: '—', bsbCode: '—', ifscCode: '—',
        declarationName: 'Rafiq Islam', declarationIdNo: 'Passport BG7781234',
        designation: 'Director',
        declarationSigned: true, declarationDateLabel: '25 Aug 2026',
        ptjVerified: true, ptjPurpose: 'Recruitment agent commission payment',
        ptjApplicantName: 'Aiman Rashid', ptjGrade: 'Verification Officer, N41',
        ptjEmail: 'aiman.rashid@usains.demo', ptjDateLabel: '26 Aug 2026',
        vendorStatus: 'Pending'
      }),
      activities: [
        { actor: 'Dr. Farah Idris (USM LEAP)', action: 'Approved application — agreement draft generated', time: '22 Aug 2026' },
        { actor: 'Rafiq Islam (Agent)', action: 'Signed the draft agreement', time: '24 Aug 2026' }
      ]
    }
  ];

  // --- Pelajar / rujukan -------------------------------------------------
  var STUDENTS = [
    { name: 'Chaiwat Suksawat', country: 'Thailand', passport: 'TH5566778', refId: 'REF-0199', matricNo: '158877', usmIdNo: 'U2025-0199', faculty: 'School of Management', firstYearFee: 33500, refStatus: 'FEES_PAID', program: 'Bachelor of Business Management', level: 'UG', agentId: 'AG-2041', status: 'Fees Paid', semester: '2025/2026 Sem 2' },
    { name: 'Siriporn Boonmee', country: 'Thailand', passport: 'TH1122334', refId: 'REF-0201', matricNo: '162301', usmIdNo: 'U2026-0201', faculty: 'School of Computer Sciences', firstYearFee: 34500, refStatus: 'FEES_PAID', program: 'Bachelor of Computer Science', level: 'UG', agentId: 'AG-2041', status: 'Fees Paid', semester: '2026/2027 Sem 1' },
    { name: 'Kyaw Zin Htet', country: 'Myanmar', passport: 'MM9988771', refId: 'REF-0202', matricNo: '162302', usmIdNo: 'U2026-0202', faculty: 'School of Civil Engineering', firstYearFee: 32500, refStatus: 'FEES_PAID', program: 'Bachelor of Civil Engineering', level: 'UG', agentId: 'AG-2041', status: 'Fees Paid', semester: '2026/2027 Sem 1' },
    { name: 'Htay Htay Win', country: 'Myanmar', passport: 'MM4455667', refId: 'REF-0203', matricNo: '162303', usmIdNo: 'U2026-0203', faculty: 'School of Management', firstYearFee: 31000, refStatus: 'FEES_PAID', program: 'Bachelor of Accounting and Finance', level: 'UG', agentId: 'AG-2041', status: 'Fees Paid', semester: '2026/2027 Sem 1' },
    { name: 'Somchai Rattanakosin', country: 'Thailand', passport: 'TH2233445', refId: 'REF-0204', matricNo: 'PGM2041', usmIdNo: 'U2026-0204', faculty: 'Graduate School of Business', firstYearFee: 42000, refStatus: 'OFFERED', program: 'Master of Business Administration', level: 'PG', agentId: 'AG-2041', status: 'Offered', semester: '2026/2027 Sem 1' },
    { name: 'Amara Chukwu', country: 'Nigeria', passport: 'A05821933', refId: 'REF-0205', matricNo: '162305', usmIdNo: 'U2026-0205', faculty: 'School of Electrical & Electronic Engineering', firstYearFee: 36000, refStatus: 'FEES_PAID', program: 'Bachelor of Electrical & Electronic Engineering', level: 'UG', agentId: 'AG-1875', status: 'Fees Paid', semester: '2026/2027 Sem 1' },
    { name: 'Ifeoma Nwosu', country: 'Nigeria', passport: 'A11029384', refId: 'REF-0206', matricNo: '162306', usmIdNo: 'U2026-0206', faculty: 'School of Pharmaceutical Sciences', firstYearFee: 38500, refStatus: 'ENROLLED', program: 'Bachelor of Pharmacy', level: 'UG', agentId: 'AG-1875', status: 'Enrolled', semester: '2026/2027 Sem 1' },
    { name: 'Layla Haddad', country: 'Jordan', passport: 'JO7719042', refId: 'REF-0207', matricNo: '162307', usmIdNo: 'U2026-0207', faculty: 'School of Medical Sciences', firstYearFee: 55000, refStatus: 'OFFERED', program: 'Bachelor of Medicine', level: 'UG', agentId: 'AG-2077', status: 'Offered', semester: '2026/2027 Sem 1' },
    { name: 'Putri Ayu Lestari', country: 'Indonesia', passport: 'A88213764', refId: 'REF-0208', matricNo: '162308', usmIdNo: 'U2026-0208', faculty: 'School of Housing, Building and Planning', firstYearFee: 33000, refStatus: 'FEES_PAID', program: 'Bachelor of Architecture', level: 'UG', agentId: 'AG-1988', status: 'Fees Paid', semester: '2026/2027 Sem 1' },
    { name: 'Rizky Pratama', country: 'Indonesia', passport: 'A99102837', refId: 'REF-0209', matricNo: '162309', usmIdNo: 'U2026-0209', faculty: 'School of Chemical Engineering', firstYearFee: 34000, refStatus: 'ENROLLED', program: 'Bachelor of Chemical Engineering', level: 'UG', agentId: 'AG-1988', status: 'Enrolled', semester: '2026/2027 Sem 1' },
    { name: 'Tasnia Rahman', country: 'Bangladesh', passport: 'BG5502187', refId: 'REF-0210', matricNo: '162310', usmIdNo: 'U2026-0210', faculty: 'School of Materials and Mineral Resources Engineering', firstYearFee: 31500, refStatus: 'SUBMITTED', program: 'Bachelor of Materials Science', level: 'UG', agentId: 'AG-2019', status: 'Submitted', semester: '2026/2027 Sem 1' }
  ];

  // --- Tuntutan komisen --------------------------------------------------
  // eligibility = 5 syarat (ikut ELIGIBILITY_LABELS). status ikut CLAIM_STAGE_LABELS.
  var CLAIMS = [
    { id: 'CL-0071', referenceNumber: 'USM/AGC/2026/0071', datePaidToUSMIso: '2026-04-15', datePaidToUSMLabel: '15 Apr 2026', receiptNo: 'RCP-2026-3644', feedbackFromUSM: { dateLabel: '12 Jun 2026', receiptNo: 'BPA-2026-0612', amountUSD: 989, amountRM: 4650 }, ipsBpaStatus: 'Confirmed by IPS', batchId: 'BAT-0001', student: 'Htay Htay Win', passport: 'MM4455667', program: 'Accounting and Finance', level: 'UG', agentId: 'AG-2041', refId: 'REF-0203', firstYearFee: 31000, amount: 4650, claimStatus: 'PAID', status: 'Paid', decision: 'Approved', submittedIso: '2026-05-02', submittedLabel: '2 May 2026', deadlineIso: '2026-05-16', deadlineLabel: '16 May 2026', eligibility: [true, true, true, true, true], payment: { amount: 4650, dateIso: '2026-06-12', dateLabel: '12 Jun 2026', reference: 'TT-2026-00644', payee: 'Global Bridge Education Sdn Bhd', note: 'Batch BAT-0001' } },
    { id: 'CL-0068', referenceNumber: 'USM/AGC/2026/0068', datePaidToUSMIso: '2026-03-28', datePaidToUSMLabel: '28 Mar 2026', receiptNo: 'RCP-2026-3510', feedbackFromUSM: { dateLabel: '—', receiptNo: '—', amountUSD: null, amountRM: null }, ipsBpaStatus: 'Confirmed by IPS', batchId: 'BAT-0001', student: 'Chaiwat Suksawat', passport: 'TH5566778', program: 'Business Management', level: 'UG', agentId: 'AG-2041', refId: 'REF-0199', firstYearFee: 33500, amount: 5025, claimStatus: 'APPROVED_PENDING_PAYMENT', status: 'Decided (USM)', decision: 'Approved', submittedIso: '2026-04-10', submittedLabel: '10 Apr 2026', deadlineIso: '2026-04-24', deadlineLabel: '24 Apr 2026', eligibility: [true, true, true, true, true] },
    { id: 'CL-0102', referenceNumber: 'USM/AGC/2026/0102', datePaidToUSMIso: '2026-07-18', datePaidToUSMLabel: '18 Jul 2026', receiptNo: 'RCP-2026-4417', feedbackFromUSM: { dateLabel: '—', receiptNo: '—', amountUSD: null, amountRM: null }, ipsBpaStatus: '—', batchId: null, student: 'Kyaw Zin Htet', passport: 'MM9988771', program: 'Civil Engineering', level: 'UG', agentId: 'AG-2041', firstYearFee: 32500, amount: 4850, claimStatus: 'DRAFT', status: 'Draft', submittedIso: null, submittedLabel: '—', deadlineIso: null, deadlineLabel: '—', eligibility: [true, true, true, true, true] },
    { id: 'CL-0098', referenceNumber: 'USM/AGC/2026/0098', datePaidToUSMIso: '2026-07-02', datePaidToUSMLabel: '2 Jul 2026', receiptNo: 'RCP-2026-4312', feedbackFromUSM: { dateLabel: '—', receiptNo: '—', amountUSD: null, amountRM: null }, ipsBpaStatus: 'Pending', batchId: null, student: 'Siriporn Boonmee', passport: 'TH1122334', program: 'Computer Science', level: 'UG', agentId: 'AG-2041', firstYearFee: 34500, amount: 5200, claimStatus: 'SUBMITTED', status: 'Submitted', submittedIso: '2026-08-25', submittedLabel: '25 Aug 2026', deadlineIso: '2026-09-08', deadlineLabel: '8 Sep 2026', eligibility: [true, true, true, true, true] },
    { id: 'CL-0091', referenceNumber: 'USM/AGC/2026/0091', datePaidToUSMIso: '2026-06-24', datePaidToUSMLabel: '24 Jun 2026', receiptNo: 'RCP-2026-4180', feedbackFromUSM: { dateLabel: '—', receiptNo: '—', amountUSD: null, amountRM: null }, ipsBpaStatus: 'Pending', batchId: null, student: 'Amara Chukwu', passport: 'A05821933', program: 'Electrical & Electronic Engineering', level: 'UG', agentId: 'AG-1875', firstYearFee: 36000, amount: 5400, claimStatus: 'UNDER_USAINS_REVIEW', status: 'Processing (USAINS)', submittedIso: '2026-08-18', submittedLabel: '18 Aug 2026', deadlineIso: '2026-09-01', deadlineLabel: '1 Sep 2026', eligibility: [true, true, true, true, true] },
    { id: 'CL-0088', referenceNumber: 'USM/AGC/2026/0088', datePaidToUSMIso: '2026-06-11', datePaidToUSMLabel: '11 Jun 2026', receiptNo: 'RCP-2026-4055', feedbackFromUSM: { dateLabel: '—', receiptNo: '—', amountUSD: null, amountRM: null }, ipsBpaStatus: 'Confirmed by IPS', batchId: null, student: 'Putri Ayu Lestari', passport: 'A88213764', program: 'Architecture', level: 'UG', agentId: 'AG-1988', firstYearFee: 33000, amount: 4950, claimStatus: 'APPROVED_PENDING_PAYMENT', status: 'Decided (USM)', decision: 'Approved', submittedIso: '2026-08-05', submittedLabel: '5 Aug 2026', deadlineIso: '2026-08-19', deadlineLabel: '19 Aug 2026', eligibility: [true, true, true, true, true] },
    { id: 'CL-0079', referenceNumber: 'USM/AGC/2026/0079', datePaidToUSMIso: '2026-05-20', datePaidToUSMLabel: '20 May 2026', receiptNo: 'RCP-2026-3871', feedbackFromUSM: { dateLabel: '24 Jul 2026', receiptNo: 'BPA-2026-0771', amountUSD: 1085, amountRM: 5100 }, ipsBpaStatus: 'Confirmed by IPS', batchId: null, student: 'Rizky Pratama', passport: 'A99102837', program: 'Chemical Engineering', level: 'UG', agentId: 'AG-1988', firstYearFee: 34000, amount: 5100, claimStatus: 'PAID', status: 'Paid', decision: 'Approved', submittedIso: '2026-07-10', submittedLabel: '10 Jul 2026', deadlineIso: '2026-07-24', deadlineLabel: '24 Jul 2026', eligibility: [true, true, true, true, true] }
  ];

  // --- Batch tuntutan Bendahari (REKAAN - demo) --------------------------
  // Satu batch = satu ejen (peraturan R-4), dihantar kepada Jabatan Bendahari
  // dalam format borang rasmi. batchStatus:
  //   'DRAFT' -> 'CHECKED' -> 'APPROVED' -> 'SUBMITTED_TO_BENDAHARI'
  // Jumlah RM/USD DIKIRA, tidak disimpan (keputusan D-021).
  var CLAIM_BATCHES = [
    {
      id: 'BAT-0001', batchNo: 'BND/2026/001', agentId: 'AG-2041',
      periodFromLabel: 'Mar 2026', periodToLabel: 'Aug 2026',
      claimIds: ['CL-0071', 'CL-0068'],
      batchStatus: 'SUBMITTED_TO_BENDAHARI',
      preparedBy: 'Aiman Rashid (USAINS)',
      checkedBy: { name: 'Aiman Rashid', designation: 'Verification Officer, USAINS', dateLabel: '3 Jun 2026' },
      approvedBy: { name: 'Dr. Farah Idris', designation: 'Approvals Officer, USM LEAP', dateLabel: '6 Jun 2026' },
      createdIso: '2026-06-01', submittedIso: '2026-06-08'
    }
  ];

  // --- Perjanjian (REKAAN - demo) ----------------------------------------
  // status: 'NOT_GENERATED' | 'DRAFT' | 'AWAITING_USAINS_SIGNATURE' |
  //         'AWAITING_LEAP_SIGNATURE' | 'AWAITING_AGENT_SIGNATURE' |
  //         'FULLY_SIGNED' | 'VOID' | 'EXPIRED'
  // Nota: "tandatangan" di sini hanyalah STATUS demo. Bukan e-signature sah.
  var AGREEMENTS = [
    {
      id: 'AGR-2041', agentId: 'AG-2041', status: 'FULLY_SIGNED',
      termYears: 2, startIso: '2024-10-15', startLabel: '15 Oct 2024',
      endIso: '2026-10-15', endLabel: '15 Oct 2026', generatedLabel: '2 Oct 2024',
      signatures: {
        usains: { signed: true, by: 'Aiman Rashid (USAINS)',     dateIso: '2024-10-08', dateLabel: '8 Oct 2024' },
        leap:   { signed: true, by: 'Dr. Farah Idris (USM LEAP)', dateIso: '2024-10-11', dateLabel: '11 Oct 2024' },
        agent:  { signed: true, by: 'Nurul Ain Zulkifli (Agent)', dateIso: '2024-10-15', dateLabel: '15 Oct 2024' }
      }
    },
    {
      id: 'AGR-1875', agentId: 'AG-1875', status: 'FULLY_SIGNED',
      termYears: 2, startIso: '2024-09-22', startLabel: '22 Sep 2024',
      endIso: '2026-09-22', endLabel: '22 Sep 2026', generatedLabel: '10 Sep 2024',
      signatures: {
        usains: { signed: true, by: 'Aiman Rashid (USAINS)',      dateIso: '2024-09-16', dateLabel: '16 Sep 2024' },
        leap:   { signed: true, by: 'Dr. Farah Idris (USM LEAP)', dateIso: '2024-09-19', dateLabel: '19 Sep 2024' },
        agent:  { signed: true, by: 'Chinedu Okafor (Agent)',     dateIso: '2024-09-22', dateLabel: '22 Sep 2024' }
      }
    },
    {
      id: 'AGR-2019', agentId: 'AG-2019', status: 'AWAITING_USAINS_SIGNATURE',
      termYears: 2, startIso: null, startLabel: '—',
      endIso: null, endLabel: '—', generatedLabel: '22 Aug 2026',
      signatures: {
        usains: { signed: false, by: null, dateIso: null, dateLabel: '—' },
        leap:   { signed: false, by: null, dateIso: null, dateLabel: '—' },
        agent:  { signed: true,  by: 'Rafiq Islam (Agent)', dateIso: '2026-08-24', dateLabel: '24 Aug 2026' }
      }
    }
  ];

  // --- Notifikasi dalam-UI (REKAAN - demo; TIADA e-mel/SMS sebenar) -------
  // audience: kunci peranan, atau 'all'
  var NOTIFICATIONS = [
    { id: 'NT-0011', audience: 'usains',  agentId: 'AG-2077', title: 'USAINS review SLA exceeded',
      body: 'The Al-Manar Education Consultancy (AG-2077) application has passed the review deadline.',
      timeIso: '2026-08-20', timeLabel: '20 Aug 2026', read: false, link: 'usains-console.html' },
    { id: 'NT-0010', audience: 'leap',    agentId: 'AG-1875', title: 'Annual review opened',
      body: 'EduBridge Africa Ltd (AG-1875) is below the minimum referral threshold.',
      timeIso: '2026-08-20', timeLabel: '20 Aug 2026', read: false, link: 'annual-review.html' },
    { id: 'NT-0009', audience: 'agent',   agentId: 'AG-2041', title: 'Renewal reminder — 45 days',
      body: 'Agreement AGR-2041 expires on 15 Oct 2026.',
      timeIso: '2026-08-28', timeLabel: '28 Aug 2026', read: false, link: 'annual-review.html' },
    { id: 'NT-0008', audience: 'payment', agentId: 'AG-1988', title: 'Claim awaiting payment record',
      body: 'CL-0088 has been approved and is awaiting a manual payment record.',
      timeIso: '2026-08-26', timeLabel: '26 Aug 2026', read: false, link: 'claims.html' },
    { id: 'NT-0007', audience: 'usains',  agentId: 'AG-2041', title: 'New claim submitted',
      body: 'CL-0098 (Siriporn Boonmee) is awaiting an eligibility review.',
      timeIso: '2026-08-25', timeLabel: '25 Aug 2026', read: false, link: 'claims.html' }
  ];

  // --- Log aktiviti global (REKAAN - demo) -------------------------------
  // Setiap transisi workflow menambah satu entri di sini melalui js/workflow.js
  var ACTIVITY_LOG = [
    { id: 'LG-0031', tsIso: '2026-08-28', tsLabel: '28 Aug 2026', actor: 'System', role: 'system',
      entity: 'agent', entityId: 'AG-2041', from: 'ACTIVE', to: 'ACTIVE',
      note: 'Renewal reminder generated — 45 days to expiry' },
    { id: 'LG-0030', tsIso: '2026-08-25', tsLabel: '25 Aug 2026', actor: 'Nurul Ain Zulkifli', role: 'agent',
      entity: 'claim', entityId: 'CL-0098', from: 'DRAFT', to: 'SUBMITTED',
      note: 'Commission claim submitted for review' },
    { id: 'LG-0029', tsIso: '2026-08-24', tsLabel: '24 Aug 2026', actor: 'Rafiq Islam', role: 'agent',
      entity: 'agreement', entityId: 'AGR-2019', from: 'DRAFT', to: 'AWAITING_USAINS_SIGNATURE',
      note: 'Agent signed the draft agreement' },
    { id: 'LG-0028', tsIso: '2026-08-22', tsLabel: '22 Aug 2026', actor: 'Dr. Farah Idris', role: 'leap',
      entity: 'agent', entityId: 'AG-2019', from: 'VERIFIED', to: 'APPROVED_AWAITING_AGREEMENT',
      note: 'Application approved — agreement draft generated' },
    { id: 'LG-0027', tsIso: '2026-08-20', tsLabel: '20 Aug 2026', actor: 'System', role: 'system',
      entity: 'agent', entityId: 'AG-2077', from: 'SUBMITTED', to: 'SUBMITTED',
      note: 'USAINS review SLA exceeded by 5 working days' }
  ];

  // --- Peranan (untuk penukar peranan) -----------------------------------
  var ROLES = {
    agent:   { key: 'agent',   label: 'Agent',           org: 'Global Bridge Education Sdn Bhd', person: 'Nurul Ain Zulkifli', title: 'Person in Charge (PIC)' },
    usains:  { key: 'usains',  label: 'USAINS',          org: 'USAINS Holding Sdn Bhd',          person: 'Aiman Rashid',       title: 'Verification Officer' },
    payment: { key: 'payment', label: 'Payment Officer', org: 'USAINS Holding Sdn Bhd',          person: 'Suria Kamal',        title: 'Claim & Payment Officer' },
    leap:    { key: 'leap',    label: 'USM LEAP',        org: 'USM LEAP',                        person: 'Dr. Farah Idris',    title: 'Approvals Officer' },
    admin:   { key: 'admin',   label: 'Super Admin',     org: 'USM Agent Gateway',               person: 'System Admin',       title: 'System Administrator' }
  };

  // --- Utiliti kecil -----------------------------------------------------
  function daysUntil(iso) {
    if (!iso) return null;
    var ms = new Date(iso + 'T00:00:00') - new Date(NOW_ISO + 'T00:00:00');
    return Math.round(ms / 86400000);
  }
  function agentById(id) {
    for (var i = 0; i < AGENTS.length; i++) { if (AGENTS[i].id === id) return AGENTS[i]; }
    return null;
  }

  // Kadar komisen (%) mengikut level pengajian, dibaca dari config aktif.
  function ratePercentFor(level, cfg) {
    cfg = cfg || CONFIG_DRAFT;
    var key = (level === 'PG') ? 'pg' : 'ug';
    return cfg.commission[key].ratePercent;
  }

  // Amaun komisen = yuran tahun pertama x kadar (UG/PG).
  // DIKIRA, bukan angka mati — menukar kadar dalam Settings (DRAFT) menggerakkan
  // semua amaun serta-merta.
  function commissionAmount(level, firstYearFee, cfg) {
    if (!firstYearFee) return 0;
    return Math.round(firstYearFee * ratePercentFor(level, cfg) / 100);
  }

  // Amaun USD untuk lajur "Total Fee (USD)" borang Bendahari.
  // DIKIRA daripada kadar DRAFT — feeUSD tidak disimpan pada mana-mana rekod
  // supaya hanya ada SATU sumber kebenaran nilai RM (keputusan D-021).
  function usdAmount(rm, cfg) {
    cfg = cfg || CONFIG_DRAFT;
    var rate = cfg.currency.usdToRm;
    if (!rm || !rate) return 0;
    return Math.round(rm / rate * 100) / 100;
  }

  // --- Eksport -----------------------------------------------------------
  root.USMDEMO = root.USMDEMO || {};
  root.USMDEMO.SEED = {
    NOW_ISO: NOW_ISO,
    CLAIM_BATCHES: CLAIM_BATCHES,
    vendorProfile: vendorProfile,
    usdAmount: usdAmount,
    CONFIG_DRAFT: CONFIG_DRAFT,
    STAGE_LABELS: STAGE_LABELS,
    CLAIM_STAGE_LABELS: CLAIM_STAGE_LABELS,
    REFERRAL_STAGE_LABELS: REFERRAL_STAGE_LABELS,
    ELIGIBILITY_LABELS: ELIGIBILITY_LABELS,
    DOC_CHECKLIST: DOC_CHECKLIST,
    AGENTS: AGENTS,
    STUDENTS: STUDENTS,
    CLAIMS: CLAIMS,
    ROLES: ROLES,
    AGREEMENTS: AGREEMENTS,
    NOTIFICATIONS: NOTIFICATIONS,
    ACTIVITY_LOG: ACTIVITY_LOG,
    docsFor: docsFor,
    ratePercentFor: ratePercentFor,
    commissionAmount: commissionAmount,
    daysUntil: daysUntil,
    agentById: agentById
  };
})(typeof window !== 'undefined' ? window : this);

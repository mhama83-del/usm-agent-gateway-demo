/*
 * seed.js — Data palsu untuk DEMO USM Agent Gateway.
 * Semua data REKAAN. Bukan data USM sebenar.
 *
 * Diguna sebagai <script> global (bukan ES module) supaya berfungsi walau
 * dibuka terus (file://) atau di hosting statik biasa. Semua data dieksport
 * di bawah namespace window.USMDEMO.SEED.
 *
 * CONFIG_DRAFT = semua nilai boleh-konfigurasi yang BELUM dimuktamadkan owner.
 * Paparkan dengan lencana "DRAF" sepanjang demo; ringkaskan dalam skrin
 * pages/settings-draft.html.
 */
(function (root) {
  'use strict';

  var NOW_ISO = '2026-08-31';

  // --- Nilai keputusan owner (DRAF) --------------------------------------
  var CONFIG_DRAFT = {
    commission: {
      ug: { label: 'Ijazah Sarjana Muda (UG)', ratePercent: 15, basis: 'Yuran tahun pertama' },
      pg: { label: 'Pascasiswazah (PG)',        ratePercent: 10, basis: 'Yuran tahun pertama' },
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
      expiryAlertsDays: [90, 60, 30]
    },
    eligibility: {
      minStudyMonths: 2 // tempoh pengajian minimum untuk kelayakan claim
    },
    renewal: {
      minReferralsPerYear: 15, // threshold prestasi untuk renew
      agreementTermYears: 2
    }
  };

  // --- Label tetap -------------------------------------------------------
  var STAGE_LABELS = ['Submitted', 'Verified by USAINS', 'Approved & Signed', 'Active', 'Annual Review'];
  var CLAIM_STAGE_LABELS = ['Draft', 'Submitted', 'Processing (USAINS)', 'Decided (USM)', 'Paid'];
  var REFERRAL_STAGE_LABELS = ['Submitted', 'Offered', 'Enrolled', 'Fees Paid'];
  var ELIGIBILITY_LABELS = [
    'Direkrut oleh ejen ini',
    'Pelajar telah enrol',
    'Yuran dibayar penuh',
    'Lengkap 2 bulan pengajian',
    'Tiada full refund'
  ];

  // Checklist dokumen (label DRAF di mana relevan)
  var DOC_CHECKLIST = [
    'Sijil Pendaftaran Syarikat (SSM / setara luar negara)',
    'Bukti Paid-Up Capital (min. RM' + CONFIG_DRAFT.fees.paidUpCapitalMin + ')',
    'Penyata Kewangan Beraudit (2 tahun terkini)',
    'Bukti Pengalaman Operasi (min. 2 tahun)',
    'Senarai Staf Sepenuh Masa (min. 2) + Resume',
    'Strategi & Pelan Perniagaan',
    'Resume Pengarah',
    'Bukti Bayaran Yuran Pendaftaran',
    'Bukti Bayaran Performance Bond (RM' + CONFIG_DRAFT.fees.performanceBond + ')'
  ];

  // --- Ejen / permohonan -------------------------------------------------
  // stage: 1..5 sepadan STAGE_LABELS. sla: 'ok' | 'warning' | 'late'.
  var AGENTS = [
    {
      id: 'AG-2041', name: 'Global Bridge Education Sdn Bhd', country: 'Malaysia', mode: 'renewal',
      typeLabel: 'Active · Renewal Upcoming', stage: 4, sla: 'ok',
      submittedIso: '2025-01-03', submittedLabel: '3 Jan 2025', expiryIso: '2026-10-15', expiryLabel: '15 Oct 2026',
      studentsThisYear: 22, tin: 'C24501120', ssm: 'SSM 1102938-X', paidUpCapital: 'RM 180,000',
      registeredAddress: 'No. 12, Jalan Bestari 5, Taman Bestari, 11900 Bayan Lepas, Penang',
      operatingAddress: 'Same as registered address', website: 'www.globalbridge-edu.com',
      officialEmail: 'operations@globalbridge-edu.com', pic: 'Nurul Ain Zulkifli',
      director: 'Wong Kah Meng (860211-07-5523)', conduct: 'No issues on record',
      activities: [
        { actor: 'System', action: 'Generated renewal reminder — 45 days to expiry', time: '28 Aug 2026' },
        { actor: 'Dr. Farah Idris (USM LEAP)', action: 'Confirmed annual review — active status continued', time: '12 Mar 2026' },
        { actor: 'Aiman Rashid (USAINS)', action: 'Processed Q1 2026 commission claims', time: '18 Feb 2026' }
      ]
    },
    {
      id: 'AG-2077', name: 'Al-Manar Education Consultancy', country: 'Jordan', mode: 'new',
      typeLabel: 'New Application', stage: 1, sla: 'late',
      submittedIso: '2026-08-11', submittedLabel: '11 Aug 2026', expiryIso: null, expiryLabel: null,
      studentsThisYear: null, tin: '—', ssm: 'Foreign equivalent · MOI 44210', paidUpCapital: 'RM 62,000 (equivalent)',
      registeredAddress: 'Building 14, Al-Rabiah St, Amman, Jordan',
      operatingAddress: 'Same as registered address', website: 'www.almanar-edu.jo',
      officialEmail: 'admin@almanar-edu.jo', pic: 'Yasmin Odeh',
      director: 'Khalid Odeh (Passport N0234871)', conduct: '—',
      activities: [
        { actor: 'Yasmin Odeh (Agent)', action: 'Submitted new registration application', time: '11 Aug 2026' },
        { actor: 'System', action: 'USAINS verification SLA exceeded by 5 working days', time: '20 Aug 2026' }
      ]
    },
    {
      id: 'AG-2063', name: 'Sunrise Overseas Consultants', country: 'Vietnam', mode: 'new',
      typeLabel: 'New Application', stage: 2, sla: 'warning',
      submittedIso: '2026-08-02', submittedLabel: '2 Aug 2026', expiryIso: null, expiryLabel: null,
      studentsThisYear: null, tin: '—', ssm: 'Foreign equivalent · ERC 0109988231', paidUpCapital: 'RM 58,500 (equivalent)',
      registeredAddress: '88 Nguyen Trai, District 1, Ho Chi Minh City, Vietnam',
      operatingAddress: 'Same as registered address', website: 'www.sunriseoverseas.vn',
      officialEmail: 'contact@sunriseoverseas.vn', pic: 'Tran Thi Mai',
      director: 'Nguyen Van Long (Passport C1928374)', conduct: '—',
      activities: [
        { actor: 'Tran Thi Mai (Agent)', action: 'Submitted new registration application', time: '2 Aug 2026' },
        { actor: 'Aiman Rashid (USAINS)', action: 'Verified documents and forwarded to USM LEAP', time: '9 Aug 2026' }
      ]
    },
    {
      id: 'AG-1988', name: 'Crescent Pathways Sdn Bhd', country: 'Indonesia', mode: 'renewal',
      typeLabel: 'Renewal', stage: 2, sla: 'ok',
      submittedIso: '2026-07-20', submittedLabel: '20 Jul 2026', expiryIso: '2026-09-30', expiryLabel: '30 Sep 2026',
      studentsThisYear: 18, tin: 'C19983401', ssm: 'SSM 987654-A', paidUpCapital: 'RM 95,000',
      registeredAddress: 'Jalan Sudirman Kav 25, Jakarta Selatan, Indonesia',
      operatingAddress: 'Suite 8-2, Menara Bestari, Kuala Lumpur', website: 'www.crescentpathways.co.id',
      officialEmail: 'info@crescentpathways.co.id', pic: 'Dewi Kartika',
      director: 'Bambang Hartono (Passport A7712340)', conduct: 'No issues on record',
      activities: [
        { actor: 'Dewi Kartika (Agent)', action: 'Submitted renewal application', time: '20 Jul 2026' },
        { actor: 'Aiman Rashid (USAINS)', action: 'Verified documents and forwarded to USM LEAP', time: '28 Jul 2026' }
      ]
    },
    {
      id: 'AG-1875', name: 'EduBridge Africa Ltd', country: 'Nigeria', mode: 'renewal',
      typeLabel: 'Active · Annual Review', stage: 5, sla: 'warning',
      submittedIso: '2024-03-14', submittedLabel: '14 Mar 2024', expiryIso: '2026-09-22', expiryLabel: '22 Sep 2026',
      studentsThisYear: 11, tin: 'C20874455', ssm: 'RC 1928374', paidUpCapital: 'RM 75,000 (equivalent)',
      registeredAddress: '21 Marina Road, Lagos Island, Lagos, Nigeria',
      operatingAddress: 'Same as registered address', website: 'www.edubridgeafrica.com',
      officialEmail: 'hello@edubridgeafrica.com', pic: 'Chinedu Okafor',
      director: 'Ifeoma Okafor (Passport A05821933)', conduct: 'No issues on record',
      activities: [
        { actor: 'System', action: 'Students referred this year (11) fell below the minimum threshold (15)', time: '20 Aug 2026' },
        { actor: 'Dr. Farah Idris (USM LEAP)', action: 'Opened annual performance review', time: '15 Aug 2026' }
      ]
    },
    {
      id: 'AG-2019', name: 'Horizon Study Partners', country: 'Bangladesh', mode: 'new',
      typeLabel: 'New Application', stage: 3, sla: 'ok',
      submittedIso: '2026-06-25', submittedLabel: '25 Jun 2026', expiryIso: null, expiryLabel: null,
      studentsThisYear: null, tin: '—', ssm: 'Foreign equivalent · RJSC 55219', paidUpCapital: 'RM 64,000 (equivalent)',
      registeredAddress: 'House 9, Road 12, Banani, Dhaka, Bangladesh',
      operatingAddress: 'Same as registered address', website: 'www.horizonstudy.com.bd',
      officialEmail: 'team@horizonstudy.com.bd', pic: 'Rafiq Islam',
      director: 'Shirin Akter (Passport BG1234567)', conduct: '—',
      activities: [
        { actor: 'Dr. Farah Idris (USM LEAP)', action: 'Approved application — agreement draft generated', time: '22 Aug 2026' },
        { actor: 'Rafiq Islam (Agent)', action: 'Signed the draft agreement', time: '24 Aug 2026' }
      ]
    }
  ];

  // --- Pelajar / rujukan -------------------------------------------------
  var STUDENTS = [
    { name: 'Siriporn Boonmee', country: 'Thailand', passport: 'TH1122334', program: 'Bachelor of Computer Science', level: 'UG', agentId: 'AG-2041', status: 'Fees Paid', semester: '2026/2027 Sem 1' },
    { name: 'Kyaw Zin Htet', country: 'Myanmar', passport: 'MM9988771', program: 'Bachelor of Civil Engineering', level: 'UG', agentId: 'AG-2041', status: 'Fees Paid', semester: '2026/2027 Sem 1' },
    { name: 'Htay Htay Win', country: 'Myanmar', passport: 'MM4455667', program: 'Bachelor of Accounting and Finance', level: 'UG', agentId: 'AG-2041', status: 'Fees Paid', semester: '2026/2027 Sem 1' },
    { name: 'Somchai Rattanakosin', country: 'Thailand', passport: 'TH2233445', program: 'Master of Business Administration', level: 'PG', agentId: 'AG-2041', status: 'Offered', semester: '2026/2027 Sem 1' },
    { name: 'Amara Chukwu', country: 'Nigeria', passport: 'A05821933', program: 'Bachelor of Electrical & Electronic Engineering', level: 'UG', agentId: 'AG-1875', status: 'Fees Paid', semester: '2026/2027 Sem 1' },
    { name: 'Ifeoma Nwosu', country: 'Nigeria', passport: 'A11029384', program: 'Bachelor of Pharmacy', level: 'UG', agentId: 'AG-1875', status: 'Enrolled', semester: '2026/2027 Sem 1' },
    { name: 'Layla Haddad', country: 'Jordan', passport: 'JO7719042', program: 'Bachelor of Medicine', level: 'UG', agentId: 'AG-2077', status: 'Offered', semester: '2026/2027 Sem 1' },
    { name: 'Putri Ayu Lestari', country: 'Indonesia', passport: 'A88213764', program: 'Bachelor of Architecture', level: 'UG', agentId: 'AG-1988', status: 'Fees Paid', semester: '2026/2027 Sem 1' },
    { name: 'Rizky Pratama', country: 'Indonesia', passport: 'A99102837', program: 'Bachelor of Chemical Engineering', level: 'UG', agentId: 'AG-1988', status: 'Enrolled', semester: '2026/2027 Sem 1' },
    { name: 'Tasnia Rahman', country: 'Bangladesh', passport: 'BG5502187', program: 'Bachelor of Materials Science', level: 'UG', agentId: 'AG-2019', status: 'Submitted', semester: '2026/2027 Sem 1' }
  ];

  // --- Tuntutan komisen --------------------------------------------------
  // eligibility = 5 syarat (ikut ELIGIBILITY_LABELS). status ikut CLAIM_STAGE_LABELS.
  var CLAIMS = [
    { id: 'CL-0102', student: 'Kyaw Zin Htet', passport: 'MM9988771', program: 'Civil Engineering', level: 'UG', agentId: 'AG-2041', amount: 4850, status: 'Draft', submittedIso: null, submittedLabel: '—', deadlineIso: null, deadlineLabel: '—', eligibility: [true, true, true, true, true] },
    { id: 'CL-0098', student: 'Siriporn Boonmee', passport: 'TH1122334', program: 'Computer Science', level: 'UG', agentId: 'AG-2041', amount: 5200, status: 'Submitted', submittedIso: '2026-08-25', submittedLabel: '25 Aug 2026', deadlineIso: '2026-09-08', deadlineLabel: '8 Sep 2026', eligibility: [true, true, true, true, true] },
    { id: 'CL-0091', student: 'Amara Chukwu', passport: 'A05821933', program: 'Electrical & Electronic Engineering', level: 'UG', agentId: 'AG-1875', amount: 5400, status: 'Processing (USAINS)', submittedIso: '2026-08-18', submittedLabel: '18 Aug 2026', deadlineIso: '2026-09-01', deadlineLabel: '1 Sep 2026', eligibility: [true, true, true, true, true] },
    { id: 'CL-0088', student: 'Putri Ayu Lestari', passport: 'A88213764', program: 'Architecture', level: 'UG', agentId: 'AG-1988', amount: 4950, status: 'Decided (USM)', decision: 'Approved', submittedIso: '2026-08-05', submittedLabel: '5 Aug 2026', deadlineIso: '2026-08-19', deadlineLabel: '19 Aug 2026', eligibility: [true, true, true, true, true] },
    { id: 'CL-0079', student: 'Rizky Pratama', passport: 'A99102837', program: 'Chemical Engineering', level: 'UG', agentId: 'AG-1988', amount: 5100, status: 'Paid', decision: 'Approved', submittedIso: '2026-07-10', submittedLabel: '10 Jul 2026', deadlineIso: '2026-07-24', deadlineLabel: '24 Jul 2026', eligibility: [true, true, true, true, true] }
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

  // --- Eksport -----------------------------------------------------------
  root.USMDEMO = root.USMDEMO || {};
  root.USMDEMO.SEED = {
    NOW_ISO: NOW_ISO,
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
    daysUntil: daysUntil,
    agentById: agentById
  };
})(typeof window !== 'undefined' ? window : this);

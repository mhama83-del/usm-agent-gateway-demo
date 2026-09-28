/*
 * store.js — "Otak palsu" demo USM Agent Gateway.
 * Menyalin data/seed.js ke localStorage pada muat pertama; semua bacaan dan
 * tulisan seterusnya melalui fail ini. TIADA backend.
 *
 * Dalam produksi CI4, fail ini digantikan oleh model + repository sebenar.
 */
(function (root) {
  'use strict';

  var NS = root.USMDEMO = root.USMDEMO || {};
  var SEED = NS.SEED;
  var KEY = 'usm_demo_state';

  // NAIKKAN nombor ini setiap kali data/seed.js berubah dengan cara yang
  // menjadikan state tersimpan usang — termasuk perubahan TEKS semata-mata.
  //
  // State menyimpan salinan penuh seed (label, notifikasi, log aktiviti,
  // label tarikh) DAN teks yang dijana semasa demo berjalan. Jika versi tidak
  // dinaikkan, pelayar yang pernah menjalankan demo lama akan terus memaparkan
  // teks lama itu walaupun kod sudah dikemas kini — kod baharu, data lama.
  //
  //   1 — keluaran asal (UI Bahasa Melayu)
  //   2 — UI English (keputusan owner 8 Sep 2026); state versi 1 dibuang
  //       kerana ia mengandungi teks BM yang tersimpan.
  //   3 — Integrasi Bendahari & vendor (28 Sep 2026): medan baharu pada
  //       STUDENTS/CLAIMS/AGENTS, entiti CLAIM_BATCHES, dan 3 nilai DRAFT
  //       baharu. State versi 2 tiada medan ini, jadi ia dibuang.
  var VERSION = 3;

  function clone(o) { return JSON.parse(JSON.stringify(o)); }

  function fresh() {
    return {
      version: VERSION,
      nowIso: SEED.NOW_ISO,
      role: 'agent',
      config: clone(SEED.CONFIG_DRAFT),
      agents: clone(SEED.AGENTS),
      referrals: clone(SEED.STUDENTS),
      claims: clone(SEED.CLAIMS),
      agreements: clone(SEED.AGREEMENTS),
      batches: clone(SEED.CLAIM_BATCHES),
      notifications: clone(SEED.NOTIFICATIONS),
      log: clone(SEED.ACTIVITY_LOG),
      // ejen/rujukan/tuntutan yang dicipta semasa demo
      demoAgentId: null,
      seq: { agent: 2100, ref: 300, claim: 200, agreement: 900, log: 100, notif: 100, batch: 1 }
    };
  }

  var _state = null;

  function load() {
    if (_state) return _state;
    var raw = null;
    try { raw = root.localStorage.getItem(KEY); } catch (e) { raw = null; }
    if (raw) {
      try {
        var parsed = JSON.parse(raw);
        if (parsed && parsed.version === VERSION) { _state = parsed; return _state; }
      } catch (e) { /* jatuh ke seed */ }
    }
    _state = fresh();
    save();
    return _state;
  }

  function save() {
    try { root.localStorage.setItem(KEY, JSON.stringify(_state)); } catch (e) { /* demo sahaja */ }
    return _state;
  }

  function reset() {
    try { root.localStorage.removeItem(KEY); } catch (e) { /* abaikan */ }
    _state = null;
    return load();
  }

  // --- Akses -------------------------------------------------------------
  function state() { return load(); }
  function config() { return load().config; }
  function now() { return load().nowIso; }

  function role() { return load().role; }
  function roleInfo() { return SEED.ROLES[role()]; }
  function setRole(key) {
    var s = load();
    if (!SEED.ROLES[key]) return s.role;
    s.role = key; save();
    return key;
  }

  function agents() { return load().agents; }
  function agent(id) { return find(agents(), 'id', id); }
  function referrals() { return load().referrals; }
  function referral(id) { return find(referrals(), 'refId', id); }
  function claims() { return load().claims; }
  function claim(id) { return find(claims(), 'id', id); }
  function batches() { return load().batches; }
  function batch(id) { return find(batches(), 'id', id); }
  function batchesForAgent(agentId) {
    var all = batches(), out = [];
    for (var i = 0; i < all.length; i++) { if (all[i].agentId === agentId) out.push(all[i]); }
    return out;
  }
  function agreements() { return load().agreements; }
  function agreement(id) { return find(agreements(), 'id', id); }
  function agreementForAgent(agentId) { return find(agreements(), 'agentId', agentId); }
  function notifications() { return load().notifications; }
  function log() { return load().log; }

  function find(arr, key, val) {
    for (var i = 0; i < arr.length; i++) { if (arr[i][key] === val) return arr[i]; }
    return null;
  }

  function nextId(kind, prefix, pad) {
    var s = load();
    s.seq[kind] = (s.seq[kind] || 0) + 1;
    var n = String(s.seq[kind]);
    while (n.length < (pad || 4)) { n = '0' + n; }
    return prefix + n;
  }

  // Ejen "cerita utama" untuk peranan Agent: ejen demo baharu jika sudah
  // dicipta, jika tidak Global Bridge (AG-2041).
  function currentAgent() {
    var s = load();
    return (s.demoAgentId && agent(s.demoAgentId)) || agent('AG-2041');
  }

  NS.Store = {
    KEY: KEY,
    clone: clone,
    fresh: fresh,
    load: load,
    save: save,
    reset: reset,
    state: state,
    config: config,
    now: now,
    role: role,
    roleInfo: roleInfo,
    setRole: setRole,
    agents: agents,
    agent: agent,
    referrals: referrals,
    referral: referral,
    claims: claims,
    claim: claim,
    batches: batches,
    batch: batch,
    batchesForAgent: batchesForAgent,
    agreements: agreements,
    agreement: agreement,
    agreementForAgent: agreementForAgent,
    notifications: notifications,
    log: log,
    nextId: nextId,
    currentAgent: currentAgent
  };
})(window);

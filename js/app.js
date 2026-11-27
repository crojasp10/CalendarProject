/* Core: shared state, date helpers, validation, tab navigation, export/import, service worker. */
(function () {
  'use strict';

  var STORAGE_KEY = 'calvirtues.v1';
  var STATE_VERSION = 1;
  var DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
  var INDEX_RE = /^(0|[1-9]\d?)$/;
  var MAX_KEYS = 20000;
  var MAX_IMPORT_BYTES = 1024 * 1024; // 1 MB
  var VIRTUE_COUNT = 13;
  var MAX_POINTS = 5;
  var MIN_YEAR = 1900;
  var MAX_YEAR = 2200;
  var TABS = ['calendar', 'virtues', 'monk'];

  var MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July',
    'August', 'September', 'October', 'November', 'December'];
  var MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  var DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']; // Monday first

  /* ---------- Date helpers (local time, DST-safe) ---------- */
  function pad(n) { return n < 10 ? '0' + n : String(n); }

  function toKey(d) {
    return String(d.getFullYear()).padStart(4, '0') + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  }

  function fromKey(key) {
    var p = key.split('-');
    var d = new Date(2000, 0, 1);
    d.setFullYear(Number(p[0]), Number(p[1]) - 1, Number(p[2]));
    return d;
  }

  /* A real calendar date between 1900 and 2200, formatted YYYY-MM-DD. */
  function isValidKey(key) {
    if (typeof key !== 'string' || !DATE_RE.test(key)) { return false; }
    var year = Number(key.slice(0, 4));
    if (year < MIN_YEAR || year > MAX_YEAR) { return false; }
    return toKey(fromKey(key)) === key;
  }

  function addDays(d, n) {
    return new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
  }

  function mondayOf(d) {
    var offset = (d.getDay() + 6) % 7; // Monday = 0
    return new Date(d.getFullYear(), d.getMonth(), d.getDate() - offset);
  }

  function diffDays(a, b) {
    var ms = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate()) -
             Date.UTC(a.getFullYear(), a.getMonth(), a.getDate());
    return Math.round(ms / 86400000);
  }

  function mod(n, m) { return ((n % m) + m) % m; }

  function fmtShort(d) { return MONTHS_SHORT[d.getMonth()] + ' ' + d.getDate(); }

  function fmtFull(d) {
    return DAYS[mod(d.getDay() + 6, 7)] + ', ' + MONTHS[d.getMonth()] + ' ' + d.getDate() + ', ' + d.getFullYear();
  }

  /* ---------- DOM helpers (text is always set with textContent) ---------- */
  function mk(tag, className, text) {
    var el = document.createElement(tag);
    if (className) { el.className = className; }
    if (text !== undefined) { el.textContent = text; }
    return el;
  }

  function clear(el) {
    while (el.firstChild) { el.removeChild(el.firstChild); }
  }

  /* ---------- State ---------- */
  function defaultState() {
    var today = new Date();
    return {
      version: STATE_VERSION,
      marks: {},                          // { 'YYYY-MM-DD': true }
      virtues: {},                        // { 'YYYY-MM-DD': { '<virtue 0-12>': 1..5 } }
      cycleStart: toKey(mondayOf(today)), // start of the 13-week virtue cycle (Monday)
      monkStart: toKey(today),            // start of the first 21-day Monk cycle
      monkDays: {}                        // { 'YYYY-MM-DD': true }
    };
  }

  function isPlainObject(v) {
    return v !== null && typeof v === 'object' && !Array.isArray(v);
  }

  function isInt(v) {
    return typeof v === 'number' && isFinite(v) && Math.floor(v) === v;
  }

  /* Normalizes one day of virtues. Accepts { idx: 1..5 } or the legacy array of indexes (1 point each). */
  function normalizeVirtueDay(val) {
    var out = {};
    var found = false;
    var i;
    if (Array.isArray(val)) {
      for (i = 0; i < val.length; i++) {
        if (isInt(val[i]) && val[i] >= 0 && val[i] < VIRTUE_COUNT) {
          out[String(val[i])] = 1;
          found = true;
        }
      }
    } else if (isPlainObject(val)) {
      var keys = Object.keys(val);
      for (i = 0; i < keys.length; i++) {
        var k = keys[i];
        var pts = val[k];
        if (INDEX_RE.test(k) && Number(k) < VIRTUE_COUNT && isInt(pts) && pts >= 1 && pts <= MAX_POINTS) {
          out[k] = pts;
          found = true;
        }
      }
    }
    return found ? out : null;
  }

  /* Copies { 'YYYY-MM-DD': true } keeping only valid dates with value === true. */
  function normalizeDayFlags(src) {
    var out = {};
    var keys = Object.keys(src);
    for (var i = 0; i < keys.length; i++) {
      if (isValidKey(keys[i]) && src[keys[i]] === true) { out[keys[i]] = true; }
    }
    return out;
  }

  /* Validates and normalizes untrusted data (storage or imported file). Returns null if invalid. */
  function sanitize(raw) {
    if (!isPlainObject(raw) || raw.version !== STATE_VERSION) { return null; }
    var out = defaultState();
    var total = 0;
    var i;

    // Shape checks and key budget (counted before any filtering).
    var flagSections = ['marks', 'monkDays'];
    for (i = 0; i < flagSections.length; i++) {
      var sec = raw[flagSections[i]];
      if (sec !== undefined) {
        if (!isPlainObject(sec)) { return null; }
        total += Object.keys(sec).length;
        if (total > MAX_KEYS) { return null; }
      }
    }
    if (raw.virtues !== undefined) {
      if (!isPlainObject(raw.virtues)) { return null; }
      var dayKeys = Object.keys(raw.virtues);
      for (i = 0; i < dayKeys.length; i++) {
        var dayVal = raw.virtues[dayKeys[i]];
        total += 1;
        if (Array.isArray(dayVal)) { total += dayVal.length; }
        else if (isPlainObject(dayVal)) { total += Object.keys(dayVal).length; }
        if (total > MAX_KEYS) { return null; }
      }
    }

    if (raw.marks !== undefined) { out.marks = normalizeDayFlags(raw.marks); }
    if (raw.monkDays !== undefined) { out.monkDays = normalizeDayFlags(raw.monkDays); }

    if (raw.virtues !== undefined) {
      var vKeys = Object.keys(raw.virtues);
      for (i = 0; i < vKeys.length; i++) {
        if (!isValidKey(vKeys[i])) { continue; }
        var day = normalizeVirtueDay(raw.virtues[vKeys[i]]);
        if (day) { out.virtues[vKeys[i]] = day; } // empty days are dropped
      }
    }

    if (raw.cycleStart !== undefined) {
      if (!isValidKey(raw.cycleStart)) { return null; }
      out.cycleStart = toKey(mondayOf(fromKey(raw.cycleStart)));
    }
    if (raw.monkStart !== undefined) {
      if (!isValidKey(raw.monkStart)) { return null; }
      out.monkStart = raw.monkStart;
    }
    return out; // unknown keys (including a legacy "monk" key) are ignored
  }

  function loadState() {
    try {
      var text = window.localStorage.getItem(STORAGE_KEY);
      if (text) {
        var parsed = sanitize(JSON.parse(text));
        if (parsed) { return parsed; }
      }
    } catch (e) { /* storage unavailable or corrupt: fall back to defaults */ }
    return defaultState();
  }

  var modules = [];
  var alertEl = null;
  var statusEl = null;

  function showAlert(msg) {
    if (!alertEl) { return; }
    alertEl.textContent = msg;
    alertEl.hidden = !msg;
  }

  var App = {
    state: loadState(),
    sanitize: sanitize,
    helpers: {
      pad: pad, toKey: toKey, fromKey: fromKey, isValidKey: isValidKey,
      addDays: addDays, mondayOf: mondayOf, diffDays: diffDays, mod: mod,
      fmtShort: fmtShort, fmtFull: fmtFull, mk: mk, clear: clear,
      MONTHS: MONTHS, MONTHS_SHORT: MONTHS_SHORT, DAYS: DAYS
    },
    VIRTUE_COUNT: VIRTUE_COUNT,
    MAX_POINTS: MAX_POINTS,

    save: function () {
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(App.state));
        showAlert('');
        return true;
      } catch (e) {
        showAlert('Could not save data in this browser (storage unavailable or full).');
        return false;
      }
    },

    /* A module is { init?: function, render: function }. */
    register: function (mod) { modules.push(mod); },

    renderAll: function () {
      for (var i = 0; i < modules.length; i++) {
        if (typeof modules[i].render === 'function') { modules[i].render(); }
      }
    }
  };
  window.App = App;

  /* ---------- Status message (backup block) ---------- */
  function setStatus(msg, isError) {
    if (!statusEl) { return; }
    statusEl.textContent = msg;
    statusEl.classList.toggle('error', Boolean(isError));
  }

  /* ---------- Tabs ---------- */
  function showTab(name, updateHash) {
    if (TABS.indexOf(name) === -1) { name = TABS[0]; }
    for (var i = 0; i < TABS.length; i++) {
      var selected = TABS[i] === name;
      var tab = document.getElementById('tab-' + TABS[i]);
      var panel = document.getElementById('panel-' + TABS[i]);
      tab.setAttribute('aria-selected', selected ? 'true' : 'false');
      tab.tabIndex = selected ? 0 : -1;
      panel.hidden = !selected;
    }
    if (updateHash && window.history && window.history.replaceState) {
      window.history.replaceState(null, '', '#' + name);
    }
    window.scrollTo(0, 0);
  }

  function initTabs() {
    var tabs = document.querySelectorAll('.tab');
    Array.prototype.forEach.call(tabs, function (tab, index) {
      tab.addEventListener('click', function () {
        showTab(tab.getAttribute('data-tab'), true);
        App.renderAll(); // keep cross-tab indicators (e.g. calendar dots) fresh
      });
      tab.addEventListener('keydown', function (e) {
        var next = null;
        if (e.key === 'ArrowRight') { next = tabs[(index + 1) % tabs.length]; }
        if (e.key === 'ArrowLeft') { next = tabs[(index + tabs.length - 1) % tabs.length]; }
        if (next) {
          e.preventDefault();
          next.focus();
          showTab(next.getAttribute('data-tab'), true);
          App.renderAll();
        }
      });
    });
    showTab(window.location.hash.replace('#', ''), false);
  }

  /* ---------- Export / Import ---------- */
  function exportData() {
    var blob = new Blob([JSON.stringify(App.state, null, 2)], { type: 'application/json' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'calendar-backup-' + toKey(new Date()) + '.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
    setStatus('Backup exported.', false);
  }

  function importData(file) {
    if (!file) { return; }
    if (file.size > MAX_IMPORT_BYTES) {
      setStatus('Import failed: the file is larger than 1 MB.', true);
      return;
    }
    var reader = new FileReader();
    reader.onload = function () {
      var parsed;
      try {
        parsed = sanitize(JSON.parse(String(reader.result)));
      } catch (e) {
        parsed = null;
      }
      if (!parsed) {
        setStatus('Import failed: this is not a valid backup file.', true);
        return;
      }
      if (!window.confirm('Replace all current data with the data from this backup file?')) {
        setStatus('Import cancelled.', false);
        return;
      }
      App.state = parsed;
      if (App.save()) { setStatus('Backup imported.', false); }
      App.renderAll();
    };
    reader.onerror = function () { setStatus('Import failed: could not read the file.', true); };
    reader.readAsText(file);
  }

  function initData() {
    var fileInput = document.getElementById('data-file');
    document.getElementById('data-export').addEventListener('click', exportData);
    document.getElementById('data-import').addEventListener('click', function () { fileInput.click(); });
    fileInput.addEventListener('change', function () {
      importData(fileInput.files[0]);
      fileInput.value = '';
    });
  }

  /* ---------- Service worker (PWA) ---------- */
  function initServiceWorker() {
    if ('serviceWorker' in navigator && window.isSecureContext) {
      navigator.serviceWorker.register('sw.js').catch(function () { /* offline support is optional */ });
    }
  }

  /* ---------- Init ---------- */
  function init() {
    alertEl = document.getElementById('app-alert');
    statusEl = document.getElementById('data-status');
    initTabs();
    initData();
    for (var i = 0; i < modules.length; i++) {
      if (typeof modules[i].init === 'function') { modules[i].init(); }
    }
    App.save(); // persists first-visit defaults (e.g. Monk start date) so they never move
    App.renderAll();
    initServiceWorker();
  }

  // Deferred scripts run in order before DOMContentLoaded, so every module has registered by then.
  document.addEventListener('DOMContentLoaded', init);
})();

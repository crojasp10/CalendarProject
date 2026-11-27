/* Core: shared state, date helpers, tab navigation, export/import. */
(function () {
  'use strict';

  var STORAGE_KEY = 'calvirtues.v1';
  var DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
  var MAX_KEYS = 20000;
  var MAX_IMPORT_BYTES = 1024 * 1024; // 1 MB
  var VIRTUE_COUNT = 13;
  var TABS = ['calendar', 'virtues', 'monk'];

  /* ---------- Date helpers (local time, DST-safe) ---------- */
  function pad(n) { return n < 10 ? '0' + n : String(n); }

  function toKey(d) {
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  }

  function fromKey(key) {
    var p = key.split('-');
    return new Date(Number(p[0]), Number(p[1]) - 1, Number(p[2]));
  }

  function isValidKey(key) {
    if (typeof key !== 'string' || !DATE_RE.test(key)) { return false; }
    var year = Number(key.slice(0, 4));
    if (year < 1900 || year > 2200) { return false; }
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

  /* ---------- State ---------- */
  function defaultState() {
    return {
      version: 1,
      marks: {},                          // { 'YYYY-MM-DD': true }
      virtues: {},                        // { 'YYYY-MM-DD': [virtueIndex, ...] }
      cycleStart: toKey(mondayOf(new Date()))
    };
  }

  function isPlainObject(v) {
    return v !== null && typeof v === 'object' && !Array.isArray(v);
  }

  /* Validates and normalizes untrusted data (storage or imported file). Returns null if invalid. */
  function sanitize(raw) {
    if (!isPlainObject(raw) || raw.version !== 1) { return null; }
    var out = defaultState();
    var count = 0;
    var key;

    if (raw.marks !== undefined) {
      if (!isPlainObject(raw.marks)) { return null; }
      var markKeys = Object.keys(raw.marks);
      for (var i = 0; i < markKeys.length; i++) {
        key = markKeys[i];
        if (isValidKey(key) && raw.marks[key] === true) {
          out.marks[key] = true;
          if (++count > MAX_KEYS) { return null; }
        }
      }
    }

    if (raw.virtues !== undefined) {
      if (!isPlainObject(raw.virtues)) { return null; }
      var virKeys = Object.keys(raw.virtues);
      for (var j = 0; j < virKeys.length; j++) {
        key = virKeys[j];
        var list = raw.virtues[key];
        if (!isValidKey(key) || !Array.isArray(list) || list.length > VIRTUE_COUNT * 4) { continue; }
        var seen = {};
        var clean = [];
        for (var k = 0; k < list.length; k++) {
          var v = list[k];
          if (typeof v === 'number' && Math.floor(v) === v && v >= 0 && v < VIRTUE_COUNT && !seen[v]) {
            seen[v] = true;
            clean.push(v);
          }
        }
        if (clean.length) {
          clean.sort(function (a, b) { return a - b; });
          out.virtues[key] = clean;
          if (++count > MAX_KEYS) { return null; }
        }
      }
    }

    if (raw.cycleStart !== undefined) {
      if (!isValidKey(raw.cycleStart)) { return null; }
      out.cycleStart = toKey(mondayOf(fromKey(raw.cycleStart)));
    }
    return out;
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

  var App = {
    state: loadState(),
    helpers: {
      pad: pad, toKey: toKey, fromKey: fromKey, isValidKey: isValidKey,
      addDays: addDays, mondayOf: mondayOf, diffDays: diffDays, mod: mod
    },
    VIRTUE_COUNT: VIRTUE_COUNT,

    save: function () {
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(App.state));
        return true;
      } catch (e) {
        setStatus('Could not save data in this browser (storage unavailable or full).', true);
        return false;
      }
    },

    register: function (mod) { modules.push(mod); },

    renderAll: function () {
      for (var i = 0; i < modules.length; i++) {
        if (typeof modules[i].render === 'function') { modules[i].render(); }
      }
    }
  };
  window.App = App;

  /* ---------- Status message ---------- */
  var statusEl = null;
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
      tab.addEventListener('click', function () { showTab(tab.getAttribute('data-tab'), true); });
      tab.addEventListener('keydown', function (e) {
        var next = null;
        if (e.key === 'ArrowRight') { next = tabs[(index + 1) % tabs.length]; }
        if (e.key === 'ArrowLeft') { next = tabs[(index + tabs.length - 1) % tabs.length]; }
        if (next) {
          e.preventDefault();
          next.focus();
          showTab(next.getAttribute('data-tab'), true);
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
    a.download = 'calendar-virtues-backup-' + toKey(new Date()) + '.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
    setStatus('Backup exported.', false);
  }

  function importData(file) {
    if (!file) { return; }
    if (file.size > MAX_IMPORT_BYTES) {
      setStatus('Import failed: file is too large.', true);
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
      if (!window.confirm('Replace all current data with the backup file?')) {
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
    if ('serviceWorker' in navigator && (window.location.protocol === 'https:' || window.location.hostname === 'localhost')) {
      navigator.serviceWorker.register('sw.js').catch(function () { /* offline support is optional */ });
    }
  }

  /* ---------- Init ---------- */
  function init() {
    statusEl = document.getElementById('data-status');
    initTabs();
    initData();
    App.renderAll();
    initServiceWorker();
  }

  // Deferred scripts run in order before DOMContentLoaded, so every module has registered by then.
  document.addEventListener('DOMContentLoaded', init);
})();

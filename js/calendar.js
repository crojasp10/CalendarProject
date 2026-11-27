/* Tab 1: monthly calendar (Monday to Sunday) with markable days. */
(function () {
  'use strict';

  var App = window.App;
  var H = App.helpers;

  var MIN_YEAR = 1900;
  var MAX_YEAR = 2200;
  var view = null; // { y, m } of the month on screen; null means the current month

  function currentView() {
    if (!view) {
      var t = new Date();
      view = { y: t.getFullYear(), m: t.getMonth() };
    }
    return view;
  }

  function shiftMonth(delta) {
    var v = currentView();
    var d = new Date(v.y, v.m + delta, 1);
    if (d.getFullYear() < MIN_YEAR || d.getFullYear() > MAX_YEAR) { return; }
    view = { y: d.getFullYear(), m: d.getMonth() };
    render();
  }

  function render(focusKey) {
    var v = currentView();
    var grid = document.getElementById('cal-grid');
    var todayKey = H.toKey(new Date());
    var first = new Date(v.y, v.m, 1);
    var daysInMonth = new Date(v.y, v.m + 1, 0).getDate();
    var offset = (first.getDay() + 6) % 7; // Monday = 0
    var marks = App.state.marks;
    var virtues = App.state.virtues;
    var markedCount = 0;
    var focusBtn = null;

    document.getElementById('cal-title').textContent = H.MONTHS[v.m] + ' ' + v.y;
    document.getElementById('cal-prev').disabled = (v.y === MIN_YEAR && v.m === 0);
    document.getElementById('cal-next').disabled = (v.y === MAX_YEAR && v.m === 11);

    H.clear(grid);
    var frag = document.createDocumentFragment();

    for (var w = 0; w < 7; w++) {
      var dow = H.mk('div', 'cal-dow', H.DAYS[w].slice(0, 3));
      dow.setAttribute('aria-hidden', 'true');
      frag.appendChild(dow);
    }
    for (var b = 0; b < offset; b++) {
      var blank = H.mk('div', 'cal-blank');
      blank.setAttribute('aria-hidden', 'true');
      frag.appendChild(blank);
    }

    for (var day = 1; day <= daysInMonth; day++) {
      var date = new Date(v.y, v.m, day);
      var key = H.toKey(date);
      var marked = marks[key] === true;
      var hasVirtues = Boolean(virtues[key]);
      if (marked) { markedCount++; }

      var btn = H.mk('button', 'cal-day');
      btn.type = 'button';
      btn.setAttribute('data-key', key);
      btn.setAttribute('aria-pressed', marked ? 'true' : 'false');
      var label = H.fmtFull(date) + (key === todayKey ? ', today' : '') +
        (marked ? ', marked' : ', not marked') + (hasVirtues ? ', has virtue points' : '');
      btn.setAttribute('aria-label', label);
      if (marked) { btn.classList.add('marked'); }
      if (key === todayKey) { btn.classList.add('today'); }
      btn.appendChild(H.mk('span', 'cal-num', String(day)));
      var dot = H.mk('span', hasVirtues ? 'cal-dot on' : 'cal-dot');
      dot.setAttribute('aria-hidden', 'true');
      btn.appendChild(dot);
      frag.appendChild(btn);
      if (key === focusKey) { focusBtn = btn; }
    }
    grid.appendChild(frag);

    document.getElementById('cal-summary').textContent =
      markedCount + (markedCount === 1 ? ' day' : ' days') + ' marked this month';

    if (focusBtn) { focusBtn.focus({ preventScroll: true }); }
  }

  function toggle(key) {
    if (!H.isValidKey(key)) { return; }
    if (App.state.marks[key] === true) { delete App.state.marks[key]; }
    else { App.state.marks[key] = true; }
    App.save();
    render(key);
  }

  function init() {
    document.getElementById('cal-prev').addEventListener('click', function () { shiftMonth(-1); });
    document.getElementById('cal-next').addEventListener('click', function () { shiftMonth(1); });
    document.getElementById('cal-today').addEventListener('click', function () { view = null; render(); });
    document.getElementById('cal-grid').addEventListener('click', function (e) {
      var btn = e.target.closest ? e.target.closest('.cal-day') : null;
      if (btn) { toggle(btn.getAttribute('data-key')); }
    });
  }

  App.register({ init: init, render: function () { render(); } });
})();

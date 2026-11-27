/* Tab 1: simple interactive month calendar. */
(function () {
  'use strict';

  var App = window.App;
  var h = App.helpers;
  var WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  var today = new Date();
  var view = { year: today.getFullYear(), month: today.getMonth() };

  var gridEl, titleEl, summaryEl;

  function monthLabel() {
    return new Date(view.year, view.month, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  }

  function dayLabel(date, marked) {
    var text = date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
    return text + (marked ? ', marked' : ', not marked');
  }

  function updateSummary() {
    var prefix = view.year + '-' + h.pad(view.month + 1) + '-';
    var count = 0;
    Object.keys(App.state.marks).forEach(function (key) {
      if (key.indexOf(prefix) === 0) { count++; }
    });
    summaryEl.textContent = count + (count === 1 ? ' day marked' : ' days marked') + ' this month';
  }

  function applyDayState(btn, key, date) {
    var marked = App.state.marks[key] === true;
    var hasDots = Boolean(App.state.virtues[key]);
    btn.classList.toggle('marked', marked);
    btn.classList.toggle('has-dots', hasDots);
    btn.setAttribute('aria-pressed', marked ? 'true' : 'false');
    btn.setAttribute('aria-label', dayLabel(date, marked) + (hasDots ? ', has virtue dots' : ''));
  }

  function render() {
    titleEl.textContent = monthLabel();
    gridEl.textContent = '';

    WEEKDAYS.forEach(function (name) {
      var head = document.createElement('div');
      head.className = 'cal-head';
      head.textContent = name;
      gridEl.appendChild(head);
    });

    var first = new Date(view.year, view.month, 1);
    var blanks = (first.getDay() + 6) % 7; // Monday-first
    for (var b = 0; b < blanks; b++) {
      var blank = document.createElement('div');
      blank.className = 'day-blank';
      gridEl.appendChild(blank);
    }

    var daysInMonth = new Date(view.year, view.month + 1, 0).getDate();
    var todayKey = h.toKey(new Date());

    for (var day = 1; day <= daysInMonth; day++) {
      (function (dayNum) {
        var date = new Date(view.year, view.month, dayNum);
        var key = h.toKey(date);
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'day' + (key === todayKey ? ' today' : '');
        btn.textContent = String(dayNum);
        applyDayState(btn, key, date);
        btn.addEventListener('click', function () {
          if (App.state.marks[key]) {
            delete App.state.marks[key];
          } else {
            App.state.marks[key] = true;
          }
          App.save();
          applyDayState(btn, key, date);
          updateSummary();
        });
        gridEl.appendChild(btn);
      })(day);
    }
    updateSummary();
  }

  function shiftMonth(delta) {
    var d = new Date(view.year, view.month + delta, 1);
    view.year = d.getFullYear();
    view.month = d.getMonth();
    render();
  }

  function init() {
    gridEl = document.getElementById('cal-grid');
    titleEl = document.getElementById('cal-title');
    summaryEl = document.getElementById('cal-summary');
    document.getElementById('cal-prev').addEventListener('click', function () { shiftMonth(-1); });
    document.getElementById('cal-next').addEventListener('click', function () { shiftMonth(1); });
    document.getElementById('cal-today').addEventListener('click', function () {
      var now = new Date();
      view.year = now.getFullYear();
      view.month = now.getMonth();
      render();
    });
  }

  App.register({
    render: function () {
      if (!gridEl) { init(); } // first render happens after DOMContentLoaded
      render();
    }
  });
})();

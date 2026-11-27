/* Tab 2: Benjamin Franklin's 13 virtues, weekly dot tracker. */
(function () {
  'use strict';

  var App = window.App;
  var h = App.helpers;
  var COUNT = App.VIRTUE_COUNT;
  var DAY_LETTERS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

  // Franklin's virtues and precepts (from his Autobiography, public domain).
  var VIRTUES = [
    { name: 'Temperance', precept: 'Eat not to dullness; drink not to elevation.' },
    { name: 'Silence', precept: 'Speak not but what may benefit others or yourself; avoid trifling conversation.' },
    { name: 'Order', precept: 'Let all your things have their places; let each part of your business have its time.' },
    { name: 'Resolution', precept: 'Resolve to perform what you ought; perform without fail what you resolve.' },
    { name: 'Frugality', precept: 'Make no expense but to do good to others or yourself; i.e., waste nothing.' },
    { name: 'Industry', precept: 'Lose no time; be always employed in something useful; cut off all unnecessary actions.' },
    { name: 'Sincerity', precept: 'Use no hurtful deceit; think innocently and justly, and, if you speak, speak accordingly.' },
    { name: 'Justice', precept: 'Wrong none by doing injuries, or omitting the benefits that are your duty.' },
    { name: 'Moderation', precept: 'Avoid extremes; forbear resenting injuries so much as you think they deserve.' },
    { name: 'Cleanliness', precept: 'Tolerate no uncleanliness in body, clothes, or habitation.' },
    { name: 'Tranquillity', precept: 'Be not disturbed at trifles, or at accidents common or unavoidable.' },
    { name: 'Chastity', precept: 'Rarely use venery but for health or offspring; never to dullness, weakness, or the injury of your own or another\'s peace or reputation.' },
    { name: 'Humility', precept: 'Imitate Jesus and Socrates.' }
  ];

  var weekStart = h.mondayOf(new Date());
  var titleEl, cycleEl, focusEl, tableEl, startEl, listEl;
  var ready = false;

  function fmtShort(d) {
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) { node.className = className; }
    if (text !== undefined) { node.textContent = text; }
    return node;
  }

  function hasDot(key, v) {
    var list = App.state.virtues[key];
    return Boolean(list) && list.indexOf(v) !== -1;
  }

  function toggleDot(key, v) {
    var list = App.state.virtues[key] || [];
    var idx = list.indexOf(v);
    if (idx === -1) {
      list.push(v);
      list.sort(function (a, b) { return a - b; });
      App.state.virtues[key] = list;
    } else {
      list.splice(idx, 1);
      if (list.length) { App.state.virtues[key] = list; } else { delete App.state.virtues[key]; }
    }
    App.save();
  }

  function weekNumbers() {
    var weeks = Math.floor(h.diffDays(h.fromKey(App.state.cycleStart), weekStart) / 7);
    return {
      weeks: weeks,
      focus: h.mod(weeks, COUNT),
      weekInCycle: h.mod(weeks, COUNT) + 1,
      cycle: Math.floor(weeks / COUNT) + 1
    };
  }

  function renderHeader(info) {
    var end = h.addDays(weekStart, 6);
    titleEl.textContent = fmtShort(weekStart) + ' \u2013 ' + fmtShort(end) + ', ' + end.getFullYear();
    cycleEl.textContent = info.weeks < 0
      ? 'Before your cycle start'
      : 'Cycle ' + info.cycle + ' \u00b7 Week ' + info.weekInCycle + ' of ' + COUNT;

    focusEl.textContent = '';
    focusEl.appendChild(el('div', 'label', 'Focus virtue this week'));
    focusEl.appendChild(el('div', 'name', (info.focus + 1) + '. ' + VIRTUES[info.focus].name));
    focusEl.appendChild(el('div', 'precept', VIRTUES[info.focus].precept));
  }

  function renderTable(info) {
    var todayKey = h.toKey(new Date());
    var dayDates = [];
    var dayKeys = [];
    for (var d = 0; d < 7; d++) {
      var date = h.addDays(weekStart, d);
      dayDates.push(date);
      dayKeys.push(h.toKey(date));
    }

    tableEl.textContent = '';

    // Header
    var thead = el('thead');
    var headRow = el('tr');
    var corner = el('th', 'virtue-name', 'Virtue');
    corner.scope = 'col';
    headRow.appendChild(corner);
    for (var i = 0; i < 7; i++) {
      var th = el('th', dayKeys[i] === todayKey ? 'today-col' : '');
      th.scope = 'col';
      th.appendChild(document.createTextNode(DAY_LETTERS[i]));
      th.appendChild(el('small', '', String(dayDates[i].getDate())));
      headRow.appendChild(th);
    }
    var totalHead = el('th', 'total', '\u03a3');
    totalHead.scope = 'col';
    totalHead.title = 'Total dots';
    headRow.appendChild(totalHead);
    thead.appendChild(headRow);
    tableEl.appendChild(thead);

    // Body
    var tbody = el('tbody');
    var dayTotals = [0, 0, 0, 0, 0, 0, 0];
    var weekTotal = 0;

    VIRTUES.forEach(function (virtue, v) {
      var tr = el('tr', v === info.focus ? 'focus' : '');
      var name = el('th', 'virtue-name', (v + 1) + '. ' + virtue.name);
      name.scope = 'row';
      tr.appendChild(name);

      var rowTotal = 0;
      for (var day = 0; day < 7; day++) {
        var on = hasDot(dayKeys[day], v);
        if (on) { rowTotal++; dayTotals[day]++; }

        var td = el('td');
        var btn = el('button', 'dot-btn');
        btn.type = 'button';
        btn.setAttribute('aria-pressed', on ? 'true' : 'false');
        btn.setAttribute('aria-label', virtue.name + ', ' +
          dayDates[day].toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }) +
          (on ? ', dot' : ', no dot'));
        btn.setAttribute('data-v', String(v));
        btn.setAttribute('data-d', String(day));
        td.appendChild(btn);
        tr.appendChild(td);
      }
      weekTotal += rowTotal;
      tr.appendChild(el('td', 'total', String(rowTotal)));
      tbody.appendChild(tr);
    });
    tableEl.appendChild(tbody);

    // Footer
    var tfoot = el('tfoot');
    var footRow = el('tr');
    var footLabel = el('th', 'virtue-name', 'Total');
    footLabel.scope = 'row';
    footRow.appendChild(footLabel);
    dayTotals.forEach(function (t) { footRow.appendChild(el('td', '', String(t))); });
    footRow.appendChild(el('td', 'total', String(weekTotal)));
    tfoot.appendChild(footRow);
    tableEl.appendChild(tfoot);

    tableEl.setAttribute('data-keys', dayKeys.join(','));
  }

  function render() {
    var info = weekNumbers();
    renderHeader(info);
    renderTable(info);
    startEl.value = App.state.cycleStart;
  }

  function onTableClick(e) {
    var btn = e.target.closest ? e.target.closest('.dot-btn') : null;
    if (!btn) { return; }
    var v = Number(btn.getAttribute('data-v'));
    var d = Number(btn.getAttribute('data-d'));
    var keys = tableEl.getAttribute('data-keys').split(',');
    if (!(v >= 0 && v < COUNT) || !keys[d]) { return; }

    toggleDot(keys[d], v);
    App.renderAll(); // also refreshes the calendar indicators
    var again = tableEl.querySelector('.dot-btn[data-v="' + v + '"][data-d="' + d + '"]');
    if (again) { again.focus(); }
  }

  function shiftWeek(delta) {
    weekStart = h.addDays(weekStart, delta * 7);
    render();
  }

  function init() {
    titleEl = document.getElementById('vir-title');
    cycleEl = document.getElementById('vir-cycle');
    focusEl = document.getElementById('vir-focus');
    tableEl = document.getElementById('vir-table');
    startEl = document.getElementById('vir-start');
    listEl = document.getElementById('vir-list');

    document.getElementById('vir-prev').addEventListener('click', function () { shiftWeek(-1); });
    document.getElementById('vir-next').addEventListener('click', function () { shiftWeek(1); });
    document.getElementById('vir-today').addEventListener('click', function () {
      weekStart = h.mondayOf(new Date());
      render();
    });
    tableEl.addEventListener('click', onTableClick);

    startEl.addEventListener('change', function () {
      if (!h.isValidKey(startEl.value)) {
        startEl.value = App.state.cycleStart;
        return;
      }
      App.state.cycleStart = h.toKey(h.mondayOf(h.fromKey(startEl.value)));
      App.save();
      render();
    });

    VIRTUES.forEach(function (virtue) {
      var li = el('li');
      li.appendChild(el('strong', '', virtue.name));
      li.appendChild(el('span', 'precept', virtue.precept));
      listEl.appendChild(li);
    });
    ready = true;
  }

  App.register({
    render: function () {
      if (!ready) { init(); } // first render happens after DOMContentLoaded
      render();
    }
  });
})();
